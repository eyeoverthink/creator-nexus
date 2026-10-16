import {useState} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import useJobStatuses from '@/components/nexus/spark/useJobStatuses';
import SparkVideoPlayer from '@/components/nexus/spark/SparkVideoPlayer';
import {parseJobBody} from '@/components/nexus/spark/jobVideoData';

export default function WatchJobVideo({event,workspace}){
 const [open,setOpen]=useState(false),body=parseJobBody(event.body),sourceId=body?.source_event_id;
 const currentWorkspace=workspace||{id:event.workspace_id,owner_id:event.owner_id};
 const jobs=useJobStatuses(currentWorkspace,open&&event.kind==='job.done'?[{job_event_id:sourceId}]:[]);
 const video=jobs.data?.[sourceId];
 if(event.kind!=='job.done'||typeof sourceId!=='string'||!/^[A-Za-z0-9_-]{6,64}$/.test(sourceId))return null;
 return <Dialog open={open} onOpenChange={setOpen}>
  <button className="text-xs text-primary underline" onClick={()=>setOpen(true)}>Watch</button>
  <DialogContent className="max-h-[90vh] overflow-y-auto">
   <DialogHeader><DialogTitle>Finished video</DialogTitle><DialogDescription>{event.message||'Your saved runner video'}</DialogDescription></DialogHeader>
   {open&&(jobs.isPending?<p role="status" className="text-sm text-muted-foreground">Checking saved video…</p>:jobs.error?<div role="alert" className="text-sm"><p className="text-destructive">Could not check the saved video: {jobs.error.message}</p><button className="text-primary underline" onClick={()=>jobs.refetch()}>Retry</button></div>:<SparkVideoPlayer fileUri={video?.file_uri} videoUrl={video?.video_url} sizeBytes={video?.size_bytes??video?.file_size_bytes} uploadedAt={video?.uploaded_at} title={event.message} preload="none"/>)}
  </DialogContent>
 </Dialog>;
}