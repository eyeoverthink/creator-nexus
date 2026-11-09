import { q, q1, newId, HttpError } from './db.ts';
import { compileFilter, compileSort, Params, rlsSql, rlsMatch, SYS_COLS, User } from './query.ts';
import { parseJsonc } from './jsonc.ts';
import { config } from './config.ts';

export type Ctx = { user: User; service: boolean };
export type Schema = { name: string; properties?: Record<string, any>; rls?: any; [k: string]: any };
export const schemas = new Map<string, Schema>();
type Listener = (entity: string, ev: { type: 'create' | 'update' | 'delete'; id: string; data: any; old_data?: any; timestamp: string }) => void;
const listeners = new Set<Listener>();
export const onEntityEvent = (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit: Listener = (e, ev) => { for (const l of listeners) { try { l(e, ev); } catch (err) { console.error('entity listener', err); } } };

const USER_RLS = {
  read: { $or: [{ id: '{{user.id}}' }, { user_condition: { role: 'admin' } }] },
  update: { $or: [{ id: '{{user.id}}' }, { user_condition: { role: 'admin' } }] },
  create: { user_condition: { role: 'admin' } },
  delete: { user_condition: { role: 'admin' } },
};
const tbl = (name: string) => `ent."${name}"`;

export async function loadSchemas() {
  for await (const f of Deno.readDir(config.base44Root + '/entities')) {
    if (!f.name.endsWith('.jsonc') && !f.name.endsWith('.json')) continue;
    const s = parseJsonc(await Deno.readTextFile(`${config.base44Root}/entities/${f.name}`));
    if (s.name === 'User') s.rls = USER_RLS;
    schemas.set(s.name, s);
  }
  if (!schemas.has('User')) schemas.set('User', { name: 'User', properties: {}, rls: USER_RLS });
}
export async function migrate() {
  await q('CREATE SCHEMA IF NOT EXISTS ent');
  await q('CREATE SCHEMA IF NOT EXISTS sh');
  for (const name of schemas.keys()) {
    if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error('bad entity name ' + name);
    await q(`CREATE TABLE IF NOT EXISTS ${tbl(name)} (
      id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_date timestamptz NOT NULL DEFAULT now(), updated_date timestamptz NOT NULL DEFAULT now(),
      created_by text, created_by_id text, is_sample boolean NOT NULL DEFAULT false)`);
    await q(`CREATE INDEX IF NOT EXISTS "${name}_data_gin" ON ${tbl(name)} USING gin (data jsonb_path_ops)`);
    await q(`CREATE INDEX IF NOT EXISTS "${name}_created" ON ${tbl(name)} (created_date)`);
    await q(`CREATE INDEX IF NOT EXISTS "${name}_owner" ON ${tbl(name)} ((data->>'owner_id'))`);
  }
  await q(`CREATE TABLE IF NOT EXISTS sh.conversations (id text PRIMARY KEY, agent_name text NOT NULL, owner_id text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb, messages jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_date timestamptz NOT NULL DEFAULT now(), updated_date timestamptz NOT NULL DEFAULT now())`);
  await q(`CREATE TABLE IF NOT EXISTS sh.actor_storage (actor text NOT NULL, room text NOT NULL, key text NOT NULL, value jsonb, PRIMARY KEY (actor, room, key))`);
  await q(`CREATE TABLE IF NOT EXISTS sh.files (key text PRIMARY KEY, owner_id text, name text, mime text, size bigint, visibility text NOT NULL, created_date timestamptz NOT NULL DEFAULT now())`);
  await q(`CREATE TABLE IF NOT EXISTS sh.workflow_runs (id bigserial PRIMARY KEY, workflow text, started_at timestamptz DEFAULT now(), finished_at timestamptz, ok boolean, detail jsonb)`);
}

export function toRecord(row: any, fields?: string[]) {
  const rec = { ...(row.data || {}), id: row.id, created_date: row.created_date, updated_date: row.updated_date, created_by: row.created_by, created_by_id: row.created_by_id, is_sample: row.is_sample ?? false };
  if (!fields?.length) return rec;
  const out: any = { id: rec.id };
  for (const f of fields) if (f in rec) out[f] = (rec as any)[f];
  return out;
}
function cleanData(input: any, schema?: Schema, isCreate = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Record data must be an object');
  const data: any = {};
  for (const [k, v] of Object.entries(input)) { if (!(k in SYS_COLS) && k !== 'is_sample' && v !== undefined) data[k] = v; }
  if (isCreate && schema?.properties) {
    for (const [k, def] of Object.entries<any>(schema.properties)) if (data[k] === undefined && def && 'default' in def) data[k] = def.default;
  }
  return JSON.parse(JSON.stringify(data));
}
const parseFields = (f: any): string[] | undefined => !f ? undefined : Array.isArray(f) ? f : String(f).split(',').map(s => s.trim()).filter(Boolean);
const encCursor = (o: number) => btoa(JSON.stringify({ o }));
const decCursor = (c?: string | null) => { if (!c) return 0; try { return Math.max(0, Number(JSON.parse(atob(c)).o) || 0); } catch { throw new HttpError(400, 'Invalid cursor'); } };

export class EntityStore {
  schema: Schema;
  constructor(public name: string, public ctx: Ctx) {
    const s = schemas.get(name);
    if (!s) throw new HttpError(404, `Entity schema ${name} not found`);
    this.schema = s;
  }
  private rule(op: 'read' | 'create' | 'update' | 'delete') { return this.schema.rls?.[op]; }
  private where(query: any, p: Params, op: 'read' | 'update' | 'delete' = 'read') {
    const f = compileFilter(query || {}, p);
    if (this.ctx.service) return f;
    if (!this.ctx.user) throw new HttpError(401, 'Authentication required');
    return `${f} AND ${rlsSql(this.rule(op), this.ctx.user, p)}`;
  }
  async readArray(query: any, sort?: string, limit?: number, skip?: number, fields?: any) {
    const p = new Params();
    const w = this.where(query, p);
    const lim = Math.min(Number(limit) || 5000, 5000), off = Math.max(0, Number(skip) || 0);
    const rows = await q(`SELECT * FROM ${tbl(this.name)} WHERE ${w} ORDER BY ${compileSort(sort, p)} LIMIT ${lim} OFFSET ${off}`, p.vals);
    const fl = parseFields(fields);
    return rows.map(r => toRecord(r, fl));
  }
  async readPage(query: any, opts: any = {}) {
    const p = new Params();
    const w = this.where(query, p);
    const lim = Math.min(Math.max(1, Number(opts.limit) || 100), 5000), off = decCursor(opts.cursor);
    if (opts.distinct) {
      const fp = p.add(String(opts.distinct).split('.'));
      const rows = await q(`SELECT DISTINCT _v FROM ${tbl(this.name)}, LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(data #> ${fp}::text[]) = 'array' THEN data #> ${fp}::text[] ELSE jsonb_build_array(data #> ${fp}::text[]) END) _v WHERE ${w} AND _v IS NOT NULL AND _v <> 'null'::jsonb ORDER BY _v LIMIT ${lim + 1} OFFSET ${off}`, p.vals);
      const items = rows.slice(0, lim).map(r => r._v);
      return { items, next_cursor: rows.length > lim ? encCursor(off + lim) : null, has_more: rows.length > lim };
    }
    const rows = await q(`SELECT * FROM ${tbl(this.name)} WHERE ${w} ORDER BY ${compileSort(opts.sort, p)} LIMIT ${lim + 1} OFFSET ${off}`, p.vals);
    const fl = parseFields(opts.fields);
    return { items: rows.slice(0, lim).map(r => toRecord(r, fl)), next_cursor: rows.length > lim ? encCursor(off + lim) : null, has_more: rows.length > lim };
  }
  async get(id: string) {
    const p = new Params();
    const w = this.where({ id }, p);
    const row = await q1(`SELECT * FROM ${tbl(this.name)} WHERE ${w}`, p.vals);
    if (!row) throw new HttpError(404, `${this.name} ${id} not found`);
    return toRecord(row);
  }
  async create(input: any) {
    const data = cleanData(input, this.schema, true);
    const id = typeof input?.id === 'string' && this.ctx.service && /^[A-Za-z0-9_-]{6,64}$/.test(input.id) ? input.id : newId();
    const u = this.ctx.user;
    if (!this.ctx.service) {
      if (!u) throw new HttpError(401, 'Authentication required');
      if (!rlsMatch(this.rule('create'), u, { ...data, id, created_by_id: u.id, created_by: u.email })) throw new HttpError(403, `Permission denied: cannot create ${this.name}`);
    }
    const row = await q1(`INSERT INTO ${tbl(this.name)} (id, data, created_by, created_by_id, created_date, updated_date) VALUES ($1, $2::jsonb, $3, $4, COALESCE($5::timestamptz, now()), COALESCE($6::timestamptz, now())) RETURNING *`,
      [id, JSON.stringify(data), u?.email ?? input?.created_by ?? null, u?.id ?? input?.created_by_id ?? null, this.ctx.service ? input?.created_date ?? null : null, this.ctx.service ? input?.updated_date ?? null : null]);
    const rec = toRecord(row);
    emit(this.name, { type: 'create', id, data: rec, timestamp: new Date().toISOString() });
    return rec;
  }
  async bulkCreate(list: any[]) {
    if (!Array.isArray(list)) throw new HttpError(400, 'bulkCreate needs an array');
    const out = []; for (const r of list) out.push(await this.create(r)); return out;
  }
  async update(id: string, input: any) {
    const patch = cleanData(input);
    const p = new Params();
    const w = this.where({ id }, p, 'update');
    if (this.name === 'User' && !this.ctx.service && this.ctx.user?.role !== 'admin') { delete patch.role; delete patch.email; }
    const before = await q1(`SELECT * FROM ${tbl(this.name)} WHERE ${w}`, p.vals);
    if (!before) throw new HttpError(404, `${this.name} ${id} not found or not permitted`);
    const row = await q1(`UPDATE ${tbl(this.name)} SET data = data || $2::jsonb, updated_date = now() WHERE id = $1 RETURNING *`, [id, JSON.stringify(patch)]);
    const rec = toRecord(row);
    emit(this.name, { type: 'update', id, data: rec, old_data: toRecord(before), timestamp: new Date().toISOString() });
    return rec;
  }
  async bulkUpdate(list: any[]) {
    if (!Array.isArray(list)) throw new HttpError(400, 'bulkUpdate needs an array');
    const out = []; for (const r of list) { const { id, ...rest } = r || {}; out.push(await this.update(id, rest)); } return out;
  }
  async updateMany(query: any, update: any) {
    if (!update || typeof update !== 'object') throw new HttpError(400, 'updateMany needs an update document');
    const p = new Params();
    const w = this.where(query, p, 'update');
    const rows = await q(`SELECT * FROM ${tbl(this.name)} WHERE ${w} ORDER BY id LIMIT 501 FOR UPDATE SKIP LOCKED`, p.vals);
    const batch = rows.slice(0, 500);
    for (const row of batch) {
      const data = { ...(row.data || {}) };
      for (const [op, fields] of Object.entries<any>(update)) {
        for (const [k, v] of Object.entries<any>(fields || {})) {
          if (op === '$set') data[k] = v;
          else if (op === '$unset') delete data[k];
          else if (op === '$inc') data[k] = (Number(data[k]) || 0) + Number(v);
          else if (op === '$push') data[k] = [...(Array.isArray(data[k]) ? data[k] : []), v];
          else if (op === '$addToSet') { const a = Array.isArray(data[k]) ? data[k] : []; data[k] = a.some((x: any) => JSON.stringify(x) === JSON.stringify(v)) ? a : [...a, v]; }
          else if (op === '$pull') data[k] = (Array.isArray(data[k]) ? data[k] : []).filter((x: any) => JSON.stringify(x) !== JSON.stringify(v));
          else if (op === '$currentDate') data[k] = new Date().toISOString();
          else throw new HttpError(400, 'Unsupported update operator ' + op);
        }
      }
      // Conditional write keeps lease patterns (filter -> updateMany -> re-read) race-safe.
      const p2 = new Params(); const cond = compileFilter(query || {}, p2);
      const idp = p2.add(row.id), dp = p2.add(JSON.stringify(data));
      const upd = await q1(`UPDATE ${tbl(this.name)} SET data = ${dp}::jsonb, updated_date = now() WHERE id = ${idp} AND ${cond} RETURNING *`, p2.vals);
      if (upd) emit(this.name, { type: 'update', id: row.id, data: toRecord(upd), old_data: toRecord(row), timestamp: new Date().toISOString() });
    }
    return { success: true, updated: batch.length, has_more: rows.length > 500 };
  }
  async delete(id: string) {
    const p = new Params();
    const w = this.where({ id }, p, 'delete');
    const row = await q1(`DELETE FROM ${tbl(this.name)} WHERE ${w} RETURNING *`, p.vals);
    if (!row) throw new HttpError(404, `${this.name} ${id} not found or not permitted`);
    emit(this.name, { type: 'delete', id, data: toRecord(row), timestamp: new Date().toISOString() });
    return { success: true };
  }
  async deleteMany(query: any) {
    if (!query || typeof query !== 'object' || !Object.keys(query).length) throw new HttpError(400, 'deleteMany needs a non-empty query');
    const p = new Params();
    const w = this.where(query, p, 'delete');
    const rows = await q(`DELETE FROM ${tbl(this.name)} WHERE ${w} RETURNING *`, p.vals);
    for (const row of rows) emit(this.name, { type: 'delete', id: row.id, data: toRecord(row), timestamp: new Date().toISOString() });
    return { success: true, deleted: rows.length };
  }
  async count(query: any) {
    const p = new Params();
    const w = this.where(query, p);
    return (await q1(`SELECT count(*)::int AS n FROM ${tbl(this.name)} WHERE ${w}`, p.vals))!.n;
  }
  async upsert(records: any[], key: string | string[]) {
    if (!Array.isArray(records)) throw new HttpError(400, 'upsert needs an array of records');
    const keys = Array.isArray(key) ? key : [key];
    if (!keys.length) throw new HttpError(400, 'upsert needs a key');
    let created = 0, updated = 0; const out = [];
    for (const r of records.slice(0, 500)) {
      const match: any = {}; for (const k of keys) match[k] = r?.[k] ?? null;
      const existing = (await this.readArray(match, '-created_date', 1))[0];
      if (existing) { out.push(await this.update(existing.id, r)); updated++; }
      else { out.push(await this.create(r)); created++; }
    }
    return { created, updated, records: out };
  }
  async aggregate(spec: any = {}) {
    const p = new Params();
    const w = this.where(spec.query || {}, p);
    const list = (v: any): string[] => v === undefined ? [] : Array.isArray(v) ? v : [v];
    const fexpr = (name: string) => SYS_COLS[name] ? name : `(data #> ${p.add(name.split('.'))}::text[])`;
    const num = (name: string) => SYS_COLS[name] ? name : `(CASE WHEN jsonb_typeof(${fexpr(name)}) = 'number' THEN (${fexpr(name)})::numeric END)`;
    const sel: string[] = [], groups: string[] = [];
    list(spec.groupBy).slice(0, 4).forEach((g, i) => { const e = fexpr(g); sel.push(`${e} AS "g${i}"`); groups.push(e); });
    if (spec.dateBucket?.field) {
      const unit = ['day', 'week', 'month', 'year'].includes(spec.dateBucket.unit) ? spec.dateBucket.unit : 'day';
      const f = spec.dateBucket.field;
      const ts = SYS_COLS[f] === 'ts' ? f : `((${fexpr(f)} #>> '{}')::timestamptz)`;
      const e = `to_char(date_trunc('${unit}', ${ts} AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`;
      sel.push(`${e} AS "db"`); groups.push(e);
    }
    if (spec.count !== false) sel.push('count(*)::int AS "count"');
    const measures: [string, string, string][] = [];
    for (const [fn, key] of [['sum', 'sum'], ['avg', 'avg'], ['min', 'min'], ['max', 'max']] as const) {
      for (const f of list(spec[key])) {
        const alias = `${key}_${f}`;
        if (fn === 'min' || fn === 'max') sel.push(`${fn}(${SYS_COLS[f] ? f : `${fexpr(f)} #>> '{}'`}) AS "${alias}"`);
        else sel.push(`${fn}(${num(f)})::float8 AS "${alias}"`);
        measures.push([fn, f, alias]);
      }
    }
    if (spec.countDistinct) sel.push(`count(DISTINCT ${fexpr(spec.countDistinct)})::int AS "count_distinct_${spec.countDistinct}"`);
    const lim = Math.min(Number(spec.limit) || 1000, 10000);
    let order = '';
    if (spec.sort) { const d = String(spec.sort).startsWith('-'); const n = String(spec.sort).replace(/^[-+]/, ''); order = `ORDER BY "${n.replace(/"/g, '')}" ${d ? 'DESC' : 'ASC'} NULLS LAST`; }
    const rows = await q(`SELECT ${sel.join(', ')} FROM ${tbl(this.name)} WHERE ${w} ${groups.length ? 'GROUP BY ' + groups.join(', ') : ''} ${order} LIMIT ${lim + 1}`, p.vals);
    const gb = list(spec.groupBy);
    const out = rows.slice(0, lim).map(r => {
      const o: any = {};
      gb.forEach((g, i) => { o[g] = r['g' + i]; });
      if (spec.dateBucket?.field) o[spec.dateBucket.field] = r.db;
      for (const [k, v] of Object.entries(r)) if (!/^g\d$/.test(k) && k !== 'db') o[k] = v;
      return o;
    });
    return { rows: out, truncated: rows.length > lim };
  }
}
// Read check used by realtime fan-out.
export function canRead(entity: string, user: User, rec: any) {
  const s = schemas.get(entity); if (!s) return false;
  return rlsMatch(s.rls?.read, user, rec);
}
