import {useEffect,useRef} from 'react';
import {Sparkles} from 'lucide-react';
import VideoOutputPreview from '@/components/nexus/spark/VideoOutputPreview';
import SparkCardImage,{resolveSparkCardImage} from '@/components/nexus/spark/SparkCardImage';
import JobStatusTag from '@/components/nexus/spark/JobStatusTag';
import {Button} from '@/components/ui/button';
import {rubric,safeSource} from '@/components/nexus/spark/sparkClient';
import SparkSafety from '@/components/nexus/spark/SparkSafety';
import SparkJobStatus from '@/components/nexus/spark/SparkJobStatus';
export default function SparkVideoCard({card,spark,jobs,compact=false,readOnly=false}){
 const element=useRef(null);
 const focused=new URLSearchParams(window.location.search).get('card')===card.id;
 useEffect(()=>{if(focused){element.current?.focus({preventScroll:true});element.current?.scrollIntoView({block:'center'});}},[focused,card.id]);
 const wn=card.why_now||{},blocked=!!card.gates_failed?.length||card.safe_by_default?.sameness?.verdict==='block'||card.safe_by_default?.risk_level==='high';
 const output=jobs?.data?.[card.job_event_id],status=output?.kind==='job.done'?'Ready':output?.kind==='job.failed'?'Failed':output?.kind==='job.claimed'?'Rendering':card.status==='script_drafted'?'Needs review':card.status==='queued'?'Queued':'Idea';
 return <article ref={element} tabIndex={-1} aria-label={card.hook_title} className="min-w-0 rounded-lg border border-border bg-card p-3 space-y-3">
  {output?.kind==='job.done'?<VideoOutputPreview card={card} title={card.hook_title} poster={resolveSparkCardImage(card)} fileUri={output.file_uri} videoUrl={output.video_url} sizeBytes={output.size_bytes??output.file_size_bytes} uploadedAt={output.uploaded_at}/>:<SparkCardImage card={card}/>}
  <div className="flex flex-wrap items-center gap-2 text-[11px]"><span className="rounded-md bg-secondary px-2 py-1">{card.format}</span>{card.is_pick&&<span className="text-primary flex items-center gap-1"><Sparkles size={12}/>Director’s pick</span>}<span className="ml-auto"><JobStatusTag status={status}/></span></div>
  <h3 className="font-heading text-sm leading-5 line-clamp-2">{card.hook_title}</h3><p className="text-sm text-muted-foreground">{card.one_line_pitch}</p>
  {!compact&&<><p className="text-xs"><span className="text-muted-foreground">Why it fits: </span>{card.why_it_fits_you}</p><div className="space-y-2 text-xs"><p>{wn.reason}</p><a href={safeSource(wn.source_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline">{wn.source_name}</a><p className="text-muted-foreground">{wn.source_published_at} · {wn.age_days} days old · {wn.evidence} · {wn.source_type}</p>{wn.evidence==='snippet'&&<p className="text-caution">Not opened, verify before using.</p>}</div><p className="border-l-2 border-primary pl-3 text-sm">{card.signature_twist}</p><p className="text-xs text-muted-foreground">Effort: {card.effort?.minutes??'unknown'} minutes · {card.effort?.usd??'unknown'} dollars</p></>}
  <details className="text-xs"><summary className="cursor-pointer text-muted-foreground">Rubric score: {card.director_score?.toFixed(3)} · why?</summary><p className="mt-2 text-muted-foreground">{rubric}</p><dl className="mt-2 space-y-1">{Object.entries(card.director_parts||{}).map(([key,value])=><div key={key} className="flex justify-between gap-3"><dt>{key.replaceAll('_',' ')}</dt><dd>{Number(value).toFixed(3)}</dd></div>)}</dl></details>
  {card.narration&&<details className="text-sm"><summary className="cursor-pointer text-primary">Read saved narration</summary><p className="mt-3 whitespace-pre-wrap leading-relaxed">{card.narration}</p></details>}
  <SparkSafety card={card}/>{blocked&&<p className="text-xs text-destructive">Blocked: {(card.gates_failed||['Safety gate']).join(', ')}</p>}
  {card.job_event_id?<SparkJobStatus card={card} event={jobs?.data?.[card.job_event_id]} error={jobs?.error} loading={jobs?.isPending}/>:!readOnly&&!blocked&&<Button variant="outline" disabled={!!spark.busy||!!spark.approval} onClick={()=>spark.make(card)} className="w-full">{card.narration?'Review script':'Make it'}</Button>}
 </article>;
}