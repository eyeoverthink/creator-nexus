// Base44 backend function `nexusTTS` — Kokoro text-to-speech on the VPS runner.
// Creates a NexusEvent (kind: job.queued, job_type: tts) that the runner picks up,
// runs Kokoro, and reports back via runnerReport. The frontend polls for completion.
//
// Actions:
//   speak  — queue a TTS job, returns { event_id } to poll against
//   status — check a queued TTS job by event_id, returns done/pending/failed
//   voices — list available Kokoro voices (static, no VPS call)
//
// Admin-gated. No secrets needed (reuses the runner's existing poll/report flow).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const VOICES: Record<string, { label: string; lang: string }> = {
  af_heart:   { label: 'Heart (female, American)', lang: 'en-us' },
  af_bella:   { label: 'Bella (female, American)', lang: 'en-us' },
  af_nova:    { label: 'Nova (female, American)',  lang: 'en-us' },
  af_sarah:   { label: 'Sarah (female, American)', lang: 'en-us' },
  af_nicole:  { label: 'Nicole (female, American)', lang: 'en-us' },
  af_sky:     { label: 'Sky (female, American)',   lang: 'en-us' },
  am_adam:    { label: 'Adam (male, American)',    lang: 'en-us' },
  am_michael: { label: 'Michael (male, American)', lang: 'en-us' },
  am_echo:    { label: 'Echo (male, American)',    lang: 'en-us' },
  am_liam:    { label: 'Liam (male, American)',    lang: 'en-us' },
  am_onyx:    { label: 'Onyx (male, American)',    lang: 'en-us' },
  bf_emma:    { label: 'Emma (female, British)',   lang: 'en-gb' },
  bf_alice:   { label: 'Alice (female, British)',  lang: 'en-gb' },
  bm_george:  { label: 'George (male, British)',   lang: 'en-gb' },
  bm_daniel:  { label: 'Daniel (male, British)',   lang: 'en-gb' },
};

const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function parseBody(event: any) {
  try {
    const v = typeof event?.body === 'string' ? JSON.parse(event.body) : event?.body;
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch { return null; }
}

export default async function (req: Request) {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user || user.role !== 'admin') return json({ error: 'nexusTTS: admin only' }, 403);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: 'JSON body required' }, 400); }

  const events = base44.asServiceRole.entities.NexusEvent;

  try {
    if (b.action === 'voices') {
      return json({ voices: Object.entries(VOICES).map(([id, v]) => ({ id, ...v })) });
    }

    if (b.action === 'speak') {
      const text = String(b.text ?? '').trim();
      if (!text) return json({ error: 'text required' }, 400);
      if (text.length > 1500) return json({ error: 'text too long (max 1500 chars)' }, 400);
      const voice = String(b.voice ?? 'af_heart');
      if (!VOICES[voice]) return json({ error: 'unknown voice' }, 400);
      const speed = Math.max(0.5, Math.min(2.0, Number(b.speed) || 1.0));

      const workspace_id = String(b.workspace_id ?? user.id);
      const event = await events.create({
        owner_id: user.id,
        workspace_id,
        agent: 'nexusTTS',
        kind: 'job.queued',
        message: `TTS: "${text.slice(0, 60)}…" voice=${voice}`,
        body: JSON.stringify({
          job_type: 'tts',
          narration: text,
          voice,
          format: String(speed),
          lang: VOICES[voice].lang,
        }),
      });
      return json({ event_id: event.id, status: 'queued', voice, speed });
    }

    if (b.action === 'status') {
      const eventId = String(b.event_id ?? '');
      if (!ID_RE.test(eventId)) return json({ error: 'invalid event_id' }, 400);

      const done = await events.filter(
        { kind: { $in: ['job.done', 'job.failed'] } },
        { sort: '-created_date', limit: 50 }
      );
      const match = done.items.find(e => {
        const body = parseBody(e);
        return body?.source_event_id === eventId;
      });

      if (!match) {
        const claimed = await events.filter(
          { kind: 'job.claimed' },
          { sort: '-created_date', limit: 20 }
        );
        const isClaimed = claimed.items.some(e => parseBody(e)?.source_event_id === eventId);
        return json({ status: isClaimed ? 'running' : 'queued' });
      }

      const result = parseBody(match);
      if (match.kind === 'job.done') {
        let audio_url = result?.audio_url ?? null;
        if (!audio_url) {
          const audioEvents = await events.filter(
            { kind: 'job.audio' },
            { sort: '-created_date', limit: 20 }
          );
          const audioMatch = audioEvents.items.find(e => parseBody(e)?.source_event_id === eventId);
          if (audioMatch) audio_url = parseBody(audioMatch)?.file_uri ?? null;
        }
        return json({
          status: audio_url ? 'done' : 'uploading',
          audio_url,
          duration: result?.duration ?? null,
          voice: result?.voice ?? null,
        });
      }
      return json({ status: 'failed', error: result?.error ?? 'TTS job failed' });
    }

    return json({ error: 'action must be voices, speak, or status' }, 400);
  } catch (e: any) {
    return json({ error: e.message ?? 'nexusTTS failed' }, 500);
  }
}
