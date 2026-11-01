import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
const call=async payload=>(await base44.functions.invoke('elevenLabsVoice',payload)).data;
export const voiceError=e=>e?.response?.data?.error||e?.message||'Something went wrong.';
export default function useElevenLabs(workspaceId){
 const cache=useQueryClient();
 const refreshVoices=()=>cache.invalidateQueries({queryKey:['elevenlabs','voices']});
 const status=useQuery({queryKey:['elevenlabs','status'],queryFn:()=>call({action:'status'}),retry:false,staleTime:60000});
 const voices=useQuery({queryKey:['elevenlabs','voices'],queryFn:async()=>(await call({action:'voices'})).voices,retry:false,staleTime:300000});
 const speak=useMutation({mutationFn:input=>call({action:'speak',workspace_id:workspaceId,...input}),onSuccess:()=>{cache.invalidateQueries({queryKey:['elevenlabs','status']});cache.invalidateQueries({queryKey:['library-assets']});}});
 const setAgentVoice=useMutation({mutationFn:voice_id=>call({action:'set_agent_voice',voice_id}),onSuccess:refreshVoices});
 const clone=useMutation({mutationFn:async({files,name,removeNoise,useForAgents})=>{const file_uris=await Promise.all(files.map(async file=>(await base44.integrations.Core.UploadPrivateFile({file})).file_uri));return call({action:'clone',name,file_uris,remove_background_noise:removeNoise,use_for_agents:useForAgents});},onSuccess:refreshVoices});
 return {status,voices,speak,setAgentVoice,clone};
}