import {useState} from 'react';
import {Loader2,Lightbulb} from 'lucide-react';
import {Button} from '@/components/ui/button';
import ProviderPicker from '@/components/nexus/agents/ProviderPicker';
import {loadOllama} from '@/components/nexus/agents/ollamaSettings';
import {loadAuditSettings} from '@/components/nexus/audit/auditCategories';
const field='mt-1 w-full rounded border border-input bg-card p-2 text-sm';
export default function IdeaFinderForm({find}){
 const [f,setF]=useState({niche:'',complaints:'',price_usd:500,buyers:40,web_research:true}),[provider,setProvider]=useState('hosted'),[ollama,setOllama]=useState(loadOllama);
 const set=k=>e=>setF({...f,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value});
 const submit=e=>{e.preventDefault();find.mutate({...f,web_research:provider==='hosted'&&f.web_research,price_usd:Number(f.price_usd),buyers:Number(f.buyers),hourly_value:loadAuditSettings().hourly,provider,ollama});};
 const goal=(Number(f.price_usd)||0)*(Number(f.buyers)||0);
 return <form onSubmit={submit} className="space-y-3 max-w-3xl">
  <label className="block text-xs text-muted-foreground">Your niche (people who share your pain)<input required maxLength={200} value={f.niche} onChange={set('niche')} placeholder="e.g. working moms running a small business" className={field}/></label>
  <label className="block text-xs text-muted-foreground">What do you complain about most?<textarea rows={4} maxLength={4000} value={f.complaints} onChange={set('complaints')} placeholder="No time, calendar chaos, inbox never ends…" className={field}/></label>
  <p className="text-xs text-muted-foreground">Your time-audit hours, leaks and logged complaints are included automatically.</p>
  <div className="flex flex-wrap gap-4 items-end">
   <label className="text-xs text-muted-foreground">Price ($)<input type="number" min="1" value={f.price_usd} onChange={set('price_usd')} className={field+' w-28'}/></label>
   <label className="text-xs text-muted-foreground">Buyers<input type="number" min="1" value={f.buyers} onChange={set('buyers')} className={field+' w-28'}/></label>
   <p className="text-sm pb-2">Goal ${goal.toLocaleString()} <span className="text-xs text-muted-foreground">(a target, not a guarantee)</span></p>
  </div>
  <ProviderPicker provider={provider} setProvider={setProvider} ollama={ollama} setOllama={setOllama}/>
  {provider==='hosted'&&<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.web_research} onChange={set('web_research')}/>Research what others in this niche complain about on the web</label>}
  {find.error&&<p role="alert" className="text-sm text-destructive">{find.error.message}</p>}
  <Button type="submit" disabled={find.isPending||!f.niche.trim()}>{find.isPending?<Loader2 className="animate-spin"/>:<Lightbulb/>}{find.isPending?'Finding ideas…':'Find 3 ideas'}</Button>
 </form>;
}