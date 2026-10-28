// What the remote API can list, fetch and save. Every read is scoped to the verified owner.
export class RemoteError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const MAX_UPLOAD = 10 * 1024 * 1024;
const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const parse = (value) => {
  try {
    const v = typeof value === 'string' ? JSON.parse(value) : value;
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
};
const lastSegment = (value) => String(value).split('?')[0].split('/').filter(Boolean).pop() || '';

export const MATERIAL = {
  library: { entity: 'NexusAsset', label: 'Library items', files: (r) => [['file_uri', r.file_uri, r.file_name, r.mime_type]] },
  media: {
    entity: 'NexusEvent',
    label: 'Rendered videos & voice audio',
    query: { kind: { $in: ['job.video', 'job.audio'] } },
    files: (r) => { const b = parse(r.body); return [['file_uri', b?.file_uri, b?.file_name], ['video_url', b?.video_url]]; },
  },
  drafts: { entity: 'NexusDraft', label: 'Drafts & scripts' },
  productions: {
    entity: 'NexusFactoryProduction',
    label: 'Factory productions',
    files: (r) => [['audio_url', r.audio_url], ['hero_image_url', r.hero_image_url], ['software_artifact_url', r.software_artifact_url]],
  },
  loosescrew: { entity: 'LooseScrewItem', label: 'looseScrew builds & media', files: (r) => [['file_uri', r.file_uri, null, r.mime_type], ['media_url', r.media_url]] },
  knowledge: { entity: 'NexusKnowledge', label: 'Knowledge references' },
  sparks: { entity: 'NexusSpark', label: 'Origin sparks & scripts' },
  spark_cards: { entity: 'SparkCard', label: 'Spark video cards', files: (r) => [['image_url', r.image_url]] },
  chats: { entity: 'NexusChatTurn', label: 'Knowledge chat answers' },
  models: { entity: 'NexusModelArtifact', label: 'Models & Modelfiles', either: true, files: (r) => [['file_uri', r.file_uri, r.file_name]] },
  workflows: { entity: 'NexusWorkflow', label: 'Workflows' },
};

function specOf(type) {
  const spec = MATERIAL[type];
  if (!spec) throw new RemoteError(`Unknown type. Use one of: ${Object.keys(MATERIAL).join(', ')}.`);
  return spec;
}

const scope = (spec, ownerId) => ({
  ...(spec.query || {}),
  ...(spec.either ? { $or: [{ owner_id: ownerId }, { created_by_id: ownerId }] } : { owner_id: ownerId }),
});

async function inBatches(list, fn, size = 6) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(...(await Promise.allSettled(list.slice(i, i + size).map(fn))));
  return out;
}

// Adds _files: [{ field, file_name, mime_type, url }] with one-hour download links for private files.
async function attachFiles(db, spec, items) {
  if (!spec.files) return items;
  const jobs = [];
  for (const item of items) {
    item._files = [];
    const seen = new Set();
    for (const [field, value, name, mime] of spec.files(item)) {
      if (typeof value !== 'string' || !value || seen.has(value) || value.startsWith('data:')) continue;
      seen.add(value);
      const entry = { field, file_name: name || lastSegment(value), mime_type: mime || null };
      item._files.push(entry);
      if (/^https?:\/\//.test(value)) entry.url = value;
      else jobs.push({ entry, value });
    }
  }
  const signed = await inBatches(jobs, (job) => db.integrations.Core.CreateFileSignedUrl({ file_uri: job.value, expires_in: 3600 }));
  signed.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      jobs[i].entry.url = result.value.signed_url;
      jobs[i].entry.expires_in = 3600;
    } else {
      jobs[i].entry.error = 'Could not create a download link.';
    }
  });
  return items;
}

export async function catalog(db, ownerId) {
  const types = Object.entries(MATERIAL);
  const counts = await inBatches(types, ([, spec]) => db.entities[spec.entity].count(scope(spec, ownerId)));
  return types.map(([type, spec], i) => ({ type, label: spec.label, count: counts[i].status === 'fulfilled' ? counts[i].value : null }));
}

export async function listMaterial(db, ownerId, input) {
  const spec = specOf(input.type);
  const includeFiles = input.include_files === true || input.include_files === 'true';
  const limit = Math.min(Math.max(Number.parseInt(input.limit, 10) || 50, 1), includeFiles ? 50 : 100);
  let since = null;
  if (input.since) {
    const date = new Date(String(input.since));
    if (Number.isNaN(date.getTime())) throw new RemoteError('since must be a date, e.g. 2026-10-01.');
    since = date.toISOString();
  }
  if (input.cursor != null && (typeof input.cursor !== 'string' || input.cursor.length > 1000)) {
    throw new RemoteError('cursor must be the next_cursor value from the previous page.');
  }
  const query = { ...scope(spec, ownerId), ...(since ? { updated_date: { $gte: since } } : {}) };
  const page = await db.entities[spec.entity].filter(query, { sort: 'created_date', limit, ...(input.cursor ? { cursor: input.cursor } : {}) });
  const items = includeFiles ? await attachFiles(db, spec, page.items) : page.items;
  return { type: input.type, items, next_cursor: page.has_more ? page.next_cursor : null, has_more: !!page.has_more };
}

export async function getMaterial(db, ownerId, input) {
  const spec = specOf(input.type);
  if (typeof input.id !== 'string' || !ID_RE.test(input.id)) throw new RemoteError('id is required.');
  const page = await db.entities[spec.entity].filter({ ...scope(spec, ownerId), id: input.id }, { limit: 1 });
  if (!page.items[0]) throw new RemoteError('Not found.', 404);
  const [item] = await attachFiles(db, spec, page.items);
  return { type: input.type, item };
}

const projectOf = (input) => (typeof input.project === 'string' && input.project.trim() ? input.project.trim().slice(0, 160) : 'Remote API');

export async function saveDocument(db, ownerId, workspaceId, input) {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const body = typeof input.body === 'string' ? input.body : '';
  if (!title || title.length > 160) throw new RemoteError('title is required (max 160 characters).');
  if (!body.trim() || body.length > 20000) throw new RemoteError('body is required (max 20,000 characters).');
  const asset = await db.entities.NexusAsset.create({
    owner_id: ownerId, workspace_id: workspaceId, title, body, kind: 'document', project: projectOf(input), source_entity: 'Remote API',
  });
  return { saved: true, type: 'library', id: asset.id, title: asset.title };
}

export async function saveUpload(db, ownerId, workspaceId, input) {
  const file = input.file;
  if (!(file instanceof File) || !file.size) throw new RemoteError('Attach a file in the "file" form field.');
  if (file.size > MAX_UPLOAD) throw new RemoteError('File too large (max 10 MB).', 413);
  const fileName = (file.name || 'upload').replace(/[^\w.\- ]+/g, '_').slice(0, 160);
  const mime = file.type || 'application/octet-stream';
  const { file_uri } = await db.integrations.Core.UploadPrivateFile({ file: new File([await file.arrayBuffer()], fileName, { type: mime }) });
  const note = typeof input.body === 'string' && input.body.trim() ? { body: input.body.slice(0, 20000) } : {};
  const asset = await db.entities.NexusAsset.create({
    owner_id: ownerId,
    workspace_id: workspaceId,
    title: (typeof input.title === 'string' && input.title.trim() ? input.title.trim() : fileName).slice(0, 160),
    kind: 'upload',
    file_uri,
    file_name: fileName,
    mime_type: mime,
    file_size: file.size,
    project: projectOf(input),
    source_entity: 'Remote API',
    ...note,
  });
  return { saved: true, type: 'library', id: asset.id, title: asset.title, file_name: fileName, file_size: file.size };
}