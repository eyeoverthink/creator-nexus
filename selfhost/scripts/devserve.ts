// Local stand-in for Caddy: serves dist/ with SPA fallback and proxies /api, /functions, /files to the API.
// deno run -A selfhost/scripts/devserve.ts [port] [api]
import { serveDir } from 'jsr:@std/http@1/file-server';
const port = Number(Deno.args[0] || 8080), api = Deno.args[1] || 'http://127.0.0.1:8787';
const dist = new URL('../../dist', import.meta.url).pathname;
Deno.serve({ port }, async (req) => {
  const u = new URL(req.url);
  if (/^\/(api|functions|files|healthz)(\/|$)/.test(u.pathname)) {
    if (req.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      const { socket, response } = Deno.upgradeWebSocket(req);
      const up = new WebSocket(api.replace(/^http/, 'ws') + u.pathname + u.search);
      const q: any[] = [];
      up.onopen = () => { while (q.length) up.send(q.shift()); };
      up.onmessage = (e) => socket.readyState === 1 && socket.send(e.data);
      up.onclose = () => { try { socket.close(); } catch { /* */ } };
      socket.onmessage = (e) => up.readyState === 1 ? up.send(e.data) : q.push(e.data);
      socket.onclose = () => { try { up.close(); } catch { /* */ } };
      return response;
    }
    return fetch(api + u.pathname + u.search, { method: req.method, headers: req.headers, body: req.body, redirect: 'manual' });
  }
  const res = await serveDir(req, { fsRoot: dist, quiet: true });
  if (res.status === 404) return new Response(await Deno.readFile(dist + '/index.html'), { headers: { 'content-type': 'text/html' } });
  return res;
});
