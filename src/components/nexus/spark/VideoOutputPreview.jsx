import {useState} from 'react';
import {Play} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import SparkVideoPlayer from '@/components/nexus/spark/SparkVideoPlayer';
import useVideoUrl from '@/components/nexus/library/useVideoUrl';
export default function VideoOutputPreview({title,fileUri,videoUrl,sizeBytes,uploadedAt}){
 const [open,setOpen]=useState(false),{url}=useVideoUrl({fileUri,videoUrl}),thumbnail=url?url.split('#')[0]+'#t=0.5':null;
 return <Dialog open={open} onOpenChange={setOpen}>
  <button onClick={()=>setOpen(true)} aria-label={'Watch '+title} className="relative aspect-video w-full overflow-hidden rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground">
   {thumbnail&&<video key={thumbnail} src={thumbnail} preload="metadata" muted playsInline aria-hidden="true" className="absolute inset-0 h-full w-full object-cover"/>}
   <span className="relative rounded-avatar bg-popover border border-border p-3"><Play size={20} aria-hidden="true"/></span>
  </button>
  <DialogContent className="max-w-4xl max-h-[90dvh] overflow-y-auto">
   <DialogHeader><DialogTitle className="text-2xl leading-8">{title}</DialogTitle><DialogDescription>Saved video and existing render details.</DialogDescription></DialogHeader>
   {open&&<SparkVideoPlayer fileUri={fileUri} videoUrl={videoUrl} title={title} sizeBytes={sizeBytes} uploadedAt={uploadedAt}/>}
  </DialogContent>
 </Dialog>;
}