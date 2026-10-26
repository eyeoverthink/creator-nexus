import {useEffect,useState} from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export default function useContinuityJournal(){
 const client=useQueryClient(),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const query=useInfiniteQuery({queryKey:['continuity-journal'],initialPageParam:null,queryFn:async({pageParam})=>{const {data}=await base44.functions.invoke('orificeBridge',{action:'continuity_status',...(pageParam?{cursor:pageParam}:{})});if(data.error)throw new Error(data.error);return data;},getNextPageParam:page=>page.entries.has_more?page.entries.next_cursor:undefined,staleTime:60000,retry:false,refetchOnWindowFocus:false});
 useEffect(()=>{let timer;const refresh=()=>{if(!timer)timer=setTimeout(()=>{timer=undefined;client.invalidateQueries({queryKey:['continuity-journal']});},1500);};const off=base44.entities.FraymusContinuityEntry.subscribe(refresh),offHeart=base44.entities.FraymusRelayHeartbeat.subscribe(refresh);return()=>{clearTimeout(timer);off();offHeart();};},[client]);
 async function save(title,text){setSaving(true);setError('');try{const {data}=await base44.functions.invoke('orificeBridge',{action:'continuity_archive',workspace_id:query.data.pages[0].workspace.id,entry:{kind:'creator_directive',title,text,source_ref:'in_app_creator_journal'}});if(data.error)throw new Error(data.error);await client.invalidateQueries({queryKey:['continuity-journal']});return true;}catch(e){setError(e.response?.data?.error||e.message);return false;}finally{setSaving(false);}}
 return {query,saving,error,save};
}