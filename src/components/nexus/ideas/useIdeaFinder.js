import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {runOllamaAgent} from '@/components/nexus/agents/runOllamaAgent';
const call=async p=>{try{return (await base44.functions.invoke('ideaFinder',p)).data;}catch(e){throw new Error(e.response?.data?.error||e.message);}};
export function useIdeaRuns(){
 const {user}=useAuth();
 return useQuery({queryKey:['idea-runs',user?.id],enabled:!!user?.id,queryFn:async()=>(await base44.entities.IdeaFinderRun.filter({owner_id:user.id},{sort:'-created_date',limit:10})).items});
}
export function useFindIdeas(){
 const qc=useQueryClient();
 return useMutation({mutationFn:async({provider,ollama,...input})=>{
  const start=await call({action:'start',provider,model:provider==='ollama'?ollama.model:'',...input});
  if(provider!=='ollama')return start.run;
  let output;
  try{output=await runOllamaAgent(ollama,start);}catch(e){await call({action:'fail',run_id:start.run_id,error:e.message}).catch(()=>null);throw e;}
  return (await call({action:'complete',run_id:start.run_id,output})).run;
 },onSettled:()=>qc.invalidateQueries({queryKey:['idea-runs']})});
}