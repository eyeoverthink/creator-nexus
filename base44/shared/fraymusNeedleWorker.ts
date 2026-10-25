import {needlePinned,needleDigest,cleanNeedleOutput} from './fraymusNeedleContract.ts';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function handleNeedleWorker(base44,req,a){
 const token=req.headers.get('x-needle-token')||(typeof a.worker_token==='string'?a.worker_token:'');
 if(!/^[a-f0-9]{64}$/.test(token)||typeof a.worker_id!=='string'||a.worker_id.length>80)return reply({error:'Invalid worker credentials.'},401);
 const workers=base44.asServiceRole.entities.NexusNeedleWorker,jobs=base44.asServiceRole.entities.NexusNeedleJob;
 // A 256-bit pairing token is the authentication check, not an app-user session.
 const worker=(await workers.filter({id:a.worker_id,token_hash:await needleDigest(token),status:{$in:['paired','ready']}},{limit:1})).items[0];
 if(!worker)return reply({error:'Worker is not paired or has been revoked.'},401);
 const now=new Date().toISOString(),scope={worker_id:worker.id,owner_id:worker.owner_id,workspace_id:worker.workspace_id};
 if(a.action==='needle_worker_hello'){
  if(!a.attestation||Object.entries(needlePinned).some(([k,v])=>a.attestation[k]!==v)||a.attestation.smoke_passed!==true)return reply({error:'Pinned hashes or native smoke check did not match.'},400);
  const proof={...needlePinned,smoke_passed:true,checked_at:now,verification:'worker-reported; not hardware attestation'};
  await workers.updateMany({id:worker.id,token_hash:worker.token_hash,status:{$in:['paired','ready']}},{$set:{status:'ready',last_seen:now,attestation_json:JSON.stringify(proof)}});
  return reply({ready:true,poll_after_seconds:30});
 }
 if(worker.status!=='ready')return reply({error:'Complete pinned runtime verification first.'},409);
 if(a.action==='needle_worker_poll'){
  if(Date.now()-Date.parse(worker.last_seen)<25000)return reply({job:null,poll_after_seconds:30});
  await workers.update(worker.id,{last_seen:now});
  const queued=await jobs.filter({...scope,status:'queued',expires_at:{$gt:now}},{sort:'created_date',limit:1});
  if(!queued.items.length)return reply({job:null,poll_after_seconds:30});
  const job=queued.items[0],lease=crypto.randomUUID(),expires=new Date(Date.now()+180000).toISOString();
  await jobs.updateMany({...scope,id:job.id,status:'queued'},{$set:{status:'running',lease_id:lease,started_at:now,expires_at:expires}});
  const claimed=await jobs.get(job.id);
  if(claimed.lease_id!==lease||claimed.status!=='running')return reply({job:null,poll_after_seconds:30});
  return reply({job:{id:job.id,nonce:job.nonce,lease_id:lease,input_json:job.input_json,input_sha256:job.input_sha256,expires_at:expires}});
 }
 if(a.action!=='needle_worker_report')return reply({error:'Unknown worker operation.'},400);
 if(typeof a.job_id!=='string'||a.job_id.length>80)return reply({error:'Invalid job identifier.'},400);
 const job=(await jobs.filter({...scope,id:a.job_id},{limit:1})).items[0];
 if(!job||a.nonce!==job.nonce||a.lease_id!==job.lease_id||a.input_sha256!==job.input_sha256)return reply({error:'Receipt does not match the claimed request.'},409);
 if(['completed','failed'].includes(job.status))return reply({accepted:true,duplicate:true});
 if(job.status!=='running'||Date.parse(job.expires_at)<=Date.now())return reply({error:'Claim expired or request was cancelled.'},409);
 let update;
 if(typeof a.error==='string')update={status:'failed',error:a.error.slice(0,1000),finished_at:now};
 else{
  if(typeof a.result_json!=='string'||a.result_json.length>14000||typeof a.output_sha256!=='string'||await needleDigest(a.result_json)!==a.output_sha256)return reply({error:'Output digest or size failed verification.'},400);
  let output;try{output=JSON.parse(a.result_json);const allowed=['type','success','error','function_calls','confidence','prefill_tps','decode_tps','peak_ram_mb'];if(Object.keys(output).some(k=>!allowed.includes(k)))throw new Error('Unapproved output field.');cleanNeedleOutput(output,JSON.parse(job.input_json));}catch(e){return reply({error:e.message},400);}
  const receipt=await needleDigest({job_id:job.id,worker_id:worker.id,nonce:job.nonce,lease_id:job.lease_id,input_sha256:job.input_sha256,output_sha256:a.output_sha256});
  update={status:output.success?'completed':'failed',result_json:a.result_json,receipt_sha256:receipt,finished_at:now,...(!output.success?{error:String(output.error||'Native inference returned success:false.').slice(0,1000)}:{})};
 }
 await jobs.updateMany({...scope,id:job.id,status:'running',lease_id:job.lease_id,expires_at:{$gt:now}},{$set:update});
 await workers.update(worker.id,{last_seen:now});
 return reply({accepted:true});
}