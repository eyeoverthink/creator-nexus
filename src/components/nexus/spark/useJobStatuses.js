import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {scope} from '@/components/nexus/spark/sparkClient';
export default function useJobStatuses(workspace,cards){
 const ids=cards.map(c=>c.job_event_id).filter(id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{6,64}$/.test(id)).sort();
 return useQuery({queryKey:['spark','jobs',workspace.id,ids.join(',')],enabled:!!ids.length,refetchInterval:15000,queryFn:async()=>{
  const out={},query={...scope(workspace),kind:{$in:['job.claimed','job.done','job.failed']},body:{$regex:'"source_event_id"\\s*:\\s*"('+ids.join('|')+')"'}};let cursor;
  do{const page=await base44.entities.NexusEvent.filter(query,{sort:'-created_date',limit:100,fields:['kind','body','created_date'],...(cursor?{cursor}:{})});for(const event of page.items){let data;try{data=JSON.parse(event.body);}catch{continue;}if(!ids.includes(data.source_event_id))continue;const previous=out[data.source_event_id];if(!previous||(previous.kind==='job.claimed'&&event.kind!=='job.claimed'))out[data.source_event_id]={...data,kind:event.kind};}cursor=page.has_more?page.next_cursor:null;}while(cursor);
  return out;
 }});
}