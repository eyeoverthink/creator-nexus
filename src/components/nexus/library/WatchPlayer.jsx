import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import useVideoUrl from '@/components/nexus/library/useVideoUrl';
import {videoDate,videoSize} from '@/components/nexus/library/videoRecords';
import VideoProductionDetails from '@/components/nexus/library/VideoProductionDetails';
import VerifiableProvenancePanel from '@/components/nexus/library/VerifiableProvenancePanel';
import SyncedSceneStage,{buildFallbackScenes} from '@/components/nexus/spark/SyncedSceneStage';
import SceneTimelineStrip from '@/components/nexus/spark/SceneTimelineStrip';
import {resolveSparkCardImage} from '@/components/nexus/spark/SparkCardImage';
import {base44} from '@/api/base44Client';

export default function WatchPlayer({video,children}){
 const {url,loading,error,retry}=useVideoUrl(video),[failed,setFailed]=useState(false),videoRef=useRef(null),[currentTime,setCurrentTime]=useState(0),[duration,setDuration]=useState(0),[generating,setGenerating]=useState(false);
 const card=video.sparkCard;
 const [localScenes,setLocalScenes]=useState(()=>card?.scene_images||[]);
 useEffect(()=>{setFailed(false);if(card?.scene_images?.length)setLocalScenes(card.scene_images);},[url,card?.scene_images]);
 const scenes=localScenes.length?localScenes:buildFallbackScenes(video.description||card?.narration||'',resolveSparkCardImage(card));
 const progressRatio=duration>0?Math.min(0.999,Math.max(0,currentTime/duration)):0;
 const activeIndex=Math.max(0,scenes.findIndex((s,idx)=>progressRatio>=(s.start_ratio??idx/scenes.length)&&progressRatio<=(s.end_ratio??(idx+1)/scenes.length)));
 const generateVisuals=async()=>{
  if(!card?.id||generating)return;
  setGenerating(true);
  try{
   const {data}=await base44.functions.invoke('sparkEngine',{action:'generate_scene_images',spark_id:card.id,narration:video.description||card.narration});
   if(Array.isArray(data?.scene_images)&&data.scene_images.length)setLocalScenes(data.scene_images);
  }finally{setGenerating(false);}
 };
 return <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
  <section aria-label="Video player" className="min-w-0 space-y-3">
   {loading?<p role="status" className="text-muted-foreground">Opening saved video…</p>:url?<>
    <SyncedSceneStage url={url} title={video.title} preload="metadata" scenes={scenes} activeIndex={activeIndex} videoRef={videoRef} onTimeUpdate={e=>setCurrentTime(e.currentTarget.currentTime||0)} onLoadedMetadata={e=>setDuration(e.currentTarget.duration||0)} onError={()=>setFailed(true)}/>
    <SceneTimelineStrip scenes={scenes} activeIndex={activeIndex} duration={duration} onSeek={t=>{if(videoRef.current){videoRef.current.currentTime=t;setCurrentTime(t);}}} onGenerate={generateVisuals} generating={generating} canGenerate={!!card?.id}/>
   </>:<div className="flex min-h-64 items-center justify-center rounded-lg border border-border bg-background p-6 text-muted-foreground"><p role="status">{video.waiting?'Still being saved to the app':'A secure video link is unavailable.'}</p></div>}
   {failed&&<p role="status" className="text-sm text-muted-foreground">The video link didn't load. Try the Download link.</p>}
   {error&&<div role="alert" className="space-y-2 text-sm"><p className="text-destructive">{error.message}</p><Button variant="outline" onClick={()=>retry()}>Retry video link</Button></div>}
   <VerifiableProvenancePanel video={video}/>
  </section>
  <aside aria-label="Video details" className="min-w-0 space-y-5">
   <h1 className="break-words font-heading text-2xl leading-8">{video.title}</h1>
   {video.description&&<p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{video.description}</p>}
   <dl className="space-y-3 text-sm"><div><dt className="text-muted-foreground">Uploaded</dt><dd><time dateTime={video.uploadedAt}>{videoDate(video.uploadedAt)}</time></dd></div><div><dt className="text-muted-foreground">Size</dt><dd>{videoSize(video.sizeBytes)}</dd></div></dl>
   {url&&<a href={url} download target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-md border border-input px-4 text-sm text-link hover:bg-secondary">Download</a>}
   <VideoProductionDetails production={video.production}/>
   {children}
  </aside>
 </div>;
}