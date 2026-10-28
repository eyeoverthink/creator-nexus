import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { allow } from '../../shared/rateLimit.ts';
import { ownedWorkspace, saveLibraryDocument } from '../../shared/libraryDocs.ts';
import { HYPIT_SCHEMA, hypitPrompt, hypitMarkdown } from './report.ts';

const isUri = (u) => typeof u === 'string' && u.length > 0 && u.length <= 500 && !/^https?:/i.test(u);

export default async function (req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Please sign in again.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Only the app owner can run Hypit.' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    if (body.action !== 'analyze') return Response.json({ error: 'action must be analyze' }, { status: 400 });
    const frames = Array.isArray(body.frames) ? body.frames.filter((f) => isUri(f?.file_uri) && Number.isFinite(f?.t)) : [];
    if (frames.length < 3 || frames.length > 12) return Response.json({ error: 'Send 3 to 12 frames.' }, { status: 400 });
    const duration = Number(body.duration);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 3600) return Response.json({ error: 'Invalid video length.' }, { status: 400 });
    const ws = await ownedWorkspace(base44, user.id, body.workspace_id);
    if (!ws) return Response.json({ error: 'Workspace not found.' }, { status: 404 });
    if (!allow(`hypit:${user.id}`, 6, 60000)) return Response.json({ error: 'Too many analyses, wait a minute.' }, { status: 429 });

    const core = base44.asServiceRole.integrations.Core;
    const sign = async (file_uri) => (await core.CreateFileSignedUrl({ file_uri, expires_in: 1800 })).signed_url;
    const title = String(body.title || 'Video').slice(0, 160);
    const goal = String(body.goal || '').slice(0, 1000);
    let transcript = typeof body.transcript === 'string' ? body.transcript.trim().slice(0, 12000) : '';
    let transcriptNote = transcript ? 'pasted' : 'none';
    if (!transcript && isUri(body.video_uri)) {
      try {
        const t = await core.TranscribeAudio({ audio_url: await sign(body.video_uri) });
        transcript = String(typeof t === 'string' ? t : t?.text || t?.transcript || '').slice(0, 12000);
        transcriptNote = transcript ? 'transcribed' : 'no speech found';
      } catch (e) {
        transcriptNote = `could not transcribe (${String(e.message).slice(0, 120)})`;
      }
    }
    const urls = await Promise.all(frames.map((f) => sign(f.file_uri)));
    const analysis = await core.InvokeLLM({
      prompt: hypitPrompt({ times: frames.map((f) => f.t), duration, transcript, goal, title }),
      file_urls: urls,
      response_json_schema: HYPIT_SCHEMA,
    });
    const asset = await saveLibraryDocument(base44, { ownerId: user.id, workspaceId: ws.id, title: `Hypit · ${analysis.title || title}`, body: hypitMarkdown(analysis, { title, duration, transcriptNote }), project: 'Hypit' });
    return Response.json({ analysis, transcript, transcript_note: transcriptNote, asset_id: asset.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}