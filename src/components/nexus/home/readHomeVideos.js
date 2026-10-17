import {base44} from '@/api/base44Client';
import {canonicalVideoEvents,cardsForJobs} from '@/components/nexus/library/videoReads';
import {videoFields,sourceId,videoRecord} from '@/components/nexus/library/videoRecords';
export default async function readHomeVideos(scope){
 const page=await base44.entities.NexusEvent.filter({...scope,kind:'job.video'},{sort:'-created_date',limit:12,fields:videoFields});
 const ids=page.items.map(sourceId).filter(id=>typeof id==='string'&&id.length<=128);
 const [canonical,cards]=await Promise.all([canonicalVideoEvents(scope,ids),cardsForJobs(scope,ids)]);
 return [...canonical.values()].map(event=>videoRecord(event,cards.get(sourceId(event)))).sort((a,b)=>b.sortDate.localeCompare(a.sortDate));
}