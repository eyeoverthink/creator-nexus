import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {authorizeRunner,readInput,json,parseBody,markers,byAge,runnerId} from '../../shared/runnerBridge.ts';

const MAX_FILE_BYTES=25*1024*1024;
const MIN_FILE_BYTES=1000;
const JOB_RE=/^job-([A-Za-z0-9_-]{6,64})$/;
const SHA_RE=/^[0-9a-f]{64}$/;
const hex=buffer=>Array.from(new Uint8Array(buffer),byte=>byte.toString(16).padStart(2,'0')).join('');

// Restrict the lookup to this job, not a moving window of unrelated uploads.
async function findVideo(events,sourceId){
 const rows=await markers(events,[sourceId],['job.video']);
 return rows.map(ev=>({ev,body:parseBody(ev)})).filter(row=>row.body?.source_event_id===sourceId&&typeof row.body.video_url==='string'&&row.body.video_url.startsWith('https://')).sort((a,b)=>byAge(a.ev,b.ev))[0]||null;
}

// Runner-only, append-only webhook. No login, updates, deletes or publishing.
export default async function(req){
 try{
  const denied=await authorizeRunner(req,'videoUpload');if(denied)return denied;
  const declared=Number(req.headers.get('content-length')||0);
  if(declared>MAX_FILE_BYTES+100000)return json({error:'request_too_large'},413);
  const ctype=(req.headers.get('content-type')||'').toLowerCase();
  const isJson=ctype.startsWith('application/json'),isForm=ctype.startsWith('multipart/form-data');
  if(!isJson&&!isForm)return json({error:'unsupported_content_type'},415);
  let action='check',jobId,shaGiven='',file=null,runner='runner';
  if(isJson){
   const input=await readInput(req,2000);if(input.error)return input.error;
   if(input.value.action!=='check')return json({error:'unknown_action'},400);
   jobId=input.value.job_id;
  }else{
   action='upload';let size=0,tooLarge=false,form;
   if(!req.body)return json({error:'invalid_form'},400);
   const bounded=req.body.pipeThrough(new TransformStream({transform(chunk,controller){size+=chunk.byteLength;if(size>MAX_FILE_BYTES+100000){tooLarge=true;throw new RangeError('request_too_large');}controller.enqueue(chunk);}}));
   try{form=await new Response(bounded,{headers:{'Content-Type':req.headers.get('content-type')}}).formData();}
   catch{return json({error:tooLarge?'request_too_large':'invalid_form'},tooLarge?413:400);}
   jobId=form.get('job_id');shaGiven=String(form.get('sha256')||'').toLowerCase();runner=runnerId(form.get('runner_id'));
   const uploaded=form.get('file');if(uploaded&&typeof uploaded==='object'&&typeof uploaded.arrayBuffer==='function')file=uploaded;
  }
  const match=typeof jobId==='string'?JOB_RE.exec(jobId):null;
  if(!match)return json({error:'invalid_job_id'},400);
  const sourceId=match[1],base44=createClientFromRequest(req),events=base44.asServiceRole.entities.NexusEvent;
  let source;
  try{source=(await events.filter({id:sourceId,kind:'job.queued'},{limit:1,fields:['owner_id','workspace_id']})).items[0];}
  catch{return json({error:'job_not_found'},404);}
  if(!source)return json({error:'job_not_found'},404);
  const existing=await findVideo(events,sourceId);
  if(action==='check')return existing?json({ok:true,exists:true,video_url:existing.body.video_url,sha256:existing.body.sha256??null,size_bytes:existing.body.size_bytes??null}):json({ok:true,exists:false});
  if(!file)return json({error:'file_missing'},400);
  if(!SHA_RE.test(shaGiven))return json({error:'invalid_sha256'},400);
  if(file.size>MAX_FILE_BYTES)return json({error:'file_too_large'},413);
  if(file.size<MIN_FILE_BYTES)return json({error:'file_too_small'},400);
  if(existing)return existing.body.sha256===shaGiven?json({ok:true,deduped:true,video_url:existing.body.video_url}):json({error:'already_has_different_video',video_url:existing.body.video_url},409);
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(bytes.length!==file.size||bytes.length>MAX_FILE_BYTES)return json({error:'bad_size'},400);
  if(bytes.length<=12||String.fromCharCode(...bytes.slice(4,8))!=='ftyp')return json({error:'not_an_mp4'},400);
  const shaActual=hex(await crypto.subtle.digest('SHA-256',bytes));
  if(shaActual!==shaGiven)return json({error:'sha256_mismatch'},400);
  let videoUrl;
  try{
   const uploaded=await base44.asServiceRole.integrations.Core.UploadPublicFile({file:new File([bytes],jobId+'.mp4',{type:'video/mp4'})});
   videoUrl=uploaded?.file_url;
  }catch{console.error('videoUpload: storage failed');return json({error:'storage_failed'},502);}
  if(typeof videoUrl!=='string'||!videoUrl.startsWith('https://')||videoUrl.length>1000)return json({error:'storage_failed'},502);
  const body=JSON.stringify({source_event_id:sourceId,job_id:jobId,video_url:videoUrl,sha256:shaActual,size_bytes:bytes.length,content_type:'video/mp4',runner_id:runner,uploaded_at:new Date().toISOString()});
  if(body.length>=20000)return json({error:'result_too_large'},413);
  const created=await events.create({owner_id:source.owner_id,workspace_id:source.workspace_id,agent:'runner',kind:'job.video',message:'Video for '+jobId+' saved',body});
  // Separate workers can race: the earliest event is authoritative. Nothing is overwritten.
  const winner=await findVideo(events,sourceId);
  if(winner&&winner.ev.id!==created.id){
   if(winner.body.sha256!==shaActual)return json({error:'already_has_different_video',video_url:winner.body.video_url},409);
   return json({ok:true,deduped:true,race:true,video_url:winner.body.video_url});
  }
  return json({ok:true,deduped:false,video_url:videoUrl,event_id:created.id});
 }catch{console.error('videoUpload: unexpected error');return json({error:'internal_error'},500);}
}