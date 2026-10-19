import {Sparkles,RefreshCw} from 'lucide-react';
import {Image} from '@/components/ui/image';
import {Button} from '@/components/ui/button';

function fmtTime(sec){
 const s=Math.max(0,Math.round(Number(sec)||0));
 return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}

export default function SceneTimelineStrip({scenes=[],activeIndex=0,duration=0,onSeek,onGenerate,generating=false,canGenerate=false}){
 if(!scenes.length&&!canGenerate)return null;
 return <div className="rounded-lg border border-border bg-card p-3 space-y-2.5">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <span className="text-xs font-medium flex items-center gap-1.5"><Sparkles size={13} className="text-primary"/>Synced Scene Visuals ({scenes.length})</span>
   {canGenerate&&<Button variant="outline" size="sm" disabled={generating} onClick={onGenerate} className="h-7 text-xs gap-1.5"><RefreshCw size={12} className={generating?'animate-spin':''}/>{generating?'Generating AI scenes…':scenes.length?'Regenerate AI visuals':'Generate AI scene visuals'}</Button>}
  </div>
  {!!scenes.length&&<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
   {scenes.map((sc,idx)=>{
    const startS=duration>0?sc.start_ratio*duration:sc.start_s||0;
    const endS=duration>0?sc.end_ratio*duration:sc.end_s||0;
    const active=idx===activeIndex;
    return <button key={sc.id||idx} type="button" onClick={()=>onSeek?.(startS)} className={`group text-left rounded-md border p-1.5 transition-colors ${active?'border-primary bg-selection':'border-border bg-secondary hover:bg-hover'}`}>
     <div className="relative aspect-video w-full overflow-hidden rounded bg-background mb-1">
      <Image src={sc.image_url} alt={sc.caption||`Scene ${idx+1}`} className="h-full w-full object-cover"/>
      <span className="absolute bottom-1 right-1 rounded bg-background/85 px-1 py-0.5 font-mono text-[10px] text-foreground">{fmtTime(startS)}–{fmtTime(endS)}</span>
     </div>
     <p className="text-[11px] leading-4 text-muted-foreground line-clamp-2">{sc.caption}</p>
    </button>;
   })}
  </div>}
 </div>;
}