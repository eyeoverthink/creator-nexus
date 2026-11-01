import {useEffect,useState,useRef} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
const initial={provider:'hosted',connection:'local',endpoint:'http://localhost:11434',model:'',useMemory:true};
const clean=value=>{
 const out=Object.fromEntries(Object.keys(initial).map(key=>[key,typeof value?.[key]===typeof initial[key]?value[key]:initial[key]]));
 if(String(out.endpoint||'').includes('4.71.129.4')||out.model==='fraymus-sovereign-v25-a100'){
  out.provider='hosted';out.connection='local';out.endpoint='http://localhost:11434';out.model='';
 }
 return out;
};
export default function useModelSettings(workspaceId){
 const cache=useQueryClient(),[token,setToken]=useState(''),[error,setError]=useState(''),pending=useRef(null),timer=useRef(null);
 const key=['model-settings',workspaceId];
 const stored=useQuery({queryKey:key,enabled:!!workspaceId,staleTime:0,queryFn:async()=>{
  const user=await base44.auth.me(),scope={owner_id:user.id,workspace_id:workspaceId,scope:'models'};
  const page=await base44.entities.NexusContinuity.filter(scope,{limit:1});
  if(page.items[0]?.settings){const settings=clean(page.items[0].settings);localStorage.setItem('nexus-model:'+workspaceId,JSON.stringify(settings));return {scope,settings};}
  let legacy=null;try{legacy=JSON.parse(localStorage.getItem('nexus-model:'+workspaceId)||'null');}catch{legacy=null;}
  const settings=clean(legacy);
  localStorage.setItem('nexus-model:'+workspaceId,JSON.stringify(settings));
  return {scope,settings};
 }});
 const persist=async()=>{const payload=pending.current;if(!payload)return;pending.current=null;try{await base44.entities.NexusContinuity.upsert([payload],{key:['owner_id','workspace_id','scope']});setError('');}catch(e){setError('Model settings could not be saved: '+e.message);}};
 useEffect(()=>{setToken('');setError('');return()=>{clearTimeout(timer.current);persist();};},[workspaceId]);
 const update=patch=>{
  const current=cache.getQueryData(key);if(!current)return;
  const settings=clean({...current.settings,...patch});cache.setQueryData(key,{...current,settings});
  localStorage.setItem('nexus-model:'+workspaceId,JSON.stringify(settings));
  pending.current={...current.scope,settings};clearTimeout(timer.current);timer.current=setTimeout(persist,500);
 };
 return {settings:stored.data?.settings||initial,update,token,setToken,loaded:!!stored.data,error:error||stored.error?.message};
}