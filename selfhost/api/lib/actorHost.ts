import { config } from './config.ts';
import type { User } from './query.ts';
import type { Actor, Conn } from '../shim/actors.ts';

const instances = new Map<string, Promise<Actor>>();
async function getInstance(name: string, room: string) {
  const key = `${name}\u0000${room}`;
  if (!instances.has(key)) instances.set(key, (async () => {
    const mod = await import(`file://${config.base44Root}/actors/${name}/entry.ts`);
    const a: Actor = new mod.default();
    a._actor = name; a._room = room;
    await a.handleStart();
    return a;
  })().catch(e => { instances.delete(key); throw e; }));
  return instances.get(key)!;
}
export async function handleActorSocket(req: Request, name: string, room: string, user: User, connId: string): Promise<Response> {
  if (!/^[A-Za-z0-9_]+$/.test(name) || !room || room.length > 128) return new Response('Bad actor', { status: 400 });
  try { await Deno.stat(`${config.base44Root}/actors/${name}/entry.ts`); } catch { return new Response('Unknown actor', { status: 404 }); }
  const actor = await getInstance(name, room);
  const { socket, response } = Deno.upgradeWebSocket(req);
  const id = /^[A-Za-z0-9-]{8,64}$/.test(connId) ? connId : crypto.randomUUID();
  const conn: Conn = {
    id,
    identity: user ? { type: 'authenticated', userId: user.id, email: user.email } : { type: 'anonymous' },
    send: (m) => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(m)); },
    reject: (code, reason) => { try { socket.close(code, reason); } catch { /* */ } },
    close: () => { try { socket.close(); } catch { /* */ } },
  };
  socket.onopen = async () => {
    actor._conns.get(id)?.close();
    actor._conns.set(id, conn);
    try { await actor.handleConnect(conn); } catch (e) { console.error('actor connect failed', (e as Error).message); }
  };
  socket.onmessage = async (ev) => {
    let m: any; try { m = JSON.parse(String(ev.data)); } catch { return; }
    if (m?.type === '__ping') { conn.send({ type: '__pong' }); return; }
    try { await actor.handleMessage(conn, m); } catch (e) { conn.send({ type: 'error', message: (e as Error).message }); }
  };
  socket.onclose = async () => { if (actor._conns.get(id) === conn) actor._conns.delete(id); try { await actor.handleDisconnect(conn); } catch { /* */ } };
  return response;
}
