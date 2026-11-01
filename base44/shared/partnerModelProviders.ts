// Model-account calls for the partner workspace (Ollama Cloud memberships and
// OpenAI-compatible services). The caller's key is used for this one request only:
// it is never stored, logged or returned.
const KINDS = ['ollama', 'openai'];
const PRIVATE_HOST = /(^|\.)(localhost|local|internal|lan|home|arpa|test|invalid|example|onion)$/i;

export function readProvider(input) {
  if (!input || typeof input !== 'object') return { error: 'Add the model account details.' };
  if (!KINDS.includes(input.kind)) return { error: 'Unknown service type.' };
  const key = typeof input.api_key === 'string' ? input.api_key.trim() : '';
  if (!key || key.length > 4000 || /\s/.test(key)) return { error: 'Paste a valid API key or access token.' };
  let url;
  try {
    url = new URL(String(input.base_url || ''));
  } catch {
    return { error: 'Enter the full https:// address of the service.' };
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.port) {
    return { error: 'Use a plain https:// address without a port, login or query.' };
  }
  const host = url.hostname.replace(/\.$/, '');
  if (!host.includes('.') || host.startsWith('[') || /^[\d.]+$/.test(host) || PRIVATE_HOST.test(host)) {
    return { error: 'Use the public web address of the service.' };
  }
  return { kind: input.kind, base: url.origin + url.pathname.replace(/\/+$/, ''), key };
}

async function request(provider, path, body, timeoutMs) {
  let res;
  try {
    res = await fetch(provider.base + path, {
      method: body ? 'POST' : 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Authorization: `Bearer ${provider.key}`,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    return { error: error?.name === 'TimeoutError' ? 'The service took too long to answer.' : 'The service could not be reached. Check the address.' };
  }
  if ((res.status >= 300 && res.status < 400) || res.type === 'opaqueredirect') {
    await res.body?.cancel();
    return { error: 'The service redirected the request. Check the address.' };
  }
  if (Number(res.headers.get('content-length') || 0) > 3000000) {
    await res.body?.cancel();
    return { error: 'The service sent an oversized response.' };
  }
  const raw = await res.text();
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    data = null;
  }
  if (!res.ok) {
    const detail = typeof data?.error === 'string' ? data.error : data?.error?.message || data?.message || '';
    return { error: `The service returned ${res.status}${detail ? `: ${String(detail).slice(0, 240)}` : ''}` };
  }
  return data && typeof data === 'object' ? { data } : { error: 'The service sent a response that was not JSON.' };
}

export async function providerModels(provider) {
  const ollama = provider.kind === 'ollama';
  const result = await request(provider, ollama ? '/api/tags' : '/models', null, 15000);
  if (result.error) return result;
  const list = ollama ? result.data.models : result.data.data;
  const names = (Array.isArray(list) ? list : []).map((m) => (ollama ? m?.name || m?.model : m?.id));
  const models = [...new Set(names.filter((n) => typeof n === 'string' && n.length > 0 && n.length <= 200))].sort().slice(0, 300);
  return models.length ? { models } : { error: 'The service listed no models. Type the model names instead.' };
}

export async function providerChat(provider, model, system, messages, temperature) {
  const ollama = provider.kind === 'ollama';
  const all = [{ role: 'system', content: system }, ...messages];
  const body = ollama
    ? { model, messages: all, stream: false, options: { num_ctx: 8192, num_predict: 2000, temperature } }
    : { model, messages: all };
  const result = await request(provider, ollama ? '/api/chat' : '/chat/completions', body, 150000);
  if (result.error) return result;
  const data = result.data;
  const text = ollama ? data.message?.content : data.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) return { error: 'The model returned an empty reply.' };
  return { text, usage: { output_tokens: (ollama ? data.eval_count : data.usage?.completion_tokens) ?? null } };
}