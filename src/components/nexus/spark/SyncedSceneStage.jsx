import {useState} from 'react';
import {Layers} from 'lucide-react';
import {Image} from '@/components/ui/image';

export function buildFallbackScenes(narration='',poster='',topicPool=[]){
 const sentences=String(narration||'').match(/[^.!?]+[.!?]+/g)?.map(s=>s.trim()).filter(Boolean)||[];
 if(!sentences.length)return poster?[{id:'scene-1',index:0,start_ratio:0,end_ratio:1,start_s:0,end_s:30,caption:'Visual scene',image_url:poster}]:[];
 const count=Math.min(5,Math.max(3,Math.ceil(sentences.length/2))),out=[];
 for(let i=0;i<count;i++){
  const sIdx=Math.floor((i*sentences.length)/count),eIdx=Math.max(sIdx+1,Math.floor(((i+1)*sentences.length)/count));
  const caption=sentences.slice(sIdx,eIdx).join(' ').trim();
  const img=i===0&&poster?poster:(topicPool[i%topicPool.length]||poster);
  out.push({id:`scene-${i+1}`,index:i,start_ratio:Number((i/count).toFixed(3)),end_ratio:Number(((i+1)/count).toFixed(3)),start_s:i*10,end_s:(i+1)*10,caption,image_url:img});
 }
 return out;
}

export default function SyncedSceneStage({url,title,preload='metadata',scenes=[],activeIndex=0,videoRef,onTimeUpdate,onLoadedMetadata,onError}){
 const [composite,setComposite]=useState(true);
 const activeScene=scenes[activeIndex]||scenes[0]||null;
 const showOverlay=composite&&!!activeScene?.image_url;
 return <div className="relative flex justify-center overflow-hidden rounded-lg border border-border bg-background">
  <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
   <defs>
    <filter id="nexus-blue-key" colorInterpolationFilters="sRGB">
     <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  3.6 3.6 -1.35 0 -0.32"/>
    </filter>
   </defs>
  </svg>
  {showOverlay&&<div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
   <Image key={activeScene.image_url} src={activeScene.image_url} alt="" className="h-full w-full object-cover opacity-90 transition-opacity duration-500"/>
   <div className="absolute inset-0 bg-background/45"/>
  </div>}
  {!!scenes.length&&<button type="button" onClick={()=>setComposite(v=>!v)} className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 rounded-md border border-border bg-popover/90 px-2.5 py-1 text-[11px] text-foreground hover:bg-hover">
   <Layers size={12} className="text-primary"/>
   <span>{composite?`Scene ${activeIndex+1}/${scenes.length} · Synced Visuals`:'Raw MP4 (Blue BG)'}</span>
  </button>}
  <video ref={videoRef} key={url} controls playsInline preload={preload} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata} onError={onError} style={showOverlay?{filter:'url(#nexus-blue-key) drop-shadow(0 2px 6px rgba(0,0,0,0.85))'}:undefined} className="relative z-[1] mx-auto max-h-[70vh] w-auto max-w-full" aria-label={title||'Rendered Spark video'} src={url}/>
 </div>;
}