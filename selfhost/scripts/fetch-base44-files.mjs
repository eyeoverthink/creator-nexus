#!/usr/bin/env node
// Phase 2: download copies of PUBLIC Base44-hosted files referenced in the export (from _files.json).
// Plain HTTPS GETs of public static files (media.base44.com / Supabase public storage / base44 public file links);
// these are not Apps API calls and use no credits. Private URIs and anything needing auth are listed, not fetched.
// The records keep their original URLs; the importer stores a url -> local copy map (sh.base44_file_mirror).
// Usage: node selfhost/scripts/fetch-base44-files.mjs <exportDir> [--max-mb 2048]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dir = process.argv[2] || './base44-export';
const maxMb = Number(process.argv[process.argv.indexOf('--max-mb') + 1]) || 2048;
const refs = JSON.parse(fs.readFileSync(path.join(dir, '_files.json'), 'utf8'));
const outDir = path.join(dir, 'files'); fs.mkdirSync(outDir, { recursive: true });
const clean = (u) => u.replace(/[.,;:]+$/, '');
const urls = [...new Set(refs.map(r => clean(r.url)))];
const publicOk = (u) => {
  try {
    const x = new URL(u);
    if (x.protocol !== 'https:') return false;
    if (x.hostname === 'media.base44.com') return true;
    if (x.hostname.endsWith('.supabase.co') && x.pathname.includes('/storage/v1/object/public/')) return true;
    if (/(^|\.)base44\.(app|com)$/.test(x.hostname) && /\/files\/(public|mp)\//.test(x.pathname)) return true;
    return false;
  } catch { return false; }
};
const result = []; let bytes = 0;
for (const u of urls) {
  if (!publicOk(u)) { result.push({ url: u, status: 'skipped', reason: u.includes('://') && u.startsWith('http') ? 'not a public static file URL' : 'private/non-HTTP URI' }); continue; }
  if (bytes > maxMb * 1048576) { result.push({ url: u, status: 'skipped', reason: 'size budget reached' }); continue; }
  try {
    const res = await fetch(u, { method: 'GET', redirect: 'follow' });
    if (!res.ok) { result.push({ url: u, status: 'failed', http: res.status }); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    const base = (decodeURIComponent(new URL(u).pathname.split('/').pop() || 'file')).replace(/[^A-Za-z0-9._-]+/g, '_').slice(-100) || 'file';
    const key = 'b44-' + crypto.createHash('sha256').update(u).digest('hex').slice(0, 16) + '-' + base;
    fs.writeFileSync(path.join(outDir, key), buf); bytes += buf.length;
    result.push({ url: u, status: 'downloaded', key, size: buf.length, mime: res.headers.get('content-type') || 'application/octet-stream' });
  } catch (e) { result.push({ url: u, status: 'failed', error: String(e.message || e) }); }
}
fs.writeFileSync(path.join(dir, '_files_downloaded.json'), JSON.stringify(result, null, 2));
const c = (s) => result.filter(r => r.status === s).length;
console.log(`files: ${urls.length} unique refs; downloaded ${c('downloaded')} (${(bytes / 1048576).toFixed(1)} MB), skipped ${c('skipped')}, failed ${c('failed')}`);
