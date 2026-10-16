import {ID_RE,json,markerQuery,parseBody,markers} from './runnerBridge.ts';
const MAX_VIDEO=50*1024*1024;
export async function pendingVideos(events,runner,cursor){
 const escaped=runner.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const page=await events.filter({kind:'job.done',body:{$regex:'"runner_id"\\s*:\\s*"'+escaped+'"'}},{sort:'created_date',limit:50,...(cursor?{cursor}:{})});
 const completed=page.items.map(parseBody).filter(v=>v&&ID_RE.test(v.source_event_id));
 const uploaded=new Set(completed.length?(await markers(events,completed.map(v=>v.source_event_id),['job.video'])).map(v=>parseBody(v)?.source_event_id):[]);
 return {transfers:completed.filter(v=>!uploaded.has(v.source_event_id)).map(v=>({source_event_id:v.source_event_id,job_id:'job-'+v.source_event_id})),next_cursor:page.next_cursor,has_more:page.has_more};
}
export async function receiveVideo(req,base44){
 const reader=req.body?.getReader(),chunks=[];let size=0;
 if(!reader)return json({error:'missing_video'},400);
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>MAX_VIDEO+65536){await reader.cancel();return json({error:'video_exceeds_50_MB'},413);}chunks.push(part.value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 const form=await new Response(bytes,{headers:{'Content-Type':req.headers.get('content-type')}}).formData();
 const sourceId=form.get('source_event_id'),file=form.get('file');
 if(typeof sourceId!=='string'||!ID_RE.test(sourceId))return json({error:'invalid_source_event_id'},400);
 if(!(file instanceof File)||file.size<12||file.size>MAX_VIDEO||file.type!=='video/mp4')return json({error:'MP4_required_max_50_MB'},400);
 const signature=new Uint8Array(await file.slice(0,12).arrayBuffer());
 if(String.fromCharCode(...signature.slice(4,8))!=='ftyp')return json({error:'invalid_MP4'},400);
 const events=base44.asServiceRole.entities.NexusEvent;
 const source=(await events.filter({id:sourceId,kind:'job.queued'},{limit:1,fields:['owner_id','workspace_id']})).items[0];
 if(!source)return json({error:'source_not_found'},404);
 const existing=(await events.filter(markerQuery([sourceId],['job.video']),{limit:1,fields:['body']})).items[0];
 if(existing)return json({ok:true,already_uploaded:true});
 const done=(await events.filter({...markerQuery([sourceId],['job.done']),owner_id:source.owner_id,workspace_id:source.workspace_id},{limit:1,fields:['body']})).items[0];
 if(!done)return json({error:'render_not_completed'},409);
 const {file_uri}=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:new File([file],'job-'+sourceId+'.mp4',{type:'video/mp4'})});
 await events.create({owner_id:source.owner_id,workspace_id:source.workspace_id,agent:'runner',kind:'job.video',message:'Rendered video transferred to Spark',body:JSON.stringify({source_event_id:sourceId,runner_id:parseBody(done)?.runner_id,file_uri,file_name:'job-'+sourceId+'.mp4',file_size_bytes:file.size,transferred_at:new Date().toISOString()})});
 return json({ok:true});
}