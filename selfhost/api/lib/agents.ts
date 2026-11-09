// Base44 agents (base44/agents/*.jsonc) as plain chat on the user's Ollama.
// TODO(selfhost): tool_configs (entity + function tools) via Ollama tool-calling; WhatsApp/Telegram links.
import { q, q1, newId, HttpError } from './db.ts';
import { config } from './config.ts';
import { parseJsonc } from './jsonc.ts';
import { publish } from './realtime.ts';
import { routes } from './llm.ts';
import type { User } from './query.ts';

const agentCache = new Map<string, any>();
async function agentConfig(name: string) {
  if (!/^[A-Za-z0-9_]+$/.test(name)) throw new HttpError(400, 'Bad agent name');
  if (!agentCache.has(name)) {
    try { agentCache.set(name, parseJsonc(await Deno.readTextFile(`${config.base44Root}/agents/${name}.jsonc`))); }
    catch { throw new HttpError(404, `Agent ${name} not found`); }
  }
  return agentCache.get(name);
}
const toConv = (r: any) => ({ id: r.id, agent_name: r.agent_name, metadata: r.metadata, messages: r.messages, created_by_id: r.owner_id, created_date: r.created_date, updated_date: r.updated_date });
async function own(id: string, user: User) {
  const r = await q1(`SELECT * FROM sh.conversations WHERE id = $1`, [id]);
  if (!r || (r.owner_id !== user?.id && user?.role !== 'admin')) throw new HttpError(404, 'Conversation not found');
  return r;
}
export async function listConversations(user: User, params: URLSearchParams) {
  const agent = params.get('agent_name');
  const rows = await q(`SELECT * FROM sh.conversations WHERE owner_id = $1 ${agent ? 'AND agent_name = $2' : ''} ORDER BY updated_date DESC LIMIT 100`, agent ? [user!.id, agent] : [user!.id]);
  return rows.map(toConv);
}
export async function getConversation(id: string, user: User) { return toConv(await own(id, user)); }
export async function createConversation(body: any, user: User) {
  await agentConfig(String(body?.agent_name || ''));
  const r = await q1(`INSERT INTO sh.conversations (id, agent_name, owner_id, metadata) VALUES ($1,$2,$3,$4::jsonb) RETURNING *`, [newId(), body.agent_name, user!.id, JSON.stringify(body.metadata || {})]);
  return toConv(r);
}
async function appendMessage(id: string, msg: any) {
  const r = await q1(`UPDATE sh.conversations SET messages = messages || jsonb_build_array($2::jsonb), updated_date = now() WHERE id = $1 RETURNING *`, [id, JSON.stringify(msg)]);
  publish(`conversation:${id}`, { _message: msg });
  return r;
}
async function replaceMessage(id: string, msg: any) {
  await q(`UPDATE sh.conversations SET messages = (SELECT jsonb_agg(CASE WHEN m->>'id' = $2 THEN $3::jsonb ELSE m END) FROM jsonb_array_elements(messages) m), updated_date = now() WHERE id = $1`, [id, msg.id, JSON.stringify(msg)]);
  publish(`conversation:${id}`, { _message: msg });
}
export async function addMessage(id: string, body: any, user: User) {
  const conv = await own(id, user);
  const msg = { id: newId(), role: body?.role || 'user', content: String(body?.content ?? ''), file_urls: body?.file_urls, created_date: new Date().toISOString() };
  await appendMessage(id, msg);
  if (msg.role === 'user') runAgent(conv.id, conv.agent_name).catch(e => console.error('agent run failed', e?.message));
  return msg;
}
async function runAgent(convId: string, agentName: string) {
  const cfg = await agentConfig(agentName);
  const conv = await q1(`SELECT * FROM sh.conversations WHERE id = $1`, [convId]);
  const reply: any = { id: newId(), role: 'assistant', content: '', status: 'running', created_date: new Date().toISOString() };
  await appendMessage(convId, reply);
  const system = String(cfg.instructions || '') + '\n\n(Self-hosted note: tools are not connected on this server yet, so answer directly and say when an action would need a tool.)';
  const history = (conv.messages as any[]).filter(m => m.role === 'user' || m.role === 'assistant').slice(-20).map(m => ({ role: m.role, content: String(m.content || '').slice(0, 12000) }));
  for (const r of routes()) {
    try {
      const res = await fetch(r.base + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(config.llmTimeoutMs),
        body: JSON.stringify({ model: r.model, stream: true, think: false, messages: [{ role: 'system', content: system }, ...history], options: { num_ctx: config.llmNumCtx } }) });
      if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = '', last = 0;
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += value; const lines = buf.split('\n'); buf = lines.pop() || '';
        for (const line of lines) { if (!line.trim()) continue; const j = JSON.parse(line); reply.content += j.message?.content || ''; }
        if (Date.now() - last > 400) { last = Date.now(); publish(`conversation:${convId}`, { _message: { ...reply } }); }
      }
      reply.status = 'completed'; reply.model = r.model;
      await replaceMessage(convId, reply);
      return;
    } catch (e) { reply.content = ''; console.error('agent route failed', r.base, (e as Error).message); }
  }
  reply.status = 'failed'; reply.content = 'No local model answered. Check that FRAYMUS-HOME Ollama is running.';
  await replaceMessage(convId, reply);
}
