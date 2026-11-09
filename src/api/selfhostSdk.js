// Browser replacement for @base44/sdk, used by the self-hosted build (vite.config.selfhost.js aliases
// '@base44/sdk' to this file). Same API surface the pages use, talking to our own server:
// entities, functions, integrations.Core, auth, agents, actors, connectors, app.
const TOKEN_KEY = 'base44_access_token';

export class Base44Error extends Error {
  constructor(message, status, code, data) { super(message); this.name = 'Base44Error'; this.status = status; this.code = code; this.data = data; this.response = { status, data }; }
}
export function getAccessToken(options = {}) {
  const { storageKey = TOKEN_KEY, paramName = 'access_token', saveToStorage = true, removeFromUrl = true } = options;
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get(paramName);
    if (fromUrl) {
      if (saveToStorage) { window.localStorage.setItem(storageKey, fromUrl); window.localStorage.setItem('token', fromUrl); }
      if (removeFromUrl) { url.searchParams.delete(paramName); window.history.replaceState({}, document.title, url.toString()); }
      return fromUrl;
    }
    return window.localStorage.getItem(storageKey);
  } catch { return null; }
}
export function saveAccessToken(token, { storageKey = TOKEN_KEY } = {}) { try { window.localStorage.setItem(storageKey, token); window.localStorage.setItem('token', token); } catch { /* */ } }
export function removeAccessToken({ storageKey = TOKEN_KEY } = {}) { try { window.localStorage.removeItem(storageKey); window.localStorage.removeItem('token'); } catch { /* */ } }
export function getLoginUrl(nextUrl) { return `/login?from_url=${encodeURIComponent(nextUrl || window.location.href)}`; }

const isObj = (v) => typeof v === 'object' && v !== null;
const hasFile = (d) => d instanceof FormData || (isObj(d) && Object.values(d).some((v) => v instanceof Blob));
function toForm(data) {
  if (data instanceof FormData) return data;
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    if (v instanceof Blob) fd.append(k, v, v.name || 'file');
    else if (isObj(v)) fd.append(k, JSON.stringify(v));
    else if (v !== undefined) fd.append(k, v);
  }
  return fd;
}

export function createClient(config = {}) {
  const serverUrl = (config.serverUrl || '').replace(/\/$/, '');
  const appId = config.appId || 'selfhost';
  let token = config.token || null;
  const currentToken = () => token || getAccessToken();
  const api = `${serverUrl}/api`;

  async function request(method, path, { params, body, raw = false } = {}) {
    let url = path.startsWith('http') ? path : api + path;
    if (params) {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
      const s = sp.toString(); if (s) url += (url.includes('?') ? '&' : '?') + s;
    }
    const headers = { Accept: 'application/json', 'X-App-Id': String(appId) };
    const t = currentToken(); if (t) headers.Authorization = `Bearer ${t}`;
    let payload;
    if (body !== undefined) {
      if (hasFile(body)) payload = toForm(body);
      else { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
    }
    const res = await fetch(url, { method, headers, body: payload });
    const text = await res.text();
    let data = text;
    try { data = text ? JSON.parse(text) : null; } catch { /* text body */ }
    if (!res.ok) {
      const message = data?.error?.message || data?.message || data?.detail || (typeof data?.error === 'string' ? data.error : '') || `Request failed with status ${res.status}`;
      const err = new Base44Error(message, res.status, data?.code, data);
      config.options?.onError?.(err);
      throw err;
    }
    return raw ? { data, status: res.status, headers: Object.fromEntries(res.headers.entries()) } : data;
  }

  // ---- realtime (entities.X.subscribe, agents.subscribeToConversation) ----
  let ws = null, wsReady = false, wsTimer = null;
  const rooms = new Map(); // room -> Set<callback>
  function ensureSocket() {
    if (ws || typeof window === 'undefined') return;
    const t = currentToken(); if (!t) return;
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const base = serverUrl ? serverUrl.replace(/^http/, 'ws') : `${proto}//${window.location.host}`;
    ws = new WebSocket(`${base}/api/realtime?token=${encodeURIComponent(t)}`);
    ws.onopen = () => { wsReady = true; for (const room of rooms.keys()) ws.send(JSON.stringify({ op: 'sub', room })); };
    ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } const set = rooms.get(m.room); if (set) for (const cb of set) { try { cb(m.event); } catch (e) { console.error('subscription callback error', e); } } };
    ws.onclose = () => { ws = null; wsReady = false; if (rooms.size) { clearTimeout(wsTimer); wsTimer = setTimeout(ensureSocket, 2000); } };
  }
  function subscribeRoom(room, cb) {
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(cb);
    ensureSocket();
    if (ws && wsReady) ws.send(JSON.stringify({ op: 'sub', room }));
    return () => { const s = rooms.get(room); if (!s) return; s.delete(cb); if (!s.size) { rooms.delete(room); if (ws && wsReady) ws.send(JSON.stringify({ op: 'unsub', room })); } };
  }

  // ---- entities ----
  const entityHandler = (name) => {
    const base = `/apps/${appId}/entities/${name}`;
    const fieldsParam = (f) => (Array.isArray(f) ? f.join(',') : f);
    const readArray = (sort, limit, skip, fields, query) => request('GET', base, { params: { q: query ? JSON.stringify(query) : undefined, sort, limit, skip, fields: fields ? fieldsParam(fields) : undefined } });
    const readPage = (o, query) => request('GET', `${base}/v2/list`, { params: { q: query ? JSON.stringify(query) : undefined, limit: o.limit || 100, cursor: o.cursor, distinct: o.distinct, sort: o.sort, fields: o.fields ? fieldsParam(o.fields) : undefined } });
    return {
      list: (...a) => (isObj(a[0]) ? readPage(a[0]) : readArray(a[0], a[1], a[2], a[3])),
      filter: (query, ...a) => (isObj(a[0]) ? readPage(a[0], query) : readArray(a[0], a[1], a[2], a[3], query)),
      get: (id) => request('GET', `${base}/${id}`),
      create: (data) => request('POST', base, { body: data }),
      update: (id, data) => request('PUT', `${base}/${id}`, { body: data }),
      delete: (id) => request('DELETE', `${base}/${id}`),
      deleteMany: (query) => request('DELETE', base, { body: query }),
      bulkCreate: (data) => request('POST', `${base}/bulk`, { body: data }),
      bulkUpdate: (data) => request('PUT', `${base}/bulk`, { body: data }),
      updateMany: (query, data) => request('PATCH', `${base}/update-many`, { body: { query, data } }),
      count: async (query) => (await request('GET', `${base}/count`, { params: { q: query ? JSON.stringify(query) : undefined } })).count,
      aggregate: (spec) => request('POST', `${base}/aggregate`, { body: spec }),
      upsert: (records, options) => request('POST', `${base}/upsert`, { body: { records, key: options?.key } }),
      importEntities: async () => { throw new Base44Error('importEntities is not available on the self-hosted server yet', 501); },
      subscribe: (callback) => subscribeRoom(`entities:${name}`, callback),
    };
  };
  const entities = new Proxy({}, { get: (_t, name) => (typeof name !== 'string' || name === 'then' || name.startsWith('_') ? undefined : entityHandler(name)) });

  // ---- integrations ----
  const integrations = new Proxy({}, {
    get: (_t, pkg) => {
      if (typeof pkg !== 'string' || pkg === 'then' || pkg.startsWith('_')) return undefined;
      return new Proxy({}, { get: (_t2, ep) => (typeof ep !== 'string' || ep === 'then' ? undefined : (data) => {
        if (typeof data === 'string') throw new Error(`Integration ${ep} must receive an object with named parameters, received: ${data}`);
        return request('POST', pkg === 'Core' ? `/apps/${appId}/integration-endpoints/Core/${ep}` : `/apps/${appId}/integration-endpoints/installable/${pkg}/integration-endpoints/${ep}`, { body: data || {} });
      }) });
    },
  });

  // ---- functions (returns an axios-like {data,status,headers}) ----
  const functions = {
    invoke: (name, data) => {
      if (typeof data === 'string') throw new Error(`Function ${name} must receive an object with named parameters, received: ${data}`);
      return request('POST', `/apps/${appId}/functions/${name}`, { body: data ?? {}, raw: true });
    },
    fetch: (path, init = {}) => { const headers = new Headers(init.headers || {}); const t = currentToken(); if (t) headers.set('Authorization', `Bearer ${t}`); return fetch(`${serverUrl}/functions${path.startsWith('/') ? path : '/' + path}`, { ...init, headers }); },
  };

  // ---- auth ----
  const auth = {
    me: () => request('GET', `/apps/${appId}/entities/User/me`),
    updateMe: (data) => request('PUT', `/apps/${appId}/entities/User/me`, { body: data }),
    isAuthenticated: async () => { if (!currentToken()) return false; try { await auth.me(); return true; } catch { return false; } },
    setToken: (t, save = true) => { token = t; if (save) saveAccessToken(t); },
    redirectToLogin: (nextUrl) => { const to = nextUrl ? new URL(nextUrl, window.location.origin) : new URL(window.location.href); if (to.pathname === '/login') return; window.location.href = `/login?returnTo=${encodeURIComponent(to.pathname + to.search + to.hash)}`; },
    loginWithProvider: () => { throw new Base44Error('Google sign-in is not set up on the self-hosted server yet. Use email and password.', 501); },
    logout: (redirectUrl) => { const t = currentToken(); token = null; removeAccessToken(); if (t) fetch(`${api}/apps/${appId}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } }).catch(() => {}); if (redirectUrl !== undefined) window.location.href = '/login'; },
    loginViaEmailPassword: async (email, password) => { const r = await request('POST', `/apps/${appId}/auth/login`, { body: { email, password } }); if (r.access_token) auth.setToken(r.access_token); return { access_token: r.access_token, user: r.user }; },
    register: async (payload) => { const r = await request('POST', `/apps/${appId}/auth/register`, { body: payload }); if (r.access_token) auth.setToken(r.access_token); return r; },
    verifyOtp: (payload) => request('POST', `/apps/${appId}/auth/verify-otp`, { body: payload }),
    resendOtp: (email) => request('POST', `/apps/${appId}/auth/resend-otp`, { body: { email } }),
    resetPasswordRequest: (email) => request('POST', `/apps/${appId}/auth/reset-password-request`, { body: { email } }),
    resetPassword: (payload) => request('POST', `/apps/${appId}/auth/reset-password`, { body: payload }),
    changePassword: async () => { throw new Base44Error('Password change is not available yet on the self-hosted server', 501); },
    inviteUser: async () => { throw new Base44Error('Invites are not available on the self-hosted server', 501); },
  };

  // ---- agents ----
  const convState = {};
  const agents = {
    listConversations: (params) => request('GET', `/apps/${appId}/agents/conversations`, { params }),
    getConversations: () => request('GET', `/apps/${appId}/agents/conversations`),
    getConversation: (id) => request('GET', `/apps/${appId}/agents/conversations/${id}`),
    createConversation: (c) => request('POST', `/apps/${appId}/agents/conversations`, { body: c }),
    addMessage: (conv, message) => request('POST', `/apps/${appId}/agents/conversations/v2/${conv.id}/messages`, { body: message }),
    subscribeToConversation: (id, onUpdate) => {
      const ready = agents.getConversation(id).then((c) => { convState[id] = c; onUpdate?.(c); return c; }).catch(() => null);
      return subscribeRoom(`conversation:${id}`, async (ev) => {
        await ready; const msg = ev?._message; const cur = convState[id]; if (!msg || !cur) return;
        const list = cur.messages || []; const i = list.findIndex((m) => m.id === msg.id);
        convState[id] = { ...cur, messages: i >= 0 ? list.map((m, j) => (j === i ? msg : m)) : [...list, msg] };
        onUpdate?.(convState[id]);
      });
    },
    getWhatsAppConnectURL: () => '#whatsapp-not-available-on-selfhost',
    getTelegramConnectURL: () => '#telegram-not-available-on-selfhost',
  };

  // ---- actors (realtime room) ----
  const actors = new Proxy({}, {
    get: (_t, actorName) => (typeof actorName !== 'string' || actorName === 'then' ? undefined : (roomId) => ({
      connect: ({ id } = {}) => {
        const listeners = new Set(); let sock = null, closed = false, retry = 0, ping = null; const queue = [];
        const open = () => {
          if (closed) return;
          const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const base = serverUrl ? serverUrl.replace(/^http/, 'ws') : `${proto}//${window.location.host}`;
          const t = currentToken();
          sock = new WebSocket(`${base}/api/actors/${encodeURIComponent(actorName)}/${encodeURIComponent(roomId)}?connection_id=${encodeURIComponent(id || crypto.randomUUID())}${t ? `&token=${encodeURIComponent(t)}` : ''}`);
          sock.onopen = () => { retry = 0; while (queue.length) sock.send(queue.shift()); clearInterval(ping); ping = setInterval(() => { if (sock?.readyState === 1) sock.send(JSON.stringify({ type: '__ping' })); }, 25000); };
          sock.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } if (m?.type === '__pong') return; for (const cb of listeners) { try { cb(m); } catch (e) { console.error(e); } } };
          sock.onclose = (ev) => { clearInterval(ping); sock = null; if (closed || ev.code === 4003) return; retry = Math.min(retry + 1, 6); setTimeout(open, 500 * 2 ** retry); };
        };
        open();
        return {
          subscribe: (cb) => { listeners.add(cb); return { unsubscribe: () => listeners.delete(cb) }; },
          send: (data) => { if (closed) return; const s = JSON.stringify(data); if (sock?.readyState === 1) sock.send(s); else queue.push(s); },
          close: () => { closed = true; clearInterval(ping); try { sock?.close(); } catch { /* */ } },
        };
      },
    })),
  });

  const connectors = {
    connectAppUser: async () => { throw new Base44Error('Connectors are configured on the server for the self-hosted build (see MIGRATION.md).', 501); },
    disconnectAppUser: async () => { throw new Base44Error('Connectors are configured on the server for the self-hosted build (see MIGRATION.md).', 501); },
  };
  const app = { getPublicSettings: () => request('GET', `/apps/public/prod/public-settings/by-id/${appId}`) };
  const noop = new Proxy({}, { get: (_t, k) => (k === 'then' ? undefined : async () => ({})) });

  if (typeof window !== 'undefined' && !token) { const t = getAccessToken(); if (t) token = t; }
  return { entities, integrations, functions, auth, agents, actors, connectors, app, analytics: noop, appLogs: noop, users: noop, payments: noop, cleanup: () => { try { ws?.close(); } catch { /* */ } } };
}
export default { createClient, getAccessToken };
