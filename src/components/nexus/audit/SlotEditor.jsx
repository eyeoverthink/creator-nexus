import {useState} from 'react';
import {Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {CATEGORIES} from '@/components/nexus/audit/auditCategories';
import {useSaveEntry} from '@/components/nexus/audit/useAuditData';
const field='mt-1 w-full rounded border border-input bg-background p-2 text-sm';
const pick=e=>({activity:e?.activity||'',category:e?.category||'inbox',energy:e?.energy||5,dollar_value:e?.dollar_value??0,complaint:e?.complaint||''});
export default function SlotEditor({date,time,entry,prev,onNext,onClose}){
 const [f,setF]=useState(()=>pick(entry)),{save,remove}=useSaveEntry();
 const set=k=>e=>setF({...f,[k]:e.target.value});
 const submit=e=>{e.preventDefault();save.mutate({id:entry?.id,slot_date:date,slot_time:time,activity:f.activity.trim(),category:f.category,energy:Number(f.energy),dollar_value:Math.max(0,Number(f.dollar_value)||0),complaint:f.complaint.trim()},{onSuccess:onNext});};
 const error=save.error||remove.error;
 return <form onSubmit={submit} className="px-3 pb-3 pt-1 grid sm:grid-cols-6 gap-3">
  <label className="sm:col-span-3 text-xs text-muted-foreground">What did you do?<input required autoFocus maxLength={200} value={f.activity} onChange={set('activity')} className={field}/></label>
  <label className="sm:col-span-3 text-xs text-muted-foreground">Category<select value={f.category} onChange={set('category')} className={field}>{CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
  <label className="sm:col-span-2 text-xs text-muted-foreground">Energy (1–10)<select value={f.energy} onChange={set('energy')} className={field}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>
  <label className="sm:col-span-2 text-xs text-muted-foreground">$ value of this half hour<input type="number" min="0" step="1" value={f.dollar_value} onChange={set('dollar_value')} className={field}/></label>
  <label className="sm:col-span-6 text-xs text-muted-foreground">Complaint (optional, feeds the idea finder)<input maxLength={300} value={f.complaint} onChange={set('complaint')} placeholder="What annoyed you about this?" className={field}/></label>
  {error&&<p role="alert" className="sm:col-span-6 text-sm text-destructive">{error.message}</p>}
  <div className="sm:col-span-6 flex flex-wrap gap-2">
   <Button type="submit" size="sm" disabled={save.isPending||!f.activity.trim()}>{save.isPending&&<Loader2 className="animate-spin"/>}Save & next</Button>
   {!entry&&prev&&<Button type="button" size="sm" variant="outline" onClick={()=>setF(pick(prev))}>Copy previous</Button>}
   {entry&&<Button type="button" size="sm" variant="outline" disabled={remove.isPending} onClick={()=>remove.mutate(entry.id,{onSuccess:onClose})}>Clear</Button>}
  </div>
 </form>;
}