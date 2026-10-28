import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { allow } from '../../shared/rateLimit.ts';
import { ownedWorkspace } from '../../shared/libraryDocs.ts';

const VOICES = { river: 'Calm, neutral', honey: 'Warm, soft', sunny: 'Bright, upbeat', storm: 'Formal, authoritative', spark: 'Energetic, quick' };
const MAX = 2500;

export default async function (req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Please sign in again.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Only the app owner can generate voice.' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    if (body.action === 'voices') {
      return Response.json({ voices: Object.entries(VOICES).map(([id, style]) => ({ id, label: id[0].toUpperCase() + id.slice(1), style })) });
    }
    if (body.action !== 'speak') return Response.json({ error: 'action must be voices or speak' }, { status: 400 });
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) return Response.json({ error: 'Enter some text to speak.' }, { status: 400 });
    if (text.length > MAX) return Response.json({ error: `Keep it under ${MAX} characters.` }, { status: 400 });
    const voice = VOICES[body.voice] ? body.voice : 'river';
    const language = typeof body.language === 'string' && /^[a-z]{2}$/.test(body.language) ? body.language : null;
    const ws = await ownedWorkspace(base44, user.id, body.workspace_id);
    if (!ws) return Response.json({ error: 'Workspace not found.' }, { status: 404 });
    if (!allow(`voice:${user.id}`, 20, 60000)) return Response.json({ error: 'Too many requests, wait a minute.' }, { status: 429 });

    const core = base44.asServiceRole.integrations.Core;
    const { url } = await core.GenerateSpeech({ text, voice, ...(language ? { language_code: language } : {}) });
    const audio = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!audio.ok) throw new Error(`Could not read the generated audio (${audio.status}).`);
    const bytes = new Uint8Array(await audio.arrayBuffer());
    const fileName = `voice-${voice}-${Date.now()}.mp3`;
    const { file_uri } = await core.UploadPrivateFile({ file: new File([bytes], fileName, { type: 'audio/mpeg' }) });
    const title = (typeof body.title === 'string' && body.title.trim() ? body.title.trim() : `Voice · ${text.slice(0, 60)}`).slice(0, 160);
    const asset = await base44.asServiceRole.entities.NexusAsset.create({
      owner_id: user.id, workspace_id: ws.id, title, body: text, kind: 'generated', file_uri, file_name: fileName,
      mime_type: 'audio/mpeg', file_size: bytes.byteLength, project: 'Voice Studio', source_entity: 'Voice Studio', source_id: `builtin/${voice}`,
    });
    const { signed_url } = await core.CreateFileSignedUrl({ file_uri, expires_in: 3600 });
    return Response.json({ asset_id: asset.id, title, file_name: fileName, characters: text.length, voice, signed_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}