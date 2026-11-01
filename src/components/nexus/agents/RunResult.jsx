import {STATUS} from '@/components/nexus/agents/statusStyles';
export default function RunResult({run}){
 return <article className="rounded-lg border border-border bg-card p-4 space-y-3">
  <header className="flex justify-between gap-3 text-xs"><span className={STATUS[run.status]}>{run.status}</span><span className="text-muted-foreground">{run.provider}{run.model?` · ${run.model}`:''} · {new Date(run.created_date).toLocaleString()}</span></header>
  <p className="text-sm font-medium">{run.outcome}</p>
  {run.summary&&<p className="text-sm text-muted-foreground">{run.summary}</p>}
  {run.error&&<p className="text-sm text-destructive">{run.error}</p>}
  {!!run.done?.length&&<section><h4 className="text-xs uppercase tracking-wider text-success mb-1">Done</h4><ul className="list-disc pl-5 text-sm space-y-1">{run.done.map((d,i)=><li key={i}>{d}</li>)}</ul></section>}
  {run.metric?.label&&<p className="text-sm"><span className="text-muted-foreground">Metric · {run.metric.label}:</span> <strong>{run.metric.value}</strong></p>}
  {!!run.blockers?.length&&<section><h4 className="text-xs uppercase tracking-wider text-caution mb-1">Blockers / needs you</h4><ul className="list-disc pl-5 text-sm space-y-1">{run.blockers.map((d,i)=><li key={i}>{d}</li>)}</ul></section>}
 </article>;
}