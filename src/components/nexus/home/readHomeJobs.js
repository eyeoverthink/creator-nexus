import {base44} from '@/api/base44Client';
import {canonicalVideoEvents,cardsForJobs} from '@/components/nexus/library/videoReads';
import {sourcePattern,videoRecord,videoPath} from '@/components/nexus/library/videoRecords';
const jobPath=card=>card?'/spark?view=kanban&card='+encodeURIComponent(card.id):'/spark?view=logs';
export default async function readHomeJobs(scope){
 const [queued,reviews]=await Promise.all([
  base44.entities.NexusEvent.filter({...scope,kind:'job.queued'},{sort:'-created_date',limit:4,fields:['message','created_date']}),
  base44.entities.SparkCard.filter({...scope,status:'script_drafted',$or:[{job_event_id:{$exists:false}},{job_event_id:''},{job_event_id:null}]},{sort:'-updated_date',limit:4,fields:['hook_title','updated_date']})
 ]);
 const ids=queued.items.map(event=>event.id);
 const [videos,cards,statuses]=await Promise.all([
  canonicalVideoEvents(scope,ids),cardsForJobs(scope,ids),
  Promise.all(ids.map(id=>base44.entities.NexusEvent.filter({...scope,kind:{$in:['job.claimed','job.done','job.failed']},body:{$regex:sourcePattern([id])}},{sort:'-created_date',limit:1,fields:['kind','created_date']})))
 ]);
 const rows=queued.items.map((event,index)=>{
  const card=cards.get(event.id),video=videos.get(event.id),kind=statuses[index].items[0]?.kind;
  const status=video||kind==='job.done'?'Ready':kind==='job.failed'?'Failed':kind==='job.claimed'?'Rendering':'Queued';
  return {id:event.id,title:card?.hook_title||event.message||'Untitled job '+event.id,status,date:event.created_date,saving:!video&&kind==='job.done',path:video?videoPath(videoRecord(video,card)):jobPath(card)};
 });
 rows.push(...reviews.items.map(card=>({id:card.id,title:card.hook_title||'Untitled script',status:'Needs review',date:card.updated_date,path:jobPath(card)})));
 return rows.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
}