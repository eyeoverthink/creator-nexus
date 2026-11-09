// Runtime configuration. Every value comes from the environment (root-only .env on the server).
const env = (k: string, d = '') => Deno.env.get(k) ?? d;
export const config = {
  port: Number(env('PORT', '8787')),
  appId: env('APP_ID', '6ad00af14909c671e73bb835'),
  publicUrl: env('PUBLIC_URL', 'http://localhost:8787').replace(/\/$/, ''),
  // Internal URL the API uses to call itself (AI gateway etc.)
  selfUrl: env('SELF_URL', 'http://127.0.0.1:' + env('PORT', '8787')),
  databaseUrl: env('DATABASE_URL', 'postgres://cn@127.0.0.1:5544/cn'),
  base44Root: env('BASE44_ROOT', new URL('../../../base44', import.meta.url).pathname),
  filesDir: env('FILES_DIR', '/data/files'),
  authSecret: env('BETTER_AUTH_SECRET'),
  fileSigningSecret: env('FILE_SIGNING_SECRET'),
  internalSecret: env('INTERNAL_SECRET'),
  cronSecret: env('CRON_SECRET'),
  adminEmails: env('ADMIN_EMAILS').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
  // Who may register: "allowlist" (ADMIN_EMAILS + SIGNUP_ALLOWLIST), "open", or "closed".
  signupMode: env('SIGNUP_MODE', 'allowlist'),
  signupAllowlist: env('SIGNUP_ALLOWLIST').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
  // LLM routing: comma-separated Ollama base URLs, tried in order.
  ollamaUrls: env('OLLAMA_URLS', 'http://100.99.98.101:11434,http://100.72.161.48:11434').split(',').map(s => s.trim()).filter(Boolean),
  // Model per Ollama URL (same order). Falls back to the last entry.
  ollamaModels: env('OLLAMA_MODELS', 'qwen3:14b,qwen3:4b').split(',').map(s => s.trim()).filter(Boolean),
  llmTimeoutMs: Number(env('LLM_TIMEOUT_MS', '240000')),
  llmNumCtx: Number(env('LLM_NUM_CTX', '16384')),
  workflowsEnabled: env('WORKFLOWS_ENABLED', 'false') === 'true',
  // URLs that used to be hard-coded *.base44.app hosts.
  appUrl: env('CREATOR_NEXUS_URL', env('PUBLIC_URL', 'http://localhost:8787')),
  transmuterUrl: env('FRAYMUS_TRANSMUTER_URL', 'https://fraymus-transmuter.base44.app'),
};
export function requireSecrets() {
  const missing = ['BETTER_AUTH_SECRET', 'FILE_SIGNING_SECRET', 'INTERNAL_SECRET', 'CRON_SECRET'].filter(k => !Deno.env.get(k) || Deno.env.get(k)!.length < 32);
  if (missing.length) throw new Error('Missing or short secrets (need >=32 chars): ' + missing.join(', '));
}
