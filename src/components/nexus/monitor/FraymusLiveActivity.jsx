import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import useFraymusLiveActivity from '@/components/nexus/monitor/useFraymusLiveActivity';
import FraymusActivityEntries from '@/components/nexus/monitor/FraymusActivityEntries';
export default function FraymusLiveActivity({compact=false}){
 const query=useFraymusLiveActivity(),data=query.data;
 return <section aria-label="Saved agent activity" className="rounded-lg border border-border bg-card p-3 space-y-3 text-sm">
  <header className="flex flex-wrap justify-between items-center gap-2"><h2 className="font-heading font-semibold">Agent registry & saved activity</h2><Button variant="outline" disabled={query.isFetching} onClick={()=>query.refetch()}>{query.isFetching?'Updating…':'Refresh'}</Button></header>
  {query.isPending&&<p role="status">Loading registry and activity…</p>}{query.error&&<p role="alert" className="text-destructive">Update failed: {query.error.message}. Previously loaded records may be stale.</p>}
  {data&&<><div className="flex flex-wrap gap-x-5 gap-y-2"><span><strong>{data.agents.length}{!data.registry_complete?'+':''}</strong> configured / saved AI profiles</span><span><strong>{data.events_24h}</strong> saved events in 24h</span><span><strong>{data.learning_records_24h}</strong> learning records in 24h</span>{data.job_counts.map(row=><span key={row.status}><strong>{row.count}</strong> {row.status} tasks</span>)}</div>
   <p className="text-xs text-muted-foreground">All workspaces owned by this account. Profiles and learning records do not prove a running worker or improved model weights. Read at {new Date(data.fetched_at).toLocaleString()}.</p>
   {data.registry_warning&&<p role="alert" className="text-caution">{data.registry_warning}</p>}{data.stale_running>0&&<p className="text-caution">{data.stale_running} claimed/running tasks have no update in over five minutes; execution is unconfirmed.</p>}
   {!compact&&<FraymusActivityEntries entries={data.activity}/>}
  </>}
  <Link to="/admin/agent-monitor" className="text-primary underline text-xs">Open task progress and activity history</Link>
 </section>;
}