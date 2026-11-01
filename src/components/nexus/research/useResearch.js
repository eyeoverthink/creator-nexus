import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
export function useResearchRuns(){
 const {user}=useAuth();
 return useQuery({queryKey:['research-runs',user?.id],enabled:!!user?.id,queryFn:async()=>(await base44.entities.TrendResearchRun.filter({owner_id:user.id},{sort:'-created_date',limit:10})).items});
}
export function useRunResearch(){
 const qc=useQueryClient();
 return useMutation({mutationFn:async({image,...input})=>{
  const image_uri=image?(await base44.integrations.Core.UploadPrivateFile({file:image})).file_uri:'';
  try{return (await base44.functions.invoke('trendResearch',{...input,image_uri})).data.run;}catch(e){throw new Error(e.response?.data?.error||e.message);}
 },onSettled:()=>qc.invalidateQueries({queryKey:['research-runs']})});
}
export function useToggleSaved(){
 const qc=useQueryClient();
 return useMutation({mutationFn:({run,index})=>base44.entities.TrendResearchRun.update(run.id,{findings:run.findings.map((f,i)=>i===index?{...f,saved:!f.saved}:f)}),onSuccess:()=>qc.invalidateQueries({queryKey:['research-runs']})});
}
export function useTargets(){
 const {user}=useAuth(),qc=useQueryClient(),key=['motivation-targets',user?.id],done=()=>qc.invalidateQueries({queryKey:key});
 const list=useQuery({queryKey:key,enabled:!!user?.id,queryFn:async()=>(await base44.entities.MotivationTarget.filter({owner_id:user.id},{sort:'-created_date',limit:20})).items});
 const save=useMutation({mutationFn:({id,...d})=>id?base44.entities.MotivationTarget.update(id,d):base44.entities.MotivationTarget.create({...d,owner_id:user.id}),onSuccess:done});
 const remove=useMutation({mutationFn:id=>base44.entities.MotivationTarget.delete(id),onSuccess:done});
 return {list,save,remove};
}