import {useState} from 'react';
import {Plus,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useTargets} from '@/components/nexus/research/useResearch';
const field='rounded border border-input bg-card p-2 text-sm';
export default function MotivationTargets(){
 const {list,save,remove}=useTargets(),[f,setF]=useState({label:'',amount_usd:1000000,by_date:''});
 const submit=e=>{e.preventDefault();save.mutate({label:f.label.trim(),amount_usd:Number(f.amount_usd)||0,by_date:f.by_date||undefined},{onSuccess:()=>setF({...f,label:''})});};
 return <section className="rounded-lg border border-border p-4 space-y-3">
  <div><h4 className="font-semibold">Moonshot money goals</h4><p className="text-xs text-muted-foreground">Goals to aim the research at, not guarantees. They never trigger any action.</p></div>
  {!!list.data?.length&&<ul className="space-y-1">{list.data.map(t=><li key={t.id} className="flex items-center gap-3 text-sm"><span className="tabular-nums font-medium">${Number(t.amount_usd).toLocaleString()}</span><span className="flex-1">{t.label}{t.by_date&&<span className="text-muted-foreground"> · by {t.by_date}</span>}</span><button onClick={()=>remove.mutate(t.id)} aria-label="Remove goal" className="text-muted-foreground"><X size={14}/></button></li>)}</ul>}
  <form onSubmit={submit} className="flex flex-wrap gap-2"><input required value={f.label} onChange={e=>setF({...f,label:e.target.value})} maxLength={160} placeholder="e.g. AI agency revenue" className={`${field} flex-1 min-w-40`}/><input type="number" min="0" value={f.amount_usd} onChange={e=>setF({...f,amount_usd:e.target.value})} aria-label="Amount in dollars" className={`${field} w-36`}/><input type="date" value={f.by_date} onChange={e=>setF({...f,by_date:e.target.value})} aria-label="By date" className={field}/><Button type="submit" disabled={save.isPending||!f.label.trim()}><Plus/>Add goal</Button></form>
 </section>;
}