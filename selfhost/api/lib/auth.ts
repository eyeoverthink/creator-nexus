import { betterAuth } from 'npm:better-auth@1.7.18';
import { bearer } from 'npm:better-auth@1.7.18/plugins';
import { getMigrations } from 'npm:better-auth@1.7.18/db/migration';
import { pool, q, q1, newId, HttpError } from './db.ts';
import { config } from './config.ts';
import { toRecord } from './entities.ts';
import type { User } from './query.ts';

const pendingIds = new Map<string, string>(); // email -> pre-existing Base44 user id (Phase 2 import)
const opts: any = {
  database: pool,
  secret: config.authSecret || 'dev-only-secret-dev-only-secret-dev-only',
  baseURL: config.publicUrl,
  basePath: '/api/auth',
  trustedOrigins: [config.publicUrl],
  emailAndPassword: { enabled: true, minPasswordLength: 10, autoSignIn: true },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  advanced: { database: { generateId: () => newId() } },
  plugins: [bearer()],
  databaseHooks: {
    user: {
      create: {
        before: async (user: any) => {
          const email = String(user.email || '').toLowerCase();
          const pre = pendingIds.get(email);
          return { data: pre ? { ...user, id: pre } : user };
        },
      },
    },
  },
};
export const auth = betterAuth(opts);
export async function migrateAuth() {
  const { runMigrations } = await getMigrations(opts);
  await runMigrations();
}

function signupAllowed(email: string) {
  if (config.signupMode === 'open') return true;
  if (config.signupMode === 'closed') return false;
  return config.adminEmails.includes(email) || config.signupAllowlist.includes(email);
}
// Mirror an auth user into the Base44-style User entity (id, email, full_name, role).
export async function ensureUserRecord(u: { id: string; email: string; name?: string }) {
  const email = u.email.toLowerCase();
  const role = config.adminEmails.includes(email) ? 'admin' : 'user';
  const existing = await q1(`SELECT * FROM ent."User" WHERE id = $1`, [u.id]);
  if (existing) {
    if (existing.data?.role !== role && config.adminEmails.includes(email)) await q(`UPDATE ent."User" SET data = data || $2::jsonb WHERE id = $1`, [u.id, JSON.stringify({ role })]);
    return;
  }
  await q(`INSERT INTO ent."User" (id, data, created_by, created_by_id) VALUES ($1, $2::jsonb, $3, $1) ON CONFLICT (id) DO NOTHING`,
    [u.id, JSON.stringify({ email, full_name: u.name || email.split('@')[0], role, disabled: false }), email]);
}
const cache = new Map<string, { user: User; at: number }>();
export async function userFromToken(token: string | null | undefined): Promise<User> {
  if (!token) return null;
  const hit = cache.get(token);
  if (hit && Date.now() - hit.at < 30000) return hit.user;
  const s = await auth.api.getSession({ headers: new Headers({ authorization: 'Bearer ' + token }) }).catch(() => null);
  if (!s?.user) { cache.delete(token); return null; }
  await ensureUserRecord(s.user as any);
  const row = await q1(`SELECT * FROM ent."User" WHERE id = $1`, [s.user.id]);
  const user = row ? toRecord(row) as any : null;
  if (user?.disabled) return null;
  cache.set(token, { user, at: Date.now() });
  if (cache.size > 5000) cache.clear();
  return user;
}
export const bearerOf = (req: Request) => {
  const h = req.headers.get('authorization') || '';
  return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : null;
};

async function call(fn: (o: any) => Promise<Response>, body: any) {
  const res = await fn({ body, asResponse: true });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(res.status === 422 ? 400 : res.status, data?.message || 'Authentication failed');
  return { data, token: res.headers.get('set-auth-token') || data?.token };
}
// Base44-compatible auth endpoints used by the app's Login/Register pages.
export async function handleAuthRoute(action: string, req: Request): Promise<any> {
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const email = String(body.email || '').trim().toLowerCase();
  switch (action) {
    case 'login': {
      if (!email || !body.password) throw new HttpError(400, 'Email and password are required');
      const { data, token } = await call(auth.api.signInEmail, { email, password: String(body.password) });
      await ensureUserRecord(data.user);
      return { access_token: token, user: await userFromToken(token) };
    }
    case 'register': {
      if (!email || !body.password) throw new HttpError(400, 'Email and password are required');
      if (!signupAllowed(email)) throw new HttpError(403, 'Registration is closed for this email on this server.');
      const pre = await q1(`SELECT id FROM ent."User" WHERE lower(data->>'email') = $1`, [email]);
      if (pre) pendingIds.set(email, pre.id);
      try {
        const { data, token } = await call(auth.api.signUpEmail, { email, password: String(body.password), name: body.full_name || email.split('@')[0] });
        await ensureUserRecord(data.user);
        // No e-mail OTP on the self-hosted build: the account is usable immediately.
        return { access_token: token, user: await userFromToken(token), requires_verification: false };
      } finally { pendingIds.delete(email); }
    }
    case 'verify-otp': throw new HttpError(400, 'Email verification codes are not used on this server. Sign in with your password.');
    case 'resend-otp': return { success: true, message: 'No verification code is needed on this server.' };
    case 'reset-password-request': return { success: true, message: 'Password reset by e-mail is not configured yet. Ask the admin to reset it on the server.' };
    case 'reset-password': throw new HttpError(501, 'Password reset by e-mail is not configured yet.');
    case 'logout': {
      const t = bearerOf(req); if (t) { cache.delete(t); await auth.api.signOut({ headers: new Headers({ authorization: 'Bearer ' + t }) }).catch(() => null); }
      return { success: true };
    }
    default: throw new HttpError(404, 'Unknown auth action');
  }
}
