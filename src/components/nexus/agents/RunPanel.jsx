import {useState} from 'react';
import {Loader2,Play} from 'lucide-react';
import {Button} from '@/components/ui/button';
import RunResult from '@/components/nexus/agents/RunResult';
const field='mt-1 w-full rounded border border-input bg-card p-2 text-sm';
const stored=()=>{try{return JSON.parse(localStorage.getItem('starter-agent-ollama')||'null')||{endpoint:'http://localhost:11434',model:''};}catch{return {endpoint:'http://localhost:11434',model:''};}};
export default function RunPanel({agent,run,lastRun}){
 const [outcome,setOutcome]=useState(''),[context,setContext]=useState(''),[provider,setProvider]=useState('hosted'),[ollama,setOllama]=useState(stored);
 const setO=k=>e=>{const n={...ollama,[k]:e.target.value};setOllama(n);localStorage.setItem('starter-agent-ollama',JSON.stringify(n));};
 const submit=e=>{e.preventDefault();run.mutate({outcome,context,provider,ollama});};
 const result=run.data?.run||lastRun;
 return <div className="grid xl:grid-cols-2 gap-6">
  <form onSubmit={submit} className="space-y-3">
   <label className="block text-xs text-muted-foreground">Desired outcome for this run<textarea rows={2} required value={outcome} onChange={e=>setOutcome(e.target.value)} maxLength={1000} placeholder={agent.outcome} className={field}/></label>
   <label className="block text-xs text-muted-foreground">Context (optional)<textarea rows={4} value={context} onChange={e=>setContext(e.target.value)} maxLength={6000} placeholder="Notes, transcript, niche, leads…" className={field}/></label>
   <fieldset className="flex gap-4 text-sm"><legend className="text-xs text-muted-foreground mb-1">AI provider (no automatic fallback)</legend>{[['hosted','Hosted AI'],['ollama','My Ollama']].map(([v,l])=><label key={v} className="flex items-center gap-2"><input type="radio" name="provider" checked={provider===v} onChange={()=>setProvider(v)}/>{l}</label>)}</fieldset>
   {provider==='ollama'&&<div className="grid sm:grid-cols-2 gap-3"><label className="text-xs text-muted-foreground">Ollama address<input value={ollama.endpoint} onChange={setO('endpoint')} className={field}/></label><label className="text-xs text-muted-foreground">Model<input value={ollama.model} onChange={setO('model')} placeholder="llama3.1:8b" className={field}/></label></div>}
   {run.error&&<p role="alert" className="text-sm text-destructive">{run.error.message}</p>}
   <Button type="submit" disabled={run.isPending||!outcome.trim()}>{run.isPending?<Loader2 className="animate-spin"/>:<Play/>}{run.isPending?'Running…':`Run ${agent.name}`}</Button>
   <p className="text-xs text-muted-foreground">The agent reads its memory and only the tools enabled in its brief. Sensitive actions are queued for your approval, never executed by the run.</p>
  </form>
  {result?<RunResult run={result}/>:<p className="text-sm text-muted-foreground">No runs yet.</p>}
 </div>;
}