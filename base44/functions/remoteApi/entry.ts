import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { waitUntil } from 'base44:runtime';
import { speak, VoiceError } from '../../shared/elevenLabs.ts';
import { ownerWorkspace } from '../../shared/ownerWorkspace.ts';
import { RemoteError, MAX_UPLOAD, catalog, listMaterial, getMaterial, saveDocument, saveUpload } from './material.ts';
import { resolveKey, listKeys, createKey, revokeKey, count, failures } from './keys.ts';

// Creator Nexus remote API.
// Remote callers send a personal key (created on the Connect page) in the X-Nexus-Key header.
// The signed-in app uses the same function to manage keys and export material.
const ACTIONS = ['catalog', 'list', 'get', 'save', 'upload', 'speak'];
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function readInput(req) {
  const type = req.headers.get('content-type') || '';
  const length = Number(req.headers.get('content-length') || 0);
  if (type.startsWith('multipart/form-data')) {
    if (length > MAX_UPLOAD + 1024 * 1024) return { error: json({ error: 'File too large (max 10 MB).' }, 413) };
    const form = await req.formData().catch(() => null);
    if (!form) return { error: json({ error: 'Could not read the upload form.' }, 400) };
    const input = {};
    for (const [name, value] of form.entries()) input[name] = value;
    return { input: { ...input, action: typeof input.action === 'string' ? input.action : 'upload' } };
  }
  if (length > 256 * 1024) return { error: json({ error: 'Request body too large.' }, 413) };
  const input = await req.json().catch(() => null);
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: json({ error: 'Send a JSON object, e.g. {"action":"catalog"}.' }, 400) };
  }
  return { input };
}

export default async function (req) {
  try {
    if (req.method !== 'POST') return json({ error: 'Use POST with a JSON body, e.g. {"action":"catalog"}.' }, 405);
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;
    const origin = (req.headers.get('x-base44-app-url') || 'https://creator-nexus.base44.app').replace(/\/+$/, '');
    const endpoint = `${origin}/functions/remoteApi`;
    const supplied = (req.headers.get('x-nexus-key') || '').trim();

    let ownerId = '';
    if (supplied) {
      const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim().slice(0, 64);
      if (failures(`fail:${ip}`) >= 10) return json({ error: 'Too many invalid keys. Try again in 5 minutes.' }, 429);
      const key = await resolveKey(db, supplied);
      if (!key) {
        count(`fail:${ip}`, 300000);
        return json({ error: 'Invalid or revoked key.' }, 401);
      }
      ownerId = key.owner_id;
      waitUntil(db.entities.NexusRemoteKey.update(key.id, { last_used_at: new Date().toISOString() }).catch(() => null));
    } else {
      const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
      if (!user) return json({ error: 'Send your key in the X-Nexus-Key header.' }, 401);
      ownerId = user.id;
    }
    if (count(`rate:${ownerId}`, 60000) > 120) return json({ error: 'Rate limit reached (120 requests a minute). Wait a moment and retry.' }, 429);

    const { input, error } = await readInput(req);
    if (error) return error;
    const action = typeof input.action === 'string' ? input.action : '';

    if (action === 'keys' || action === 'create_key' || action === 'revoke_key') {
      if (supplied) return json({ error: 'Keys can only be managed from the signed-in app.' }, 403);
      if (action === 'keys') return json({ endpoint, keys: await listKeys(db, ownerId) });
      if (action === 'create_key') return json({ endpoint, ...(await createKey(db, ownerId, input.label)) }, 201);
      return json(await revokeKey(db, ownerId, input.id));
    }
    if (action === 'catalog') {
      const owner = await db.entities.User.get(ownerId).catch(() => null);
      return json({
        endpoint,
        account: owner ? { id: owner.id, email: owner.email, name: owner.full_name, role: owner.role } : { id: ownerId },
        types: await catalog(db, ownerId),
        actions: ACTIONS,
      });
    }
    if (action === 'list') return json(await listMaterial(db, ownerId, input));
    if (action === 'get') return json(await getMaterial(db, ownerId, input));
    if (action === 'save' || action === 'upload' || action === 'speak') {
      const workspaceId = typeof input.workspace_id === 'string' && input.workspace_id ? input.workspace_id : null;
      const workspace = await ownerWorkspace(db, ownerId, workspaceId);
      if (!workspace) return json({ error: 'Workspace not found. Open the Studio once to create one.' }, 404);
      if (action === 'save') return json(await saveDocument(db, ownerId, workspace.id, input), 201);
      if (action === 'upload') return json(await saveUpload(db, ownerId, workspace.id, input), 201);
      const owner = await db.entities.User.get(ownerId).catch(() => null);
      if (owner?.role !== 'admin') return json({ error: 'Only the app owner can generate ElevenLabs voice.' }, 403);
      const result = await speak(db, {
        ownerId,
        workspaceId: workspace.id,
        text: input.text,
        voiceId: input.voice_id,
        modelId: input.model_id,
        title: input.title,
      });
      return json(result, 201);
    }
    return json({ error: `Unknown action. Use one of: ${ACTIONS.join(', ')}.` }, 400);
  } catch (error) {
    if (error instanceof RemoteError || error instanceof VoiceError) return json({ error: error.message }, error.status);
    return json({ error: error?.message || 'remoteApi failed' }, 500);
  }
}