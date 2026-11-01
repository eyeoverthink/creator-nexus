import {STATUS,LABEL} from '@/components/nexus/agents/statusStyles';
export default function ToolToggles({catalog,caps,value,onChange}){
 const toggle=k=>onChange(value.includes(k)?value.filter(t=>t!==k):[...value,k]);
 return <fieldset><legend className="text-xs text-muted-foreground mb-1">Tools (live status from your connections)</legend>
  <div className="grid sm:grid-cols-2 gap-2">{Object.entries(catalog).map(([k,label])=><label key={k} className="flex items-start gap-2 rounded border border-border bg-card p-2 text-sm cursor-pointer">
   <input type="checkbox" checked={value.includes(k)} onChange={()=>toggle(k)} className="mt-1"/>
   <span className="flex-1">{label}<span className={`block text-[11px] ${STATUS[caps[k]]||''}`}>{LABEL[caps[k]]||caps[k]}</span></span>
  </label>)}</div>
 </fieldset>;
}