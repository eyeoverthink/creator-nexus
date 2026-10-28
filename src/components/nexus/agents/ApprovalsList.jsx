import {Check,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {STATUS,LABEL} from '@/components/nexus/agents/statusStyles';
export default function ApprovalsList({actions,decide}){
 const items=actions.data||[];
 if(actions.isPending)return <p role="status" className="text-sm text-muted-foreground">Loading…</p>;
 if(!items.length)return <p className="text-sm text-muted-foreground">No proposed actions yet.</p>;
 return <ul className="space-y-3">{items.map(a=><li key={a.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
  <div className="flex flex-wrap justify-between gap-2"><p className="font-medium text-sm">{a.title}</p><span className={`text-xs ${STATUS[a.status]}`}>{LABEL[a.status]||a.status} · {a.kind}</span></div>
  <pre className="text-xs font-mono bg-background rounded p-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(a.payload,null,2)}</pre>
  <p className="text-[11px] text-muted-foreground font-mono break-all">sha256 {a.payload_sha256}</p>
  {a.blocked_reason&&<p className="text-xs text-destructive">{a.blocked_reason}</p>}
  {a.result&&<p className="text-xs text-muted-foreground break-all">Result: {JSON.stringify(a.result)}</p>}
  {a.status==='pending'&&<div className="flex gap-2"><Button size="sm" disabled={decide.isPending} onClick={()=>decide.mutate({action:a,decision:'approve'})}><Check/>Approve exactly this</Button><Button size="sm" variant="outline" disabled={decide.isPending} onClick={()=>decide.mutate({action:a,decision:'reject'})}><X/>Reject</Button></div>}
 </li>)}{decide.error&&<p role="alert" className="text-sm text-destructive">{decide.error.message}</p>}</ul>;
}