// Local file storage with HMAC-signed URLs (replaces Base44 UploadFile/UploadPrivateFile/CreateFileSignedUrl).
import { config } from './config.ts';
import { q, q1, newId, HttpError } from './db.ts';
import type { User } from './query.ts';

const enc = new TextEncoder();
let keyP: Promise<CryptoKey> | null = null;
const hmacKey = () => keyP ??= crypto.subtle.importKey('raw', enc.encode(config.fileSigningSecret || 'dev-file-secret-dev-file-secret-dev'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
const b64u = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function sign(s: string) { return b64u(await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(s))); }
const safeName = (n: string) => (n || 'file').replace(/[^A-Za-z0-9._-]+/g, '_').slice(-120) || 'file';

export async function saveFile(file: Blob & { name?: string }, visibility: 'public' | 'private', user: User) {
  if (!(file instanceof Blob)) throw new HttpError(400, 'Upload needs a file');
  if (file.size > 512 * 1024 * 1024) throw new HttpError(413, 'File too large (512 MB max)');
  const key = `${newId()}-${safeName((file as any).name || 'upload')}`;
  const dir = `${config.filesDir}/${visibility}`;
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeFile(`${dir}/${key}`, new Uint8Array(await file.arrayBuffer()));
  await q(`INSERT INTO sh.files (key, owner_id, name, mime, size, visibility) VALUES ($1,$2,$3,$4,$5,$6)`, [key, user?.id ?? null, (file as any).name || null, file.type || 'application/octet-stream', file.size, visibility]);
  return visibility === 'public' ? { file_url: `${config.publicUrl}/files/public/${key}` } : { file_uri: `selfhost://private/${key}` };
}
export async function signedUrl(fileUri: string, expiresIn = 300) {
  const m = String(fileUri || '').match(/^selfhost:\/\/private\/([A-Za-z0-9._-]+)$/);
  if (!m) throw new HttpError(400, 'Unknown file_uri');
  const exp = Math.floor(Date.now() / 1000) + Math.max(10, Math.min(Number(expiresIn) || 300, 7 * 86400));
  const sig = await sign(`${m[1]}.${exp}`);
  return { signed_url: `${config.publicUrl}/files/private/${m[1]}?exp=${exp}&sig=${sig}` };
}
export async function serveFile(req: Request, visibility: string, key: string): Promise<Response> {
  if (!/^[A-Za-z0-9._-]+$/.test(key) || !['public', 'private'].includes(visibility)) return new Response('Not found', { status: 404 });
  if (visibility === 'private') {
    const u = new URL(req.url); const exp = Number(u.searchParams.get('exp')); const sig = u.searchParams.get('sig') || '';
    if (!exp || exp < Date.now() / 1000 || sig !== await sign(`${key}.${exp}`)) return new Response('Link expired or invalid', { status: 403 });
  }
  const meta = await q1(`SELECT mime, visibility FROM sh.files WHERE key = $1`, [key]);
  if (!meta || meta.visibility !== visibility) return new Response('Not found', { status: 404 });
  try {
    const f = await Deno.open(`${config.filesDir}/${visibility}/${key}`);
    return new Response(f.readable, { headers: { 'content-type': meta.mime, 'cache-control': visibility === 'public' ? 'public, max-age=86400' : 'private, max-age=60' } });
  } catch { return new Response('Not found', { status: 404 }); }
}
