// Phase 2: import a Base44 export (<Entity>.json arrays from export-base44.mjs, or dashboard <Entity>.csv)
// into Postgres. Idempotent: upsert by Base44 id, keeping id, created_date, updated_date, created_by,
// created_by_id and is_sample. Run it as often as you like; re-runs converge to the export.
//   docker compose run --rm -v /opt/creator-nexus/import:/import:ro -v /opt/creator-nexus/selfhost/api/scripts:/app/selfhost/api/scripts:ro \
//     api run -A scripts/import-base44.ts /import [--replace] [--dry-run]
// --replace : delete rows of each imported entity that are NOT in the export (e.g. Phase 1 test rows). Off by default.
// --dry-run : report only, write nothing.
// Users: Base44 User rows keep their ids. If someone already registered here with the same e-mail under a
// different id, that login is moved onto the Base44 id (auth tables + any rows they created here), so their
// Base44 data stays theirs. ADMIN_EMAILS (e.g. eyeoverthink@gmail.com) are forced to role=admin.
// Files: if <dir>/_files_downloaded.json + <dir>/files/ exist (fetch-base44-files.mjs), the copies go to
// FILES_DIR/public/ and sh.base44_file_mirror maps each original URL to its local /files/public/<key> URL.
import { loadSchemas, migrate, schemas } from '../lib/entities.ts';
import { q, q1, pool } from '../lib/db.ts';
import { config } from '../lib/config.ts';

const dir = Deno.args.find(a => !a.startsWith('--')) || '/import';
const replace = Deno.args.includes('--replace');
const dry = Deno.args.includes('--dry-run');
await loadSchemas(); if (!dry) await migrate();

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []; let row: string[] = [], cell = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') inQ = false; else cell += c; continue; }
    if (c === '"') inQ = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows; return body.filter(r => r.length > 1 || r[0]).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}
function coerce(rec: Record<string, any>, props: Record<string, any> = {}) {
  const out: any = {};
  for (const [k, v] of Object.entries(rec)) {
    if (typeof v !== 'string') { out[k] = v; continue; }
    const t = props[k]?.type;
    if (v === '') continue;
    if (t === 'number' || t === 'integer') out[k] = Number(v);
    else if (t === 'boolean') out[k] = v === 'true';
    else if (t === 'object' || t === 'array') { try { out[k] = JSON.parse(v); } catch { out[k] = v; } }
    else out[k] = v;
  }
  return out;
}
// Base44 returns stored timestamps as UTC without a zone ("2026-06-01T09:23:41.481000"): mark them UTC.
const ts = (v: any) => { if (!v) return null; const s = String(v); return /([zZ]|[+-]\d\d:?\d\d)$/.test(s) ? s : s + 'Z'; };

const files: string[] = [];
for await (const f of Deno.readDir(dir)) if (/^[A-Za-z0-9][A-Za-z0-9_]*\.(json|csv)$/.test(f.name)) files.push(f.name);
files.sort((a, b) => (a.startsWith('User.') ? -1 : b.startsWith('User.') ? 1 : a.localeCompare(b))); // users first

const report: Record<string, any> = {};
let total = 0;
for (const fname of files) {
  const [, name, ext] = fname.match(/^(.+)\.(json|csv)$/)!;
  const schema = schemas.get(name);
  if (!schema) { console.warn(`skip ${fname}: no entity schema ${name} in this build`); report[name] = { skipped: 'no schema' }; continue; }
  const text = await Deno.readTextFile(`${dir}/${fname}`);
  const list: any[] = ext === 'json' ? JSON.parse(text) : parseCsv(text);
  const ids: string[] = [];
  let n = 0, users = 0;
  for (const raw of list) {
    const r = coerce(raw, schema.properties);
    const { id, created_date, updated_date, created_by, created_by_id, is_sample, ...data } = r;
    if (!id) continue;
    ids.push(String(id));
    if (name === 'User') {
      const email = String(data.email || '').toLowerCase();
      if (email) data.email = email;
      if (config.adminEmails.includes(email)) data.role = 'admin';
      if (!dry && email) users += await adoptLogin(String(id), email);
    }
    if (!dry) await q(`INSERT INTO ent."${name}" (id, data, created_date, updated_date, created_by, created_by_id, is_sample)
      VALUES ($1, $2::jsonb, COALESCE($3::timestamptz, now()), COALESCE($4::timestamptz, now()), $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, created_date = EXCLUDED.created_date, updated_date = EXCLUDED.updated_date,
        created_by = EXCLUDED.created_by, created_by_id = EXCLUDED.created_by_id, is_sample = EXCLUDED.is_sample`,
      [String(id), JSON.stringify(data), ts(created_date), ts(updated_date), created_by || null, created_by_id || null, is_sample === true || is_sample === 'true']);
    n++;
  }
  let removed = 0;
  const extra = (await q1(`SELECT count(*)::int AS c FROM ent."${name}" WHERE NOT (id = ANY($1::text[]))`, [ids]))?.c ?? 0;
  if (replace && extra && !dry) removed = (await q(`DELETE FROM ent."${name}" WHERE NOT (id = ANY($1::text[])) RETURNING id`, [ids])).length;
  report[name] = { in_export: list.length, upserted: n, extra_local_rows: extra - removed, removed, logins_moved: users };
  total += n; console.log(`${name}: ${n} upserted${extra ? `, ${extra - removed} local-only rows kept` : ''}${removed ? `, ${removed} removed` : ''}${users ? `, ${users} login moved to Base44 id` : ''}`);
}

// A login created here before the import (same e-mail, different id) is moved onto the Base44 id.
async function adoptLogin(b44Id: string, email: string): Promise<number> {
  const au = await q1(`SELECT id FROM public."user" WHERE lower(email) = $1`, [email]).catch(() => null);
  if (!au || au.id === b44Id) return 0;
  const old = au.id as string;
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    // email is unique, so copy the row under a temporary e-mail first, then swap.
    const tmp = `moving-${old}@local.invalid`;
    await c.query(`UPDATE public."user" SET email = $2 WHERE id = $1`, [old, tmp]);
    await c.query(`INSERT INTO public."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
      SELECT $2, name, $3, "emailVerified", image, "createdAt", now() FROM public."user" WHERE id = $1`, [old, b44Id, email]);
    await c.query(`UPDATE public.account SET "userId" = $2 WHERE "userId" = $1`, [old, b44Id]);
    await c.query(`UPDATE public.session SET "userId" = $2 WHERE "userId" = $1`, [old, b44Id]);
    await c.query(`DELETE FROM public."user" WHERE id = $1`, [old]);
    for (const n of schemas.keys()) {
      if (n === 'User') continue;
      await c.query(`UPDATE ent."${n}" SET created_by_id = $2 WHERE created_by_id = $1`, [old, b44Id]);
      await c.query(`UPDATE ent."${n}" SET data = jsonb_set(data, '{owner_id}', to_jsonb($2::text)) WHERE data->>'owner_id' = $1`, [old, b44Id]);
    }
    await c.query(`UPDATE sh.files SET owner_id = $2 WHERE owner_id = $1`, [old, b44Id]);
    await c.query(`UPDATE sh.conversations SET owner_id = $2 WHERE owner_id = $1`, [old, b44Id]);
    await c.query(`DELETE FROM ent."User" WHERE id = $1`, [old]);
    await c.query('COMMIT');
    return 1;
  } catch (e) { await c.query('ROLLBACK'); console.error(`could not move login for ${email}: ${(e as Error).message}`); return 0; }
  finally { c.release(); }
}

// File copies (optional).
let mirrored = 0;
try {
  const list = JSON.parse(await Deno.readTextFile(`${dir}/_files_downloaded.json`)) as any[];
  if (!dry) {
    await q(`CREATE TABLE IF NOT EXISTS sh.base44_file_mirror (url text PRIMARY KEY, key text NOT NULL, local_url text NOT NULL, size bigint, mime text, copied_at timestamptz DEFAULT now())`);
    await Deno.mkdir(`${config.filesDir}/public`, { recursive: true });
    for (const f of list.filter(x => x.status === 'downloaded')) {
      await Deno.copyFile(`${dir}/files/${f.key}`, `${config.filesDir}/public/${f.key}`);
      await q(`INSERT INTO sh.files (key, owner_id, name, mime, size, visibility) VALUES ($1, NULL, $2, $3, $4, 'public') ON CONFLICT (key) DO NOTHING`, [f.key, f.key.replace(/^b44-[0-9a-f]+-/, ''), f.mime, f.size]);
      await q(`INSERT INTO sh.base44_file_mirror (url, key, local_url, size, mime) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (url) DO UPDATE SET key = EXCLUDED.key, local_url = EXCLUDED.local_url, size = EXCLUDED.size, mime = EXCLUDED.mime`,
        [f.url, f.key, `${config.publicUrl}/files/public/${f.key}`, f.size, f.mime]);
      mirrored++;
    }
  }
} catch (e) { if (!(e instanceof Deno.errors.NotFound)) console.error('file mirror:', (e as Error).message); }

const admins = await q(`SELECT id, data->>'email' AS email, data->>'role' AS role FROM ent."User" WHERE data->>'role' = 'admin'`).catch(() => []);
console.log(`done${dry ? ' (dry run, nothing written)' : ''}: ${total} records, ${mirrored} file copies. admins: ${admins.map((a: any) => a.email).join(', ') || 'none'}`);
if (!dry) await Deno.writeTextFile(`${config.filesDir}/../import-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, JSON.stringify({ dir, replace, report, mirrored }, null, 2)).catch(() => null);
await pool.end();
