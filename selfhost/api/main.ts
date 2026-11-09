// creator-nexus self-hosted API: Base44-compatible REST + functions + realtime, on Postgres and local Ollama.
import './lib/egress.ts';
import { config, requireSecrets } from './lib/config.ts';
import { HttpError } from './lib/db.ts';
import { loadSchemas, migrate, EntityStore, schemas } from './lib/entities.ts';
import { auth, migrateAuth, handleAuthRoute, userFromToken, bearerOf } from './lib/auth.ts';
import { loadFunctionNames, runFunction, functionNames } from './lib/functions.ts';
import { runCore } from './lib/integrations.ts';
import { serveFile } from './lib/files.ts';
import { gatewayChat, gatewayModels, llmHealth, lastRoute } from './lib/llm.ts';
import { handleRealtime } from './lib/realtime.ts';
import { handleActorSocket } from './lib/actorHost.ts';
import * as agents from './lib/agents.ts';
import { loadWorkflows, runWorkflow, workflows } from './lib/workflows.ts';
import { setUserResolver } from './shim/sdk.ts';

if (Deno.env.get('SELFHOST_ENV') !== 'dev') requireSecrets();
await loadSchemas();
await migrate();
await migrateAuth();
const fnNames = await loadFunctionNames();
await loadWorkflows();
setUserResolver(userFromToken);
console.log(`creator-nexus selfhost: ${schemas.size} entities, ${fnNames.length} functions, LLM routes ${config.ollamaUrls.join(' -> ')}`);

const json = (data: unknown, status = 200) => Response.json(data, { status });
const err = (e: any) => {
  const status = e instanceof HttpError ? e.status : (e?.status || 500);
  if (status >= 500) console.error('error:', e?.message || e);
  const message = status >= 500 && !(e instanceof HttpError) ? 'Internal server error' : (e?.message || 'Error');
  return json({ message, detail: message, error: { message }, ...(e?.data && typeof e.data === 'object' ? { data: e.data } : {}) }, status);
};
const timingSafeEq = (a: string, b: string) => { if (!a || !b || a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
async function body(req: Request) {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('multipart/form-data')) {
    const fd = await req.formData(); const o: any = {};
    for (const [k, v] of fd.entries()) { if (typeof v === 'string') { try { o[k] = k === 'file' ? v : JSON.parse(v); } catch { o[k] = v; } } else o[k] = v; }
    return o;
  }
  const t = await req.text(); if (!t) return {};
  try { return JSON.parse(t); } catch { throw new HttpError(400, 'Invalid JSON body'); }
}

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const m = req.method;
  const token = bearerOf(req) || url.searchParams.get('token');
  const user = () => userFromToken(token);

  if (path === '/healthz') return json({ ok: true });
  if (path === '/api/selfhost/status') {
    return json({ ok: true, egress: (await import('./lib/egress.ts')).egressLog.slice(0, 20), entities: schemas.size, functions: functionNames().length, workflows: workflows(), llm: await llmHealth(), last_llm_route: lastRoute, workflows_enabled: config.workflowsEnabled });
  }
  // Better Auth's own handler (future: Google OAuth, TOTP 2FA).
  if (path.startsWith('/api/auth/')) return auth.handler(req);

  // Backend functions: same /functions/<name> path the Nexus runner already calls, plus the SDK path.
  let fm = path.match(/^\/functions\/([A-Za-z0-9_]+)$/) || path.match(/^\/api\/apps\/[^/]+\/functions\/([A-Za-z0-9_]+)$/);
  if (fm) {
    const u = await user();
    return runFunction(fm[1], req, { user: u, token });
  }
  fm = path.match(/^\/files\/(public|private)\/([^/]+)$/);
  if (fm && m === 'GET') return serveFile(req, fm[1], fm[2]);

  if (path === '/api/realtime') return handleRealtime(req, await user());
  fm = path.match(/^\/api\/actors\/([A-Za-z0-9_]+)\/([^/]+)$/);
  if (fm) return handleActorSocket(req, fm[1], decodeURIComponent(fm[2]), await user(), url.searchParams.get('connection_id') || '');

  // OpenAI-compatible gateway for aiGateway.connection() (internal only).
  if (path.startsWith('/api/ai-gateway/v1/')) {
    if (!timingSafeEq(token || '', config.internalSecret || 'dev-internal')) return json({ error: { message: 'unauthorized' } }, 401);
    if (path.endsWith('/chat/completions') && m === 'POST') return gatewayChat(req);
    if (path.endsWith('/models')) return gatewayModels();
    return json({ error: { message: 'not found' } }, 404);
  }
  // systemd timers -> scheduled workflows.
  fm = path.match(/^\/internal\/workflows\/([A-Za-z0-9_]+)$/);
  if (fm && m === 'POST') {
    if (!timingSafeEq(req.headers.get('x-cron-secret') || '', config.cronSecret || '')) return json({ error: 'unauthorized' }, 401);
    const r = await runWorkflow(fm[1]); return json(r.body, r.status);
  }

  if (path.match(/^\/api\/apps\/public\/prod\/public-settings\/by-id\/[^/]+$/)) {
    return json({ id: config.appId, public_settings: { requires_auth: true, auth_config: { enable_username_password: true, enable_google_login: false, mfa_policy: 'off' }, selfhosted: true } });
  }
  const am = path.match(/^\/api\/apps\/([^/]+)\/(.*)$/);
  if (!am) return json({ message: 'Not found' }, 404);
  const rest = am[2];

  let r = rest.match(/^auth\/([a-z-]+)$/);
  if (r) return json(await handleAuthRoute(r[1], req));

  if (rest === 'entities/User/me') {
    const u = await user(); if (!u) throw new HttpError(401, 'Authentication required');
    if (m === 'GET') return json(u);
    if (m === 'PUT' || m === 'PATCH') return json(await new EntityStore('User', { user: u, service: false }).update(u.id, await body(req)));
  }
  r = rest.match(/^entities\/([A-Za-z0-9_]+)(?:\/(.*))?$/);
  if (r) {
    const u = await user();
    if (!u) throw new HttpError(401, 'Authentication required');
    const s = new EntityStore(r[1], { user: u, service: false });
    const sub = r[2] || '';
    const qp = url.searchParams; const qry = qp.get('q') ? JSON.parse(qp.get('q')!) : {};
    if (!sub && m === 'GET') return json(await s.readArray(qry, qp.get('sort') || undefined, Number(qp.get('limit')) || undefined, Number(qp.get('skip')) || undefined, qp.get('fields') || undefined));
    if (!sub && m === 'POST') return json(await s.create(await body(req)));
    if (!sub && m === 'DELETE') return json(await s.deleteMany(await body(req)));
    if (sub === 'v2/list' && m === 'GET') return json(await s.readPage(qry, { limit: qp.get('limit'), cursor: qp.get('cursor'), sort: qp.get('sort') || undefined, fields: qp.get('fields') || undefined, distinct: qp.get('distinct') || undefined }));
    if (sub === 'count' && m === 'GET') return json({ count: await s.count(qry) });
    if (sub === 'aggregate' && m === 'POST') return json(await s.aggregate(await body(req)));
    if (sub === 'upsert' && m === 'POST') { const b = await body(req); return json(await s.upsert(b.records, b.key)); }
    if (sub === 'bulk' && m === 'POST') return json(await s.bulkCreate(await body(req)));
    if (sub === 'bulk' && m === 'PUT') return json(await s.bulkUpdate(await body(req)));
    if (sub === 'update-many' && m === 'PATCH') { const b = await body(req); return json(await s.updateMany(b.query, b.data)); }
    if (sub && !sub.includes('/')) {
      if (m === 'GET') return json(await s.get(sub));
      if (m === 'PUT' || m === 'PATCH') return json(await s.update(sub, await body(req)));
      if (m === 'DELETE') return json(await s.delete(sub));
    }
    return json({ message: 'Not found' }, 404);
  }
  r = rest.match(/^integration-endpoints\/Core\/([A-Za-z0-9_]+)$/);
  if (r && m === 'POST') {
    const u = await user(); if (!u) throw new HttpError(401, 'Authentication required');
    return json(await runCore(r[1], await body(req), u));
  }
  if (rest.startsWith('integration-endpoints/')) throw new HttpError(501, 'This integration is not available on the self-hosted server');
  r = rest.match(/^agents\/conversations(?:\/(v2\/)?([^/]+)(\/messages)?)?$/);
  if (r) {
    const u = await user(); if (!u) throw new HttpError(401, 'Authentication required');
    if (!r[2] && m === 'GET') return json(await agents.listConversations(u, url.searchParams));
    if (!r[2] && m === 'POST') return json(await agents.createConversation(await body(req), u));
    if (r[2] && r[3] && m === 'POST') return json(await agents.addMessage(r[2], await body(req), u));
    if (r[2] && !r[3] && m === 'GET') return json(await agents.getConversation(r[2], u));
  }
  if (rest.startsWith('analytics') || rest.startsWith('app-logs')) return json({ ok: true });
  return json({ message: 'Not found' }, 404);
}

Deno.serve({ port: config.port, hostname: '0.0.0.0' }, async (req) => {
  try { return await handle(req); } catch (e) { return err(e); }
});
