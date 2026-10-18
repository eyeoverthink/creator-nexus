import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { authorizeRunner, readInput, json, runnerId, ID_RE, markerQuery, cleanResult } from '../../shared/runnerBridge.ts';
import {receiveVideo} from '../../shared/runnerVideos.ts';
import {receiveAudio} from '../../shared/runnerAudio.ts';

// Shared-secret webhook for completion reports from the supplied VPS runner.
export default async function(req) {
  try {
    const denied = await authorizeRunner(req, 'report');
    if (denied) return denied;
    if((req.headers.get('content-type')||'').toLowerCase().startsWith('multipart/form-data')){const c=createClientFromRequest(req);return(req.headers.get('x-media-type')||'').toLowerCase()==='audio'?await receiveAudio(req,c):await receiveVideo(req,c);}
    const parsed = await readInput(req, 30000);
    if (parsed.error) return parsed.error;
    const input = parsed.value;
    const sourceId = input.source_event_id;
    if (typeof sourceId !== 'string' || !ID_RE.test(sourceId)) return json({ error: 'invalid_source_event_id' }, 400);
    if (typeof input.ok !== 'boolean') return json({ error: 'ok_must_be_boolean' }, 400);
    const result = input.result ?? {};
    if (typeof result !== 'object' || Array.isArray(result)) return json({ error: 'result_must_be_object' }, 400);
    const base44 = createClientFromRequest(req);
    const events = base44.asServiceRole.entities.NexusEvent;
    const sourcePage = await events.filter({ id: sourceId, kind: 'job.queued' }, { limit: 1, fields: ['owner_id', 'workspace_id'] });
    const source = sourcePage.items[0];
    if (!source) return json({ error: 'source_not_found' }, 404);
    if (input.owner_id != null && input.owner_id !== source.owner_id) return json({ error: 'owner_mismatch' }, 400);
    if (input.workspace_id != null && input.workspace_id !== source.workspace_id) return json({ error: 'workspace_mismatch' }, 400);
    const existing = await events.count(markerQuery([sourceId], ['job.done', 'job.failed']));
    if (existing) return json({ error: 'already_reported' }, 409);
    const cleaned = cleanResult(result);
    const jobId = typeof cleaned.job_id === 'string' ? cleaned.job_id : `job-${sourceId}`;
    const body = JSON.stringify({ source_event_id: sourceId, job_id: jobId, ok: input.ok, runner_id: runnerId(input.runner_id), reported_at: new Date().toISOString(), ...cleaned });
    if (body.length >= 20000) return json({ error: 'result_too_large' }, 413);
    const kind = input.ok ? 'job.done' : 'job.failed';
    const created = await events.create({
      owner_id: source.owner_id, workspace_id: source.workspace_id, agent: 'runner', kind,
      message: `Job ${jobId} ${input.ok ? 'done' : 'failed'}`, body,
    });
    return json({ ok: true, kind, event_id: created.id });
  } catch {
    console.error('runnerReport: unexpected error');
    return json({ error: 'internal_error' }, 500);
  }
}