// Small per-instance limiter for tools that spend app credits.
const hits = new Map();
export function allow(key, max, windowMs) {
  const now = Date.now();
  for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  const entry = hits.get(key) || { n: 0, reset: now + windowMs };
  entry.n += 1;
  hits.set(key, entry);
  return entry.n <= max;
}