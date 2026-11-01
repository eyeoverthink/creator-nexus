import {useState} from 'react';
import {Play,Sparkles} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import SparkVideoPlayer from '@/components/nexus/spark/SparkVideoPlayer';
import {Image} from '@/components/ui/image';

export default function VideoOutputPreview({title,poster,fileUri,videoUrl,sizeBytes,uploadedAt,card}){
 const [open,setOpen]=useState(false);
 const coverImage=card?.scene_images?.[0]?.image_url||card?.image_url||poster;
 const sceneCount=card?.scene_images?.length||0;
 return <Dialog open={open} onOpenChange={setOpen}>
  <button onClick={()=>setOpen(true)} aria-label={'Watch '+title} className="relative aspect-video w-full overflow-hidden rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground group">
   {coverImage&&<Image src={coverImage} alt={title||'Video cover'} className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-[1.02]"/>}
   <div className="absolute inset-0 bg-background/30"/>
   {sceneCount>0&&<span className="absolute top-2 left-2 rounded bg-background/85 px-2 py-0.5 text-[10px] font-mono text-foreground flex items-center gap-1"><Sparkles size={10} className="text-primary"/>{sceneCount} synced scenes</span>}
   <span className="relative rounded-avatar bg-popover/95 border border-border p-3"><Play size={20} aria-hidden="true"/></span>
  </button>
  <DialogContent className="max-w-4xl max-h-[90dvh] overflow-y-auto">
   <DialogHeader><DialogTitle className="text-2xl leading-8">{title}</DialogTitle><DialogDescription>Saved video with scene-synced visuals timed to narration.</DialogDescription></DialogHeader>
   {open&&<SparkVideoPlayer fileUri={fileUri} videoUrl={videoUrl} title={title} sizeBytes={sizeBytes} uploadedAt={uploadedAt} card={card} sparkId={card?.id} narration={card?.narration} sceneImages={card?.scene_images}/>}
  </DialogContent>
 </Dialog>;
}