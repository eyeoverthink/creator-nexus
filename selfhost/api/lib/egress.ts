// Outbound fetch guard. The app code has many hard-coded *.base44.app URLs; on the self-hosted
// server they must never reach Base44 (no credits, no Base44 functions). Rules:
//   creator-nexus.base44.app          -> this server (SELF_URL)
//   fraymus-transmuter.base44.app     -> FRAYMUS_TRANSMUTER_URL if it is set to a non-Base44 host, else blocked
//   media.base44.com (GET/HEAD only)  -> allowed (static public files already referenced by the app)
//   anything else on base44.app/.com  -> blocked with a 503 JSON response
import { config } from './config.ts';

const realFetch = globalThis.fetch.bind(globalThis);
const isBase44 = (h: string) => h === 'base44.app' || h.endsWith('.base44.app') || h === 'base44.com' || h.endsWith('.base44.com');
export const egressLog: { at: string; host: string; path: string; action: string }[] = [];
const note = (host: string, path: string, action: string) => { egressLog.unshift({ at: new Date().toISOString(), host, path, action }); egressLog.length = Math.min(egressLog.length, 100); console.warn(`egress ${action}: ${host}${path}`); };

function rewrite(u: URL, method: string): URL | null | 'allow' {
  const h = u.hostname.toLowerCase();
  if (!isBase44(h)) return 'allow';
  if (h === 'media.base44.com' && (method === 'GET' || method === 'HEAD')) return 'allow';
  if (h === 'creator-nexus.base44.app') { const t = new URL(u.pathname + u.search, config.selfUrl); return t; }
  if (h === 'fraymus-transmuter.base44.app') {
    try { const t = new URL(config.transmuterUrl); if (!isBase44(t.hostname)) return new URL(u.pathname + u.search, t); } catch { /* */ }
    return null;
  }
  return null;
}
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const req = input instanceof Request ? input : null;
  const url = new URL(req ? req.url : String(input));
  const method = (init?.method || req?.method || 'GET').toUpperCase();
  // Calls to our own public URL (signed file links, /functions) stay inside the container.
  if (url.origin === new URL(config.publicUrl).origin && url.origin !== new URL(config.selfUrl).origin) {
    const t = new URL(url.pathname + url.search, config.selfUrl);
    return realFetch(req ? new Request(t.toString(), req) : t.toString(), init);
  }
  const r = rewrite(url, method);
  if (r === 'allow') return realFetch(input as any, init);
  if (r === null) {
    note(url.hostname, url.pathname, 'blocked');
    return new Response(JSON.stringify({ error: 'blocked_base44_egress', message: `Self-hosted server does not call ${url.hostname}` }), { status: 503, headers: { 'content-type': 'application/json' } });
  }
  note(url.hostname, url.pathname, 'rewritten->' + r.host);
  return realFetch(req ? new Request(r.toString(), req) : r.toString(), init);
}) as typeof fetch;
