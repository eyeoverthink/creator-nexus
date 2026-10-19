import {useEffect,useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {waitingForVideo} from '@/components/nexus/spark/jobVideoData';
import {resolveSparkCardImage} from '@/components/nexus/spark/SparkCardImage';
import SyncedSceneStage,{buildFallbackScenes} from '@/components/nexus/spark/SyncedSceneStage';
import SceneTimelineStrip from '@/components/nexus/spark/SceneTimelineStrip';

export default function SparkVideoPlayer({fileUri,videoUrl,title,sizeBytes,uploadedAt,preload='metadata',card,sparkId,narration,sceneImages}){
 const qc=useQueryClient(),videoRef=useRef(null),[currentTime,setCurrentTime]=useState(0),[duration,setDuration]=useState(0),[generating,setGenerating]=useState(false),[localScenes,setLocalScenes]=useState(()=>Array.isArray(sceneImages)&&sceneImages.length?sceneImages:card?.scene_images||[]);
 const resolvedSparkId=sparkId||card?.id;
 const resolvedNarration=narration||card?.narration||'';
 useEffect(()=>{
  if(Array.isArray(sceneImages)&&sceneImages.length)setLocalScenes(sceneImages);
  else if(Array.isArray(card?.scene_images)&&card.scene_images.length)setLocalScenes(card.scene_images);
 },[sceneImages,card?.scene_images]);

 const scenes=localScenes.length?localScenes:buildFallbackScenes(resolvedNarration,resolveSparkCardImage(card));
 const progressRatio=duration>0?Math.min(0.999,Math.max(0,currentTime/duration)):0;
 const activeIndex=Math.max(0,scenes.findIndex((s,idx)=>progressRatio>=(s.start_ratio??idx/scenes.length)&&progressRatio<=(s.end_ratio??(idx+1)/scenes.length)));

 const generateVisuals=async()=>{
  if(!resolvedSparkId||generating)return;
  setGenerating(true);
  try{
   const {data}=await base44.functions.invoke('sparkEngine',{action:'generate_scene_images',spark_id:resolvedSparkId,narration:resolvedNarration});
   if(Array.isArray(data?.scene_images)&&data.scene_images.length){
    setLocalScenes(data.scene_images);
    qc.invalidateQueries({queryKey:['spark','cards']});
   }
  }finally{setGenerating(false);}
 };

 const publicUrl=typeof videoUrl==='string'&&videoUrl.startsWith('https://')?videoUrl:null;
 const video=useQuery({queryKey:['spark','video',fileUri||null],enabled:!publicUrl&&!!fileUri,queryFn:async()=>{const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:fileUri,expires_in:3600});return signed_url;},staleTime:45*60*1000,refetchInterval:!publicUrl&&fileUri?45*60*1000:false});
 const url=publicUrl||(typeof video.data==='string'&&video.data.startsWith('https://')?video.data:null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[url]);
 if(!publicUrl&&!fileUri)return <p className="text-muted-foreground">{waitingForVideo}</p>;
 if(!publicUrl&&video.isPending)return <p role="status" className="text-muted-foreground">Opening saved video…</p>;
 if(!publicUrl&&video.error)return <div role="alert"><p className="text-destructive">Could not open video: {video.error.message}</p><button className="text-primary underline" onClick={()=>video.refetch()}>Retry</button></div>;
 if(!url)return <p className="text-muted-foreground">{waitingForVideo}</p>;
 return <div className="space-y-3">
  <SyncedSceneStage url={url} title={title} preload={preload} scenes={scenes} activeIndex={activeIndex} videoRef={videoRef} onTimeUpdate={e=>setCurrentTime(e.currentTarget.currentTime||0)} onLoadedMetadata={e=>setDuration(e.currentTarget.duration||0)} onError={()=>setFailed(true)}/>
  <SceneTimelineStrip scenes={scenes} activeIndex={activeIndex} duration={duration} onSeek={t=>{if(videoRef.current){videoRef.current.currentTime=t;setCurrentTime(t);}}} onGenerate={generateVisuals} generating={generating} canGenerate={!!resolvedSparkId}/>
  {failed&&<p role="status" className="text-muted-foreground">The video link didn't load. Try the Download link.</p>}
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
   {typeof sizeBytes==='number'&&<span>{(sizeBytes/(1024*1024)).toFixed(2)} MB</span>}
   {uploadedAt&&<time dateTime={uploadedAt}>Uploaded {new Date(uploadedAt).toLocaleString()}</time>}
   <a className="text-primary underline" href={url} download target="_blank" rel="noopener noreferrer">Download</a>
  </div>
  {fileUri&&!publicUrl&&<p className="text-muted-foreground">Saved video (stored privately)</p>}
 </div>;
}