import {base44} from '@/api/base44Client';

export default function connectWorkspaceRoom({workspace,draft,onState,onReady,onStatus,onError}){
 let id=sessionStorage.getItem('nexus-connection');
 if(!id){id=crypto.randomUUID();sessionStorage.setItem('nexus-connection',id);}
 const connection=base44.actors.NexusRoom(workspace.room_id).connect({id});
 let timer,closed=false,timedOut=false;
 const initialize=()=>connection.send({type:'initialize',workspace_id:workspace.id,draft_id:draft.id});
 const armTimeout=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(closed)return;timedOut=true;onReady(false);onStatus('Disconnected');onError('Your saved workspace is open, but the live connection is unavailable. Retry the connection to continue editing.');},15000);};
 const synchronize=()=>{
  if(closed||document.visibilityState==='hidden')return;
  onReady(false);onStatus('Connecting');armTimeout();
  initialize();
  connection.send({type:'context',panels:(workspace.layout||[]).flatMap(panel=>panel.tabs),active:'draft'});
 };
 const subscription=connection.subscribe(message=>{
  if(closed)return;
  // An automatic socket reconnect can reach an uninitialized room after its first request was lost.
  if(message.type==='state'&&message.state&&!message.state.draft){onReady(false);onStatus('Connecting');armTimeout();initialize();return;}
  if((message.type==='state'||message.type==='conflict')&&message.state?.draft){
   clearTimeout(timer);if(timedOut){timedOut=false;onError('');}
   onState(message.state);onReady(true);onStatus('Live');
   if(message.type==='conflict')onError('Another edit arrived first. Your view has been refreshed; please retry.');
  }
  if(message.type==='saved')onStatus('Saved');
  if(message.type==='error')onError(message.message);
 });
 // Reinitialize after browser suspension or restored connectivity, not just at mount.
 document.addEventListener('visibilitychange',synchronize);
 window.addEventListener('pageshow',synchronize);
 window.addEventListener('online',synchronize);
 synchronize();
 return {connection,cleanup:()=>{closed=true;clearTimeout(timer);document.removeEventListener('visibilitychange',synchronize);window.removeEventListener('pageshow',synchronize);window.removeEventListener('online',synchronize);subscription.unsubscribe();connection.close();}};
}