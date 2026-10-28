import {useState} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {SLOTS,today,currentSlot} from '@/components/nexus/audit/auditCategories';
import {useDayEntries} from '@/components/nexus/audit/useAuditData';
import SlotRow from '@/components/nexus/audit/SlotRow';
const shift=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toLocaleDateString('en-CA');};
export default function AuditDayLog(){
 const [date,setDate]=useState(today),[open,setOpen]=useState(''),day=useDayEntries(date);
 const go=d=>{if(d){setDate(d);setOpen('');}};
 const by=Object.fromEntries((day.data||[]).map(e=>[e.slot_time,e])),now=date===today()?currentSlot():'',logged=day.data?.length||0;
 return <div className="space-y-4 max-w-4xl">
  <div className="flex flex-wrap items-center gap-2">
   <Button variant="outline" size="icon" aria-label="Previous day" onClick={()=>go(shift(date,-1))}><ChevronLeft/></Button>
   <input type="date" aria-label="Audit day" value={date} onChange={e=>go(e.target.value)} className="rounded border border-input bg-card px-2 h-9 text-sm"/>
   <Button variant="outline" size="icon" aria-label="Next day" onClick={()=>go(shift(date,1))}><ChevronRight/></Button>
   <span className="text-sm text-muted-foreground ml-2 tabular-nums">{logged} / {SLOTS.length} half hours · {logged/2} h logged</span>
  </div>
  <p className="text-xs text-muted-foreground">Track every 30 minutes for 2 days: what you did, energy 1–10, and what that half hour was worth in dollars.</p>
  {day.isPending?<p role="status" className="text-sm text-muted-foreground">Loading…</p>:day.error?<p role="alert" className="text-sm text-destructive">{day.error.message}</p>:
   <ol className="divide-y divide-border rounded-lg border border-border bg-card">{SLOTS.map((t,i)=><SlotRow key={t} date={date} time={t} entry={by[t]} prev={by[SLOTS[i-1]]} isNow={t===now} open={open===t} onToggle={()=>setOpen(open===t?'':t)} onNext={()=>setOpen(SLOTS[i+1]||'')}/>)}</ol>}
 </div>;
}