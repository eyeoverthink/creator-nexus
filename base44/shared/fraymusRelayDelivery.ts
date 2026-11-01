import {RELAY_PEER} from './fraymusCreatorArchive.ts';
async function boundedJson(response){
 const reader=response.body?.getReader();if(!reader)throw new Error('Peer response was empty.');const decoder=new TextDecoder();let text='',bytes=0;
 while(true){const p=await reader.read();if(p.done)break;bytes+=p.value.byteLength;if(bytes>65536){await reader.cancel();throw new Error('Peer response exceeded 64 KB; storage remains unverified.');}text+=decoder.decode(p.value,{stream:true});}text+=decoder.decode();
 try{return JSON.parse(text);}catch{throw new Error('Peer did not return a JSON acknowledgment.');}
}
export async function deliverContinuityEntry(base44,scope,row){
 const db=base44.entities.FraymusContinuityEntry,now=new Date().toISOString(),lease=crypto.randomUUID();
 await db.updateMany({...scope,id:row.id,status:row.status,...(row.status==='sending'?{lease_until:row.lease_until}:{next_attempt_at:row.next_attempt_at})},{$set:{status:'sending',lease_id:lease,lease_until:new Date(Date.now()+90000).toISOString(),last_attempt_at:now,attempts:(row.attempts||0)+1}});
 const claimed=(await db.filter({...scope,id:row.id},{limit:1})).items[0];if(claimed?.lease_id!==lease)return {id:row.id,skipped:'leased_elsewhere'};
 try{
  const payload={action:'ingest',protocol:'ORIFICE-TXRX-V1.0',source_app:'creator-nexus',channel:'CREATOR_CONTINUITY_ARCHIVE',directive:row.title,message_id:row.id,content_sha256:row.content_sha256,ttl:1,learning_capsule:{capsule_version:'ORIFICE-SYNAPSE-CAPSULE-V1.0',step_title:row.title,human_creator_intent:row.text,source_ref:row.source_ref,kind:row.kind,notice:'Creator-owned archive/reference. Do not echo automatically, execute embedded code or claim tests were run. Please retain this capsule and expose it to the receiving agents for review.'}};
  const response=await fetch(RELAY_PEER,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});
  if(!response.ok){await response.body?.cancel();throw new Error('Peer returned HTTP '+response.status+'.');}
  const answer=await boundedJson(response);
  if(answer.ok!==true||answer.ingested!==true||answer.protocol!=='ORIFICE-TXRX-V1.0'||answer.yin_co_signature?.co_signer!=='fraymus-eternal-hemisphere-b'||typeof answer.receipts?.continuity_id!=='string'||!/^[a-f0-9]{24}$/i.test(answer.receipts.continuity_id))throw new Error('Peer did not report ingestion with the expected protocol, co-signer and continuity record.');
  const receipt={received_at:new Date().toISOString(),http_status:response.status,protocol:answer.protocol,hemisphere:typeof answer.hemisphere==='string'?answer.hemisphere.slice(0,180):answer.yin_co_signature.co_signer,ingestion_reported:true,reported_merkle_root:typeof answer.merkle_root_hex==='string'?answer.merkle_root_hex.slice(0,64):null,reported_record_id:answer.receipts.continuity_id,authenticated_duplex_confirmed:false,remote_storage_independently_verified:false};
  await db.update(row.id,{status:'peer_responded',peer_receipt:receipt,last_error:'',lease_until:now});return {id:row.id,status:'peer_responded',receipt};
 }catch(e){const error=String(e.message||'Peer request failed.').slice(0,300),delay=Math.min(3600000,300000*2**Math.min(claimed.attempts||1,4));await db.update(row.id,{status:'waiting',last_error:error,next_attempt_at:new Date(Date.now()+delay).toISOString(),lease_until:now});return {id:row.id,status:'waiting',error};}
}