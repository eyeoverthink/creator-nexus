import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const MAX_AUDIO = 10 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function parseBody(event: any) {
  try {
    const v = typeof event?.body === 'string' ? JSON.parse(event.body) : event?.body;
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch { return null; }
}

export default async function (req: Request) {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const expected = secrets.get('RUNNER_SECRET');
  if (!expected || expected.length < 32) return json({ error: 'not_configured' }, 503);
  const supplied = req.headers.get('x-runner-secret') || '';
  const encoder = new TextEncoder();
  const hashes = await Promise.all([supplied, expected].map(v => crypto.subtle.digest('SHA-256', encoder.encode(v))));
  const left = new Uint8Array(hashes[0]), right = new Uint8Array(hashes[1]);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  if (diff) return json({ error: 'unauthorized' }, 401);

  const reader = req.body?.getReader();
  if (!reader) return json({ error: 'missing_body' }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > MAX_AUDIO + 65536) { await reader.cancel(); return json({ error: 'too_large' }, 413); }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) { bytes.set(c, offset); offset += c.byteLength; }

  const form = await new Response(bytes, { headers: { 'Content-Type': req.headers.get('content-type')! } }).formData();
  const sourceId = form.get('source_event_id') as string;
  const file = form.get('file') as File;
  if (typeof sourceId !== 'string' || !ID_RE.test(sourceId)) return json({ error: 'invalid_source_event_id' }, 400);
  if (!(file instanceof File) || file.size < 44 || file.size > MAX_AUDIO) return json({ error: 'WAV_required_max_10_MB' }, 400);
  const sig = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (String.fromCharCode(...sig) !== 'RIFF') return json({ error: 'invalid_WAV' }, 400);

  const base44 = createClientFromRequest(req);
  const events = base44.asServiceRole.entities.NexusEvent;
  const source = (await events.filter({ id: sourceId, kind: 'job.queued' }, { limit: 1, fields: ['owner_id', 'workspace_id'] })).items[0];
  if (!source) return json({ error: 'source_not_found' }, 404);
  const existing = (await events.filter({ kind: 'job.audio', body: { $regex: '"source_event_id"\\s*:\\s*"' + sourceId + '"' } }, { limit: 1, fields: ['body'] })).items[0];
  if (existing) return json({ ok: true, already_uploaded: true });
  const done = (await events.filter({ kind: 'job.done', body: { $regex: '"source_event_id"\\s*:\\s*"' + sourceId + '"' }, owner_id: source.owner_id, workspace_id: source.workspace_id }, { limit: 1, fields: ['body'] })).items[0];
  if (!done) return json({ error: 'tts_not_completed' }, 409);

  const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({
    file: new File([file], 'job-' + sourceId + '.wav', { type: 'audio/wav' })
  });
  const bodyParsed = parseBody(done);
  await events.create({
    owner_id: source.owner_id,
    workspace_id: source.workspace_id,
    agent: 'runner',
    kind: 'job.audio',
    message: 'TTS audio transferred',
    body: JSON.stringify({
      source_event_id: sourceId,
      runner_id: bodyParsed?.runner_id,
      file_uri,
      file_name: 'job-' + sourceId + '.wav',
      file_size_bytes: file.size,
      transferred_at: new Date().toISOString(),
    }),
  });
  return json({ ok: true, file_uri });
}
