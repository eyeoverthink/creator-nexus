// Mongo-style filter -> Postgres SQL over a JSONB `data` column, plus RLS rules.
export class Params {
  vals: unknown[] = [];
  add(v: unknown) { this.vals.push(v); return '$' + this.vals.length; }
}
export const SYS_COLS: Record<string, 'text' | 'ts'> = {
  id: 'text', created_date: 'ts', updated_date: 'ts', created_by: 'text', created_by_id: 'text',
};
type Field = { col: string; type: 'text' | 'ts' } | { json: string };

function field(name: string, p: Params, base: string, top: boolean): Field {
  if (top && base === 'data' && SYS_COLS[name]) return { col: name, type: SYS_COLS[name] };
  const parts = name.split('.');
  return { json: `(${base} #> ${p.add(parts)}::text[])` };
}
const isOps = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length > 0 && Object.keys(v as object).every(k => k.startsWith('$'));
const jtext = (x: string) => `(${x} #>> '{}')`;

function eq(f: Field, v: unknown, p: Params): string {
  if ('col' in f) {
    if (v === null || v === undefined) return `${f.col} IS NULL`;
    return f.type === 'ts' ? `${f.col} = ${p.add(String(v))}::timestamptz` : `${f.col} = ${p.add(String(v))}`;
  }
  const x = f.json;
  if (v === null || v === undefined) return `(${x} IS NULL OR ${x} = 'null'::jsonb)`;
  const val = p.add(JSON.stringify(v));
  if (Array.isArray(v)) return `(${x} = ${val}::jsonb)`;
  return `(${x} = ${val}::jsonb OR (jsonb_typeof(${x}) = 'array' AND ${x} @> jsonb_build_array(${val}::jsonb)))`;
}
function cmp(f: Field, op: string, v: unknown, p: Params): string {
  const sqlOp = ({ $gt: '>', $gte: '>=', $lt: '<', $lte: '<=' } as any)[op];
  if ('col' in f) return f.type === 'ts' ? `${f.col} ${sqlOp} ${p.add(String(v))}::timestamptz` : `${f.col} COLLATE "C" ${sqlOp} ${p.add(String(v))}`;
  const x = f.json;
  if (typeof v === 'number') return `(CASE WHEN jsonb_typeof(${x}) = 'number' THEN (${x})::numeric END) ${sqlOp} ${p.add(v)}::numeric`;
  if (typeof v === 'boolean') return `(CASE WHEN jsonb_typeof(${x}) = 'boolean' THEN (${x})::boolean END) ${sqlOp} ${p.add(v)}::boolean`;
  const s = v instanceof Date ? v.toISOString() : String(v);
  return `(CASE WHEN jsonb_typeof(${x}) = 'string' THEN ${jtext(x)} END) COLLATE "C" ${sqlOp} ${p.add(s)}`;
}
function inList(f: Field, list: unknown[], p: Params): string {
  if (!Array.isArray(list)) throw new Error('$in needs an array');
  if (!list.length) return 'FALSE';
  if ('col' in f) {
    const hasNull = list.some(v => v === null);
    const vals = list.filter(v => v !== null).map(String);
    const c = f.type === 'ts' ? `${f.col} = ANY(${p.add(vals)}::timestamptz[])` : `${f.col} = ANY(${p.add(vals)}::text[])`;
    return hasNull ? `(${c} OR ${f.col} IS NULL)` : c;
  }
  const x = f.json, arr = p.add(JSON.stringify(list));
  const nullPart = list.some(v => v === null) ? ` OR ${x} IS NULL OR ${x} = 'null'::jsonb` : '';
  return `(EXISTS (SELECT 1 FROM jsonb_array_elements(${arr}::jsonb) _e WHERE ${x} = _e OR (jsonb_typeof(${x}) = 'array' AND ${x} @> jsonb_build_array(_e)))${nullPart})`;
}
function ops(f: Field, o: Record<string, any>, p: Params, base: string): string {
  const parts: string[] = [];
  for (const [op, v] of Object.entries(o)) {
    switch (op) {
      case '$eq': parts.push(eq(f, v, p)); break;
      case '$ne': parts.push(`NOT COALESCE(${eq(f, v, p)}, FALSE)`); break;
      case '$gt': case '$gte': case '$lt': case '$lte': parts.push(`COALESCE(${cmp(f, op, v, p)}, FALSE)`); break;
      case '$in': parts.push(inList(f, v, p)); break;
      case '$nin': parts.push(`NOT COALESCE(${inList(f, v, p)}, FALSE)`); break;
      case '$exists': {
        const e = 'col' in f ? `${f.col} IS NOT NULL` : `${f.json} IS NOT NULL`;
        parts.push(v ? e : `NOT (${e})`); break;
      }
      case '$regex': {
        const flags = String(o.$options || '') + (v instanceof RegExp ? v.flags : '');
        const src = v instanceof RegExp ? v.source : String(v);
        const t = 'col' in f ? `${f.col}::text` : jtext(f.json);
        parts.push(`COALESCE(${t} ${flags.includes('i') ? '~*' : '~'} ${p.add(src)}, FALSE)`); break;
      }
      case '$options': break;
      case '$not': parts.push(`NOT COALESCE(${isOps(v) ? ops(f, v, p, base) : eq(f, v, p)}, FALSE)`); break;
      case '$all': {
        if ('col' in f) throw new Error('$all on system field');
        parts.push(`COALESCE(${f.json} @> ${p.add(JSON.stringify(v))}::jsonb, FALSE)`); break;
      }
      case '$size': {
        if ('col' in f) throw new Error('$size on system field');
        parts.push(`(jsonb_typeof(${f.json}) = 'array' AND jsonb_array_length(${f.json}) = ${p.add(Number(v))}::int)`); break;
      }
      case '$elemMatch': {
        if ('col' in f) throw new Error('$elemMatch on system field');
        const inner = isOps(v) ? ops({ json: '_el' }, v, p, '_el') : compileFilter(v, p, '_el', false);
        parts.push(`EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(${f.json}) = 'array' THEN ${f.json} ELSE '[]'::jsonb END) _el WHERE ${inner})`); break;
      }
      default: throw new Error('Unsupported query operator ' + op);
    }
  }
  return parts.length ? '(' + parts.join(' AND ') + ')' : 'TRUE';
}
export function compileFilter(query: any, p: Params, base = 'data', top = true): string {
  if (!query || typeof query !== 'object') return 'TRUE';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    if (k === '$or' || k === '$and' || k === '$nor') {
      const subs = (v as any[]).map(s => compileFilter(s, p, base, top));
      if (!subs.length) continue;
      if (k === '$and') parts.push('(' + subs.join(' AND ') + ')');
      else if (k === '$or') parts.push('(' + subs.join(' OR ') + ')');
      else parts.push('NOT (' + subs.join(' OR ') + ')');
      continue;
    }
    if (k === '$text' || k === '$where') throw new Error('Unsupported query operator ' + k);
    const f = field(k, p, base, top);
    parts.push(isOps(v) ? ops(f, v as any, p, base) : eq(f, v, p));
  }
  return parts.length ? '(' + parts.join(' AND ') + ')' : 'TRUE';
}
export function compileSort(sort: string | undefined, p: Params): string {
  const items = String(sort || '-created_date').split(',').map(s => s.trim()).filter(Boolean);
  const out = items.map(s => {
    const desc = s.startsWith('-'); const name = s.replace(/^[-+]/, '');
    const expr = SYS_COLS[name] ? name : `(data #> ${p.add(name.split('.'))}::text[])`;
    return `${expr} ${desc ? 'DESC NULLS LAST' : 'ASC NULLS FIRST'}`;
  });
  out.push('id ' + (items[0]?.startsWith('-') ? 'DESC' : 'ASC'));
  return out.join(', ');
}

// ---- RLS ----
export type User = { id: string; email: string; role?: string; [k: string]: any } | null;
const tmpl = (v: any, user: User) => typeof v === 'string' ? v.replace(/\{\{user\.(\w+)\}\}/g, (_, k) => (user as any)?.[k] ?? '\u0000none') : v;
const userCond = (c: Record<string, any>, user: User) => !!user && Object.entries(c).every(([k, v]) => (user as any)[k] === tmpl(v, user));

// SQL predicate for read/update/delete rules. `undefined` rule = any signed-in user.
export function rlsSql(rule: any, user: User, p: Params): string {
  if (rule === undefined || rule === null) return user ? 'TRUE' : 'FALSE';
  if (rule === true) return 'TRUE';
  if (rule === false) return 'FALSE';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(rule)) {
    if (k === '$or') parts.push('(' + ((v as any[]).map(r => rlsSql(r, user, p)).join(' OR ') || 'FALSE') + ')');
    else if (k === '$and') parts.push('(' + ((v as any[]).map(r => rlsSql(r, user, p)).join(' AND ') || 'TRUE') + ')');
    else if (k === 'user_condition') parts.push(userCond(v as any, user) ? 'TRUE' : 'FALSE');
    else {
      if (!user) { parts.push('FALSE'); continue; }
      const name = k.startsWith('data.') ? k.slice(5) : k;
      const val = tmpl(v, user);
      parts.push(compileFilter({ [name]: val }, p));
    }
  }
  return parts.length ? '(' + parts.join(' AND ') + ')' : 'TRUE';
}
// JS evaluation of the same rules against a record (for create, and realtime fan-out).
export function rlsMatch(rule: any, user: User, rec: any): boolean {
  if (rule === undefined || rule === null) return !!user;
  if (typeof rule === 'boolean') return rule;
  return Object.entries(rule).every(([k, v]) => {
    if (k === '$or') return (v as any[]).some(r => rlsMatch(r, user, rec));
    if (k === '$and') return (v as any[]).every(r => rlsMatch(r, user, rec));
    if (k === 'user_condition') return userCond(v as any, user);
    if (!user) return false;
    const name = k.startsWith('data.') ? k.slice(5) : k;
    const actual = name.split('.').reduce((o: any, part) => o?.[part], rec);
    return actual === tmpl(v, user);
  });
}
