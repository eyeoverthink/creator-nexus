// InvokeLLM and an OpenAI-compatible gateway, both routed to the user's own Ollama servers.
// Order: OLLAMA_URLS[0] (FRAYMUS-HOME RTX 5070 over Tailscale), then the next ones as fallback.
import { providerModels } from '../../../base44/shared/partnerModelProviders.ts';
import { config } from './config.ts';
import { HttpError } from './db.ts';

export type Route = { base: string; model: string };
export const routes = (): Route[] => config.ollamaUrls.map((base, i) => ({ base: base.replace(/\/$/, ''), model: config.ollamaModels[i] ?? config.ollamaModels.at(-1)! }));
// Same provider shape as base44/shared/partnerModelProviders.ts ({kind, base, key}).
const asProvider = (r: Route) => ({ kind: 'ollama', base: r.base, key: 'local-ollama' });

export async function llmHealth() {
  return Promise.all(routes().map(async r => {
    const t0 = Date.now();
    const res: any = await providerModels(asProvider(r));
    return { base: r.base, model: r.model, reachable: !res.error, has_model: !!res.models?.includes(r.model), ms: Date.now() - t0, error: res.error };
  }));
}

async function ollamaChat(r: Route, messages: any[], format: any, timeoutMs: number) {
  const body: any = { model: r.model, messages, stream: false, think: false, options: { num_ctx: config.llmNumCtx, temperature: 0.4 } };
  if (format) body.format = format;
  const res = await fetch(r.base + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
  const text = await res.text();
  if (!res.ok) throw new HttpError(502, `Ollama ${r.base} returned ${res.status}: ${text.slice(0, 200)}`);
  const data = JSON.parse(text);
  return { content: String(data.message?.content ?? ''), model: data.model, eval_count: data.eval_count };
}
const stripThink = (s: string) => s.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
function parseJson(s: string) {
  const t = stripThink(s).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(t); } catch { /* fall through */ }
  const m = t.match(/[\[{][\s\S]*[\]}]/); if (m) return JSON.parse(m[0]);
  throw new HttpError(502, 'The model did not return valid JSON');
}
export const lastRoute: { used?: string; model?: string; at?: string } = {};

// Base44 Core.InvokeLLM({prompt, response_json_schema?, file_urls?, add_context_from_internet?})
export async function invokeLLM(input: any) {
  const prompt = String(input?.prompt ?? '');
  if (!prompt) throw new HttpError(400, 'InvokeLLM needs a prompt');
  let content = prompt;
  if (Array.isArray(input?.file_urls) && input.file_urls.length) {
    // TODO(selfhost): pass images to a vision model (qwen3-vl on fraymus-kvm2) and extract PDFs/text.
    content += `\n\n[Note: ${input.file_urls.length} attached file(s) were not readable by this local model.]`;
  }
  if (input?.add_context_from_internet) {
    // TODO(selfhost): web search context (e.g. self-hosted SearXNG). Not wired yet.
    content += '\n\n[Note: live internet context is not available on this server; answer from the prompt only.]';
  }
  const schema = input?.response_json_schema;
  const messages = [{ role: 'user', content: schema ? content + '\n\nReply with only one JSON object that matches the requested schema.' : content }];
  const errors: string[] = [];
  for (const r of routes()) {
    try {
      const out = await ollamaChat(r, messages, schema || undefined, config.llmTimeoutMs);
      Object.assign(lastRoute, { used: r.base, model: r.model, at: new Date().toISOString() });
      if (schema) return parseJson(out.content);
      const text = stripThink(out.content);
      if (!text) throw new Error('empty reply');
      return text;
    } catch (e) { errors.push(`${r.base}: ${(e as Error).message}`); }
  }
  throw new HttpError(502, 'No local model answered. ' + errors.join(' | '));
}

// OpenAI-compatible endpoint for code that uses aiGateway.connection() + @ai-sdk/openai-compatible.
// Model "automatic" (or any unknown name) maps to the route's configured model.
export async function gatewayChat(req: Request): Promise<Response> {
  const body = await req.json();
  const errors: string[] = [];
  for (const r of routes()) {
    const b = { ...body, model: !body.model || body.model === 'automatic' || String(body.model).includes('/') ? r.model : body.model };
    try {
      const res = await fetch(r.base + '/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b), signal: AbortSignal.timeout(config.llmTimeoutMs) });
      if (res.status >= 500) { errors.push(`${r.base}: ${res.status}`); await res.body?.cancel(); continue; }
      Object.assign(lastRoute, { used: r.base, model: b.model, at: new Date().toISOString() });
      return new Response(res.body, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
    } catch (e) { errors.push(`${r.base}: ${(e as Error).message}`); }
  }
  return Response.json({ error: { message: 'No local model answered: ' + errors.join(' | ') } }, { status: 502 });
}
export async function gatewayModels(): Promise<Response> {
  return Response.json({ object: 'list', data: [{ id: 'automatic', object: 'model' }, ...routes().map(r => ({ id: r.model, object: 'model' }))] });
}
