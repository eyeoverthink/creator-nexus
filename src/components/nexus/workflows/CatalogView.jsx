import {useState} from 'react';
import {KIND_LABEL} from './workflowCatalog';
const TONE={runnable:'text-success border-success/40',guidance:'text-caution border-caution/40',catalog:'text-muted-foreground border-border'};
export default function CatalogView({catalog,loading,onAdd}){
 const [kind,setKind]=useState('all');const shown=catalog.filter(c=>kind==='all'||c.kind===kind);
 const groups=[...new Set(shown.map(c=>c.group))];
 return <div className="space-y-5">
  <div className="flex flex-wrap gap-2">{['all','runnable','guidance','catalog'].map(k=><button key={k} onClick={()=>setKind(k)} className={`px-3 h-8 rounded-md border text-xs ${kind===k?'border-primary bg-selection text-foreground':'border-border text-muted-foreground'}`}>{k==='all'?'Everything':KIND_LABEL[k]}</button>)}</div>
  {loading&&<p role="status" className="text-xs text-muted-foreground">Loading your skills…</p>}
  {groups.map(g=><section key={g} className="space-y-2"><h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{g}</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{shown.filter(c=>c.group===g).map(c=><article key={c.type} className="p-4 rounded-lg border border-border bg-card flex flex-col gap-2">
   <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-medium min-w-0 break-words">{c.label}</h3><span className={`shrink-0 text-[11px] px-1.5 py-0.5 rounded border ${TONE[c.kind]}`}>{KIND_LABEL[c.kind]}</span></div>
   <p className="text-xs text-muted-foreground break-words line-clamp-4">{c.description}</p>
   <p className="text-[11px] font-mono text-muted-foreground">in: {c.inputs.join(', ')||'—'} · out: {c.output||'—'}{c.hosted?' · hosted run, needs approval':''}{c.agentScope?` · for ${c.agentScope}`:''}{c.enabled===false?' · disabled':''}</p>
   {onAdd&&c.kind!=='catalog'&&<button onClick={()=>onAdd(c)} className="mt-auto self-start text-xs text-link">Add to canvas</button>}
  </article>)}</div></section>)}
 </div>;
}