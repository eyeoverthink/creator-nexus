import {ArrowUpRight,Clock,Sparkles,MoreHorizontal} from 'lucide-react';
import {Button} from '@/components/ui/button';
export default function SparkCard({spark,onChoose,busy}){
 return <article className="spark-creative-card rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
  <div className="studio-card-visual" aria-hidden="true"><Sparkles size={48}/></div>
  <div className="flex justify-between flex-wrap gap-3"><span className="text-xs text-primary">{spark.format}</span><span className="flex gap-2 items-center text-xs text-muted-foreground"><Clock size={16} aria-hidden="true"/>{spark.effort_minutes} min estimate</span></div>
  <div><h3 className="font-heading text-xl">{spark.title}</h3><p className="mt-3 text-base font-medium">“{spark.hook}”</p></div>
  {spark.risk_flags.length>0&&<p className="text-sm text-destructive">Review: {spark.risk_flags.join(' · ')}</p>}
  <div className="mt-auto pt-2 space-y-3"><p className="text-xs text-muted-foreground">Text production only. Video and voice cost are not quoted or authorized here.</p><Button variant={spark.draft_id?'outline':'default'} disabled={busy} onClick={()=>onChoose(spark)} className="w-full">{spark.draft_id?'Open my project':'Create my brief & script'}<ArrowUpRight size={16} className="ml-2"/></Button></div>
  <details className="studio-card-menu"><summary aria-label={'More about '+spark.title}><MoreHorizontal size={22} aria-hidden="true"/><span className="sr-only">More details</span></summary><div className="space-y-4 mt-4"><div className="grid sm:grid-cols-2 gap-3">{spark.scenes.map((scene,i)=><div key={i} className="border border-border rounded-lg p-3 text-sm leading-relaxed"><span className="text-muted-foreground block mb-1">Scene {i+1}</span>{scene}</div>)}</div><p className="text-sm text-muted-foreground leading-relaxed">{spark.why_now}</p><p className="text-sm"><span className="text-primary">Make it yours:</span> {spark.signature_move}</p></div></details>
 </article>;
}