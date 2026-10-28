import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { voiceStatus, listVoices, speak, VoiceError } from '../../shared/elevenLabs.ts';
import { ownerWorkspace } from '../../shared/ownerWorkspace.ts';

// In-app ElevenLabs voice tool (app owner only: it spends the owner's ElevenLabs characters).
// Actions: status (plan + models), voices, speak (MP3 saved privately to the Library).
export default async function (req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Please sign in again.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Only the app owner can use the ElevenLabs voice.' }, { status: 403 });
    const body = await req.json().catch(() => ({}));

    if (body.action === 'status') return Response.json(await voiceStatus());
    if (body.action === 'voices') return Response.json({ voices: await listVoices() });
    if (body.action === 'speak') {
      const workspace = await ownerWorkspace(base44.asServiceRole, user.id, body.workspace_id || null);
      if (!workspace) return Response.json({ error: 'Workspace not found.' }, { status: 404 });
      const result = await speak(base44.asServiceRole, {
        ownerId: user.id,
        workspaceId: workspace.id,
        text: body.text,
        voiceId: body.voice_id,
        modelId: body.model_id,
        title: body.title,
      });
      return Response.json(result);
    }
    return Response.json({ error: 'action must be status, voices or speak' }, { status: 400 });
  } catch (error) {
    if (error instanceof VoiceError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: error.message }, { status: 500 });
  }
}