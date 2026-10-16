import {useState} from 'react';
import {Play} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
export default function VideoPreviewDialog({url,title,preload,onError}){
 const [open,setOpen]=useState(false);
 return <Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><button className="studio-video-preview" aria-label={'Watch '+(title||'finished video')}>
   <video src={url} preload={preload} muted playsInline tabIndex={-1} aria-hidden="true" onError={onError}/>
   <span className="studio-play"><Play size={24} aria-hidden="true"/></span><span className="studio-watch">Watch video</span>
  </button></DialogTrigger>
  <DialogContent className="studio-video-modal max-w-4xl">
   <DialogHeader><DialogTitle>{title||'Your finished video'}</DialogTitle><DialogDescription>Your saved creation. Play, pause, or view full screen.</DialogDescription></DialogHeader>
   {open&&<video key={url} src={url} controls playsInline preload="metadata" aria-label={title||'Finished video'} onError={onError} className="w-full max-h-[70dvh] rounded-xl bg-background"/>}
  </DialogContent>
 </Dialog>;
}