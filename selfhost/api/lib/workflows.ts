// Base44 workflows. Scheduled ones are triggered by systemd timers -> POST /internal/workflows/<name>.
// TODO(selfhost): entity/connector triggers (jq-style conditions, waits) are listed but not executed yet.
import { config } from './config.ts';
import { parseJsonc } from './jsonc.ts';
import { q, q1 } from './db.ts';
import { toRecord } from './entities.ts';
import { runFunction } from './functions.ts';

export type Workflow = { file: string; name: string; trigger: string; cron?: string; steps: { function_name: string; args: any }[]; raw: any };
const all = new Map<string, Workflow>();
export async function loadWorkflows() {
  for await (const f of Deno.readDir(config.base44Root + '/workflows')) {
    if (!f.name.endsWith('.jsonc')) continue;
    const raw = parseJsonc(await Deno.readTextFile(`${config.base44Root}/workflows/${f.name}`));
    const key = f.name.replace(/\.jsonc$/, '');
    const steps = (raw.definition?.do || []).map((s: any) => Object.values(s)[0] as any).filter((s: any) => s?.call === 'invoke_backend_function').map((s: any) => ({ function_name: s.with.function_name, args: s.with.args || {} }));
    all.set(key, { file: f.name, name: raw.name, trigger: raw.trigger?.config?.trigger_type, cron: raw.trigger?.config?.cron_expression || undefined, steps, raw });
  }
  return [...all.values()];
}
export const workflows = () => [...all.entries()].map(([k, w]) => ({ key: k, name: w.name, trigger: w.trigger, cron: w.cron, steps: w.steps.map(s => s.function_name) }));
export async function runWorkflow(key: string) {
  const w = all.get(key);
  if (!w) return { status: 404, body: { error: 'Unknown workflow' } };
  if (w.trigger !== 'scheduled') return { status: 400, body: { error: 'Only scheduled workflows can be run by the timer (entity triggers are TODO).' } };
  if (!config.workflowsEnabled) return { status: 409, body: { error: 'Workflows are disabled (WORKFLOWS_ENABLED=false).' } };
  const owner = config.adminEmails[0] ? await q1(`SELECT * FROM ent."User" WHERE lower(data->>'email') = $1`, [config.adminEmails[0]]) : null;
  const user = owner ? toRecord(owner) : null;
  const run = await q1(`INSERT INTO sh.workflow_runs (workflow) VALUES ($1) RETURNING id`, [key]);
  const results: any[] = [];
  let ok = true;
  for (const s of w.steps) {
    if (JSON.stringify(s.args).includes('${')) { results.push({ function: s.function_name, skipped: 'templated args need a trigger payload' }); continue; }
    const req = new Request(`${config.publicUrl}/functions/${s.function_name}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-selfhost-workflow': key }, body: JSON.stringify(s.args) });
    const res = await runFunction(s.function_name, req, { user, token: null });
    const text = await res.text();
    results.push({ function: s.function_name, status: res.status, body: text.slice(0, 2000) });
    if (!res.ok) { ok = false; break; }
  }
  await q(`UPDATE sh.workflow_runs SET finished_at = now(), ok = $2, detail = $3::jsonb WHERE id = $1`, [run.id, ok, JSON.stringify(results)]);
  return { status: ok ? 200 : 500, body: { workflow: key, ok, results } };
}
