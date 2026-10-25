import {needlePinned,needleDigest,needleInput,validateNeedleSchema,canonicalNeedle} from './fraymusNeedleContract.ts';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function handleNeedleUser(base44,user,a){
 if(!['needle_status','needle_pair','needle_revoke','needle_enqueue','needle_cancel'].includes(a.action))return reply({error:'Unknown Needle operation.'},400);
 if(a.workspace_id!==undefined&&(typeof a.workspace_id!=='string'||a.workspace_id.length>80))return reply({error:'Invalid workspace.'},400);
 const workspace=(await base44.entities.NexusWorkspace.filter({owner_id:user.id,...(a.workspace_id?{id:a.workspace_id}:{})},{sort:'created_date',limit:1})).items[0];
 if(!workspace)return reply({error:'Create or select your own workspace first.'},404);
 const scope={owner_id:user.id,workspace_id:workspace.id};
 // Service writes protect credentials, claims and receipts from direct client fabrication.
 // Scope has been authenticated against the workspace owner above.
 const workers=base44.asServiceRole.entities.NexusNeedleWorker,jobs=base44.asServiceRole.entities.NexusNeedleJob,now=new Date().toISOString();
 if(a.action==='needle_pair'){
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
  await workers.updateMany({...scope,status:{$in:['paired','ready']}},{$set:{status:'revoked'}});
  await jobs.updateMany({...scope,status:{$in:['queued','running']}},{$set:{status:'cancelled',finished_at:now,error:'Worker pairing replaced.'}});
  const worker=await workers.create({...scope,status:'paired',token_hash:await needleDigest(token)});
  return reply({worker_id:worker.id,token,workspace_id:workspace.id,pinned:needlePinned});
 }
 if(a.action==='needle_revoke'){
  await workers.updateMany({...scope,status:{$in:['paired','ready']}},{$set:{status:'revoked'}});
  await jobs.updateMany({...scope,status:{$in:['queued','running']}},{$set:{status:'cancelled',finished_at:now,error:'Worker pairing revoked.'}});
  return reply({revoked:true});
 }
 if(a.action==='needle_cancel'){
  if(typeof a.job_id!=='string'||a.job_id.length>80)return reply({error:'Invalid request.'},400);
  await jobs.updateMany({...scope,id:a.job_id,status:{$in:['queued','running']}},{$set:{status:'cancelled',finished_at:now}});
  return reply({cancelled:true});
 }
 if(a.action==='needle_enqueue'){
  const parsed=needleInput.safeParse(a.input);if(!parsed.success)return reply({error:parsed.error.issues.map(i=>i.message).join('; ')},400);
  const input=parsed.data;
  try{if(new Set(input.tools.map(t=>t.name)).size!==input.tools.length)throw new Error('Tool names must be unique.');input.tools.forEach(t=>{if(t.parameters.type!=='object')throw new Error('Tool parameters must be an object.');validateNeedleSchema(t.parameters);});}catch(e){return reply({error:e.message},400);}
  const raw=canonicalNeedle(input);if(raw.length>12000)return reply({error:'Request exceeds 12,000 characters.'},400);
  const worker=(await workers.filter({...scope,status:'ready',last_seen:{$gt:new Date(Date.now()-180000).toISOString()}},{sort:'-created_date',limit:1})).items[0];
  if(!worker)return reply({error:'Start the paired worker and complete its native verification first.'},409);
  if(await jobs.count({...scope,status:{$in:['queued','running']},expires_at:{$gt:now}})>=3)return reply({error:'Three requests are already active; wait or cancel one.'},409);
  const job=await jobs.create({...scope,worker_id:worker.id,status:'queued',input_json:raw,input_sha256:await needleDigest(raw),nonce:crypto.randomUUID(),expires_at:new Date(Date.now()+600000).toISOString()});
  return reply({job_id:job.id});
 }
 await jobs.updateMany({...scope,status:{$in:['queued','running']},expires_at:{$lte:now}},{$set:{status:'expired',finished_at:now,error:'Request or worker claim expired. Submit a new request to retry.'}});
 const worker=(await workers.filter(scope,{sort:'-created_date',limit:1,fields:['status','last_seen','attestation_json']})).items[0]||null;
 if(a.cursor!==undefined&&(typeof a.cursor!=='string'||a.cursor.length>2000))return reply({error:'Invalid history cursor.'},400);
 const page=await jobs.filter(scope,{sort:'-created_date',limit:10,...(a.cursor?{cursor:a.cursor}:{}),fields:['status','input_json','input_sha256','nonce','lease_id','result_json','receipt_sha256','error','created_date','started_at','finished_at','expires_at','worker_id']});
 return reply({workspace_id:workspace.id,worker,online:!!worker&&worker.status==='ready'&&Date.now()-Date.parse(worker.last_seen)<180000,...page,pinned:needlePinned});
}