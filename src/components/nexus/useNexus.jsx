import {useState,useEffect,useRef} from 'react';
import {base44} from '@/api/base44Client';
import placeAgentPanels from '@/components/nexus/placeAgentPanels';
import useModelSettings from '@/components/nexus/models/useModelSettings';
import {runOllama} from '@/components/nexus/models/ollamaClient';
import connectWorkspaceRoom from '@/components/nexus/connectWorkspaceRoom';
import useStudioWorkspace from '@/components/nexus/useStudioWorkspace';
import {buildAgentCrossTabContext,publishLiveEdit} from '@/lib/crossTabMemory';
export const initialLayout=[{id:'feed',tabs:['feed'],active:'feed',x:0,y:0,w:28,h:100},{id:'draft',tabs:['draft'],active:'draft',x:29,y:0,w:43,h:100},{id:'activity',tabs:['performance','activity'],active:'performance',x:73,y:0,w:27,h:100}];
export default function useNexus(){
 const studio=useStudioWorkspace(initialLayout),workspace=studio.workspace;
 const [layout,setLayout]=useState(initialLayout),[state,setState]=useState(null),[status,setStatus]=useState('Connecting'),[error,setError]=useState(''),[agent,setAgent]=useState('writer'),[layoutStatus,setLayoutStatus]=useState('');const room=useRef(null),latest=useRef(null),saveTimer=useRef(null);
 const models=useModelSettings(workspace?.id);
 const [paidApproval,setPaidApproval]=useState(null);
 const [connected,setConnected]=useState(false);
 useEffect(()=>{
  let alive=true;setConnected(false);latest.current=null;setState(null);setStatus('Connecting');setError('');setLayoutStatus('');
  const w=workspace,d=studio.draft;
  if(!w||!d){setLayout([]);return;}
  const nextLayout=w.agent_roster_version?(w.layout?.length?w.layout:initialLayout):placeAgentPanels(w.layout?.length?w.layout:initialLayout);
  setLayout(nextLayout);
  setState({draft:d,revision:d.revision||0,feed:[],events:[],agents:{},proposals:[],context:{panels:nextLayout.flatMap(p=>p.tabs),active:'draft',selection:null}});
  const live=connectWorkspaceRoom({workspace:w,draft:d,onState:next=>{if(alive){latest.current=next;setState(next);}},onReady:ready=>{if(alive){setConnected(ready);if(!ready)latest.current=null;}},onStatus:value=>{if(alive)setStatus(value);},onError:value=>{if(alive)setError(value);},onMissingWorkspace:studio.reload});
  room.current=live.connection;
  return()=>{alive=false;live.cleanup();room.current=null;latest.current=null;clearTimeout(saveTimer.current);};
 },[workspace,studio.draft,studio.reload]);
 const send=msg=>room.current?.send(msg);
 const changeLayout=next=>{if(!workspace)return;setLayout(next);setLayoutStatus('Saving layout…');send({type:'context',panels:next.flatMap(p=>p.tabs)});clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>{if(workspace)base44.entities.NexusWorkspace.update(workspace.id,{layout:next}).then(()=>setLayoutStatus('Layout saved')).catch(e=>{setError(e.message);setLayoutStatus('Layout not saved');});},600);};
 const open=type=>{if(!workspace)return;const existing=layout.find(p=>p.tabs.includes(type));if(existing){changeLayout(layout.map(p=>p.id===existing.id?{...p,active:type}:p));return;}changeLayout([...layout,{id:crypto.randomUUID(),tabs:[type],active:type,x:15,y:8,w:55,h:82}]);};
 const edit=(title,body)=>{const current=latest.current;if(!current?.draft)return;setStatus('Saving');publishLiveEdit({title,body,field:'Studio Draft',draftId:current.draft.id,revision:(current.revision||0)+1});send({type:'edit',title,body,baseRevision:current.revision});};
 const executeRun=async (task,agentId=agent)=>{
  const agent=agentId;if(!latest.current?.draft){setError('Reconnect to the workspace before running an agent. No agent action was started.');return;}if(latest.current.agents[agent]==='working')return;
  const current=latest.current,{settings,token}=models;
  if((current.proposals||[]).length>=8){setError('Review or reject pending draft suggestions before requesting another agent action.');open('draft');return;}
  setError('');send({type:'agent_status',agent,busy:true});
  const crossTab=buildAgentCrossTabContext();
  const mergedSelection=crossTab.selection||current.context?.selection||null;
  send({type:'context',selection:mergedSelection,liveEdit:crossTab.liveEdit||null,windows:crossTab.openWindows||[]});
  try{
   const {data}=await base44.functions.invoke('nexusAgent',{operation:settings.provider==='ollama'?'prepare_ollama':'run',consent:settings.provider!=='ollama',use_approved_examples:settings.useMemory,agent,draft_id:current.draft.id,task,context:{...current.context,selection:mergedSelection,liveEdit:crossTab.liveEdit||null,windows:crossTab.openWindows||[],crossTabMemory:crossTab,draft:{title:current.draft.title,body:current.draft.body},feed:current.feed.slice(0,5)}});
   if(data.error)throw new Error(data.error);
   const result=settings.provider==='ollama'?await runOllama(settings,token,data):data.result;
   send({type:'agent_result',agent,result,baseRevision:current.revision,baseDraft:{title:current.draft.title,body:current.draft.body},task,provider:settings.provider,model:settings.provider==='ollama'?settings.model:'automatic'});
   if(result.kind==='edit')open('draft');
  }catch(e){setError(e.message);send({type:'agent_status',agent,busy:false});}
 };
 const run=(task,agentId=agent)=>{if(!latest.current?.draft){setError('Reconnect to the workspace before running an agent. No agent action was started.');return;}return models.settings.provider==='ollama'?executeRun(task,agentId):setPaidApproval({label:'Run '+({writer:'Scribe',researcher:'Scout',strategist:'Pulse'}[agentId]||'the selected agent'),task,agentId});};
 const confirmPaidRun=()=>{const request=paidApproval;setPaidApproval(null);if(request)executeRun(request.task,request.agentId);};
 useEffect(()=>{const key=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();send({type:'save'});}if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='p'){e.preventDefault();open('preview');}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[layout]);
 return {workspace,layout,state,status,error,layoutStatus,setError,agent,setAgent,send,edit,run,open,changeLayout,models,paidApproval,confirmPaidRun,cancelPaidRun:()=>setPaidApproval(null),connected,retryConnection:studio.reload,studioPhase:studio.phase,studioError:studio.createError||studio.error,creatingWorkspace:studio.creating,createWorkspace:studio.createWorkspace};
}