// Replacement for the Base44 "base44:runtime" module. Secrets come from the process environment.
export const secrets = {
  get(name: string): string | undefined { return Deno.env.get(name) ?? undefined; },
  async getAsync(name: string) { return Deno.env.get(name) ?? undefined; },
};
const pending = new Set<Promise<unknown>>();
export function waitUntil(p: Promise<unknown>) {
  const w = Promise.resolve(p).catch(e => console.error('waitUntil task failed:', e?.message || e)).finally(() => pending.delete(w));
  pending.add(w);
}
