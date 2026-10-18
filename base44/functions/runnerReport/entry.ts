import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { authorizeRunner, readInput, json, runnerId, ID_RE, markerQuery, cleanResult } from '../../shared/runnerBridge.ts';
import { receiveVideo } from '../../shared/runnerVideos.ts';
const MAX_AUDIO=10*1024*1024;
async function receiveAudio(req:any,base44:any){
 const reader=req.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
 if(!reader)return json({error:'missing_audio'},400);
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>MAX_AUDIO+65536){await reader.cancel();return json({error:'audio_exceeds_10_MB'},413);}chunks.push(part.value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 const form=await new Response(bytes,{headers:{'Content-Type':req.headers.get('content-type')}}).formData();
 const sourceId=form.get('source_event_id') as string,file=form.get('file') as File;
 if(typeof sourceId!=='string'||!ID_RE.test(sourceId))return json({error:'invalid_source_event_id'},400);
 if(!(file instanceof File)||file.size<44||file.size>MAX_AUDIO)return json({error:'WAV_required_max_10_MB'},400);
 const signature=new Uint8Array(await file.slice(0,4).arrayBuffer());
 if(String.fromCharCode(...signature)!=='RIFF')return json({error:'invalid_WAV'},400);
 const events=base44.asServiceRole.entities.NexusEvent;
 const source=(await events.filter({id:sourceId,kind:'job.queued'},{limit:1,fields:['owner_id','workspace_id']})).items[0];
 if(!source)return json({error:'source_not_found'},404);
 const existing=(await events.filter({kind:'job.audio',body:{$regex:'"source_event_id"\\s*:\\s*"'+sourceId+'"'}},{limit:1,fields:['body']})).items[0];
 if(existing)return json({ok:true,already_uploaded:true});
 const done=(await events.filter({kind:'job.done',body:{$regex:'"source_event_id"\\s*:\\s*"'+sourceId+'"'},owner_id:source.owner_id,workspace_id:source.workspace_id},{limit:1,fields:['body']})).items[0];
 if(!done)return json({error:'tts_not_completed'},409);
 const {file_uri}=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:new File([file],'job-'+sourceId+'.wav',{type:'audio/wav'})});
 const bodyParsed=typeof done.body==='string'?JSON.parse(done.body):done.body;
 await events.create({owner_id:source.owner_id,workspace_id:source.workspace_id,agent:'runner',kind:'job.audio',message:'TTS audio transferred',body:JSON.stringify({source_event_id:sourceId,runner_id:bodyParsed?.runner_id,file_uri,file_name:'job-'+sourceId+'.wav',file_size_bytes:file.size,transferred_at:new Date().toISOString()})});
 return json({ok:true,file_uri});
}

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