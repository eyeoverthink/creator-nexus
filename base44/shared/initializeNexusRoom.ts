export default async function initializeNexusRoom(room,conn,msg){
 const fail=message=>conn.send({type:'error',code:'workspace_initialization_failed',message});
 if(!msg.workspace_id||msg.workspace_id.length>64||!msg.draft_id||msg.draft_id.length>64){fail('The workspace connection request is invalid.');return;}
 let resource='workspace';
 try{
  // Resolve the selected records using actor-supported filter queries.
  const wp=await room.client.asServiceRole.entities.NexusWorkspace.filter({id:msg.workspace_id},{limit:1});
  const w=Array.isArray(wp)?wp[0]:wp?.items?.[0];
  if(!w||w.id!==msg.workspace_id){fail('The saved workspace could not be found.');return;}
  resource='draft';
  const dp=await room.client.asServiceRole.entities.NexusDraft.filter({id:msg.draft_id},{limit:1});
  const d=Array.isArray(dp)?dp[0]:dp?.items?.[0];
  if(!d||d.id!==msg.draft_id||d.workspace_id!==w.id){fail('The saved draft could not be found.');return;}
  room.workspace=w.id;
  await room.storage.put('workspace',w.id);
  if(!room.state.draft||room.state.draft.id!==d.id){room.state.draft=d;room.state.revision=d.revision||0;}
  await room.publish();
  conn.send({type:'initialized',workspace_id:w.id,draft_id:d.id,state:room.state});
 }catch(error){
  const status=error.status??error.response?.status;
  fail(status===404?`The saved ${resource} could not be found.`:'The saved workspace could not be opened. Please retry the connection.');
 }
}