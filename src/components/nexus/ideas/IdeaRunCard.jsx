import {STATUS} from '@/components/nexus/agents/statusStyles';
import ComplaintList from '@/components/nexus/ideas/ComplaintList';
import IdeaCard from '@/components/nexus/ideas/IdeaCard';
export default function IdeaRunCard({run}){
 const a=run.audit_snapshot;
 return <article className="space-y-5">
  <header className="flex flex-wrap justify-between gap-2 text-xs"><span className={STATUS[run.status]}>{run.status}</span><span className="text-muted-foreground">{run.niche} · {run.provider}{run.web_research?' + web research':''}{a?` · audit ${a.days} day(s), ${a.total_hours} h, ${a.complaint_count} complaints`:''} · {new Date(run.created_date).toLocaleString()}</span></header>
  {run.error&&<p className="text-sm text-destructive">{run.error}</p>}
  {run.status==='running'&&<p role="status" className="text-sm text-muted-foreground">Still running…</p>}
  {(!!run.my_complaints?.length||!!run.niche_complaints?.length)&&<div className="grid md:grid-cols-2 gap-6">
   {!!run.my_complaints?.length&&<ComplaintList title="What you complain about most" items={run.my_complaints.map(c=>[c.complaint,c.evidence])}/>}
   {!!run.niche_complaints?.length&&<ComplaintList title={`What other ${run.niche} complain about`} items={run.niche_complaints.map(c=>[c.complaint,c.source])}/>}
  </div>}
  {!!run.ideas?.length&&<div className="grid lg:grid-cols-3 gap-3">{run.ideas.map((i,n)=><IdeaCard key={n} idea={i}/>)}</div>}
 </article>;
}