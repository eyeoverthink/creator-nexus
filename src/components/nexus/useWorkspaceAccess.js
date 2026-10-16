import {useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {initialLayout} from '@/components/nexus/useNexus';
export default function useWorkspaceAccess(){
 const cache=useQueryClient(),lock=useRef(false),[creating,setCreating]=useState(false),[createError,setCreateError]=useState('');
 const boot=useQuery({queryKey:['origin','workspace'],queryFn:async()=>{const user=await base44.auth.me();const page=await base44.entities.NexusWorkspace.filter({owner_id:user.id},{sort:'created_date',limit:1});return page.items[0]||null;}});
 const createWorkspace=async()=>{
  if(lock.current)return;
  lock.current=true;setCreating(true);setCreateError('');
  try{
   const user=await base44.auth.me();
   const page=await base44.entities.NexusWorkspace.filter({owner_id:user.id},{sort:'created_date',limit:1});
   if(!page.items.length)await base44.entities.NexusWorkspace.create({owner_id:user.id,name:'My creative space',room_id:crypto.randomUUID(),layout:initialLayout,agent_roster_version:1});
   await cache.invalidateQueries({queryKey:['origin','workspace']});
  }catch(error){setCreateError(error.message);}
  finally{lock.current=false;setCreating(false);}
 };
 return {boot,workspace:boot.data,creating,createError,createWorkspace};
}