import { CAPABILITIES, KIND_CAPABILITY } from './roster.ts';
import { capabilityStatus, readCalendar, sha256, validatePayload } from './execute.ts';

export const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    done: { type: 'array', items: { type: 'string' } },
    metric: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } }, required: ['label', 'value'] },
    blockers: { type: 'array', items: { type: 'string' } },
    drafts: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, kind: { type: 'string' }, body: { type: 'string' } }, required: ['title', 'body'] } },
    proposed_actions: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['message', 'delete', 'spend', 'booking', 'publish'] }, title: { type: 'string' }, payload: { type: 'object' } }, required: ['kind', 'title', 'payload'] } },
    memory_notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'done', 'metric', 'blockers', 'drafts', 'proposed_actions', 'memory_notes'],
};

export async function prepareRun(base44, agent, outcome, context) {
  const caps = await capabilityStatus(base44);
  const tools = (agent.tools || []).filter((t) => CAPABILITIES[t]);
  const calendar = tools.includes('calendar_read') && caps.calendar_read === 'available' ? await readCalendar(base44) : null;
  const toolLines = tools.map((t) => `- ${t}: ${CAPABILITIES[t]} [${caps[t]}]`).join('\n');
  const system = `You are my ${agent.name}. You are a document that executes outcomes, not a chatbot.
ROLE: ${agent.role}
STANDING OUTCOME: ${agent.outcome}
RULES (never break):\n${(agent.rules || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}
TOOLS (only these exist):\n${toolLines}
DEFINITION OF DONE: ${agent.definition_of_done}
VOICE: ${agent.voice}

You cannot execute anything yourself. You can only produce drafts and PROPOSE actions. Proposed action payloads:
- booking: {summary, description, start_iso, end_iso} (ISO 8601 with timezone)
- delete: {event_id, summary} (event_id must come from the calendar list)
- message: {to, subject, body}
- spend: {amount_usd, purpose}
- publish: {platform, text}
Only propose kinds whose tool is listed. "done" lists only what you produced in this response (drafts written, analysis made) - never claim something was sent, booked, published or paid. Put anything needing human input or missing integrations in "blockers". memory_notes: short durable facts worth remembering. Revenue and time figures are goals, not guarantees. Reply as JSON only.`;
  const user = `MEMORY:\n${agent.memory || '(empty)'}\n\nCALENDAR (next 3 days): ${calendar ? JSON.stringify(calendar) : 'not available'}\nNOW: ${new Date().toISOString()}\n\nRUN OUTCOME: ${outcome}\nCONTEXT: ${context || '(none)'}`;
  return { caps, calendarRead: !!calendar, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] };
}

const str = (v, n) => String(v ?? '').slice(0, n);

export async function completeRun(base44, ownerId, agent, run, out, caps, audit) {
  if (!out || typeof out !== 'object' || !Array.isArray(out.done)) throw new Error('Model did not return the required DONE structure.');
  const tools = agent.tools || [];
  const drafts = (Array.isArray(out.drafts) ? out.drafts : []).slice(0, 15).filter((d) => d?.title && d?.body);
  const savedDrafts = drafts.length ? await base44.entities.StarterAgentDraft.bulkCreate(drafts.map((d) => ({ owner_id: ownerId, agent_key: agent.agent_key, run_id: run.id, title: str(d.title, 200), kind: str(d.kind || 'draft', 40), body: str(d.body, 12000) }))) : [];
  const actions = [];
  for (const a of (Array.isArray(out.proposed_actions) ? out.proposed_actions : []).slice(0, 10)) {
    const cap = KIND_CAPABILITY[a?.kind];
    if (!cap || !a.payload || typeof a.payload !== 'object') continue;
    const invalid = validatePayload(a.kind, a.payload);
    const reason = !tools.includes(cap) ? `Tool ${cap} is not enabled for this agent.` : invalid || (caps[cap] !== 'available' ? `${CAPABILITIES[cap]}. Kept as a draft; cannot execute.` : '');
    actions.push({ owner_id: ownerId, agent_key: agent.agent_key, run_id: run.id, kind: a.kind, capability: cap, title: str(a.title, 200), payload: a.payload, payload_sha256: await sha256(a.payload), status: reason ? 'blocked' : 'pending', blocked_reason: reason });
  }
  const savedActions = actions.length ? await base44.entities.StarterAgentAction.bulkCreate(actions) : [];
  const pending = actions.filter((a) => a.status === 'pending').length, blocked = actions.length - pending;
  const notes = (Array.isArray(out.memory_notes) ? out.memory_notes : []).slice(0, 8).map((n) => str(n, 300)).filter(Boolean);
  if (notes.length) {
    const memory = `${agent.memory || ''}\n[${new Date().toISOString().slice(0, 10)}] ${notes.join(' | ')}`.trim().slice(-12000);
    await base44.entities.StarterAgent.update(agent.id, { memory });
  }
  const done = [...out.done.slice(0, 10).map((d) => str(d, 300)), `System: saved ${savedDrafts.length} draft(s), queued ${pending} approval(s), ${blocked} blocked, ${notes.length} memory note(s).`];
  const blockers = [...(Array.isArray(out.blockers) ? out.blockers : []).slice(0, 10).map((b) => str(b, 300)), ...actions.filter((a) => a.status === 'blocked').map((a) => `${a.title}: ${a.blocked_reason}`)];
  const updated = await base44.entities.StarterAgentRun.update(run.id, { status: 'completed', summary: str(out.summary, 2000), done, metric: { label: str(out.metric?.label, 80), value: str(out.metric?.value, 80) }, blockers, draft_count: savedDrafts.length, action_count: actions.length, completed_at: new Date().toISOString() });
  await audit('run_completed', `${savedDrafts.length} drafts, ${pending} pending approvals, ${blocked} blocked`, run.id);
  return { run: updated, drafts: savedDrafts.length, actions: savedActions.length };
}