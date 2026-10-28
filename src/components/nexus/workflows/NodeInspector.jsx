import {KIND_LABEL} from './workflowCatalog';
const field='mt-1 w-full rounded-md p-2 bg-secondary border border-border text-xs';
export default function NodeInspector({node,entry,step,edges,onChange,onDelete}){
 if(!node)return <p className="text-xs text-muted-foreground">Select a node to edit its settings and see its inputs and outputs.</p>;
 const set=patch=>onChange({...node.config,...patch});
 return <div className="space-y-3 text-xs">
  <div><h3 className="text-sm font-medium break-words">{entry?.label||node.type}</h3><p className="text-muted-foreground">{entry?KIND_LABEL[entry.kind]:'Missing from catalog'} · in: {entry?.inputs.join(', ')||'—'} · out: {entry?.output||'—'}</p></div>
  <label className="block">Label<input value={node.config?.label||''} maxLength={60} onChange={e=>set({label:e.target.value})} className={field}/></label>
  {entry?.type==='input'&&<label className="block">Text<textarea rows={5} maxLength={8000} value={node.config?.text||''} onChange={e=>set({text:e.target.value})} className={field}/></label>}
  {entry?.hosted&&<label className="block">Task for this agent<textarea rows={4} maxLength={2000} value={node.config?.task||''} onChange={e=>set({task:e.target.value})} placeholder="e.g. Turn the incoming brief into three hooks." className={field}/></label>}
  {entry?.kind==='guidance'&&<p className="text-muted-foreground whitespace-pre-wrap break-words max-h-40 overflow-y-auto">{entry.instructions}</p>}
  <p className="text-muted-foreground">{edges.filter(e=>e.target===node.id).length} incoming · {edges.filter(e=>e.source===node.id).length} outgoing</p>
  {step&&<div className="space-y-1 border-t border-border pt-2"><p className="font-medium">Last run: {step.status}</p>{step.input&&<details><summary className="text-link">Input</summary><pre className="whitespace-pre-wrap break-words max-h-40 overflow-y-auto">{step.input}</pre></details>}{step.output&&<pre className="whitespace-pre-wrap break-words max-h-64 overflow-y-auto p-2 rounded bg-secondary">{step.output}</pre>}{step.error&&<p className="text-destructive">{step.error}</p>}{step.output&&<button onClick={()=>navigator.clipboard.writeText(step.output)} className="text-link">Copy output</button>}</div>}
  <button onClick={onDelete} className="text-destructive">Delete node</button>
 </div>;
}