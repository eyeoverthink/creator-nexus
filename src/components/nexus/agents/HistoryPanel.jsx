import RunResult from '@/components/nexus/agents/RunResult';
export default function HistoryPanel({runs,audit}){
 return <div className="grid xl:grid-cols-2 gap-6">
  <section><h3 className="text-sm font-semibold mb-2">Runs</h3>{runs.isPending?<p role="status" className="text-sm text-muted-foreground">Loading…</p>:!(runs.data||[]).length?<p className="text-sm text-muted-foreground">No runs yet.</p>:<div className="space-y-3">{runs.data.map(r=><RunResult key={r.id} run={r}/>)}</div>}</section>
  <section><h3 className="text-sm font-semibold mb-2">Audit trail</h3>{!(audit.data||[]).length?<p className="text-sm text-muted-foreground">No events yet.</p>:<ol className="space-y-1">{audit.data.map(a=><li key={a.id} className="text-xs border-b border-border py-2"><span className="text-muted-foreground tabular-nums">{new Date(a.created_date).toLocaleString()}</span> · <span className="font-mono">{a.event}</span><p className="text-muted-foreground mt-0.5 break-words">{a.detail}</p></li>)}</ol>}</section>
 </div>;
}