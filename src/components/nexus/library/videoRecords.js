import {parseJobBody} from '@/components/nexus/spark/jobVideoData';
import {escapeSearch} from '@/components/nexus/library/libraryConstants';
import videoProduction from '@/components/nexus/library/videoProduction';
export const videoFields=['kind','body','created_date','owner_id','workspace_id'];
export const sourcePattern=ids=>'"source_event_id"\\s*:\\s*"('+ids.map(escapeSearch).join('|')+')"';
export function httpsVideoUrl(value){
 if(typeof value!=='string'||!value.startsWith('https://'))return null;
 try{return new URL(value).protocol==='https:'?value:null;}catch{return null;}
}
export const sourceId=event=>parseJobBody(event.body)?.source_event_id;
export function videoRecord(event,card,completion){
 const body=parseJobBody(event.body)||{},jobId=body.job_id||'job-'+body.source_event_id;
 return {type:'video',id:event.id,eventId:event.id,sourceId:body.source_event_id,jobId,workspaceId:event.workspace_id,sortDate:event.created_date,
  title:card?.hook_title||card?.title||'Untitled video '+jobId,description:card?.narration||card?.one_line_pitch||'',
  videoUrl:httpsVideoUrl(body.video_url),fileUri:typeof body.file_uri==='string'?body.file_uri:null,
  sizeBytes:body.size_bytes??body.file_size_bytes,uploadedAt:body.uploaded_at||body.transferred_at||event.created_date,
  waiting:event.kind==='job.done',production:videoProduction(body,completion)};
}
export const videoPath=video=>'/watch/'+encodeURIComponent(video.jobId);
export const videoSize=bytes=>typeof bytes==='number'&&Number.isFinite(bytes)?(bytes/(1024*1024)).toFixed(2)+' MB':'Size unavailable';
export const videoDate=value=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString():'Upload date unavailable';