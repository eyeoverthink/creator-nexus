import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { voiceStatus, listVoices, speak, VoiceError, voiceProfile, setAgentVoice, cloneVoice } from '../../shared/elevenLabs.ts';
import { ownerWorkspace } from '../../shared/ownerWorkspace.ts';

// In-app ElevenLabs voice tool (app owner only: it spends the owner's ElevenLabs characters).
// Actions: status, voices, speak (MP3 saved privately to the Library), set_agent_voice, clone (instant voice clone).
export default async function (req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Please sign in again.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Only the app owner can use the ElevenLabs voice.' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const db = base44.asServiceRole;

    if (body.action === 'status') return Response.json(await voiceStatus());
    if (body.action === 'voices') {
      const [voices, profile] = await Promise.all([listVoices(), voiceProfile(db, user.id)]);
      return Response.json({ voices: voices.map((v) => ({ ...v, is_agent_voice: v.voice_id === profile?.agent_voice_id })), agent_voice_id: profile?.agent_voice_id || null });
    }
    if (body.action === 'set_agent_voice') return Response.json(await setAgentVoice(db, user.id, body.voice_id));
    if (body.action === 'clone') {
      const voice = await cloneVoice(db, { name: body.name, description: body.description, fileUris: body.file_uris, removeNoise: body.remove_background_noise === true });
      const agent = body.use_for_agents === true ? await setAgentVoice(db, user.id, voice.voice_id, voice.name) : null;
      return Response.json({ ...voice, agent_voice: !!agent });
    }
    if (body.action === 'speak') {
      const workspace = await ownerWorkspace(db, user.id, body.workspace_id || null);
      if (!workspace) return Response.json({ error: 'Workspace not found.' }, { status: 404 });
      const result = await speak(db, {
        ownerId: user.id,
        workspaceId: workspace.id,
        text: body.text,
        voiceId: body.voice_id,
        modelId: body.model_id,
        title: body.title,
      });
      return Response.json(result);
    }
    return Response.json({ error: 'action must be status, voices, speak, set_agent_voice or clone' }, { status: 400 });
  } catch (error) {
    if (error instanceof VoiceError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: error.message }, { status: 500 });
  }
}