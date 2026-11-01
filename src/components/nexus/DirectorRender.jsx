import {useState} from 'react';
import {Loader2} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import useToolJobPoll from '@/components/nexus/useToolJobPoll';
import SparkVideoPlayer from '@/components/nexus/spark/SparkVideoPlayer';
import RunnerTransferSetup from '@/components/nexus/spark/RunnerTransferSetup';

export default function DirectorRender({result}) {
 const [style,setStyle]=useState('midnight'),[submitting,setSubmitting]=useState(false),[error,setError]=useState('');
 const [job,setJob]=useState(()=>localStorage.getItem('director-render-job')||'');
 const progress=useToolJobPoll(job,'render');
 const busy=submitting||!!job&&progress?.status!=='done'&&progress?.status!=='failed';
 const render=async()=>{
  setSubmitting(true);setError('');
  try {
   const {data}=await base44.functions.invoke('nexusRender',{action:'render',narration:result.script_used,style,voice:'af_heart',format:result.plan.aspect_ratio==='16:9'?'1920x1080':'1080x1920'});
   if(data.error)throw new Error(data.error);
   if(!data.event_id)throw new Error('The runner job was not created.');
   localStorage.setItem('director-render-job',data.event_id);setJob(data.event_id);
  } catch(e){setError(e.response?.data?.error||e.message);} finally{setSubmitting(false);}
 };
 const labels={queued:'Queued — waiting for the runner to claim this job.',running:'Runner claimed the job. Rendering narration and animated graphics…',transferring:'Rendering finished. Waiting for the video transfer service to upload the MP4.',done:'Video ready.',failed:'Rendering stopped.'};
 return <section aria-label="Render video" className="rounded-lg border border-border bg-card p-4 space-y-4">
  <h2 className="font-heading">Render video</h2>
  <p className="text-sm text-muted-foreground">Create a narrated MP4 with animated text, tables and diagrams. These are graphic cards, not photographs. The runner creates its own word-timed scene plan from this narration; it does not render the preview JSON exactly.</p>
  <label className="block text-sm">Render style<select value={style} onChange={e=>setStyle(e.target.value)} disabled={busy} className="mt-2 w-full rounded-md border border-input bg-background p-2"><option value="midnight">Midnight</option><option value="paper">Paper</option><option value="signal">Signal</option></select></label>
  <Button onClick={render} disabled={!result?.ok||!result?.plan||busy}>{busy&&<Loader2 className="animate-spin"/>}{busy?'Render in progress':'Render video on runner'}</Button>
  {job&&<div className="space-y-2"><p role="status" className="text-sm">{labels[progress?.status]||'Checking runner job…'}</p><p className="break-all font-mono text-xs text-muted-foreground">Job: {job}</p></div>}
  {(error||progress?.error)&&<p role="alert" className="text-destructive">{error||progress.error}</p>}
  {progress?.status==='done'&&<SparkVideoPlayer fileUri={progress.file_uri} videoUrl={progress.video_url} sizeBytes={progress.file_size_bytes} uploadedAt={progress.uploaded_at} title="Director Lab rendered video"/>}
  <p className="text-xs text-muted-foreground">Requires the running VPS dispatcher and video transfer service. Queued does not confirm that the VPS is online. Voice: af_heart. Videos are saved privately.</p>
  <RunnerTransferSetup/>
 </section>;
}