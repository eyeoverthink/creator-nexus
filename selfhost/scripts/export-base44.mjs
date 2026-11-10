#!/usr/bin/env node
// Phase 2: READ-ONLY export of every entity from the live Base44 app (Apps API, GET only).
// No AI/integration/function calls; nothing in Base44 is created, changed or deleted.
//
// Auth (pick one; the value is never printed or written anywhere by this script):
//   A) Base44 CLI login (no secret to handle):   npx base44 login   then run with --cli
//   B) Read-only personal access token (Base44 > workspace settings > Secrets > access token, "Read only"),
//      saved in a mode-600 file:   BASE44_TOKEN_FILE=/root/.base44-readonly.token node export-base44.mjs <out>
//      (BASE44_TOKEN env var also works.)
//
// Usage: node selfhost/scripts/export-base44.mjs <outDir> [--cli] [--app-id <id>] [--entities A,B]
// Output: <outDir>/<Entity>.json (array of records incl. id/created_date/updated_date/created_by/created_by_id),
//         <outDir>/_manifest.json (Base44 counts, exported counts, schema diff, API calls made),
//         <outDir>/_files.json (every Base44-hosted file URL / private URI found in the data, with where it was found).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const out = args.find((a, i) => !a.startsWith('--') && !['--app-id', '--entities'].includes(args[i - 1])) || './base44-export';
const useCli = args.includes('--cli');
const appId = opt('--app-id') || process.env.BASE44_APP_ID || '6ad00af14909c671e73bb835';
const API = (process.env.BASE44_API_URL || 'https://app.base44.com').replace(/\/$/, '');
const onlyEntities = opt('--entities')?.split(',').map(s => s.trim()).filter(Boolean);
const MIN_GAP_MS = Number(process.env.BASE44_MIN_GAP_MS || 1100); // stay well under 70 req/min

let token = '';
if (!useCli) {
  const tf = process.env.BASE44_TOKEN_FILE;
  token = (tf ? fs.readFileSync(tf, 'utf8') : process.env.BASE44_TOKEN || '').trim();
  if (!token) { console.error('No credential: use --cli (after `npx base44 login`) or set BASE44_TOKEN_FILE / BASE44_TOKEN.'); process.exit(1); }
}

let calls = 0, last = 0;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// The only network function. It refuses anything but GET, so this script cannot change Base44.
async function get(p, params = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)])).toString();
  const rel = `/api/apps/${appId}${p}${qs ? '?' + qs : ''}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const wait = last + MIN_GAP_MS - Date.now(); if (wait > 0) await sleep(wait);
    last = Date.now(); calls++;
    if (useCli) {
      try {
        const txt = execFileSync('npx', ['--yes', 'base44', 'api', 'fetch', 'GET', rel, '--read-only', '--app-id', appId], { encoding: 'utf8', maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe'] });
        return JSON.parse(txt);
      } catch (e) {
        const msg = String(e.stderr || e.message);
        if (/rate limit|429/i.test(msg) && attempt < 5) { await sleep(15000); continue; }
        throw Object.assign(new Error(msg.split('\n').slice(0, 3).join(' ')), { status: /404/.test(msg) ? 404 : 0 });
      }
    }
    const res = await fetch(API + rel, { method: 'GET', headers: { authorization: 'Bearer ' + token, accept: 'application/json' } });
    if (res.status === 429 || res.status === 503) { const ra = Number(res.headers.get('retry-after')) || 15; await sleep(ra * 1000); continue; }
    const body = await res.text();
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} ${body.slice(0, 200)}`), { status: res.status });
    return JSON.parse(body);
  }
  throw new Error('gave up after retries: ' + p);
}

const repoEntities = (() => {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../base44/entities');
  try { return fs.readdirSync(root).filter(f => /\.jsonc?$/.test(f)).map(f => f.replace(/\.jsonc?$/, '')); } catch { return []; }
})();

// Find Base44-hosted file references anywhere in a record.
const FILE_RE = /(https?:\/\/[^\s"'<>)]*(?:base44\.(?:app|com)|supabase\.co\/storage)[^\s"'<>)]*)|((?:base44|private):\/\/[^\s"'<>)]+)/g;
function scanFiles(entity, rec, found) {
  const walk = (v, p) => {
    if (typeof v === 'string') { for (const m of v.matchAll(FILE_RE)) found.push({ url: m[0], entity, id: rec.id, field: p }); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, p ? `${p}.${k}` : k);
  };
  walk(rec, '');
}

fs.mkdirSync(out, { recursive: true });
const manifest = { app_id: appId, exported_at: new Date().toISOString(), via: useCli ? 'base44 cli (--read-only)' : 'personal access token', entities: {}, live_only_entities: [], repo_only_entities: [], errors: {} };
let live = [];
try {
  const s = await get('/entity-schemas');
  const list = Array.isArray(s) ? s : (s.schemas || s.items || []);
  live = list.map(x => x.name || x.entity_name || x.title).filter(Boolean);
} catch (e) { manifest.errors._schemas = e.message; }
const names = [...new Set([...(live.length ? live : repoEntities), ...repoEntities])].filter(n => !onlyEntities || onlyEntities.includes(n));
manifest.live_only_entities = live.filter(n => !repoEntities.includes(n));
manifest.repo_only_entities = live.length ? repoEntities.filter(n => n !== 'User' && !live.includes(n)) : [];
const files = [];

for (const name of names) {
  const rows = [];
  try {
    let count = null;
    if (name === 'User') {
      try { count = (await get('/entities/User/count')).count; } catch (e) { manifest.errors.User_count = e.message; }
      const users = await get('/entities/User', { sort: 'created_date', limit: 10000 });
      rows.push(...(Array.isArray(users) ? users : users.items || []));
    } else {
      try { count = (await get(`/entities/${name}/count`)).count; } catch (e) { if (e.status === 404) { manifest.entities[name] = { base44_count: 0, exported: 0, note: 'not in live app' }; continue; } throw e; }
      if (count > 0) {
        let page = await get(`/entities/${name}/v2/list`, { limit: 5000, sort: 'created_date' });
        rows.push(...page.items);
        while (page.has_more && page.next_cursor) { page = await get(`/entities/${name}/v2/list`, { cursor: page.next_cursor, limit: 5000 }); rows.push(...page.items); }
      }
    }
    for (const r of rows) scanFiles(name, r, files);
    fs.writeFileSync(path.join(out, name + '.json'), JSON.stringify(rows));
    manifest.entities[name] = { base44_count: count, exported: rows.length };
    console.log(`${name}: base44=${count} exported=${rows.length}${count !== null && count !== rows.length ? '  <-- MISMATCH' : ''}`);
  } catch (e) { manifest.errors[name] = e.message; console.error(`${name}: FAILED ${e.message}`); }
}
manifest.api_calls = calls;
manifest.file_refs = files.length;
fs.writeFileSync(path.join(out, '_manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(out, '_files.json'), JSON.stringify(files, null, 2));
console.log(`done: ${Object.keys(manifest.entities).length} entities, ${Object.values(manifest.entities).reduce((a, e) => a + e.exported, 0)} records, ${files.length} file refs, ${calls} Base44 API calls (GET only), errors: ${Object.keys(manifest.errors).length}`);
