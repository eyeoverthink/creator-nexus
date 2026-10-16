import {useCallback,useEffect,useRef,useState} from 'react';
import {base44} from '@/api/base44Client';

export default function useStudioWorkspace(initialLayout){
 const [snapshot,setSnapshot]=useState({workspace:null,draft:null,phase:'loading',error:''});
 const [attempt,setAttempt]=useState(0),[creating,setCreating]=useState(false),[createError,setCreateError]=useState('');
 const creatingRef=useRef(false);
 const reload=useCallback(()=>setAttempt(value=>value+1),[]);
 useEffect(()=>{
  let active=true;setSnapshot({workspace:null,draft:null,phase:'loading',error:''});setCreateError('');
  (async()=>{
   const user=await base44.auth.me();
   const {items}=await base44.entities.NexusWorkspace.filter({owner_id:user.id},{limit:1,sort:'created_date'});
   if(!active)return;
   const workspace=items[0];
   if(!workspace){setSnapshot({workspace:null,draft:null,phase:'empty',error:''});return;}
   const drafts=await base44.entities.NexusDraft.filter({workspace_id:workspace.id,owner_id:user.id},{limit:1,sort:'created_date'});
   if(!active)return;
   let draft=drafts.items[0];
   if(!draft)draft=await base44.entities.NexusDraft.create({owner_id:user.id,workspace_id:workspace.id,title:'The art of making space',body:'# The art of making space\n\nA little less noise. A lot more possibility.\n\nThe best ideas rarely arrive when we’re trying to do everything at once. They show up when we make room to notice.\n\n## A different kind of creative workflow\n\nWhat if your tools could share your train of thought? Not another tab to manage, but a partner sitting beside you.\n\n- Start with a spark, not a blank page\n- Let curiosity lead the research\n- Build something that feels like you\n\nThis is an example draft. Make it yours, or ask an agent to take it somewhere new.',revision:0});
   if(active)setSnapshot({workspace,draft,phase:'ready',error:''});
  })().catch(error=>{if(active)setSnapshot({workspace:null,draft:null,phase:'error',error:error.message});});
  return()=>{active=false;};
 },[attempt]);
 const createWorkspace=async()=>{
  if(creatingRef.current||snapshot.phase!=='empty')return;
  creatingRef.current=true;setCreating(true);setCreateError('');
  try{
   const user=await base44.auth.me();
   // Recheck after an explicit click so another tab's workspace is reused.
   const {items}=await base44.entities.NexusWorkspace.filter({owner_id:user.id},{limit:1,sort:'created_date'});
   if(!items.length)await base44.entities.NexusWorkspace.create({owner_id:user.id,name:'My creative space',room_id:crypto.randomUUID(),layout:initialLayout,agent_roster_version:1});
   reload();
  }catch(error){setCreateError(error.message);}
  finally{creatingRef.current=false;setCreating(false);}
 };
 return {...snapshot,creating,createError,reload,createWorkspace};
}