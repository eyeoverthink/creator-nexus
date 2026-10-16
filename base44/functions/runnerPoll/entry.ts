import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { authorizeRunner, readInput, json, runnerId, parseBody, markers, byAge, ID_RE } from '../../shared/runnerBridge.ts';
import {pendingVideos} from '../../shared/runnerVideos.ts';

// Shared-secret webhook for the supplied VPS runner. Append-only NexusEvent operations.
export default async function(req) {
  try {
    const denied = await authorizeRunner(req, 'poll');
    if (denied) return denied;
    const input = await readInput(req, 4096, true);
    if (input.error) return input.error;
    const runner = runnerId(input.value.runner_id);
    const base44 = createClientFromRequest(req);
    const events = base44.asServiceRole.entities.NexusEvent;
    if(input.value.operation==='transfers')return json(await pendingVideos(events,runner,typeof input.value.cursor==='string'?input.value.cursor:undefined));
    const queued = await events.filter({ kind: 'job.queued' }, { sort: '-created_date', limit: 200 });
    const valid = queued.items.filter(event => ID_RE.test(event.id));
    if (!valid.length) return json({ job: null });
    const handled = new Set((await markers(events, valid.map(event => event.id), ['job.claimed', 'job.done', 'job.failed'])).map(event => parseBody(event)?.source_event_id));
    const candidates = valid.filter(event => !handled.has(event.id)).sort(byAge);
    let attempts = 0;
    for (const event of candidates) {
      if (attempts >= 3) break;
      const job = parseBody(event);
      if (!job || typeof job.job_type !== 'string' || !event.owner_id || !event.workspace_id) continue;
      attempts++;
      const claim = await events.create({
        owner_id: event.owner_id, workspace_id: event.workspace_id, agent: 'runner', kind: 'job.claimed',
        message: `Job ${event.id} claimed by ${runner}`,
        body: JSON.stringify({ source_event_id: event.id, runner_id: runner, claimed_at: new Date().toISOString() }),
      });
      const claims = (await markers(events, [event.id], ['job.claimed'])).sort(byAge);
      if (!claims.length || claims[0].id !== claim.id) continue;
      const payload = { job_type: job.job_type };
      for (const [key, limit] of [['narration', 5000], ['format', 20], ['voice', 40]]) {
        if (typeof job[key] === 'string') payload[key] = job[key].slice(0, limit);
      }
      if (job.test === true) payload.test = true;
      return json({ job_id: `job-${event.id}`, source_event_id: event.id, owner_id: event.owner_id, workspace_id: event.workspace_id, payload });
    }
    return json({ job: null });
  } catch {
    console.error('runnerPoll: unexpected error');
    return json({ error: 'internal_error' }, 500);
  }
}