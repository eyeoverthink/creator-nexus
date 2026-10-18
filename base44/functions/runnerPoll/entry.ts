import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { authorizeRunner, readInput, json, runnerId, parseBody, markers, byAge, ID_RE } from '../../shared/runnerBridge.ts';
import { pendingVideos } from '../../shared/runnerVideos.ts';
// Shared-secret webhook for the supplied VPS runner. Append-only NexusEvent operations.

async function pendingAudios(events:any,runner:string,cursor?:string){
 const escaped=runner.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const page=await events.filter({kind:'job.done',body:{$regex:'"job_type"\\s*:\\s*"tts".*"runner_id"\\s*:\\s*"'+escaped+'"'}},{sort:'created_date',limit:50,...(cursor?{cursor}:{})});
 const completed=page.items.map(parseBody).filter((v:any)=>v&&ID_RE.test(v.source_event_id));
 const uploaded=new Set(completed.length?(await markers(events,completed.map((v:any)=>v.source_event_id),['job.audio'])).map((v:any)=>parseBody(v)?.source_event_id):[]);
 return {transfers:completed.filter((v:any)=>!uploaded.has(v.source_event_id)).map((v:any)=>({source_event_id:v.source_event_id,job_id:'job-'+v.source_event_id})),next_cursor:page.next_cursor,has_more:page.has_more};
}

export default async function(req) {
  try {
    const denied = await authorizeRunner(req, 'poll');
    if (denied) return denied;
    const input = await readInput(req, 4096, true);
    if (input.error) return input.error;
    const runner = runnerId(input.value.runner_id);
    const base44 = createClientFromRequest(req);
    const events = base44.asServiceRole.entities.NexusEvent;
    const op = input.value.operation;
    if(op==='transfers')return json(await pendingVideos(events,runner,typeof input.value.cursor==='string'?input.value.cursor:undefined));
    if(op==='audio-transfers')return json(await pendingAudios(events,runner,typeof input.value.cursor==='string'?input.value.cursor:undefined));
    if(typeof op==='string')return json({error:'unknown_operation',operation:op},400);
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
      for (const [key, limit] of [['narration', 5000], ['text', 5000], ['format', 20], ['voice', 40], ['lang', 10], ['style', 40]]) {
        if (typeof job[key] === 'string') payload[key] = job[key].slice(0, limit);
      }
      if (typeof job.speed === 'number') payload.speed = Math.max(0.5, Math.min(2.0, job.speed));
      if (job.test === true) payload.test = true;
      return json({ job_id: `job-${event.id}`, source_event_id: event.id, owner_id: event.owner_id, workspace_id: event.workspace_id, payload });
    }
    return json({ job: null, _v: 'audio-patch-1' });
  } catch {
    console.error('runnerPoll: unexpected error');
    return json({ error: 'internal_error' }, 500);
  }
}