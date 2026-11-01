import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { summarize, buildMessages, cleanOutput, IDEA_SCHEMA } from './ideas.ts';

const json = (o, status = 200) => Response.json(o, { status });
const num = (v, min, max, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (user.role !== 'admin') return json({ error: 'Only the workspace owner (admin) can run the idea finder.' }, 403);
    const body = await req.json().catch(() => ({}));
    const owner = String(user.id), R = base44.entities.IdeaFinderRun;
    const finish = async (run, out) => R.update(run.id, { status: 'completed', ...cleanOutput(out, run), completed_at: new Date().toISOString() });

    if (body.action === 'start') {
      const niche = String(body.niche || '').trim().slice(0, 200);
      if (!niche) return json({ error: 'Describe your niche (who shares your pain).' }, 400);
      const set = { niche, complaints: String(body.complaints || '').trim().slice(0, 4000), price_usd: Math.round(num(body.price_usd, 1, 100000, 500)), buyers: Math.round(num(body.buyers, 1, 10000, 40)), hourly_value: num(body.hourly_value, 0, 10000, 50) };
      const provider = body.provider === 'ollama' ? 'ollama' : 'hosted', web = provider === 'hosted' && body.web_research === true;
      const { items } = await base44.entities.TimeAuditEntry.filter({ owner_id: owner }, { sort: '-slot_date', limit: 400 });
      const audit = summarize(items, set.hourly_value);
      if (!audit.total_hours && !set.complaints) return json({ error: 'Log some time-audit half hours or write your complaints first.' }, 400);
      const messages = buildMessages(set, audit, web);
      const run = await R.create({ owner_id: owner, ...set, provider, model: String(body.model || (provider === 'hosted' ? 'automatic' : '')).slice(0, 160), web_research: web, status: 'running', audit_snapshot: { days: audit.days, total_hours: audit.total_hours, categories: audit.categories, complaint_count: audit.complaints.length } });
      if (provider === 'ollama') return json({ run_id: run.id, messages, schema: IDEA_SCHEMA });
      try {
        const out = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: messages.map((m) => `${m.role.toUpperCase()}:\n${m.content}`).join('\n\n'), response_json_schema: IDEA_SCHEMA, add_context_from_internet: web });
        return json({ run: await finish(run, out) });
      } catch (e) {
        await R.update(run.id, { status: 'failed', error: String(e.message).slice(0, 1000) });
        return json({ error: `Idea finder failed: ${e.message}` }, 502);
      }
    }

    if (body.action === 'complete' || body.action === 'fail') {
      const run = await R.get(String(body.run_id || '')).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!run || run.owner_id !== owner || run.status !== 'running' || run.provider !== 'ollama') return json({ error: 'No running Ollama idea run with that id.' }, 404);
      let err = body.action === 'fail' ? String(body.error || 'Ollama failed') : '';
      if (!err) {
        let out = null;
        try { out = JSON.parse(String(body.output || '')); } catch { err = 'Ollama output was not valid JSON.'; }
        if (!err) { try { return json({ run: await finish(run, out) }); } catch (e) { err = e.message; } }
      }
      await R.update(run.id, { status: 'failed', error: err.slice(0, 1000) });
      return json({ error: err }, 422);
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}