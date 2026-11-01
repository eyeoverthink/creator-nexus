import {z} from 'npm:zod@4.4.3';
import {dispatchRequire,dispatchIdentity,dispatchProgram,dispatchMerkle,dispatchHash,dispatchCanonical,verifyDispatchCrypto,fraymusHex} from './fraymusDispatchCrypto.ts';
const inputSchema=z.object({action:z.enum(['status','pin','revoke','prepare','verify','accept']),public_key:fraymusHex.optional(),confirmed:z.boolean().optional(),subject:z.string().min(1).max(160).optional(),program:z.object({css:z.string().max(8192).optional(),js:z.string().max(8192).optional(),html:z.string().max(8192).optional(),wasm:z.string().max(8192).optional()}).strict().optional(),envelope_json:z.string().max(19000).optional(),cursor:z.string().max(1000).optional()}).strict();
export async function runFraymusSignedDispatch(base44,user,workspaceId,input){
 const a=inputSchema.parse(input),workspace=await base44.entities.NexusWorkspace.get(workspaceId);
 dispatchRequire(workspace?.owner_id===user.id,'Only the workspace owner can manage its signed dispatch.',403);
 // Elevated writes are limited to server-owned trust/challenge state after owner validation.
 const writer=base44.asServiceRole.entities.FraymusDispatchRecord,reader=base44.entities.FraymusDispatchRecord;
 const db={filter:(...args)=>reader.filter(...args),count:(...args)=>reader.count(...args),create:(...args)=>writer.create(...args),updateMany:(...args)=>writer.updateMany(...args)},scope={owner_id:user.id,workspace_id:workspaceId},recipient=`workspace:${workspaceId}`;
 if(a.action==='status'){
  const [trust,receipts]=await Promise.all([db.filter({...scope,kind:'trust',status:'active'},{sort:'-created_date',limit:20,fields:['sender','public_key','fingerprint']}),db.filter({...scope,kind:'challenge',status:'accepted'},{sort:'-created_date',limit:20,...(a.cursor?{cursor:a.cursor}:{}),fields:['subject','sender','receipt_id','envelope_json','issued_at']})]);
  return {status:'ready',recipient,trusted_keys:trust.items,receipts:receipts.items,next_cursor:receipts.next_cursor,has_more:receipts.has_more,notice:'Workspace-local review inbox. Accepted programs remain inert; no worker, mail delivery or code execution is triggered.'};
 }
 if(['pin','revoke','prepare'].includes(a.action))dispatchRequire(Boolean(a.public_key),'Provide the exact public key.');
 if(['pin','revoke'].includes(a.action)){
  dispatchRequire(a.confirmed===true,'Explicit confirmation is required before changing trusted keys.');
  const identity=await dispatchIdentity(a.public_key),query={...scope,kind:'trust',public_key:a.public_key};
  if(a.action==='revoke'){
   await db.updateMany({...query,status:'active'},{$set:{status:'revoked'}});
   await db.updateMany({...scope,kind:'challenge',public_key:a.public_key,status:'issued'},{$set:{status:'revoked'}});
   return {status:'revoked',...identity};
  }
  const existing=await db.filter({...query,status:'active'},{limit:1});
  if(!existing.items.length){dispatchRequire(await db.count({...scope,kind:'trust',status:'active'})<20,'Trusted-key capacity reached; revoke a key first.');await db.create({...scope,kind:'trust',status:'active',public_key:a.public_key,...identity});}
  return {status:'trusted',public_key:a.public_key,...identity};
 }
 if(a.action==='prepare'){
  dispatchRequire(Boolean(a.subject?.trim()),'Provide a subject.');
  const trust=await db.filter({...scope,kind:'trust',status:'active',public_key:a.public_key},{limit:1});dispatchRequire(trust.items.length===1,'Pin the sender public key before preparing a dispatch.');
  const identity=await dispatchIdentity(a.public_key),program=dispatchProgram(a.program||{}),now=Date.now();
  dispatchRequire(await db.count({...scope,kind:'challenge',status:'issued',expires_at:{$gt:new Date(now).toISOString()}})<10,'Ten challenges already await signatures; wait for their five-minute expiry.');
  const issued_at=new Date(now).toISOString(),expires_at=new Date(now+300000).toISOString(),nonce=crypto.randomUUID();
  const challenge=await db.create({...scope,kind:'challenge',status:'issued',sender:identity.sender,public_key:a.public_key,recipient,issued_at,expires_at,nonce});
  const envelope={protocol:'fraymus.dispatch/2',alg:'Ed25519',workspace_id:workspaceId,from:identity.sender,to:recipient,subject:a.subject,pubkey:a.public_key,challenge_id:challenge.id,nonce,issued_at,expires_at,program,psha:await dispatchHash(JSON.stringify(program)),merkle:await dispatchMerkle(program)};
  return {status:'awaiting_browser_signature',envelope,canonical:dispatchCanonical(envelope)};
 }
 dispatchRequire(Boolean(a.envelope_json),'Provide a signed envelope.');
 let raw;try{raw=JSON.parse(a.envelope_json);}catch{dispatchRequire(false,'Envelope is not valid JSON.');}
 const checked=await verifyDispatchCrypto(raw),e=checked.envelope;
 dispatchRequire(e.workspace_id===workspaceId&&e.to===recipient,'Dispatch is addressed to a different workspace.');
 const now=Date.now(),issued=Date.parse(e.issued_at),expiry=Date.parse(e.expires_at);
 dispatchRequire(issued<=now+30000&&issued>=now-300000&&expiry>now&&expiry-issued===300000,'Dispatch is expired or has an invalid time window.');
 const [trust,challenges]=await Promise.all([db.filter({...scope,kind:'trust',status:'active',public_key:e.pubkey,fingerprint:checked.identity.fingerprint},{limit:1}),db.filter({...scope,id:e.challenge_id,kind:'challenge',public_key:e.pubkey,sender:e.from,recipient,nonce:e.nonce,issued_at:e.issued_at,expires_at:e.expires_at},{limit:1})]);
 dispatchRequire(trust.items.length===1,'Sender key is untrusted or revoked.');dispatchRequire(challenges.items.length===1,'No matching server-issued challenge.');
 const challenge=challenges.items[0],can_accept=challenge.status==='issued';
 const report={status:'verified',receipt_id:checked.receipt_id,signature_valid:true,merkle_valid:true,trusted_sender:true,recipient,can_accept,executed:false};
 if(a.action==='verify')return report;
 dispatchRequire(can_accept,'Replay rejected: this challenge was already consumed.',409);
 // Conditional single-record transition is the replay gate, not a read-then-create check.
 const claim=await db.updateMany({...scope,id:challenge.id,kind:'challenge',status:'issued',nonce:e.nonce,expires_at:{$gt:new Date().toISOString()}},{$set:{status:'accepted',subject:e.subject,receipt_id:checked.receipt_id,envelope_json:JSON.stringify(e)}});
 dispatchRequire(claim.success===true&&claim.updated===1,'Replay rejected or challenge expired during acceptance.',409);
 return {...report,status:'accepted_for_review',can_accept:false,record_id:challenge.id,notice:'Signature, pinned key, recipient, program leaves and one-use challenge verified. Saved to the review inbox; nothing executed.'};
}