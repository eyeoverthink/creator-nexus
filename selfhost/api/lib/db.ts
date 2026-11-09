import pg from 'npm:pg@8.23.1';
import { config } from './config.ts';
// Return timestamps as ISO strings and bigints as numbers.
pg.types.setTypeParser(1184, (v: string) => new Date(v).toISOString());
pg.types.setTypeParser(1114, (v: string) => new Date(v + 'Z').toISOString());
pg.types.setTypeParser(20, (v: string) => Number(v));
pg.types.setTypeParser(1700, (v: string) => Number(v));
export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 20 });
export async function q<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool.query(text, params);
  return r.rows as T[];
}
export async function q1<T = any>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(text, params))[0] ?? null;
}
// 24-hex ids in the same shape Base44 uses (4-byte time + 8 random bytes).
export function newId(): string {
  const t = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const r = crypto.getRandomValues(new Uint8Array(8));
  return t + Array.from(r, b => b.toString(16).padStart(2, '0')).join('');
}
export class HttpError extends Error {
  constructor(public status: number, message: string, public data?: unknown) { super(message); }
}
