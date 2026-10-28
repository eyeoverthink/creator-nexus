import {useEffect,useState} from 'react';
import {Loader2,Save} from 'lucide-react';
import {Button} from '@/components/ui/button';
export default function MemoryPanel({agent,save}){
 const [m,setM]=useState(agent.memory||'');
 useEffect(()=>setM(agent.memory||''),[agent.memory]);
 return <div className="space-y-3 max-w-3xl">
  <p className="text-xs text-muted-foreground">Read at the start of every run; runs append dated notes. Edit freely.</p>
  <textarea rows={16} value={m} onChange={e=>setM(e.target.value)} maxLength={12000} className="w-full rounded border border-input bg-card p-3 text-xs font-mono"/>
  <div className="flex items-center gap-3"><Button disabled={save.isPending||m===(agent.memory||'')} onClick={()=>save.mutate({memory:m})}>{save.isPending?<Loader2 className="animate-spin"/>:<Save/>}Save memory</Button><span className="text-xs text-muted-foreground">{m.length.toLocaleString()} / 12,000</span></div>
 </div>;
}