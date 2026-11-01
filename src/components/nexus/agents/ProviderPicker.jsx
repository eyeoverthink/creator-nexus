import {useId} from 'react';
import {saveOllama} from '@/components/nexus/agents/ollamaSettings';
const field='mt-1 w-full rounded border border-input bg-card p-2 text-sm';
export default function ProviderPicker({provider,setProvider,ollama,setOllama}){
 const name=useId(),setO=k=>e=>{const n={...ollama,[k]:e.target.value};setOllama(n);saveOllama(n);};
 return <div className="space-y-3">
  <fieldset className="flex gap-4 text-sm"><legend className="text-xs text-muted-foreground mb-1">AI provider (no automatic fallback)</legend>{[['hosted','Hosted AI'],['ollama','My Ollama']].map(([v,l])=><label key={v} className="flex items-center gap-2"><input type="radio" name={name} checked={provider===v} onChange={()=>setProvider(v)}/>{l}</label>)}</fieldset>
  {provider==='ollama'&&<div className="grid sm:grid-cols-2 gap-3"><label className="text-xs text-muted-foreground">Ollama address<input value={ollama.endpoint} onChange={setO('endpoint')} className={field}/></label><label className="text-xs text-muted-foreground">Model<input value={ollama.model} onChange={setO('model')} placeholder="llama3.1:8b" className={field}/></label></div>}
 </div>;
}