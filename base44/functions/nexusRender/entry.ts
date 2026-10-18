// Base44 backend function `nexusRender` — HyperFrames video rendering on the VPS runner.
// Creates a NexusEvent (kind: job.queued, job_type: render) that the runner picks up,
// runs HyperFrames (render_hf.py), and reports back via runnerReport with the video URL.
//
// Actions:
//   render — queue a render job, returns { event_id } to poll against
//   status — check a queued render job by event_id
//   styles — list available HyperFrames styles and card types (static)
//
// Admin-gated. No secrets needed (reuses the runner's existing poll/report flow).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const STYLES: Record<string, { canvas: string; surface: string; ink: string; muted: string; accents: string }> = {
  midnight: { canvas: '#0a0e1f', surface: '#141a36', ink: '#f6f7ff', muted: '#8f9ac8', accents: '#ffb703,#4cc9f0,#ff5d8f,#9be564' },
  paper:    { canvas: '#f3ecdd', surface: '#fffaf0', ink: '#16130f', muted: '#7a6f5c', accents: '#d62828,#1d4e89,#e09f00,#2a7f62' },
  signal:   { canvas: '#05070a', surface: '#10161d', ink: '#eef6f2', muted: '#7d9a8c', accents: '#00f5a0,#00d9f5,#ff4d6d,#ffe14d' },
};

const CARD_TYPES = ['title_card', 'hero_stat', 'keyword_card', 'bullet_build', 'spec_table', 'code_snippet', 'diagram_flow'];
const FORMATS = ['1080x1920', '1920x1080'];
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
  if (!user || user.role !== 'admin') return json({ error: 'nexusRender: admin only' }, 403);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: 'JSON body required' }, 400); }

  const events = base44.asServiceRole.entities.NexusEvent;

  try {
    if (b.action === 'styles') {
      return json({ styles: STYLES, card_types: CARD_TYPES, formats: FORMATS });
    }

    if (b.action === 'render') {
      const narration = String(b.narration ?? '').trim();
      if (!narration) return json({ error: 'narration required (the script text)' }, 400);
      if (narration.length > 1500) return json({ error: 'narration too long (max 1500 chars)' }, 400);
      const style = String(b.style ?? 'midnight');
      if (!STYLES[style]) return json({ error: `unknown style — use ${Object.keys(STYLES).join(', ')}` }, 400);
      const voice = String(b.voice ?? 'af_heart');
      const format = FORMATS.includes(String(b.format)) ? String(b.format) : '1080x1920';

      const workspace_id = String(b.workspace_id ?? user.id);
      const event = await events.create({
        owner_id: user.id,
        workspace_id,
        agent: 'nexusRender',
        kind: 'job.queued',
        message: `Render: style=${style} voice=${voice} "${narration.slice(0, 50)}…"`,
        body: JSON.stringify({
          job_type: 'render',
          narration,
          style,
          voice,
          format,
        }),
      });
      return json({ event_id: event.id, status: 'queued', style, voice, format });
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
        return json({
          status: 'done',
          video_url: result?.video_url ?? null,
          durations: result?.durations_s ?? null,
          style: result?.style ?? null,
          renderer: result?.renderer ?? 'hyperframes',
        });
      }
      return json({ status: 'failed', error: result?.error ?? 'Render job failed' });
    }

    return json({ error: 'action must be styles, render, or status' }, 400);
  } catch (e: any) {
    return json({ error: e.message ?? 'nexusRender failed' }, 500);
  }
}
