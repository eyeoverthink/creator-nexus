export default function SourceStatus({run}){
 const rows=[...(run.sources||[]).map(s=>({label:`${s.type}: ${s.url||s.value}`,status:s.status,note:s.note})),...(run.youtube||[]).map(y=>({label:`YouTube: ${y.topic}`,status:y.status,note:y.note||`${y.videos.length} videos`}))];
 if(!rows.length)return null;
 return <details className="rounded-lg border border-border p-3"><summary className="text-sm cursor-pointer">Source status ({rows.filter(r=>r.status==='failed').length} failed)</summary>
  <ul className="mt-2 space-y-1 text-xs">{rows.map((r,i)=><li key={i} className="flex gap-2"><span className={r.status==='failed'?'text-destructive':'text-success'}>{r.status}</span><span className="truncate flex-1">{r.label}</span><span className="text-muted-foreground">{r.note}</span></li>)}</ul>
 </details>;
}