import { secrets } from 'base44:runtime';

// ElevenLabs voice: plan status, voice list, and text-to-speech saved privately to the Library.
const API = 'https://api.elevenlabs.io';
const VOICE_RE = /^[A-Za-z0-9]{10,40}$/;
const MODEL_RE = /^[a-z0-9_]{3,60}$/;
export const MAX_SPEAK_CHARS = 2500;

export class VoiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function authHeaders(extra = {}) {
  const key = secrets.get('ELEVENLABS_API_KEY');
  if (!key) throw new VoiceError('ElevenLabs is not set up: add ELEVENLABS_API_KEY in Secrets.', 503);
  return { 'xi-api-key': key, ...extra };
}

async function request(path, init = {}, timeout = 20000) {
  const res = await fetch(API + path, { ...init, headers: authHeaders(init.headers), signal: AbortSignal.timeout(timeout) });
  if (res.ok) return res;
  const data = await res.json().catch(() => null);
  const detail = data?.detail;
  const message = typeof detail === 'string' ? detail : detail?.message || `ElevenLabs request failed (${res.status}).`;
  if (detail?.status === 'quota_exceeded') throw new VoiceError(message, 402);
  if (res.status === 401) {
    throw new VoiceError(detail?.status === 'invalid_api_key' ? 'ElevenLabs rejected the saved API key. Update ELEVENLABS_API_KEY in Secrets.' : message, 502);
  }
  if (res.status === 429) throw new VoiceError('ElevenLabs is busy or rate-limited. Try again in a minute.', 429);
  throw new VoiceError(message, res.status >= 500 ? 502 : 400);
}

export async function voiceStatus() {
  const [sub, models] = await Promise.all([
    request('/v1/user/subscription').then((r) => r.json()),
    request('/v1/models').then((r) => r.json()),
  ]);
  const preferred = secrets.get('ELEVENLABS_MODEL') || '';
  const tts = (Array.isArray(models) ? models : []).filter((m) => m.can_do_text_to_speech);
  const fallback = tts.some((m) => m.model_id === preferred) ? preferred : tts[0]?.model_id || '';
  const used = Number(sub.character_count) || 0;
  const limit = Number(sub.character_limit) || 0;
  return {
    tier: sub.tier || 'unknown',
    characters_used: used,
    characters_limit: limit,
    characters_left: Math.max(0, limit - used),
    resets_at: sub.next_character_count_reset_unix ? new Date(sub.next_character_count_reset_unix * 1000).toISOString() : null,
    models: tts.map((m) => ({ model_id: m.model_id, name: m.name || m.model_id, is_default: m.model_id === fallback })),
  };
}

export async function listVoices() {
  const data = await request('/v2/voices?page_size=100').then((r) => r.json());
  const preferred = secrets.get('ELEVENLABS_VOICE_ID') || '';
  return (data.voices || []).map((v) => ({
    voice_id: v.voice_id,
    name: v.name,
    category: v.category || 'voice',
    preview_url: v.preview_url || null,
    is_default: v.voice_id === preferred,
  }));
}

// db must be a service-role client; the caller has already verified who ownerId is.
export async function speak(db, { ownerId, workspaceId, text, voiceId, modelId, title }) {
  const clean = typeof text === 'string' ? text.trim() : '';
  if (!clean) throw new VoiceError('Enter some text to speak.');
  if (clean.length > MAX_SPEAK_CHARS) throw new VoiceError(`Text is too long: ${clean.length} characters (max ${MAX_SPEAK_CHARS}).`);
  const voice = voiceId ? String(voiceId) : secrets.get('ELEVENLABS_VOICE_ID') || '';
  if (!VOICE_RE.test(voice)) throw new VoiceError('Choose an ElevenLabs voice.');
  const model = modelId ? String(modelId) : secrets.get('ELEVENLABS_MODEL') || 'eleven_multilingual_v2';
  if (!MODEL_RE.test(model)) throw new VoiceError('Choose an ElevenLabs model.');

  const res = await request(`/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: clean, model_id: model }),
  }, 120000);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength < 200) throw new VoiceError('ElevenLabs returned an empty audio file.', 502);

  const fileName = `elevenlabs-${new Date().toISOString().replace(/[:.]/g, '-')}.mp3`;
  const { file_uri } = await db.integrations.Core.UploadPrivateFile({ file: new File([bytes], fileName, { type: 'audio/mpeg' }) });
  const asset = await db.entities.NexusAsset.create({
    owner_id: ownerId,
    workspace_id: workspaceId,
    title: (typeof title === 'string' && title.trim() ? title.trim() : `Voice · ${clean.slice(0, 60)}`).slice(0, 160),
    body: clean,
    kind: 'generated',
    file_uri,
    file_name: fileName,
    mime_type: 'audio/mpeg',
    file_size: bytes.byteLength,
    project: 'ElevenLabs voice',
    source_entity: 'ElevenLabs',
    source_id: `${model}/${voice}`,
  });
  const { signed_url } = await db.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 3600 });
  return {
    asset_id: asset.id,
    title: asset.title,
    file_name: fileName,
    file_size: bytes.byteLength,
    characters: clean.length,
    model_id: model,
    voice_id: voice,
    signed_url,
    expires_in: 3600,
  };
}