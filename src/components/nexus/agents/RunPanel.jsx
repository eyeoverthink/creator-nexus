import {useState} from 'react';
import {Loader2,Play} from 'lucide-react';
import {Button} from '@/components/ui/button';
import RunResult from '@/components/nexus/agents/RunResult';
import ProviderPicker from '@/components/nexus/agents/ProviderPicker';
import {loadOllama} from '@/components/nexus/agents/ollamaSettings';
const field='mt-1 w-full rounded border border-input bg-card p-2 text-sm';
export default function RunPanel({agent,run,lastRun,preset}){
 const [outcome,setOutcome]=useState(preset?.outcome||''),[context,setContext]=useState(preset?.context||''),[provider,setProvider]=useState('hosted'),[ollama,setOllama]=useState(loadOllama);
 const submit=e=>{e.preventDefault();run.mutate({outcome,context,provider,ollama});};
 const result=run.data?.run||lastRun;
 return <div className="grid xl:grid-cols-2 gap-6">
  <form onSubmit={submit} className="space-y-3">
   <label className="block text-xs text-muted-foreground">Desired outcome for this run<textarea rows={2} required value={outcome} onChange={e=>setOutcome(e.target.value)} maxLength={1000} placeholder={agent.outcome} className={field}/></label>
   <label className="block text-xs text-muted-foreground">Context (optional)<textarea rows={4} value={context} onChange={e=>setContext(e.target.value)} maxLength={6000} placeholder="Notes, transcript, niche, leads…" className={field}/></label>
   <ProviderPicker provider={provider} setProvider={setProvider} ollama={ollama} setOllama={setOllama}/>
   {run.error&&<p role="alert" className="text-sm text-destructive">{run.error.message}</p>}
   <Button type="submit" disabled={run.isPending||!outcome.trim()}>{run.isPending?<Loader2 className="animate-spin"/>:<Play/>}{run.isPending?'Running…':`Run ${agent.name}`}</Button>
   <p className="text-xs text-muted-foreground">The agent reads its memory and only the tools enabled in its brief. Sensitive actions are queued for your approval, never executed by the run.</p>
  </form>
  {result?<RunResult run={result}/>:<p className="text-sm text-muted-foreground">No runs yet.</p>}
 </div>;
}