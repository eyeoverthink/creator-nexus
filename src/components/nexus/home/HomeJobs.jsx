import {Link} from 'react-router-dom';
import {ArrowUpRight,Clapperboard} from 'lucide-react';
import {Button} from '@/components/ui/button';
import StatusPill from '@/components/nexus/spark/StatusPill';
export default function HomeJobs({cards,jobs}){
 const current=cards.filter(card=>card.job_event_id).slice(0,6);
 return <section className="studio-section" aria-labelledby="continue-title"><div className="studio-section-heading"><h2 id="continue-title">Continue</h2><Link to="/spark" className="studio-text-link">Open Create<ArrowUpRight size={16} aria-hidden="true"/></Link></div>
  {current.length?<div className="studio-job-grid">{current.map(card=>{const job=jobs[card.job_event_id],status=job?.kind==='job.done'?'ready':job?.kind==='job.failed'?'failed':job?.kind==='job.claimed'?'rendering':'queued';return <article key={card.id} className="studio-job-tile"><Clapperboard size={24} className="text-primary" aria-hidden="true"/><h3>{card.hook_title}</h3><StatusPill status={status}/><Link to="/spark" className="studio-text-link mt-4">Open creation<ArrowUpRight size={16} aria-hidden="true"/></Link></article>;})}</div>:<div className="studio-empty"><p>Start something today. Pick it up here next time.</p><Button asChild variant="outline"><Link to="/spark">Start a creation</Link></Button></div>}
 </section>;
}