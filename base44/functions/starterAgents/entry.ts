import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ROSTER, CAPABILITIES } from './roster.ts';
import { capabilityStatus, executeAction, sha256 } from './execute.ts';
import { prepareRun, completeRun, OUTPUT_SCHEMA } from './run.ts';

const json = (o, status = 200) => Response.json(o, { status });
const EDITABLE = ['outcome', 'role', 'rules', 'tools', 'memory', 'definition_of_done', 'voice'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (user.role !== 'admin') return json({ error: 'Only the workspace owner (admin) can operate agents.' }, 403);
    const body = await req.json().catch(() => ({}));
    const owner = String(user.id), E = base44.entities;
    const audit = (event, detail, run_id = '', action_id = '', agent_key = body.agent_key || '') =>
      E.StarterAgentAudit.create({ owner_id: owner, agent_key, run_id, action_id, event, detail: String(detail).slice(0, 2000) });
    const getAgent = async () => (await E.StarterAgent.filter({ owner_id: owner, agent_key: String(body.agent_key || '') }))[0] || null;

    if (body.action === 'bootstrap') {
      const existing = await E.StarterAgent.filter({ owner_id: owner });
      const have = new Set(existing.map((a) => a.agent_key));
      const missing = ROSTER.filter((r) => !have.has(r.agent_key));
      if (missing.length) await E.StarterAgent.bulkCreate(missing.map((r) => ({ ...r, owner_id: owner, memory: '' })));
      return json({ agents: await E.StarterAgent.filter({ owner_id: owner }), capabilities: await capabilityStatus(base44), catalog: CAPABILITIES });
    }

    if (body.action === 'save_agent') {
      const agent = await getAgent();
      if (!agent) return json({ error: 'Agent not found' }, 404);
      const patch = {};
      for (const k of EDITABLE) if (k in (body.patch || {})) patch[k] = body.patch[k];
      if (patch.rules) patch.rules = patch.rules.map(String).filter(Boolean).slice(0, 20);
      if (patch.tools) patch.tools = patch.tools.filter((t) => CAPABILITIES[t]);
      const saved = await E.StarterAgent.update(agent.id, patch);
      await audit('agent_edited', `Updated: ${Object.keys(patch).join(', ')}`);
      return json({ agent: saved });
    }

    if (body.action === 'start_run') {
      const agent = await getAgent();
      if (!agent) return json({ error: 'Agent not found' }, 404);
      const outcome = String(body.outcome || '').trim().slice(0, 1000);
      if (!outcome) return json({ error: 'Describe the outcome for this run.' }, 400);
      const provider = body.provider === 'ollama' ? 'ollama' : 'hosted';
      const prep = await prepareRun(base44, agent, outcome, String(body.context || '').slice(0, 6000));
      const run = await E.StarterAgentRun.create({ owner_id: owner, agent_key: agent.agent_key, outcome, context: String(body.context || '').slice(0, 6000), provider, model: String(body.model || (provider === 'hosted' ? 'automatic' : '')).slice(0, 160), status: 'running', capabilities: { ...prep.caps, calendar_read_used: prep.calendarRead } });
      await audit('run_started', `${provider} · ${outcome.slice(0, 200)}${prep.calendarRead ? ' · read calendar' : ''}`, run.id);
      if (provider === 'ollama') return json({ run_id: run.id, messages: prep.messages, schema: OUTPUT_SCHEMA });
      try {
        const out = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: prep.messages.map((m) => `${m.role.toUpperCase()}:\n${m.content}`).join('\n\n'), response_json_schema: OUTPUT_SCHEMA });
        return json(await completeRun(base44, owner, agent, run, out, prep.caps, audit));
      } catch (e) {
        await E.StarterAgentRun.update(run.id, { status: 'failed', error: String(e.message).slice(0, 1000) });
        await audit('run_failed', e.message, run.id);
        return json({ error: `Run failed: ${e.message}` }, 502);
      }
    }

    if (body.action === 'complete_run' || body.action === 'fail_run') {
      const run = await E.StarterAgentRun.get(String(body.run_id || '')).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!run || run.owner_id !== owner || run.status !== 'running' || run.provider !== 'ollama') return json({ error: 'No running Ollama run with that id.' }, 404);
      body.agent_key = run.agent_key;
      const agent = await getAgent();
      let out = null, err = body.action === 'fail_run' ? String(body.error || 'Ollama failed') : '';
      if (!err) { try { out = JSON.parse(String(body.output || '')); } catch { err = 'Ollama output was not valid JSON.'; } }
      if (!err) { try { return json(await completeRun(base44, owner, agent, run, out, run.capabilities || {}, audit)); } catch (e) { err = e.message; } }
      await E.StarterAgentRun.update(run.id, { status: 'failed', error: err.slice(0, 1000) });
      await audit('run_failed', err, run.id);
      return json({ error: err }, 422);
    }

    if (body.action === 'decide') {
      const act = await E.StarterAgentAction.get(String(body.action_id || '')).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!act || act.owner_id !== owner) return json({ error: 'Action not found' }, 404);
      if (act.status !== 'pending') return json({ error: `Action is ${act.status}; only pending actions can be decided.` }, 409);
      const now = new Date().toISOString();
      if (body.decision === 'reject') {
        const r = await E.StarterAgentAction.update(act.id, { status: 'rejected', decided_at: now });
        await audit('action_rejected', act.title, act.run_id, act.id, act.agent_key);
        return json({ action: r });
      }
      if (body.decision !== 'approve') return json({ error: 'decision must be approve or reject' }, 400);
      const hash = await sha256(act.payload);
      if (body.payload_sha256 !== act.payload_sha256 || hash !== act.payload_sha256) return json({ error: 'Approval does not match the exact stored payload.' }, 409);
      await audit('action_approved', `${act.title} · sha256 ${hash.slice(0, 12)}`, act.run_id, act.id, act.agent_key);
      const caps = await capabilityStatus(base44);
      if (caps[act.capability] !== 'available') {
        const r = await E.StarterAgentAction.update(act.id, { status: 'blocked', decided_at: now, blocked_reason: 'Integration no longer available.' });
        await audit('action_blocked', act.title, act.run_id, act.id, act.agent_key);
        return json({ action: r });
      }
      const result = await executeAction(base44, act);
      const r = await E.StarterAgentAction.update(act.id, { status: result.ok ? 'executed' : 'failed', decided_at: now, result });
      await audit(result.ok ? 'action_executed' : 'action_failed', `${act.title} · ${JSON.stringify(result).slice(0, 400)}`, act.run_id, act.id, act.agent_key);
      return json({ action: r });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}