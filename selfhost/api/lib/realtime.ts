// WebSocket hub: entity subscriptions (entities.X.subscribe) and agent conversation updates.
import { onEntityEvent, canRead } from './entities.ts';
import type { User } from './query.ts';
import { q1 } from './db.ts';

type Client = { ws: WebSocket; user: User; rooms: Set<string> };
const clients = new Set<Client>();
export function handleRealtime(req: Request, user: User): Response {
  if (!user) return new Response('Authentication required', { status: 401 });
  const { socket, response } = Deno.upgradeWebSocket(req);
  const c: Client = { ws: socket, user, rooms: new Set() };
  socket.onopen = () => clients.add(c);
  socket.onclose = () => clients.delete(c);
  socket.onerror = () => clients.delete(c);
  socket.onmessage = async (ev) => {
    let m: any; try { m = JSON.parse(String(ev.data)); } catch { return; }
    if (m?.op === 'ping') { socket.send(JSON.stringify({ op: 'pong' })); return; }
    if (typeof m?.room !== 'string' || m.room.length > 200) return;
    if (m.op === 'sub') {
      if (m.room.startsWith('conversation:')) {
        const conv = await q1(`SELECT owner_id FROM sh.conversations WHERE id = $1`, [m.room.slice(13)]);
        if (!conv || (conv.owner_id !== user!.id && user!.role !== 'admin')) return;
      } else if (!m.room.startsWith('entities:')) return;
      c.rooms.add(m.room);
    }
    if (m.op === 'unsub') c.rooms.delete(m.room);
  };
  return response;
}
export function publish(room: string, payload: unknown, filter?: (u: User) => boolean) {
  const msg = JSON.stringify({ room, event: payload });
  for (const c of clients) {
    if (!c.rooms.has(room) || c.ws.readyState !== WebSocket.OPEN) continue;
    if (filter && !filter(c.user)) continue;
    try { c.ws.send(msg); } catch { /* closed */ }
  }
}
onEntityEvent((entity, ev) => {
  publish(`entities:${entity}`, { type: ev.type, id: ev.id, data: ev.data, timestamp: ev.timestamp }, u => canRead(entity, u, ev.data));
});
