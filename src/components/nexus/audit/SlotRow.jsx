import {Zap} from 'lucide-react';
import {CATEGORY,fmtSlot} from '@/components/nexus/audit/auditCategories';
import SlotEditor from '@/components/nexus/audit/SlotEditor';
export default function SlotRow({date,time,entry,prev,isNow,open,onToggle,onNext}){
 return <li className={isNow?'bg-selection':''}>
  <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-hover">
   <span className="w-16 shrink-0 tabular-nums text-muted-foreground">{fmtSlot(time)}</span>
   {entry?<>
    <span className="flex-1 min-w-0 truncate">{entry.activity}{entry.complaint&&<span className="text-caution"> · complaint</span>}</span>
    <span className="hidden sm:inline text-xs text-muted-foreground">{CATEGORY[entry.category]?.label}</span>
    <span className="text-xs tabular-nums w-20 text-right inline-flex items-center justify-end gap-1"><Zap size={12}/>{entry.energy} · ${entry.dollar_value}</span>
   </>:<span className="flex-1 text-muted-foreground">{isNow?'Now · ':''}Log this half hour</span>}
  </button>
  {open&&<SlotEditor date={date} time={time} entry={entry} prev={prev} onNext={onNext} onClose={onToggle}/>}
 </li>;
}