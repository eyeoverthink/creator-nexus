import {useEffect} from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export default function useTaskMonitorSource(source,filter){
 const client=useQueryClient();
 const statuses=filter==='running'?source.running:filter==='waiting'?source.waiting:filter==='completed'?['completed','succeeded','approved']:filter==='failed'?['failed','cancelled','expired']:[...source.running,...source.waiting];
 const query=useInfiniteQuery({
  queryKey:['agent-monitor',source.entity,filter],initialPageParam:null,
  queryFn:({pageParam})=>statuses.length?base44.entities[source.entity].filter({status:{$in:statuses}},{sort:'-updated_date',limit:12,fields:source.fields,...(pageParam?{cursor:pageParam}:{})}):Promise.resolve({items:[],has_more:false}),
  getNextPageParam:page=>page.has_more?page.next_cursor:undefined,
  staleTime:30000,retry:false,refetchOnWindowFocus:true,refetchInterval:60000,refetchIntervalInBackground:false,
 });
 useEffect(()=>{
  let timer;
  const unsubscribe=base44.entities[source.entity].subscribe(()=>{
   if(timer)return;
   timer=setTimeout(()=>{timer=undefined;client.invalidateQueries({queryKey:['agent-monitor',source.entity]});},1500);
  });
  return ()=>{clearTimeout(timer);unsubscribe();};
 },[client,source.entity]);
 return query;
}