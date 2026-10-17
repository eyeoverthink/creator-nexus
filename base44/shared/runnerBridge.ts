import { secrets } from 'base44:runtime';
import { cleanVideoProduction } from './runnerResultMetadata.ts';

export const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const RUNNER_RE = /^[A-Za-z0-9_.-]{1,40}$/;
const buckets = new Map();
export const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export const runnerId = value => typeof value === 'string' && RUNNER_RE.test(value) ? value : 'runner';
export function parseBody(event) {
  try {
    const value = typeof event?.body === 'string' ? JSON.parse(event.body) : event?.body;
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch { return null; }
}
function bucket(key, duration) {
  const now = Date.now();
  for (const [id, value] of buckets) if (value.reset <= now) buckets.delete(id);
  if (!buckets.has(key)) {
    if (buckets.size >= 1000) return null;
    buckets.set(key, { count: 0, reset: now + duration });
  }
  return buckets.get(key);
}
export async function authorizeRunner(req, operation) {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const expected = secrets.get('RUNNER_SECRET');
  if (!expected || expected.length < 32) return json({ error: 'server_not_configured' }, 503);
  const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim().slice(0, 64);
  const failures = bucket(`${operation}:fail:${ip}`, 300000);
  if (!failures || failures.count >= 10) return json({ error: 'too_many_attempts' }, 429);
  const supplied = req.headers.get('x-runner-secret') || '';
  if (supplied.length > 4096) { failures.count++; return json({ error: 'unauthorized' }, 401); }
  const encoder = new TextEncoder();
  const hashes = await Promise.all([supplied, expected].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const left = new Uint8Array(hashes[0]), right = new Uint8Array(hashes[1]);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  if (difference) { failures.count++; return json({ error: 'unauthorized' }, 401); }
  const rate = bucket(`${operation}:rate:${ip}`, 60000);
  if (!rate || ++rate.count > 30) return json({ error: 'rate_limited' }, 429);
  return null;
}
export async function readInput(req, maxBytes, allowEmpty = false) {
  const reader = req.body?.getReader();
  let size = 0, raw = '';
  const decoder = new TextDecoder();
  if (reader) {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBytes) { await reader.cancel(); return { error: json({ error: 'request_too_large' }, 413) }; }
      raw += decoder.decode(chunk.value, { stream: true });
    }
    raw += decoder.decode();
  }
  let value;
  try { value = allowEmpty && !raw.trim() ? {} : JSON.parse(raw); }
  catch { return { error: json({ error: 'invalid_json' }, 400) }; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: json({ error: 'invalid_body' }, 400) };
  return { value };
}
export function markerQuery(ids, kinds) {
  if (!ids.length || ids.some(id => !ID_RE.test(id))) throw new Error('Invalid source event identifier');
  return { kind: { $in: kinds }, body: { $regex: '"source_event_id"\\s*:\\s*"(' + ids.join('|') + ')"' } };
}
export async function markers(entity, ids, kinds) {
  const query = markerQuery(ids, kinds);
  const results = [];
  let cursor;
  do {
    const page = await entity.filter(query, { sort: 'created_date', limit: 100, fields: ['body', 'created_date'], ...(cursor ? { cursor } : {}) });
    results.push(...page.items);
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return results;
}
export function byAge(a, b) {
  return (Date.parse(a.created_date) || 0) - (Date.parse(b.created_date) || 0) || String(a.id).localeCompare(String(b.id));
}
export function cleanResult(result) {
  const out = cleanVideoProduction(result);
  if (typeof result.job_id === 'string' && ID_RE.test(result.job_id)) out.job_id = result.job_id;
  if (typeof result.error === 'string') out.error = result.error.slice(0, 3000);
  if (typeof result.output_path === 'string') out.output_path = result.output_path.slice(0, 300);
  const numeric = value => typeof value === 'number' && Number.isFinite(value);
  for (const key of ['file_size_bytes', 'audio_s', 'video_duration_s', 'words', 'total_s']) if (numeric(result[key])) out[key] = result[key];
  if (result.durations_s && typeof result.durations_s === 'object' && !Array.isArray(result.durations_s)) {
    out.durations_s = Object.fromEntries(Object.entries(result.durations_s).slice(0, 20).filter(([key, value]) => /^[A-Za-z0-9_]{1,30}$/.test(key) && numeric(value)));
  }
  return out;
}