// Server-side replacement for npm:@base44/sdk (createClientFromRequest / createClient).
// Function code keeps calling base44.entities.X.filter(...), base44.asServiceRole..., integrations.Core.InvokeLLM, etc.
import { EntityStore, Ctx } from '../lib/entities.ts';
import { runCore } from '../lib/integrations.ts';
import { HttpError } from '../lib/db.ts';
import { config } from '../lib/config.ts';
import type { User } from '../lib/query.ts';

export const requestCtx = new WeakMap<Request, { user: User; token?: string | null }>();
let invokeImpl: ((name: string, body: any, ctx: Ctx, token?: string | null) => Promise<Response>) | null = null;
export function setInvoke(fn: typeof invokeImpl) { invokeImpl = fn; }
let userResolver: ((token: string | null) => Promise<User>) | null = null;
export function setUserResolver(fn: typeof userResolver) { userResolver = fn; }

function entitiesProxy(ctx: () => Promise<Ctx>) {
  return new Proxy({}, {
    get(_t, name) {
      if (typeof name !== 'string' || name === 'then' || name.startsWith('_')) return undefined;
      const store = async () => new EntityStore(name, await ctx());
      return {
        list: async (sort?: any, limit?: any, skip?: any, fields?: any) => (sort && typeof sort === 'object') ? (await store()).readPage({}, sort) : (await store()).readArray({}, sort, limit, skip, fields),
        filter: async (query: any, sort?: any, limit?: any, skip?: any, fields?: any) => (sort && typeof sort === 'object') ? (await store()).readPage(query, sort) : (await store()).readArray(query, sort, limit, skip, fields),
        get: async (id: string) => (await store()).get(id),
        create: async (d: any) => (await store()).create(d),
        bulkCreate: async (d: any[]) => (await store()).bulkCreate(d),
        update: async (id: string, d: any) => (await store()).update(id, d),
        bulkUpdate: async (d: any[]) => (await store()).bulkUpdate(d),
        updateMany: async (q: any, d: any) => (await store()).updateMany(q, d),
        delete: async (id: string) => (await store()).delete(id),
        deleteMany: async (q: any) => (await store()).deleteMany(q),
        count: async (q?: any) => (await store()).count(q),
        aggregate: async (spec: any) => (await store()).aggregate(spec),
        upsert: async (records: any[], opts: any) => (await store()).upsert(records, opts?.key),
        subscribe: () => () => {},
        importEntities: async () => { throw new HttpError(501, 'importEntities is not supported server-side'); },
      };
    },
  });
}
function coreProxy(ctx: () => Promise<Ctx>) {
  const core = new Proxy({}, { get(_t, name) { if (typeof name !== 'string' || name === 'then') return undefined; return async (input: any) => runCore(name, input, (await ctx()).user); } });
  return new Proxy({}, { get(_t, pkg) { if (pkg === 'Core') return core; if (typeof pkg !== 'string' || pkg === 'then') return undefined; return new Proxy({}, { get() { return async () => { throw new HttpError(501, `Integration package ${String(pkg)} is not available on the self-hosted server`); }; } }); } });
}
const connectorToken = (type: string) => {
  const v = Deno.env.get(`CONNECTOR_${type.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_TOKEN`);
  if (!v) throw new HttpError(404, `The ${type} connector is not set up on the self-hosted server (TODO: add CONNECTOR_${type.toUpperCase()}_TOKEN).`);
  return v;
};
function buildClient(getUser: () => Promise<User>, token: string | null) {
  const userCtx = async (): Promise<Ctx> => ({ user: await getUser(), service: false });
  const svcCtx = async (): Promise<Ctx> => ({ user: await getUser().catch(() => null), service: true });
  const invoke = (ctx: () => Promise<Ctx>) => async (name: string, data: any) => {
    if (!invokeImpl) throw new Error('functions not initialised');
    const res = await invokeImpl(name, data ?? {}, await ctx(), token);
    const text = await res.text(); let body: any = text; try { body = JSON.parse(text); } catch { /* text */ }
    if (!res.ok) { const e: any = new HttpError(res.status, body?.error?.message || body?.error || body?.message || `Function ${name} failed`, body); e.response = { status: res.status, data: body }; throw e; }
    return { data: body, status: res.status, headers: Object.fromEntries(res.headers) };
  };
  const connectors = {
    getConnection: async (type: string) => ({ accessToken: connectorToken(type), connectionConfig: {} }),
    getAccessToken: async (type: string) => connectorToken(type),
    getCurrentAppUserConnection: async (type: string) => ({ accessToken: connectorToken(type), connectionConfig: {} }),
    getCurrentAppUserAccessToken: async (type: string) => connectorToken(type),
    getWorkspaceConnection: async (type: string) => ({ accessToken: connectorToken(type), connectionConfig: {} }),
  };
  const aiGateway = {
    connection: () => ({ baseURL: `${config.selfUrl}/api/ai-gateway/v1`, token: config.internalSecret || 'dev-internal', headers: {} }),
  };
  const agentsStub = new Proxy({}, { get(_t, k) { if (k === 'then') return undefined; return async () => { throw new HttpError(501, `agents.${String(k)} is not available server-side yet`); }; } });
  const serviceRole = {
    entities: entitiesProxy(svcCtx), integrations: coreProxy(svcCtx), functions: { invoke: invoke(svcCtx) },
    connectors, aiGateway, agents: agentsStub,
    sso: { getAccessToken: async () => { throw new HttpError(501, 'SSO not available'); } },
    appLogs: { logUserInApp: async () => ({}) },
  };
  return {
    entities: entitiesProxy(userCtx), integrations: coreProxy(userCtx), functions: { invoke: invoke(userCtx) },
    asServiceRole: serviceRole, connectors, aiGateway, agents: agentsStub,
    auth: {
      me: async () => { const u = await getUser(); if (!u) throw new HttpError(401, 'Authentication required'); return u; },
      isAuthenticated: async () => !!(await getUser().catch(() => null)),
      updateMe: async (d: any) => { const u = await getUser(); if (!u) throw new HttpError(401, 'Authentication required'); return new EntityStore('User', { user: u, service: false }).update(u.id, d); },
    },
    users: { inviteUser: async () => { throw new HttpError(501, 'User invites are not available on the self-hosted server'); } },
    appLogs: { logUserInApp: async () => ({}) },
    cleanup: () => {},
  };
}
export function createClientFromRequest(req: Request) {
  const known = requestCtx.get(req);
  const h = req.headers.get('authorization') || '';
  const token = known?.token ?? (h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : null);
  let cached: Promise<User> | null = null;
  const getUser = () => cached ??= (known ? Promise.resolve(known.user) : (userResolver ? userResolver(token) : Promise.resolve(null)));
  return buildClient(getUser, token);
}
export function createServiceClient() { return buildClient(async () => null, null); }
export function createClient(_cfg: any = {}) { return buildClient(async () => null, null); }
export function getAccessToken() { return null; }
export default { createClient, createClientFromRequest };
