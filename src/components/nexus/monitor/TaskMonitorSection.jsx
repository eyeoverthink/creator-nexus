import {Button} from '@/components/ui/button';
import useTaskMonitorSource from '@/components/nexus/monitor/useTaskMonitorSource';
import TaskMonitorCard from '@/components/nexus/monitor/TaskMonitorCard';
export default function TaskMonitorSection({source,filter,now}){
 const query=useTaskMonitorSource(source,filter);
 return <section aria-label={source.label} className="min-w-0 rounded-lg border border-border bg-card p-4 space-y-4">
  <div className="flex items-center justify-between gap-3"><h2 className="font-heading text-base">{source.label}</h2><Button variant="ghost" size="sm" disabled={query.isFetching} onClick={()=>query.refetch()}>{query.isFetching?'Updating…':'Refresh'}</Button></div>
  {query.isPending?<p role="status" className="text-sm text-muted-foreground">Loading task reports…</p>:null}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Task reports could not load. Use Refresh to retry; any cards below are from the last successful update.</p>}
  {query.data?.pages.every(page=>!page.items.length)&&<p className="py-6 text-sm text-muted-foreground">No {filter==='all'?'active':filter} tasks reported.</p>}
  {query.data?.pages.map((page,index)=><div key={index} className="space-y-3">{page.items.map(task=><TaskMonitorCard key={task.id} task={task} source={source} now={now}/>)}</div>)}
  {query.hasNextPage&&<Button variant="outline" disabled={query.isFetching} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more tasks'}</Button>}
 </section>;
}