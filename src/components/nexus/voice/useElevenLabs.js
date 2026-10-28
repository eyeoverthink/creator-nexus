import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
const call=async payload=>(await base44.functions.invoke('elevenLabsVoice',payload)).data;
export const voiceError=e=>e?.response?.data?.error||e?.message||'Something went wrong.';
export default function useElevenLabs(workspaceId){
 const cache=useQueryClient();
 const status=useQuery({queryKey:['elevenlabs','status'],queryFn:()=>call({action:'status'}),retry:false,staleTime:60000});
 const voices=useQuery({queryKey:['elevenlabs','voices'],queryFn:async()=>(await call({action:'voices'})).voices,retry:false,staleTime:300000});
 const speak=useMutation({mutationFn:input=>call({action:'speak',workspace_id:workspaceId,...input}),onSuccess:()=>{cache.invalidateQueries({queryKey:['elevenlabs','status']});cache.invalidateQueries({queryKey:['library-assets']});}});
 return {status,voices,speak};
}