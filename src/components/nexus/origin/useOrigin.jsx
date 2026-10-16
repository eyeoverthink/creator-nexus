import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {initialLayout} from '@/components/nexus/useNexus';
export default function useOrigin(){
 const cache=useQueryClient(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[approval,setApproval]=useState(null),[projectId,setProjectId]=useState(()=>new URLSearchParams(window.location.search).get('project'));
 const boot=useQuery({queryKey:['origin','workspace'],queryFn:async()=>{const user=await base44.auth.me();const page=await base44.entities.NexusWorkspace.filter({owner_id:user.id},{sort:'created_date',limit:1});const workspace=page.items[0]||await base44.entities.NexusWorkspace.create({owner_id:user.id,name:'My creative space',room_id:crypto.randomUUID(),layout:initialLayout,agent_roster_version:1});return workspace;}});
 const workspace=boot.data,profile=useQuery({queryKey:['origin','dna',workspace?.id],enabled:!!workspace,queryFn:async()=>{const {items}=await base44.entities.CreatorDNA.filter({owner_id:workspace.owner_id,workspace_id:workspace.id},{sort:'-updated_date',limit:1});return items[0]||null;}});
 const act=async(action,values={})=>{if(busy)return null;setBusy(true);setError('');try{const {data}=await base44.functions.invoke('nexusOrigin',{action,workspace_id:workspace.id,...values});if(data.error)throw new Error(data.error);if(data.regression_warning)setError(data.regression_warning);await Promise.all([cache.invalidateQueries({queryKey:['origin']}),cache.invalidateQueries({queryKey:['regression',workspace.id]})]);return data;}catch(e){setError(e.response?.data?.error||e.message);return null;}finally{setBusy(false);}};
 const ask=(action,values={},onSuccess)=>setApproval({label:action==='sparks'?'Generate five personal Sparks with Director':'Write this brief and script with Scribe',action,values,onSuccess});
 const confirm=async()=>{const request=approval;setApproval(null);if(!request)return;const result=await act(request.action,{...request.values,consent:true});if(result)request.onSuccess?.(result);};
 const openProject=id=>{setProjectId(id);const url=new URL(window.location.href);if(id)url.searchParams.set('project',id);else url.searchParams.delete('project');window.history.replaceState(null,'',url);};
 return {workspace,dna:profile.data,loading:boot.isPending||profile.isPending,loadError:boot.error||profile.error,busy,error,setError,act,ask,approval,confirm,cancelApproval:()=>setApproval(null),projectId,openProject};
}