import {partnerEngine} from '@/components/nexus/partner/fraymusPartnerEngines';
export default function PartnerModelPicker({partner}){
 const p=partner.state.profile,providers=partner.state.providers,engine=partnerEngine(p,providers);
 const local=[...new Set([!p.providerId&&p.model,...partner.models].filter(Boolean))];
 const value=engine.type==='builtin'?'builtin|':`${p.providerId||''}|${p.model}`;
 const modelsFor=x=>[...new Set([x.id===p.providerId&&p.model,...x.models].filter(Boolean))];
 const choose=v=>{const split=v.indexOf('|');partner.updateProfile({providerId:v.slice(0,split),model:v.slice(split+1)});};
 return <label className="block">Model<select value={value} onChange={e=>choose(e.target.value)} className="mt-2 w-full h-11 rounded border border-input bg-background px-3">
  <option value="builtin|">Built-in AI (no setup needed)</option>
  {local.length>0&&<optgroup label="Ollama on this computer">{local.map(m=><option key={m} value={`|${m}`}>{m}</option>)}</optgroup>}
  {providers.map(x=>modelsFor(x).length>0&&<optgroup key={x.id} label={x.label}>{modelsFor(x).map(m=><option key={m} value={`${x.id}|${m}`}>{m}</option>)}</optgroup>)}
 </select><span className="block text-xs text-muted-foreground mt-2">If the chosen model can't be reached, the built-in AI answers instead and says so.</span></label>;
}