import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import readHomeJobs from '@/components/nexus/home/readHomeJobs';
import readHomeVideos from '@/components/nexus/home/readHomeVideos';
export default function useHomeData(){
 const boot=useQuery({queryKey:['origin','workspace'],queryFn:async()=>{const user=await base44.auth.me().catch(()=>null);if(user?.id){const page=await base44.entities.NexusWorkspace.filter({owner_id:user.id},{sort:'created_date',limit:1}).catch(()=>({items:[]}));if(page?.items?.[0])return page.items[0];}const fallback=await base44.entities.NexusWorkspace.list('created_date',1).catch(()=>[]);const arr=Array.isArray(fallback)?fallback:fallback?.items||[];return arr[0]||null;}});
 const workspace=boot.data,enabled=!!workspace,scope={owner_id:workspace?.owner_id,workspace_id:workspace?.id};
 const jobs=useQuery({queryKey:['home','continue',workspace?.id],enabled,queryFn:()=>readHomeJobs(scope),refetchInterval:30000});
 const videos=useQuery({queryKey:['home','videos',workspace?.id],enabled,queryFn:()=>readHomeVideos(scope),staleTime:30000,refetchInterval:30000});
 const ideas=useQuery({queryKey:['home','ideas',workspace?.id],enabled,queryFn:()=>base44.entities.SparkCard.filter({...scope,status:'proposed'},{sort:'-director_score',limit:5,fields:['hook_title','one_line_pitch','format','batch_id','director_score']}),staleTime:30000});
 return {boot,jobs,videos,ideas};
}