import {useEffect,useState} from 'react';
import {Loader2,Save} from 'lucide-react';
import {Button} from '@/components/ui/button';
import ToolToggles from '@/components/nexus/agents/ToolToggles';
const field='mt-1 w-full rounded border border-input bg-card p-2 text-sm';
export default function AgentBrief({agent,catalog,caps,save}){
 const [f,setF]=useState(null);
 useEffect(()=>{setF({role:agent.role||'',outcome:agent.outcome||'',rules:(agent.rules||[]).join('\n'),tools:agent.tools||[],definition_of_done:agent.definition_of_done||'',voice:agent.voice||''});},[agent]);
 if(!f)return null;
 const set=k=>e=>setF({...f,[k]:e.target.value});
 const submit=e=>{e.preventDefault();save.mutate({...f,rules:f.rules.split('\n').map(s=>s.trim()).filter(Boolean)});};
 return <form onSubmit={submit} className="space-y-3 max-w-3xl">
  <label className="block text-xs text-muted-foreground">Outcome (a result, not a task)<textarea rows={2} value={f.outcome} onChange={set('outcome')} maxLength={600} className={field}/></label>
  <label className="block text-xs text-muted-foreground">Role<input value={f.role} onChange={set('role')} maxLength={600} className={field}/></label>
  <label className="block text-xs text-muted-foreground">Rules (one per line, never broken)<textarea rows={7} value={f.rules} onChange={set('rules')} className={field+' font-mono text-xs'}/></label>
  <ToolToggles catalog={catalog} caps={caps} value={f.tools} onChange={tools=>setF({...f,tools})}/>
  <label className="block text-xs text-muted-foreground">Definition of done<textarea rows={2} value={f.definition_of_done} onChange={set('definition_of_done')} maxLength={1200} className={field}/></label>
  <label className="block text-xs text-muted-foreground">Voice<input value={f.voice} onChange={set('voice')} maxLength={200} className={field}/></label>
  {save.error&&<p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
  <Button type="submit" disabled={save.isPending}>{save.isPending?<Loader2 className="animate-spin"/>:<Save/>}Save brief</Button>
 </form>;
}