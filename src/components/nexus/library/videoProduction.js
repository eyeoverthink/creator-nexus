// Treat historical event bodies as untrusted, even when no new report was involved.
export default function videoProduction(upload, completion) {
 const director = completion?.director ?? upload?.director;
 const credits = completion?.credits ?? upload?.credits;
 const report = director && typeof director === 'object' && !Array.isArray(director) ? director : null;
 return {
  credits: Array.isArray(credits) ? credits.filter(line => typeof line === 'string' && line.trim()).slice(0, 12).map(line => line.slice(0, 240)) : [],
  director: report ? {
   model: typeof report.model === 'string' ? report.model.slice(0, 80) : '',
   status: typeof report.status === 'string' ? report.status.slice(0, 80) : '',
   enabled: typeof report.enabled === 'boolean' ? report.enabled : undefined,
   fallback: typeof report.fallback === 'boolean' ? report.fallback : undefined,
   reason: typeof report.fallback_reason === 'string' ? report.fallback_reason.slice(0, 240) : '',
   seconds: typeof report.seconds === 'number' && Number.isFinite(report.seconds) && report.seconds >= 0 && report.seconds <= 900 ? report.seconds : null,
   attempts: Number.isInteger(report.attempt_count) && report.attempt_count >= 0 && report.attempt_count <= 3 ? report.attempt_count : Array.isArray(report.attempts) ? Math.min(report.attempts.length, 3) : null,
   repairs: Array.isArray(report.repairs) ? report.repairs.filter(item => typeof item === 'string').slice(0, 8).map(item => item.slice(0, 120)) : [],
   errors: Array.isArray(report.attempts) ? report.attempts.slice(0, 3).flatMap((attempt, index) => Array.isArray(attempt?.errors) ? attempt.errors.filter(item => typeof item === 'string').slice(0, 6).map(message => ({attempt: index + 1, message: message.slice(0, 160)})) : []) : [],
  } : null,
 };
}