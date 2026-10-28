import {useState} from 'react';
import {Plus,X,RotateCcw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import useChecklist from '@/components/nexus/audit/useChecklist';
export default function WeekendChecklist(){
 const {items,add,toggle,remove,reset}=useChecklist(),[label,setLabel]=useState(''),list=items.data||[],n=list.filter(i=>i.done).length;
 const submit=e=>{e.preventDefault();if(label.trim())add.mutate(label.trim(),{onSuccess:()=>setLabel('')});};
 return <div className="max-w-2xl space-y-4">
  <div className="flex items-center gap-3"><p className="text-sm tabular-nums">{n} / {list.length} done</p><div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary transition-all" style={{width:`${list.length?n/list.length*100:0}%`}}/></div><Button variant="outline" size="sm" disabled={!n||reset.isPending} onClick={()=>reset.mutate()}><RotateCcw/>Reset</Button></div>
  {items.isPending||!items.data?.length?<p role="status" className="text-sm text-muted-foreground">Loading…</p>:
   <ul className="divide-y divide-border rounded-lg border border-border bg-card">{list.map(i=><li key={i.id} className="flex items-center gap-3 px-3 py-2">
    <input type="checkbox" checked={i.done} onChange={()=>toggle.mutate(i)} aria-label={i.label} className="h-4 w-4"/>
    <span className={`flex-1 text-sm ${i.done?'line-through text-muted-foreground':''}`}>{i.label}</span>
    {i.preset&&<span className="text-xs text-muted-foreground">preset</span>}
    <button onClick={()=>remove.mutate(i.id)} aria-label={`Remove ${i.label}`} className="text-muted-foreground hover:text-foreground"><X size={16}/></button>
   </li>)}</ul>}
  <form onSubmit={submit} className="flex gap-2"><input value={label} onChange={e=>setLabel(e.target.value)} maxLength={200} placeholder="Add your own task" className="flex-1 rounded border border-input bg-card p-2 text-sm"/><Button type="submit" disabled={!label.trim()||add.isPending}><Plus/>Add</Button></form>
 </div>;
}