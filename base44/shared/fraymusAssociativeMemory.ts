import {FRAYMUS_HDC_ENCODER,FRAYMUS_HDC_DIMENSIONS,encodeFraymusAssociative,packFraymusAssociative,unpackFraymusAssociative,compareFraymusAssociative,digestFraymusAssociative} from './fraymusAssociativeVectors.ts';
export async function executeFraymusAssociative(base44,user,workspaceId,args){
 if(!['learn','recall'].includes(args.memory_action))return {error:'Choose learn or recall.',status_code:400};
 if(args.memory_action==='recall'&&args.commit===true)return {error:'Recall is read-only.',status_code:400};
 if(workspaceId!==undefined&&(typeof workspaceId!=='string'||!workspaceId||workspaceId.length>120))return {error:'Invalid workspace.',status_code:400};
 const threshold=args.minimum_similarity??0.15;
 if(!Number.isFinite(threshold)||threshold< -1||threshold>1)return {error:'Similarity threshold must be between -1 and 1.',status_code:400};
 if(args.state_id)return {error:'Associative memory searches independent entries, not prototype snapshots.',status_code:400};
 let encoded;
 try{encoded=encodeFraymusAssociative(args.text);}catch(error){return {error:error.message,status_code:400};}
 if(args.memory_action==='learn'&&(typeof args.label!=='string'||!args.label.trim()||args.label.length>60))return {error:'Learning needs an explicit label of 1–60 characters.',status_code:400};
 const workspaces=await base44.entities.NexusWorkspace.filter({owner_id:user.id,...(workspaceId?{id:workspaceId}:{})},{sort:'created_date',limit:1});
 const workspace=workspaces.items[0];if(!workspace)return {error:'Select your own workspace first.',status_code:404};
 const scope={owner_id:user.id,workspace_id:workspace.id,project:'Fraymus Associative Memory',source_entity:'FraymusAssociativeEntry',kind:'document'};
 const digest=await digestFraymusAssociative(encoded.bytes),packed=packFraymusAssociative(encoded.bytes);
 const report={engine:'Fraymus Associative Memory',source:{implementation:'Original Creator Nexus implementation',encoder:FRAYMUS_HDC_ENCODER},encoder:FRAYMUS_HDC_ENCODER,dimensions:FRAYMUS_HDC_DIMENSIONS,packed_bytes:512,word_count:encoded.word_count,vector_sha256:digest,round_trip_verified:compareFraymusAssociative(encoded.bytes,unpackFraymusAssociative(packed))===1,workspace_id:workspace.id,committed:false,notice:'Deterministic lexical word/bigram hypervectors, not neural semantic embeddings or model-weight training. Similarity is not confidence. Entries append independently; recall never reinforces memory.'};
 if(args.memory_action==='learn'){
  if(args.commit!==true)return {...report,status:'preview',matches:[]};
  const body=JSON.stringify({version:1,encoder:FRAYMUS_HDC_ENCODER,dimensions:FRAYMUS_HDC_DIMENSIONS,packed,label:args.label.trim(),text:args.text,vector_sha256:digest});
  const record=await base44.entities.NexusAsset.create({...scope,title:`Associative memory · ${args.label.trim()}`,body,source_id:digest});
  return {...report,status:'learned',state_id:record.id,committed:true,matches:[]};
 }
 const page=await base44.entities.NexusAsset.filter(scope,{sort:'-created_date',limit:128,fields:['id','body','created_date']});
 const matches=[];let invalid=0;
 for(const record of page.items){
  let entry,vector;
  try{
   entry=JSON.parse(record.body);
   if(entry.version!==1||entry.encoder!==FRAYMUS_HDC_ENCODER||entry.dimensions!==4096||typeof entry.label!=='string'||entry.label.length>60||typeof entry.text!=='string'||entry.text.length>2000)throw new Error('Incompatible entry.');
   vector=unpackFraymusAssociative(entry.packed);
   if(await digestFraymusAssociative(vector)!==entry.vector_sha256)throw new Error('Digest mismatch.');
  }catch{invalid++;continue;}
  const similarity=compareFraymusAssociative(encoded.bytes,vector);
  if(similarity>=threshold)matches.push({id:record.id,label:entry.label,text:entry.text,similarity,created_date:record.created_date});
 }
 matches.sort((a,b)=>b.similarity-a.similarity||a.id.localeCompare(b.id));
 return {...report,status:page.items.length?'recalled':'empty',minimum_similarity:threshold,searched_entries:page.items.length,invalid_entries:invalid,search_truncated:!!page.has_more,search_scope:'Most recent 128 workspace entries; no entries are deleted.',matches:matches.slice(0,5)};
}