import {useEffect} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export default function useFraymusLiveActivity(){
 const client=useQueryClient();
 const query=useQuery({queryKey:['fraymus-live-activity'],queryFn:async()=>{const {data}=await base44.functions.invoke('openclawGateway',{action:'fraymus_live_snapshot'});if(data.error)throw new Error(data.error);return data;},staleTime:15000,refetchInterval:60000,refetchIntervalInBackground:false,refetchOnWindowFocus:true,retry:false});
 useEffect(()=>{let timer;const update=()=>{if(timer)return;timer=setTimeout(()=>{timer=null;client.invalidateQueries({queryKey:['fraymus-live-activity']});},2000);};const stops=['NexusEvent','SparkLearningLog','NexusDispatchJob','NexusContinuity'].map(name=>base44.entities[name].subscribe(update));return()=>{clearTimeout(timer);stops.forEach(stop=>stop());};},[client]);
 return query;
}