import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {PROVIDER_PRESETS} from '@/components/nexus/partner/partnerProviderPresets';
import {findProviderModels} from '@/components/nexus/partner/fraymusPartnerCloud';
const field='mt-2 w-full h-11 rounded border border-input bg-background px-3';
export default function PartnerProviderForm({count,onSave,onCancel}){
 const first=PROVIDER_PRESETS[0],[preset,setPreset]=useState(first),[label,setLabel]=useState(`${first.name} ${count+1}`),[baseUrl,setBaseUrl]=useState(first.base_url),[key,setKey]=useState(''),[typed,setTyped]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const choose=id=>{const next=PROVIDER_PRESETS.find(x=>x.id===id);setPreset(next);setBaseUrl(next.base_url);setLabel(`${next.name} ${count+1}`);};
 const save=async e=>{
  e.preventDefault();setBusy(true);setError('');
  try{
   let url;try{url=new URL(baseUrl.trim());}catch{throw new Error('Enter the full https:// address of the service.');}
   if(url.protocol!=='https:')throw new Error('Use an https:// address.');
   const provider={id:crypto.randomUUID(),label:label.trim().slice(0,60)||preset.name,kind:preset.kind,base_url:url.toString().replace(/\/+$/,''),api_key:key.trim()};
   const names=[...new Set(typed.split(',').map(x=>x.trim()).filter(x=>x&&x.length<=200))].slice(0,100);
   onSave({...provider,models:names.length?names:await findProviderModels(provider)});
  }catch(err){setError(err.message);}finally{setBusy(false);}
 };
 return <form onSubmit={save} className="border border-border rounded p-3 space-y-4 text-sm">
  <label className="block">Service<select value={preset.id} onChange={e=>choose(e.target.value)} className={field}>{PROVIDER_PRESETS.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
  <label className="block">Name<input required maxLength={60} value={label} onChange={e=>setLabel(e.target.value)} className={field}/></label>
  <label className="block">Address<input required value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} placeholder="https://…" className={field}/></label>
  <label className="block">API key or OAuth access token<input required type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} className={field}/>{preset.help&&<span className="block text-xs text-muted-foreground mt-1">{preset.help}</span>}</label>
  <label className="block">Model names (optional)<input value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Leave empty to find them automatically" className={field}/><span className="block text-xs text-muted-foreground mt-1">Separate several names with commas.</span></label>
  {error&&<p role="alert" className="text-destructive">{error}</p>}
  <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy||!key.trim()}>{busy?'Checking account…':'Save & find models'}</Button><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button></div>
 </form>;
}