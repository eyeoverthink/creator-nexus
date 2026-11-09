// Phase 2: import Base44 entity exports (<Entity>.json arrays, or dashboard <Entity>.csv) into Postgres,
// keeping each record's id, created_date, updated_date, created_by and created_by_id.
//   docker compose run --rm -v /opt/creator-nexus/import:/import api run -A scripts/import-base44.ts /import [--replace]
import { loadSchemas, migrate, schemas } from '../lib/entities.ts';
import { q, pool } from '../lib/db.ts';

const dir = Deno.args[0] || '/import';
const replace = Deno.args.includes('--replace');
await loadSchemas(); await migrate();

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
let total = 0;
for await (const f of Deno.readDir(dir)) {
  const m = f.name.match(/^([A-Za-z0-9_]+)\.(json|csv)$/); if (!m) continue;
  const name = m[1]; const schema = schemas.get(name);
  if (!schema) { console.warn(`skip ${f.name}: no entity schema ${name}`); continue; }
  const text = await Deno.readTextFile(`${dir}/${f.name}`);
  const list: any[] = m[2] === 'json' ? JSON.parse(text) : parseCsv(text);
  if (replace) await q(`DELETE FROM ent."${name}"`);
  let n = 0;
  for (const raw of list) {
    const r = coerce(raw, schema.properties);
    const { id, created_date, updated_date, created_by, created_by_id, is_sample, ...data } = r;
    if (!id) continue;
    await q(`INSERT INTO ent."${name}" (id, data, created_date, updated_date, created_by, created_by_id, is_sample)
      VALUES ($1, $2::jsonb, COALESCE($3::timestamptz, now()), COALESCE($4::timestamptz, now()), $5, $6, COALESCE($7, false))
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_date = EXCLUDED.updated_date`,
      [String(id), JSON.stringify(data), created_date || null, updated_date || null, created_by || null, created_by_id || null, is_sample === true || is_sample === 'true']);
    n++;
  }
  total += n; console.log(`${name}: ${n} records`);
}
console.log(`done: ${total} records. Users sign up again with the same e-mail; their old ids are reused automatically.`);
await pool.end();
