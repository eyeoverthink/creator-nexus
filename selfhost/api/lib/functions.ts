// Serves the app's Deno backend functions (base44/functions/<name>/entry.ts) unchanged, at /functions/<name>.
import { config } from './config.ts';
import { requestCtx, setInvoke } from '../shim/sdk.ts';
import type { Ctx } from './entities.ts';

const names = new Set<string>();
const mods = new Map<string, Promise<any>>();
export async function loadFunctionNames() {
  for await (const d of Deno.readDir(config.base44Root + '/functions')) if (d.isDirectory && /^[A-Za-z0-9_]+$/.test(d.name)) names.add(d.name);
  return [...names].sort();
}
export const functionNames = () => [...names].sort();
const load = (name: string) => {
  if (!mods.has(name)) mods.set(name, import(`file://${config.base44Root}/functions/${name}/entry.ts`));
  return mods.get(name)!;
};
export async function runFunction(name: string, req: Request, ctx: { user: any; token?: string | null }): Promise<Response> {
  if (!names.has(name)) return Response.json({ error: `Function ${name} not found` }, { status: 404 });
  let mod;
  try { mod = await load(name); } catch (e) {
    mods.delete(name);
    console.error(`function ${name} failed to load:`, (e as Error).message);
    return Response.json({ error: `Function ${name} failed to load on the self-hosted server`, detail: (e as Error).message }, { status: 500 });
  }
  const handler = mod.default;
  if (typeof handler !== 'function') return Response.json({ error: `Function ${name} has no default export` }, { status: 500 });
  requestCtx.set(req, ctx);
  try {
    const res = await handler(req);
    return res instanceof Response ? res : Response.json(res ?? null);
  } catch (e) {
    console.error(`function ${name} threw:`, (e as Error)?.message);
    return Response.json({ error: (e as Error)?.message || 'internal_error' }, { status: (e as any)?.status || 500 });
  }
}
// In-process functions.invoke used by the server SDK shim.
setInvoke(async (name: string, body: any, ctx: Ctx, token?: string | null) => {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (token) headers.set('authorization', 'Bearer ' + token);
  const req = new Request(`${config.publicUrl}/functions/${name}`, { method: 'POST', headers, body: JSON.stringify(body ?? {}) });
  return runFunction(name, req, { user: ctx.user, token });
});
