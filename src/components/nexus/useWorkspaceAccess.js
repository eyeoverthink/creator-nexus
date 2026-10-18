import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {appParams} from '@/lib/app-params';
import {initialLayout} from '@/components/nexus/useNexus';
export const WORKSPACE_QUERY_KEY=['nexus-workspace'];
export async function invokeNexusEvolution(payload){
 try{
  const {data}=await base44.functions.invoke('nexusEvolution',payload);
  return data;
 }catch(err){
  const headers={'Content-Type':'application/json','X-App-Id':String(appParams.appId||'')};
  if(appParams.functionsVersion)headers['Base44-Functions-Version']=String(appParams.functionsVersion);
  const res=await fetch(`/api/apps/${appParams.appId}/functions/nexusEvolution`,{method:'POST',headers,body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>null);
  if(!res.ok||!data||data.error){
   throw new Error(data?.error||err?.response?.data?.error||err?.message||'nexusEvolution call failed');
  }
  return data;
 }
}
async function readWorkspace(){
 try{
  const user=await base44.auth.me();
  const page=await base44.entities.NexusWorkspace.filter({owner_id:user.id},{sort:'created_date',limit:1});
  return {user,workspace:page.items[0]||null};
 }catch(err){
  try{
   const data=await invokeNexusEvolution({action:'telemetry'});
   if(data?.workspace?.id){
    return {user:{id:data.workspace.owner_id||'owner'},workspace:data.workspace};
   }
  }catch{}
  throw err;
 }
}
export default function useWorkspaceAccess(){
 const qc=useQueryClient();
 const [creating,setCreating]=useState(false);
 const [createError,setCreateError]=useState('');
 const boot=useQuery({queryKey:WORKSPACE_QUERY_KEY,queryFn:readWorkspace,retry:false});
 const createWorkspace=async()=>{
  setCreating(true);
  setCreateError('');
  try{
   const user=boot.data?.user||await base44.auth.me();
   const workspace=await base44.entities.NexusWorkspace.create({owner_id:user.id,name:'My creative space',room_id:`room_${user.id}_${Date.now()}`,layout:initialLayout});
   qc.setQueryData(WORKSPACE_QUERY_KEY,{user,workspace});
   return workspace;
  }catch(err){
   setCreateError(err.message||'Could not create your workspace.');
   return null;
  }finally{
   setCreating(false);
  }
 };
 return {boot,user:boot.data?.user||null,workspace:boot.data?.workspace||null,creating,createError,createWorkspace};
}