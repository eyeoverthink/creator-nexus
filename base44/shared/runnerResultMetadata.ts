// Bounded, display-only metadata. Never accept plans, image files, prompts or credentials.
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const text = (value, max) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\b(?:Bearer\s+\S+|(?:sk|hf|ghp)[_-][A-Za-z0-9_-]{12,})/gi, '[redacted]').replace(/((?:api[_ -]?key|authorization|secret|token)\s*[:=]\s*)\S+/gi, '$1[redacted]').trim().slice(0, max) : '';
const lines = (value, count, max) => Array.isArray(value) ? value.slice(0, count).map(item => text(item, max)).filter(Boolean) : [];
const seconds = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 900;
export function cleanVideoProduction(result) {
  const out = {};
  const credits = lines(result?.credits, 12, 240);
  if (credits.length) out.credits = credits;
  const director = result?.director;
  if (!object(director)) return out;
  const clean = {};
  for (const key of ['model', 'status']) {
    const label = text(director[key], 80);
    if (label) clean[key] = label;
  }
  for (const key of ['enabled', 'fallback']) if (typeof director[key] === 'boolean') clean[key] = director[key];
  const reason = text(director.fallback_reason ?? director.reason, 240);
  if (reason) clean.fallback_reason = reason;
  if (seconds(director.seconds)) clean.seconds = director.seconds;
  if (Number.isInteger(director.attempts) && director.attempts >= 0 && director.attempts <= 3) clean.attempt_count = director.attempts;
  if (Array.isArray(director.attempts)) {
    clean.attempts = director.attempts.slice(0, 3).map(attempt => {
      const entry = {};
      if (object(attempt)) {
        const errors = lines(attempt.errors, 6, 160);
        if (errors.length) entry.errors = errors;
        if (seconds(attempt.seconds)) entry.seconds = attempt.seconds;
      }
      return entry;
    });
    clean.attempt_count = clean.attempts.length;
  }
  const repairs = lines(director.repairs, 8, 120);
  if (repairs.length) clean.repairs = repairs;
  if (Object.keys(clean).length) out.director = clean;
  return out;
}