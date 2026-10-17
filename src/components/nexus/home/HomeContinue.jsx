import {Link} from 'react-router-dom';
import moment from 'moment';
import HomeJobStatus from '@/components/nexus/home/HomeJobStatus';
export default function HomeContinue({query}){
 const rows=query.data||[];
 return <section aria-labelledby="continue-heading" className="space-y-4">
  <h2 id="continue-heading" className="font-heading text-lg">Continue</h2>
  {query.isLoading?<p role="status" className="text-sm text-muted-foreground">Loading recent jobs…</p>:query.error?<p role="alert" className="text-sm text-muted-foreground">Recent jobs could not load. <button className="rounded-sm underline" onClick={()=>query.refetch()}>Retry jobs</button></p>:!rows.length?<p className="text-sm text-muted-foreground">No jobs to continue yet.</p>:<div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">{rows.map(job=><Link key={job.id} to={job.path} className="home-card flex min-w-0 flex-col items-start gap-3 rounded-lg border border-border bg-card p-4" aria-label={job.title+', '+job.status}>
   <h3 className="line-clamp-2 break-words font-heading text-sm leading-5">{job.title}</h3><HomeJobStatus status={job.status}/>
   {job.saving&&<p className="text-xs text-muted-foreground">Still being saved to the app</p>}
   <time dateTime={job.date} className="mt-auto text-xs text-muted-foreground">{moment(job.date).fromNow()}</time>
  </Link>)}</div>}
 </section>;
}