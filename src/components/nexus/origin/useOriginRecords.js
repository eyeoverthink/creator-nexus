import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export default function useOriginRecords(entity,query,enabled=true){
 const result=useInfiniteQuery({queryKey:['origin',entity,query],enabled,initialPageParam:undefined,queryFn:({pageParam})=>base44.entities[entity].filter(query,{sort:'-created_date',limit:12,...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:p=>p.has_more?p.next_cursor:undefined});
 return {...result,rows:result.data?.pages.flatMap(p=>p.items)||[]};
}