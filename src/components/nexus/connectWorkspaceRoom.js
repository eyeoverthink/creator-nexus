import {base44} from '@/api/base44Client';

export default function connectWorkspaceRoom({workspace,draft,onState,onReady,onStatus,onError}){
 let id=sessionStorage.getItem('nexus-connection');
 if(!id){id=crypto.randomUUID();sessionStorage.setItem('nexus-connection',id);}
 const connection=base44.actors.NexusRoom(workspace.room_id).connect({id});
 let timer,closed=false,timedOut=false,verified=false,initializing=false,connectionError=false;
 const matches=next=>next?.draft?.id===draft.id&&next.draft.workspace_id===workspace.id&&next.draft.owner_id===workspace.owner_id;
 const initialize=()=>{initializing=true;connection.send({type:'initialize',workspace_id:workspace.id,draft_id:draft.id});};
 const armTimeout=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(closed)return;timedOut=true;verified=false;initializing=false;connectionError=true;onReady(false);onStatus('Disconnected');onError('Your saved workspace is open, but the live connection is unavailable. Retry the connection to continue editing.');},15000);};
 const synchronize=()=>{
  if(closed||document.visibilityState==='hidden')return;
  verified=false;onReady(false);onStatus('Connecting');armTimeout();
  initialize();
  connection.send({type:'context',panels:(workspace.layout||[]).flatMap(panel=>panel.tabs),active:'draft'});
 };
 const subscription=connection.subscribe(message=>{
  if(closed)return;
  // A socket and cached state alone do not prove the saved workspace was authorized.
  if(message.type==='initialized'&&message.workspace_id===workspace.id&&message.draft_id===draft.id&&matches(message.state)){
   verified=true;initializing=false;clearTimeout(timer);
   if(timedOut||connectionError){timedOut=false;connectionError=false;onError('');}
   onState(message.state);onReady(true);onStatus('Live');return;
  }
  if(message.type==='state'&&message.state&&!message.state.draft&&!initializing){synchronize();return;}
  if((message.type==='state'||message.type==='conflict')&&verified&&matches(message.state)){
   clearTimeout(timer);onState(message.state);onReady(true);onStatus('Live');
   if(message.type==='conflict')onError('Another edit arrived first. Your view has been refreshed; please retry.');
  }
  if(message.type==='saved'&&verified)onStatus('Saved');
  if(message.type==='error'){
   if(!verified||message.code==='workspace_initialization_failed'){clearTimeout(timer);verified=false;initializing=false;connectionError=true;onReady(false);onStatus('Disconnected');}
   onError(message.message);
  }
 });
 // Reinitialize after browser suspension or restored connectivity, not just at mount.
 document.addEventListener('visibilitychange',synchronize);
 window.addEventListener('pageshow',synchronize);
 window.addEventListener('online',synchronize);
 synchronize();
 return {connection,cleanup:()=>{closed=true;clearTimeout(timer);document.removeEventListener('visibilitychange',synchronize);window.removeEventListener('pageshow',synchronize);window.removeEventListener('online',synchronize);subscription.unsubscribe();connection.close();}};
}