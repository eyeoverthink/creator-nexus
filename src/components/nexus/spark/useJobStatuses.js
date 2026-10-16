import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {scope} from '@/components/nexus/spark/sparkClient';
import {parseJobBody,earlierEvent} from '@/components/nexus/spark/jobVideoData';
export default function useJobStatuses(workspace,cards){
 const ids=cards.map(c=>c.job_event_id).filter(id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{6,64}$/.test(id)).sort();
 return useQuery({queryKey:['spark','jobs',workspace?.id,ids.join(',')],enabled:!!workspace?.id&&!!ids.length,refetchInterval:15000,queryFn:async()=>{
  const out={},videos={},query={...scope(workspace),kind:{$in:['job.claimed','job.done','job.failed','job.video']},body:{$regex:'"source_event_id"\\s*:\\s*"('+ids.join('|')+')"'}};let cursor;
  do{const page=await base44.entities.NexusEvent.filter(query,{sort:'-created_date',limit:100,fields:['kind','body','created_date'],...(cursor?{cursor}:{})});for(const event of page.items){const data=parseJobBody(event.body);if(!data||!ids.includes(data.source_event_id))continue;if(event.kind==='job.video'){const previous=videos[data.source_event_id];if(!previous||earlierEvent(event,previous.event)<0)videos[data.source_event_id]={event,data};continue;}const previous=out[data.source_event_id];if(!previous||(previous.kind==='job.claimed'&&event.kind!=='job.claimed'))out[data.source_event_id]={...data,kind:event.kind};}cursor=page.has_more?page.next_cursor:null;}while(cursor);
  for(const [id,video] of Object.entries(videos))out[id]={...out[id],...video.data,kind:'job.done'};
  return out;
 }});
}