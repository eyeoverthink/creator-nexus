export default async function initializeNexusRoom(room,conn,msg){
 const fail=message=>conn.send({type:'error',code:'workspace_initialization_failed',message});
 if(!msg.workspace_id||msg.workspace_id.length>64||!msg.draft_id||msg.draft_id.length>64){fail('The workspace connection request is invalid.');return;}
 let resource='workspace';
 try{
  // Resolve the selected records directly, then authorize their complete relationship.
  const w=await room.client.asServiceRole.entities.NexusWorkspace.get(msg.workspace_id);
  if(!w||w.id!==msg.workspace_id||w.owner_id!==conn.identity.userId){fail('The saved workspace could not be found.');return;}
  if(room.workspace&&room.workspace!==w.id){fail('This connection belongs to a different workspace. Please reopen your workspace.');return;}
  resource='draft';
  const d=await room.client.asServiceRole.entities.NexusDraft.get(msg.draft_id);
  if(!d||d.id!==msg.draft_id||d.owner_id!==conn.identity.userId||d.workspace_id!==w.id){fail('The saved draft could not be found.');return;}
  if(room.state.draft&&(room.state.draft.id!==d.id||room.state.draft.workspace_id!==w.id||room.state.draft.owner_id!==conn.identity.userId)){fail('The live draft does not match the saved workspace. Please reopen your workspace.');return;}
  room.workspace=w.id;
  await room.storage.put('workspace',w.id);
  // Never replace newer room edits with an older database snapshot on reconnect.
  if(!room.state.draft){room.state.draft=d;room.state.revision=d.revision||0;}
  await room.publish();
  conn.send({type:'initialized',workspace_id:w.id,draft_id:d.id,state:room.state});
 }catch(error){
  const status=error.status??error.response?.status;
  fail(status===404?`The saved ${resource} could not be found.`:'The saved workspace could not be opened. Please retry the connection.');
 }
}