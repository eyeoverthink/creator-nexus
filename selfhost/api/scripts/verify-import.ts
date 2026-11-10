// Phase 2: compare the Base44 export (counts from Base44 itself, in _manifest.json) with Postgres.
// Read-only. Exit code 1 if any Base44 record is missing or a field differs.
//   docker compose run --rm -v /opt/creator-nexus/import:/import:ro -v .../api/scripts:/app/selfhost/api/scripts:ro api run -A scripts/verify-import.ts /import
import { q, pool } from '../lib/db.ts';

const dir = Deno.args[0] || '/import';
const manifest = JSON.parse(await Deno.readTextFile(`${dir}/_manifest.json`));
let bad = 0;
// Postgres jsonb stores object keys in its own order, so compare with sorted keys.
const canon = (v: any): any => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const sample: string[] = [];
const rows: string[] = [];
const ts = (v: any) => v ? new Date(/([zZ]|[+-]\d\d:?\d\d)$/.test(String(v)) ? v : v + 'Z').toISOString() : null;
for (const [name, m] of Object.entries<any>(manifest.entities)) {
  let exp: any[] = [];
  try { exp = JSON.parse(await Deno.readTextFile(`${dir}/${name}.json`)); } catch { /* none */ }
  const ids = exp.map(r => String(r.id));
  let present = 0, total = 0, diffs = 0;
  try {
    total = (await q(`SELECT count(*)::int c FROM ent."${name}"`))[0].c;
    const got = await q(`SELECT id, data, created_date, created_by_id FROM ent."${name}" WHERE id = ANY($1::text[])`, [ids]);
    present = got.length;
    const byId = new Map(got.map((g: any) => [g.id, g]));
    for (const r of exp) {
      const g: any = byId.get(String(r.id)); if (!g) continue;
      if (r.created_date && ts(r.created_date) !== g.created_date) diffs++;
      else if ((r.created_by_id || null) !== (g.created_by_id || null)) diffs++;
      else for (const [k, v] of Object.entries(r)) {
        if (['id', 'created_date', 'updated_date', 'created_by', 'created_by_id', 'is_sample'].includes(k) || v === null || v === undefined || v === '') continue;
        if (name === 'User' && (k === 'email' || k === 'role')) continue;
        if (JSON.stringify(canon(g.data[k])) !== JSON.stringify(canon(v))) { diffs++; if (sample.length < 5) sample.push(`${name}.${k} id=${r.id}`); break; }
      }
    }
  } catch (e) { rows.push(`${name.padEnd(28)} ERROR ${(e as Error).message}`); bad++; continue; }
  const b44 = m.base44_count ?? '?';
  const ok = present === ids.length && (m.base44_count == null || m.base44_count === ids.length) && diffs === 0;
  if (!ok) bad++;
  rows.push(`${name.padEnd(28)} base44=${String(b44).padStart(5)} exported=${String(ids.length).padStart(5)} selfhost_has=${String(present).padStart(5)} selfhost_total=${String(total).padStart(5)} field_diffs=${diffs} ${ok ? 'OK' : 'CHECK'}`);
}
console.log(rows.join('\n'));
if (sample.length) console.log('first field diffs: ' + sample.join(', '));
console.log(bad ? `\n${bad} entit${bad === 1 ? 'y needs' : 'ies need'} a look` : '\nall Base44 records present and identical');
await pool.end();
Deno.exit(bad ? 1 : 0);
