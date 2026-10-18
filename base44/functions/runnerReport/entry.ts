import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const RUNNER_RE = /^[A-Za-z0-9_.-]{1,40}$/;
const MAX_VIDEO = 50 * 1024 * 1024;
const MAX_AUDIO = 10 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

const runnerId = (value: unknown) =>
  typeof value === 'string' && RUNNER_RE.test(value) ? value : 'runner';

function parseBody(event: any) {
  try {
    const v = typeof event?.body === 'string' ? JSON.parse(event.body) : event?.body;
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch { return null; }
}

function cleanResult(result: any) {
  const out: any = {};
  if (typeof result.job_id === 'string' && ID_RE.test(result.job_id)) out.job_id = result.job_id;
  if (typeof result.error === 'string') out.error = result.error.slice(0, 3000);
  if (typeof result.output_path === 'string') out.output_path = result.output_path.slice(0, 300);
  const numeric = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  for (const key of ['file_size_bytes', 'audio_s', 'video_duration_s', 'words', 'total_s']) {
    if (numeric(result[key])) out[key] = result[key];
  }
  if (result.durations_s && typeof result.durations_s === 'object' && !Array.isArray(result.durations_s)) {
    out.durations_s = Object.fromEntries(
      Object.entries(result.durations_s).slice(0, 20)
        .filter(([k, v]) => /^[A-Za-z0-9_]{1,30}$/.test(k) && numeric(v))
    );
  }
  return out;
}

function markerQuery(ids: string[], kinds: string[]) {
  if (!ids.length || ids.some(id => !ID_RE.test(id))) throw new Error('Invalid source event identifier');
  return { kind: { $in: kinds }, body: { $regex: '"source_event_id"\\s*:\\s*"(' + ids.join('|') + ')"' } };
}

const buckets = new Map<string, { count: number; reset: number }>();
function bucket(key: string, duration: number) {
  const now = Date.now();
  for (const [id, v] of buckets) if (v.reset <= now) buckets.delete(id);
  if (!buckets.has(key)) {
    if (buckets.size >= 1000) return null;
    buckets.set(key, { count: 0, reset: now + duration });
  }
  return buckets.get(key)!;
}

async function authorizeRunner(req: Request, operation: string) {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const expected = secrets.get('RUNNER_SECRET');
  if (!expected || expected.length < 32) return json({ error: 'server_not_configured' }, 503);
  const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim().slice(0, 64);
  const failures = bucket(`${operation}:fail:${ip}`, 300000);
  if (!failures || failures.count >= 10) return json({ error: 'too_many_attempts' }, 429);
  const supplied = req.headers.get('x-runner-secret') || '';
  if (supplied.length > 4096) { failures.count++; return json({ error: 'unauthorized' }, 401); }
  const encoder = new TextEncoder();
  const hashes = await Promise.all([supplied, expected].map(v => crypto.subtle.digest('SHA-256', encoder.encode(v))));
  const left = new Uint8Array(hashes[0]), right = new Uint8Array(hashes[1]);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  if (difference) { failures.count++; return json({ error: 'unauthorized' }, 401); }
  const rate = bucket(`${operation}:rate:${ip}`, 60000);
  if (!rate || ++rate.count > 30) return json({ error: 'rate_limited' }, 429);
  return null;
}

async function readInput(req: Request, maxBytes: number) {
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
  try { value = JSON.parse(raw); }
  catch { return { error: json({ error: 'invalid_json' }, 400) }; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: json({ error: 'invalid_body' }, 400) };
  return { value };
}

async function readMultipart(req: Request, maxSize: number) {
  const reader = req.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (!reader) return { error: json({ error: 'missing_body' }, 400) };
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > maxSize + 65536) { await reader.cancel(); return { error: json({ error: 'file_too_large' }, 413) }; }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return { bytes };
}

async function receiveVideo(req: Request, base44: any) {
  const result = await readMultipart(req, MAX_VIDEO);
  if ('error' in result) return result.error;
  const form = await new Response(result.bytes, { headers: { 'Content-Type': req.headers.get('content-type')! } }).formData();
  const sourceId = form.get('source_event_id') as string;
  const file = form.get('file') as File;
  if (typeof sourceId !== 'string' || !ID_RE.test(sourceId)) return json({ error: 'invalid_source_event_id' }, 400);
  if (!(file instanceof File) || file.size < 12 || file.size > MAX_VIDEO || file.type !== 'video/mp4') return json({ error: 'MP4_required_max_50_MB' }, 400);
  const sig = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (String.fromCharCode(...sig.slice(4, 8)) !== 'ftyp') return json({ error: 'invalid_MP4' }, 400);
  const events = base44.asServiceRole.entities.NexusEvent;
  const source = (await events.filter({ id: sourceId, kind: 'job.queued' }, { limit: 1, fields: ['owner_id', 'workspace_id'] })).items[0];
  if (!source) return json({ error: 'source_not_found' }, 404);
  const existing = (await events.filter(markerQuery([sourceId], ['job.video']), { limit: 1, fields: ['body'] })).items[0];
  if (existing) return json({ ok: true, already_uploaded: true });
  const done = (await events.filter({ ...markerQuery([sourceId], ['job.done']), owner_id: source.owner_id, workspace_id: source.workspace_id }, { limit: 1, fields: ['body'] })).items[0];
  if (!done) return json({ error: 'render_not_completed' }, 409);
  const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: new File([file], 'job-' + sourceId + '.mp4', { type: 'video/mp4' }) });
  await events.create({ owner_id: source.owner_id, workspace_id: source.workspace_id, agent: 'runner', kind: 'job.video', message: 'Rendered video transferred', body: JSON.stringify({ source_event_id: sourceId, runner_id: parseBody(done)?.runner_id, file_uri, file_name: 'job-' + sourceId + '.mp4', file_size_bytes: file.size, transferred_at: new Date().toISOString() }) });
  return json({ ok: true });
}

async function receiveAudio(req: Request, base44: any) {
  const result = await readMultipart(req, MAX_AUDIO);
  if ('error' in result) return result.error;
  const form = await new Response(result.bytes, { headers: { 'Content-Type': req.headers.get('content-type')! } }).formData();
  const sourceId = form.get('source_event_id') as string;
  const file = form.get('file') as File;
  if (typeof sourceId !== 'string' || !ID_RE.test(sourceId)) return json({ error: 'invalid_source_event_id' }, 400);
  if (!(file instanceof File) || file.size < 44 || file.size > MAX_AUDIO) return json({ error: 'WAV_required_max_10_MB' }, 400);
  const sig = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (String.fromCharCode(...sig) !== 'RIFF') return json({ error: 'invalid_WAV' }, 400);
  const events = base44.asServiceRole.entities.NexusEvent;
  const source = (await events.filter({ id: sourceId, kind: 'job.queued' }, { limit: 1, fields: ['owner_id', 'workspace_id'] })).items[0];
  if (!source) return json({ error: 'source_not_found' }, 404);
  const existing = (await events.filter({ kind: 'job.audio', body: { $regex: '"source_event_id"\\s*:\\s*"' + sourceId + '"' } }, { limit: 1, fields: ['body'] })).items[0];
  if (existing) return json({ ok: true, already_uploaded: true });
  const done = (await events.filter({ kind: 'job.done', body: { $regex: '"source_event_id"\\s*:\\s*"' + sourceId + '"' }, owner_id: source.owner_id, workspace_id: source.workspace_id }, { limit: 1, fields: ['body'] })).items[0];
  if (!done) return json({ error: 'tts_not_completed' }, 409);
  const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: new File([file], 'job-' + sourceId + '.wav', { type: 'audio/wav' }) });
  const bodyParsed = parseBody(done);
  await events.create({ owner_id: source.owner_id, workspace_id: source.workspace_id, agent: 'runner', kind: 'job.audio', message: 'TTS audio transferred', body: JSON.stringify({ source_event_id: sourceId, runner_id: bodyParsed?.runner_id, file_uri, file_name: 'job-' + sourceId + '.wav', file_size_bytes: file.size, transferred_at: new Date().toISOString() }) });
  return json({ ok: true, file_uri });
}

export default async function (req: Request) {
  try {
    const denied = await authorizeRunner(req, 'report');
    if (denied) return denied;
    if ((req.headers.get('content-type') || '').toLowerCase().startsWith('multipart/form-data')) {
      const c = createClientFromRequest(req);
      return (req.headers.get('x-media-type') || '').toLowerCase() === 'audio'
        ? await receiveAudio(req, c)
        : await receiveVideo(req, c);
    }
    const parsed = await readInput(req, 30000);
    if ('error' in parsed) return parsed.error;
    const input = parsed.value;
    const sourceId = input.source_event_id;
    if (typeof sourceId !== 'string' || !ID_RE.test(sourceId)) return json({ error: 'invalid_source_event_id' }, 400);
    if (typeof input.ok !== 'boolean') return json({ error: 'ok_must_be_boolean' }, 400);
    const result = input.result ?? {};
    if (typeof result !== 'object' || Array.isArray(result)) return json({ error: 'result_must_be_object' }, 400);
    const base44 = createClientFromRequest(req);
    const events = base44.asServiceRole.entities.NexusEvent;
    const sourcePage = await events.filter({ id: sourceId, kind: 'job.queued' }, { limit: 1, fields: ['owner_id', 'workspace_id'] });
    const source = sourcePage.items[0];
    if (!source) return json({ error: 'source_not_found' }, 404);
    if (input.owner_id != null && input.owner_id !== source.owner_id) return json({ error: 'owner_mismatch' }, 400);
    if (input.workspace_id != null && input.workspace_id !== source.workspace_id) return json({ error: 'workspace_mismatch' }, 400);
    const existing = await events.count(markerQuery([sourceId], ['job.done', 'job.failed']));
    if (existing) return json({ error: 'already_reported' }, 409);
    const cleaned = cleanResult(result);
    const jobId = typeof cleaned.job_id === 'string' ? cleaned.job_id : `job-${sourceId}`;
    const body = JSON.stringify({ source_event_id: sourceId, job_id: jobId, ok: input.ok, runner_id: runnerId(input.runner_id), reported_at: new Date().toISOString(), ...cleaned });
    if (body.length >= 20000) return json({ error: 'result_too_large' }, 413);
    const kind = input.ok ? 'job.done' : 'job.failed';
    const created = await events.create({
      owner_id: source.owner_id, workspace_id: source.workspace_id, agent: 'runner', kind,
      message: `Job ${jobId} ${input.ok ? 'done' : 'failed'}`, body,
    });
    return json({ ok: true, kind, event_id: created.id, _v: 'selfcontained-1' });
  } catch {
    console.error('runnerReport: unexpected error');
    return json({ error: 'internal_error' }, 500);
  }
}
