import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export default function RunHistory({workflowId,refreshKey,onShow}){
 const runs=useQuery({queryKey:['wf-runs',workflowId,refreshKey],enabled:!!workflowId,queryFn:async()=>(await base44.entities.NexusWorkflowRun.filter({workflow_id:workflowId},{sort:'-created_date',limit:5})).items});
 if(!workflowId)return null;
 return <div className="space-y-2"><h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Run history</h3>{runs.isPending?<p className="text-xs">Loading…</p>:!runs.data?.length?<p className="text-xs text-muted-foreground">No runs yet.</p>:runs.data.map(r=><button key={r.id} onClick={()=>onShow(r.steps||[])} className="w-full text-left text-xs p-2 rounded border border-border hover:bg-hover"><span className={r.status==='completed'?'text-success':r.status==='failed'?'text-destructive':'text-link'}>{r.status}</span> · {new Date(r.created_date).toLocaleString()}{r.error&&<span className="block text-muted-foreground truncate">{r.error}</span>}</button>)}</div>;
}