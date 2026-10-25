import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {initialLayout} from '@/components/nexus/useNexus';
export const WORKSPACE_QUERY_KEY=['origin','workspace'];
async function readWorkspace(){
 const user=await base44.auth.me().catch(()=>null);
 if(user?.id){
  const page=await base44.entities.NexusWorkspace.filter({owner_id:user.id},{sort:'created_date',limit:1}).catch(()=>({items:[]}));
  if(page?.items?.[0])return page.items[0];
 }
 const fallback=await base44.entities.NexusWorkspace.list('created_date',1).catch(()=>[]);
 const arr=Array.isArray(fallback)?fallback:fallback?.items||[];
 return arr[0]||null;
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
   const user=await base44.auth.me();
   const existing=await base44.entities.NexusWorkspace.filter({owner_id:user.id},{sort:'created_date',limit:1});
   const workspace=existing.items[0]||await base44.entities.NexusWorkspace.create({owner_id:user.id,name:'My creative space',room_id:`room_${user.id}_${Date.now()}`,layout:initialLayout,agent_roster_version:1});
   qc.setQueryData(WORKSPACE_QUERY_KEY,workspace);
   return workspace;
  }catch(err){
   setCreateError(err.message||'Could not create your workspace.');
   return null;
  }finally{
   setCreating(false);
  }
 };
 return {boot,workspace:boot.data||null,creating,createError,createWorkspace};
}