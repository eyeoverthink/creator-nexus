import {formatDistanceToNow} from 'date-fns';
import {describeMonitorTask} from '@/components/nexus/monitor/taskMonitorSources';
export default function TaskMonitorCard({task,source,now}){
 const info=describeMonitorTask(task,source);
 const active=[...source.running,...source.waiting].includes(task.status);
 const stale=active&&info.updated&&now-info.updated.getTime()>300000;
 const expired=active&&task.expires_at&&new Date(task.expires_at).getTime()<now;
 return <article className="rounded-lg border border-border bg-background p-4 space-y-3">
  <div className="flex flex-wrap items-start justify-between gap-2">
   <h3 className="font-medium break-words min-w-0">{info.title}</h3>
   <span className="text-xs rounded border border-border bg-secondary px-2 py-1">{task.status.replaceAll('_',' ')}</span>
  </div>
  <p className="text-sm break-words">{info.brief.length>240?`${info.brief.slice(0,240)}…`:info.brief}</p>
  {info.brief.length>240&&<details><summary className="text-sm text-primary cursor-pointer">Full task brief</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm">{info.brief}</p></details>}
  <dl className="text-xs text-muted-foreground space-y-1 break-words">
   <div><dt className="inline">Agent / node: </dt><dd className="inline text-foreground">{info.node}</dd></div>
   <div><dt className="inline">Workspace: </dt><dd className="inline font-mono">{task.workspace_id||'Not reported'}</dd></div>
  </dl>
  {info.progress===null?<p className="text-xs text-muted-foreground">Progress not reported by this runner.</p>:<div className="space-y-1">
   <div className="flex justify-between text-xs text-muted-foreground"><span>{info.done} of {info.total} steps reported complete</span><span>{info.progress}%</span></div>
   <progress aria-label={`${info.title}: reported steps complete`} value={info.done} max={info.total} className="w-full h-2 accent-primary"/>
  </div>}
  <div className="border-t border-border pt-2 text-xs text-muted-foreground">
   {info.updated?<time dateTime={info.updated.toISOString()} title={info.updated.toLocaleString()}>Last report {formatDistanceToNow(info.updated,{addSuffix:true})}</time>:'Last report time unavailable'}
   {expired?<p className="text-caution mt-1">Lease or queue deadline passed; stored status may be outdated.</p>:stale&&<p className="text-caution mt-1">No update in over 5 minutes. Current execution is unconfirmed.</p>}
  </div>
 </article>;
}