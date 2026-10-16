import {Sparkles,MoreHorizontal} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {rubric,safeSource} from '@/components/nexus/spark/sparkClient';
import SparkSafety from '@/components/nexus/spark/SparkSafety';
import SparkJobStatus from '@/components/nexus/spark/SparkJobStatus';
import StatusPill from '@/components/nexus/spark/StatusPill';
export default function SparkVideoCard({card,spark,jobs,compact=false,readOnly=false}){
 const wn=card.why_now||{},blocked=!!card.gates_failed?.length||card.safe_by_default?.sameness?.verdict==='block'||card.safe_by_default?.risk_level==='high';
 return <article className={'spark-creative-card min-w-0 rounded-xl border bg-card p-5 space-y-4 '+(card.is_pick?'border-primary/60':'border-border')}>
  <div className="studio-card-visual" aria-hidden="true"><Sparkles size={48}/></div>
  <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-secondary px-3 py-2">{card.format}</span>{card.is_pick&&<span className="text-primary flex items-center gap-1"><Sparkles size={16} aria-hidden="true"/>Director’s pick</span>}{!card.job_event_id&&<StatusPill status="review"/>}</div>
  <h3 className="font-heading text-xl">{card.hook_title}</h3><p className="text-base text-muted-foreground">{card.one_line_pitch}</p>
  {blocked&&<p className="text-sm text-destructive">Blocked: {(card.gates_failed||['Safety gate']).join(', ')}</p>}
  {card.job_event_id?<SparkJobStatus card={card} event={jobs?.data?.[card.job_event_id]} error={jobs?.error} loading={jobs?.isPending}/>:!readOnly&&!blocked&&<Button disabled={!!spark.busy||!!spark.approval} onClick={()=>spark.make(card)} className="w-full">{card.narration?'Review script':'Make it'}</Button>}
  <details className="studio-card-menu"><summary aria-label={'More about '+card.hook_title}><MoreHorizontal size={22} aria-hidden="true"/><span className="sr-only">More details</span></summary><div className="space-y-4 mt-4">
   {!compact&&<><p className="text-sm"><span className="text-muted-foreground">Why it fits: </span>{card.why_it_fits_you}</p><div className="space-y-2 text-sm"><p>{wn.reason}</p><a href={safeSource(wn.source_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline">{wn.source_name}</a><p className="text-muted-foreground">{wn.source_published_at} · {wn.age_days} days old · {wn.evidence} · {wn.source_type}</p>{wn.evidence==='snippet'&&<p className="text-caution">Not opened, verify before using.</p>}</div><p className="border-l-2 border-primary pl-3 text-sm">{card.signature_twist}</p><p className="text-sm text-muted-foreground">Effort: {card.effort?.minutes??'unknown'} minutes · {card.effort?.usd??'unknown'} dollars</p></>}
   <details className="text-sm" data-advanced><summary className="cursor-pointer text-muted-foreground">Rubric score: {card.director_score?.toFixed(3)} · why?</summary><p className="mt-2 text-muted-foreground">{rubric}</p><dl className="mt-2 space-y-1">{Object.entries(card.director_parts||{}).map(([key,value])=><div key={key} className="flex justify-between gap-3"><dt>{key.replaceAll('_',' ')}</dt><dd>{Number(value).toFixed(3)}</dd></div>)}</dl></details>
   {card.narration&&<details className="text-sm"><summary className="cursor-pointer text-primary">Read saved narration</summary><p className="mt-3 whitespace-pre-wrap leading-relaxed">{card.narration}</p></details>}
   <SparkSafety card={card}/>
  </div></details>
 </article>;
}