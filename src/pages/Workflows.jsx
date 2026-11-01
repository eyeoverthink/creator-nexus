import {useState} from 'react';
import ProShell from '@/components/nexus/ProShell';
import useWorkspaceAccess from '@/components/nexus/useWorkspaceAccess';
import useWorkflowData from '@/components/nexus/workflows/useWorkflowData';
import CatalogView from '@/components/nexus/workflows/CatalogView';
import WorkflowBuilder from '@/components/nexus/workflows/WorkflowBuilder';
const blank=()=>({id:null,name:'Untitled workflow',nodes:[],edges:[],dirty:false});
export default function Workflows(){
 const {workspace,boot,createWorkspace,creating}=useWorkspaceAccess(),data=useWorkflowData(workspace);
 const [tab,setTab]=useState('catalog'),[graph,setGraph]=useState(blank);
 const open=wf=>{if(graph.dirty&&!window.confirm('Discard unsaved changes?'))return;setGraph(wf?{id:wf.id,name:wf.name,nodes:wf.nodes||[],edges:wf.edges||[],dirty:false}:blank());setTab('build');};
 const tabBtn=(id,label)=><button onClick={()=>setTab(id)} className={`text-sm px-3 py-2 border-b-2 ${tab===id?'border-primary text-foreground':'border-transparent text-muted-foreground'}`}>{label}</button>;
 return <ProShell><main className="p-5 lg:p-8 max-w-[1600px] mx-auto space-y-6 pb-12">
  <header className="space-y-2"><p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Workflows</p><h1 className="text-2xl font-heading">Capability catalog & workflow canvas</h1><p className="text-sm text-muted-foreground max-w-3xl">See what Creator Nexus can actually do, chain those capabilities into saved workflows, and run them step by step. Skills are instruction-only guidance for agents; only steps marked “Runs in workflows” execute.</p></header>
  {boot.isPending?<p role="status">Loading workspace…</p>:!workspace?<button disabled={creating} onClick={createWorkspace} className="text-sm text-link">{creating?'Creating…':'Create your workspace to start'}</button>:<>
   <div className="flex flex-wrap items-center gap-1 border-b border-border">{tabBtn('catalog','1 · Catalog')}{tabBtn('build','2 · Build, inspect & run')}<select aria-label="Open workflow" value={graph.id||''} onChange={e=>open(e.target.value?data.workflows.data.find(w=>w.id===e.target.value):null)} className="ml-auto h-8 rounded-md bg-secondary border border-border px-2 text-xs"><option value="">New workflow</option>{(data.workflows.data||[]).map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
   {tab==='catalog'?<CatalogView catalog={data.catalog} loading={data.skills.isPending} onAdd={entry=>{setGraph(g=>({...g,dirty:true,nodes:[...g.nodes,{id:Math.random().toString(36).slice(2,10),type:entry.type,x:40+g.nodes.length*40,y:40+g.nodes.length*60,config:{}}]}));setTab('build');}}/>:<WorkflowBuilder workspace={workspace} data={data} graph={graph} setGraph={setGraph}/>}
  </>}
 </main></ProShell>;
}