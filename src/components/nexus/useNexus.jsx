import {useState,useEffect,useRef} from 'react';
import {base44} from '@/api/base44Client';
import placeAgentPanels from '@/components/nexus/placeAgentPanels';
import useModelSettings from '@/components/nexus/models/useModelSettings';
import {runOllama} from '@/components/nexus/models/ollamaClient';
import connectWorkspaceRoom from '@/components/nexus/connectWorkspaceRoom';
export const initialLayout=[{id:'feed',tabs:['feed'],active:'feed',x:0,y:0,w:28,h:100},{id:'draft',tabs:['draft'],active:'draft',x:29,y:0,w:43,h:100},{id:'activity',tabs:['performance','activity'],active:'performance',x:73,y:0,w:27,h:100}];
export default function useNexus(){
 const [workspace,setWorkspace]=useState(null),[layout,setLayout]=useState(initialLayout),[state,setState]=useState(null),[status,setStatus]=useState('Connecting'),[error,setError]=useState(''),[agent,setAgent]=useState('writer'),[layoutStatus,setLayoutStatus]=useState('');const room=useRef(null),latest=useRef(null),saveTimer=useRef(null);
 const models=useModelSettings(workspace?.id);
 const [paidApproval,setPaidApproval]=useState(null);
 const [connected,setConnected]=useState(false),[connectionAttempt,setConnectionAttempt]=useState(0);
 useEffect(()=>{let alive=true,cleanup;setConnected(false);latest.current=null;setStatus('Connecting');setError(''); (async()=>{const user=await base44.auth.me();let {items}=await base44.entities.NexusWorkspace.filter({owner_id:user.id},{limit:1,sort:'created_date'});let w=items[0];if(!w)w=await base44.entities.NexusWorkspace.create({owner_id:user.id,name:'My creative space',room_id:crypto.randomUUID(),layout:initialLayout,agent_roster_version:1});if(!w.agent_roster_version)w=await base44.entities.NexusWorkspace.update(w.id,{layout:placeAgentPanels(w.layout?.length?w.layout:initialLayout),agent_roster_version:1});let drafts=await base44.entities.NexusDraft.filter({workspace_id:w.id,owner_id:user.id},{limit:1,sort:'created_date'});let d=drafts.items[0];if(!d)d=await base44.entities.NexusDraft.create({owner_id:user.id,workspace_id:w.id,title:'The art of making space',body:'# The art of making space\n\nA little less noise. A lot more possibility.\n\nThe best ideas rarely arrive when we’re trying to do everything at once. They show up when we make room to notice.\n\n## A different kind of creative workflow\n\nWhat if your tools could share your train of thought? Not another tab to manage, but a partner sitting beside you.\n\n- Start with a spark, not a blank page\n- Let curiosity lead the research\n- Build something that feels like you\n\nThis is an example draft. Make it yours, or ask an agent to take it somewhere new.',revision:0});if(!alive)return;setWorkspace(w);setLayout(w.layout?.length?w.layout:initialLayout);setState({draft:d,revision:d.revision||0,feed:[],events:[],agents:{},proposals:[],context:{panels:(w.layout||initialLayout).flatMap(p=>p.tabs),active:'draft',selection:null}});const live=connectWorkspaceRoom({workspace:w,draft:d,onState:next=>{if(alive){latest.current=next;setState(next);}},onReady:ready=>{if(alive){setConnected(ready);if(!ready)latest.current=null;}},onStatus:value=>{if(alive)setStatus(value);},onError:value=>{if(alive)setError(value);}});room.current=live.connection;cleanup=live.cleanup;})().catch(e=>{if(alive){setError(e.message);setStatus('Disconnected');}});return()=>{alive=false;cleanup?.();room.current=null;latest.current=null;clearTimeout(saveTimer.current);};},[connectionAttempt]);
 const send=msg=>room.current?.send(msg);
 const changeLayout=next=>{setLayout(next);setLayoutStatus('Saving layout…');send({type:'context',panels:next.flatMap(p=>p.tabs)});clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>{if(workspace)base44.entities.NexusWorkspace.update(workspace.id,{layout:next}).then(()=>setLayoutStatus('Layout saved')).catch(e=>{setError(e.message);setLayoutStatus('Layout not saved');});},600);};
 const open=type=>{const existing=layout.find(p=>p.tabs.includes(type));if(existing){changeLayout(layout.map(p=>p.id===existing.id?{...p,active:type}:p));return;}changeLayout([...layout,{id:crypto.randomUUID(),tabs:[type],active:type,x:15,y:8,w:55,h:82}]);};
 const edit=(title,body)=>{const current=latest.current;if(!current?.draft)return;setStatus('Saving');send({type:'edit',title,body,baseRevision:current.revision});};
 const executeRun=async (task,agentId=agent)=>{
  const agent=agentId;if(!latest.current?.draft||latest.current.agents[agent]==='working')return;
  const current=latest.current,{settings,token}=models;
  if((current.proposals||[]).length>=8){setError('Review or reject pending draft suggestions before requesting another agent action.');open('draft');return;}
  setError('');send({type:'agent_status',agent,busy:true});
  try{
   const {data}=await base44.functions.invoke('nexusAgent',{operation:settings.provider==='ollama'?'prepare_ollama':'run',consent:settings.provider!=='ollama',use_approved_examples:settings.useMemory,agent,draft_id:current.draft.id,task,context:{...current.context,draft:{title:current.draft.title,body:current.draft.body},feed:current.feed.slice(0,5)}});
   if(data.error)throw new Error(data.error);
   const result=settings.provider==='ollama'?await runOllama(settings,token,data):data.result;
   send({type:'agent_result',agent,result,baseRevision:current.revision,baseDraft:{title:current.draft.title,body:current.draft.body},task,provider:settings.provider,model:settings.provider==='ollama'?settings.model:'automatic'});
   if(result.kind==='edit')open('draft');
  }catch(e){setError(e.message);send({type:'agent_status',agent,busy:false});}
 };
 const run=(task,agentId=agent)=>models.settings.provider==='ollama'?executeRun(task,agentId):setPaidApproval({label:'Run '+({writer:'Scribe',researcher:'Scout',strategist:'Pulse'}[agentId]||'the selected agent'),task,agentId});
 const confirmPaidRun=()=>{const request=paidApproval;setPaidApproval(null);if(request)executeRun(request.task,request.agentId);};
 useEffect(()=>{const key=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();send({type:'save'});}if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='p'){e.preventDefault();open('preview');}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[layout]);
 return {workspace,layout,state,status,error,layoutStatus,setError,agent,setAgent,send,edit,run,open,changeLayout,models,paidApproval,confirmPaidRun,cancelPaidRun:()=>setPaidApproval(null),connected,retryConnection:()=>setConnectionAttempt(value=>value+1)};
}