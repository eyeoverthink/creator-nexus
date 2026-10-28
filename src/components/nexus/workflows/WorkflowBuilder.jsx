import {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Loader2,Play,Plus,Save} from 'lucide-react';
import WorkflowCanvas from './WorkflowCanvas';
import NodeInspector from './NodeInspector';
import RunHistory from './RunHistory';
import {runWorkflow,validateWorkflow} from './runWorkflow';
const uid=()=>Math.random().toString(36).slice(2,10);
export default function WorkflowBuilder({workspace,data,graph,setGraph}){
 const qc=useQueryClient(),{lookup,catalog}=data,[sel,setSel]=useState(null),[steps,setSteps]=useState(null),[busy,setBusy]=useState(''),[msg,setMsg]=useState(''),[consent,setConsent]=useState(false),[runKey,setRunKey]=useState(0);
 const upd=patch=>setGraph(g=>({...g,...patch,dirty:true}));
 const add=entry=>upd({nodes:[...graph.nodes,{id:uid(),type:entry.type,x:40+graph.nodes.length*40%600,y:40+graph.nodes.length*70%420,config:{}}]});
 const save=async()=>{setBusy('save');setMsg('');try{const body={name:graph.name.trim()||'Untitled workflow',nodes:graph.nodes,edges:graph.edges};const rec=graph.id?await base44.entities.NexusWorkflow.update(graph.id,body):await base44.entities.NexusWorkflow.create({...body,owner_id:workspace.owner_id,workspace_id:workspace.id});setGraph({...graph,...body,id:rec.id,dirty:false});qc.invalidateQueries({queryKey:['wf-list']});setMsg('Saved.');return rec.id;}catch(e){setMsg(e.message);}finally{setBusy('');}};
 const run=async()=>{const {errors}=validateWorkflow(graph.nodes,graph.edges,lookup);if(errors.length)return setMsg(errors.join(' '));const hosted=graph.nodes.some(n=>lookup(n.type)?.hosted);if(hosted&&!consent)return setMsg('Approve hosted agent runs first.');const id=graph.dirty||!graph.id?await save():graph.id;if(!id)return;setBusy('run');setMsg('');try{await runWorkflow({workflow:{...graph,id},workspace,lookup,onStep:setSteps});setMsg('Run finished.');}catch(e){setMsg(e.message);}finally{setBusy('');setRunKey(k=>k+1);}};
 const node=graph.nodes.find(n=>n.id===sel),{errors}=validateWorkflow(graph.nodes,graph.edges,lookup);
 const palette=catalog.filter(c=>c.kind!=='catalog');
 return <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
  <aside className="space-y-2"><h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Palette</h3><div className="space-y-1 max-h-[560px] overflow-y-auto">{palette.map(c=><button key={c.type} onClick={()=>add(c)} className="w-full text-left text-xs p-2 rounded border border-border hover:bg-hover flex items-center gap-2"><Plus size={12} className="shrink-0"/><span className="truncate">{c.label}</span></button>)}</div></aside>
  <section className="space-y-3 min-w-0">
   <div className="flex flex-wrap items-center gap-2"><input aria-label="Workflow name" value={graph.name} maxLength={120} onChange={e=>upd({name:e.target.value})} className="h-8 flex-1 min-w-[180px] rounded-md px-2 bg-secondary border border-border text-sm"/><Button variant="outline" disabled={!!busy} onClick={save}>{busy==='save'?<Loader2 className="animate-spin"/>:<Save/>}Save</Button><Button disabled={!!busy} onClick={run}>{busy==='run'?<Loader2 className="animate-spin"/>:<Play/>}Run workflow</Button></div>
   <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>I approve hosted agent runs for this workflow run (agent steps use integration credits).</label>
   <WorkflowCanvas nodes={graph.nodes} edges={graph.edges} lookup={lookup} selectedId={sel} steps={steps} onSelect={setSel} onMove={(id,x,y)=>setGraph(g=>({...g,dirty:true,nodes:g.nodes.map(n=>n.id===id?{...n,x,y}:n)}))} onConnect={(s,t)=>upd({edges:[...graph.edges,{id:uid(),source:s,target:t}]})} onRemoveEdge={id=>upd({edges:graph.edges.filter(e=>e.id!==id)})}/>
   <p role="status" className="text-xs text-muted-foreground">{graph.nodes.length} nodes · {graph.edges.length} connections · {errors.length?`Not ready: ${errors[0]}`:'Ready to run'}{graph.dirty?' · unsaved changes':''}</p>
   {msg&&<p role="alert" className="text-xs">{msg}</p>}
  </section>
  <aside className="space-y-6"><NodeInspector node={node} entry={node&&lookup(node.type)} step={steps?.find(s=>s.node_id===sel)} edges={graph.edges} onChange={config=>upd({nodes:graph.nodes.map(n=>n.id===sel?{...n,config}:n)})} onDelete={()=>{upd({nodes:graph.nodes.filter(n=>n.id!==sel),edges:graph.edges.filter(e=>e.source!==sel&&e.target!==sel)});setSel(null);}}/><RunHistory workflowId={graph.id} refreshKey={runKey} onShow={setSteps}/></aside>
 </div>;
}