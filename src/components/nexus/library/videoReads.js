import {base44} from '@/api/base44Client';
import {videoFields,sourcePattern,sourceId,videoRecord} from '@/components/nexus/library/videoRecords';
import {parseJobBody} from '@/components/nexus/spark/jobVideoData';
const eventRead=(query,sort,limit=50,cursor)=>base44.entities.NexusEvent.filter(query,{sort,limit,fields:videoFields,...(cursor?{cursor}:{})});
export async function canonicalVideoEvents(scope,ids){
 const first=new Map();let remaining=[...new Set(ids.filter(id=>typeof id==='string'&&id.length<=128))];
 while(remaining.length){
  const page=await eventRead({...scope,kind:'job.video',body:{$regex:sourcePattern(remaining)}},'created_date');
  for(const event of page.items){const id=sourceId(event);if(remaining.includes(id)&&!first.has(id))first.set(id,event);}
  const next=remaining.filter(id=>!first.has(id));if(!page.has_more||next.length===remaining.length)break;remaining=next;
 }
 const result=new Map();remaining=[...first.keys()];
 while(remaining.length){
  const page=await eventRead({...scope,kind:'job.video',$or:remaining.map(id=>({created_date:first.get(id).created_date,body:{$regex:sourcePattern([id])}}))},'id');
  for(const event of page.items){const id=sourceId(event);if(remaining.includes(id)&&!result.has(id))result.set(id,event);}
  const next=remaining.filter(id=>!result.has(id));if(!page.has_more||next.length===remaining.length)break;remaining=next;
 }
 return result;
}
export async function cardsForJobs(scope,ids){
 const cards=new Map();let remaining=[...new Set(ids)];
 while(remaining.length){
  const page=await base44.entities.SparkCard.filter({...scope,job_event_id:{$in:remaining}},{sort:'created_date',limit:50,fields:['id','job_event_id','card_id','hook_title','narration','one_line_pitch','format','topic_tags','image_url','scene_images','signature_twist','why_now','safe_by_default','signal_snapshot','director_score','director_parts']});
  for(const card of page.items)if(!cards.has(card.job_event_id))cards.set(card.job_event_id,card);
  const next=remaining.filter(id=>!cards.has(id));if(!page.has_more||next.length===remaining.length)break;remaining=next;
 }
 return cards;
}
export async function readVideoPage(scope,cursor,{readyOnly=false,excludeEventId,limit=24}={}){
 const page=await eventRead({...scope,kind:readyOnly?'job.video':{$in:['job.video','job.done']},...(excludeEventId?{id:{$ne:excludeEventId}}:{})},'-created_date',limit,cursor);
 const ids=[...new Set(page.items.map(sourceId).filter(id=>typeof id==='string'&&id.length<=128))];
 const [canonical,cards]=await Promise.all([canonicalVideoEvents(scope,ids),cardsForJobs(scope,ids)]);
 const items=page.items.filter(event=>{const id=sourceId(event);return ids.includes(id)&&(event.kind==='job.video'?canonical.get(id)?.id===event.id:!canonical.has(id));}).map(event=>videoRecord(event,cards.get(sourceId(event))));
 return {items,next_cursor:page.next_cursor,has_more:page.has_more};
}
export async function findVideo(ownerId,jobId){
 const guessedSource=jobId.startsWith('job-')?jobId.slice(4):jobId;
 const jobPattern='"job_id"\\s*:\\s*"'+jobId.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"';
 const page=await eventRead({owner_id:ownerId,kind:{$in:['job.video','job.done']},$or:[{body:{$regex:jobPattern}},{body:{$regex:sourcePattern([guessedSource])}}]},'created_date',1);
 const event=page.items[0],id=event&&sourceId(event);if(!id)return null;
 const scope={owner_id:ownerId,workspace_id:event.workspace_id};
 const [canonical,cards,completion]=await Promise.all([canonicalVideoEvents(scope,[id]),cardsForJobs(scope,[id]),eventRead({...scope,kind:'job.done',body:{$regex:sourcePattern([id])}},'created_date',1)]);
   const report=completion.items.find(item=>sourceId(item)===id);
   return {video:videoRecord(canonical.get(id)||event,cards.get(id),parseJobBody(report?.body)),scope};
}