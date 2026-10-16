import {useEffect,useState} from 'react';
import {Film,Play} from 'lucide-react';
import useVideoUrl from '@/components/nexus/library/useVideoUrl';
export default function VideoThumbnail({video}){
 const {url}=useVideoUrl(video),[portrait,setPortrait]=useState(false),[failed,setFailed]=useState(false);
 const thumbnail=url?url.split('#')[0]+'#t=0.5':null;
 useEffect(()=>setFailed(false),[thumbnail]);
 return <div className={'relative flex w-full items-center justify-center overflow-hidden rounded-md bg-background '+(portrait?'aspect-[9/16]':'aspect-video')}>
  {thumbnail&&!failed?<video key={thumbnail} src={thumbnail} muted playsInline preload="metadata" tabIndex={-1} aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" onLoadedMetadata={e=>setPortrait(e.currentTarget.videoHeight>e.currentTarget.videoWidth)} onError={()=>setFailed(true)}/>:<Film className="text-muted-foreground" size={28} aria-hidden="true"/>}
  {!video.waiting&&<span className="relative rounded-avatar border border-border bg-popover p-3"><Play size={18} aria-hidden="true"/></span>}
 </div>;
}