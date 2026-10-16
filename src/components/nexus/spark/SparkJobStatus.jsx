import SparkVideoPlayer from '@/components/nexus/spark/SparkVideoPlayer';
import StatusPill from '@/components/nexus/spark/StatusPill';
export default function SparkJobStatus({card,event,error,loading}){
 const state=event?.kind==='job.done'?'Done':event?.kind==='job.failed'?'Failed':event?.kind==='job.claimed'?'Claimed by runner':'Queued';
 return <div className="space-y-4 text-sm">
  {state==='Done'&&<SparkVideoPlayer fileUri={event?.file_uri} videoUrl={event?.video_url} title={card.hook_title} sizeBytes={event?.size_bytes??event?.file_size_bytes} uploadedAt={event?.uploaded_at}/>}
  <StatusPill status={state==='Done'?'ready':state==='Failed'?'failed':state==='Claimed by runner'?'rendering':'queued'}/>
  {loading&&<p role="status" className="text-muted-foreground">Checking your creation…</p>}
  {error&&<p role="alert" className="text-destructive">Status unavailable: {error.message}</p>}
  {state==='Failed'&&<p className="text-destructive">{event.error||'No error details reported.'}</p>}
  <details data-advanced className="text-xs text-muted-foreground"><summary className="cursor-pointer">Production details</summary><div className="space-y-2 mt-3">
   <p className="break-all font-mono">Job: {card.job_event_id}</p>{event?.runner_id&&<p className="font-mono">Runner: {event.runner_id}</p>}
   {state==='Done'&&<p>Audio: {event.audio_s??event.video_duration_s??'not reported'} s · Total: {event.total_s??'not reported'} s · Size: {event.file_size_bytes??'not reported'} bytes</p>}
   {event?.output_path&&<p className="break-all font-mono">VPS output: {event.output_path}</p>}
  </div></details>
 </div>;
}