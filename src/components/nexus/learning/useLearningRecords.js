import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export default function useLearningRecords(entity,workspace,agent,search=''){
 const escaped=search.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const result=useInfiniteQuery({queryKey:['learning',entity,workspace?.id,agent,search],enabled:!!workspace,initialPageParam:null,queryFn:({pageParam})=>base44.entities[entity].filter({owner_id:workspace.owner_id,workspace_id:workspace.id,...(agent?{agent}:{}),...(escaped&&entity==='NexusKnowledge'?{$or:[{title:{$regex:escaped,$options:'i'}},{body:{$regex:escaped,$options:'i'}}]}:{})},{sort:'-created_date',limit:20,...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined});
 return {...result,records:result.data?.pages.flatMap(p=>p.items)||[]};
}