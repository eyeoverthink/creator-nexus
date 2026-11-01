import { RemoteError } from './material.ts';

// Personal remote keys: shown once at creation, stored only as a SHA-256 fingerprint.
const KEY_RE = /^cnx_[A-Za-z0-9_-]{40}$/;
const buckets = new Map();

async function fingerprint(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function newKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(30));
  return 'cnx_' + btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_');
}

// Small in-memory counters for rate limits and failed-key lockouts.
export function count(key, windowMs) {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= 5000) return Infinity;
    bucket = { n: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }
  return ++bucket.n;
}

export function failures(key) {
  const bucket = buckets.get(key);
  return bucket && bucket.reset > Date.now() ? bucket.n : 0;
}

const view = (k) => ({
  id: k.id,
  label: k.label,
  key_hint: k.key_hint,
  created_date: k.created_date,
  last_used_at: k.last_used_at || null,
  revoked: !!k.revoked,
});

export async function resolveKey(db, supplied) {
  if (!KEY_RE.test(supplied)) return null;
  const page = await db.entities.NexusRemoteKey.filter({ key_hash: await fingerprint(supplied), revoked: false }, { limit: 1 });
  return page.items[0] || null;
}

export async function listKeys(db, ownerId) {
  const page = await db.entities.NexusRemoteKey.filter({ owner_id: ownerId }, { sort: '-created_date', limit: 50 });
  return page.items.map(view);
}

export async function createKey(db, ownerId, label) {
  const name = (typeof label === 'string' ? label.trim() : '').slice(0, 80) || 'Remote key';
  const active = await db.entities.NexusRemoteKey.count({ owner_id: ownerId, revoked: false });
  if (active >= 10) throw new RemoteError('You already have 10 active keys. Revoke one first.', 409);
  const key = newKey();
  const record = await db.entities.NexusRemoteKey.create({
    owner_id: ownerId, label: name, key_hash: await fingerprint(key), key_hint: key.slice(-4), revoked: false,
  });
  return { key, ...view(record) };
}

export async function revokeKey(db, ownerId, id) {
  if (typeof id !== 'string' || !id) throw new RemoteError('id is required.');
  const page = await db.entities.NexusRemoteKey.filter({ id, owner_id: ownerId }, { limit: 1 });
  if (!page.items[0]) throw new RemoteError('Key not found.', 404);
  await db.entities.NexusRemoteKey.update(page.items[0].id, { revoked: true });
  return { revoked: true, id: page.items[0].id };
}