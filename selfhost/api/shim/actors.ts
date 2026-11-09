// Replacement for "base44:runtime/actors": a single-process actor host (one instance per actor+room).
import { q, q1 } from '../lib/db.ts';
import { createServiceClient } from './sdk.ts';

export type Conn = { id: string; identity: { type: 'authenticated' | 'anonymous'; userId?: string; email?: string }; send(m: unknown): void; reject(code: number, reason: string): void; close(): void };
export class Actor {
  state: any = {};
  _conns = new Map<string, Conn>();
  _timers = new Map<string, any>();
  _actor = ''; _room = '';
  client: any = createServiceClient();
  storage = {
    get: async (key: string) => (await q1(`SELECT value FROM sh.actor_storage WHERE actor=$1 AND room=$2 AND key=$3`, [this._actor, this._room, key]))?.value ?? undefined,
    put: async (key: string, value: unknown) => { await q(`INSERT INTO sh.actor_storage (actor, room, key, value) VALUES ($1,$2,$3,$4::jsonb) ON CONFLICT (actor, room, key) DO UPDATE SET value = EXCLUDED.value`, [this._actor, this._room, key, JSON.stringify(value ?? null)]); },
    delete: async (key: string) => { await q(`DELETE FROM sh.actor_storage WHERE actor=$1 AND room=$2 AND key=$3`, [this._actor, this._room, key]); },
  };
  get roomId() { return this._room; }
  broadcast(msg: unknown, except?: string) { for (const [id, c] of this._conns) if (id !== except) c.send(msg); }
  async schedule(key: string, at: number) {
    clearTimeout(this._timers.get(key));
    this._timers.set(key, setTimeout(() => { this._timers.delete(key); Promise.resolve((this as any).handleWake?.(key)).catch(e => console.error('actor wake failed', e?.message)); }, Math.max(0, at - Date.now())));
  }
  async cancelSchedule(key: string) { clearTimeout(this._timers.get(key)); this._timers.delete(key); }
  async handleStart(): Promise<void> {}
  async handleConnect(_c: Conn): Promise<void> {}
  async handleMessage(_c: Conn, _m: unknown): Promise<void> {}
  async handleDisconnect(_c: Conn): Promise<void> {}
}
