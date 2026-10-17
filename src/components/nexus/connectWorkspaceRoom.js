import {base44} from '@/api/base44Client';
import {createClient,getAccessToken} from '@base44/sdk';
import {appParams} from '@/lib/app-params';

export default function connectWorkspaceRoom({workspace,draft,onState,onReady,onStatus,onError,onMissingWorkspace}){
 let id=sessionStorage.getItem('nexus-connection');
 if(!id){id=crypto.randomUUID();sessionStorage.setItem('nexus-connection',id);}
 // Actor auth must use the current session, not a token captured before a login change.
 const actorClient=createClient({appId:appParams.appId,serverUrl:'',appBaseUrl:appParams.appBaseUrl,functionsVersion:appParams.functionsVersion,token:getAccessToken()||appParams.token,analytics:{enabled:false}});
 const connection=actorClient.actors.NexusRoom(workspace.room_id).connect({id});
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
  if(closed||!message||typeof message!=='object')return;
  // Every new socket needs authorization, including automatic SDK reconnects.
  if(message.type==='room_ready'){initializing=false;synchronize();return;}
  // A socket and cached state alone do not prove the saved workspace was authorized.
  if(message.type==='initialized'&&message.workspace_id===workspace.id&&message.draft_id===draft.id&&matches(message.state)){
   verified=true;initializing=false;clearTimeout(timer);
   if(timedOut||connectionError){timedOut=false;connectionError=false;onError('');}
   onState(message.state);onReady(true);onStatus('Live');return;
  }
  // Cached drafts also arrive on reconnect. Never wait forever for an empty state.
  if(message.type==='state'&&message.state&&!verified&&!initializing){synchronize();return;}
  if((message.type==='state'||message.type==='conflict')&&verified&&matches(message.state)){
   clearTimeout(timer);onState(message.state);onReady(true);onStatus('Live');
   if(message.type==='conflict')onError('Another edit arrived first. Your view has been refreshed; please retry.');
  }
  if(message.type==='saved'&&verified)onStatus('Saved');
  if(message.type==='error'){
   if(!verified||message.code==='workspace_initialization_failed'){clearTimeout(timer);verified=false;initializing=false;connectionError=true;onReady(false);onStatus('Disconnected');}
   if(message.message==='The saved workspace could not be found.'){
    base44.entities.NexusWorkspace.filter({id:workspace.id,owner_id:workspace.owner_id},{limit:1}).then(({items})=>{
     if(closed)return;
     if(!items.length){onMissingWorkspace?.();return;}
     onError('Your saved workspace exists, but the live connection could not open it. Retry the connection to continue editing.');
    }).catch(()=>{if(!closed)onError('The workspace could not be verified. Retry the connection; no replacement workspace has been created.');});
    return;
   }
   onError(message.message);
  }
 });
 // Reinitialize after browser suspension or restored connectivity, not just at mount.
 document.addEventListener('visibilitychange',synchronize);
 window.addEventListener('pageshow',synchronize);
 window.addEventListener('online',synchronize);
 // Wait for the server's ready/state message rather than queueing initialization
 // on a socket that may still be reconnecting with an obsolete session.
 onReady(false);onStatus('Connecting');armTimeout();
 return {connection,cleanup:()=>{closed=true;clearTimeout(timer);document.removeEventListener('visibilitychange',synchronize);window.removeEventListener('pageshow',synchronize);window.removeEventListener('online',synchronize);subscription.unsubscribe();connection.close();}};
}