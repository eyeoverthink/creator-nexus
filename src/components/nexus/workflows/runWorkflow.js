import {base44} from '@/api/base44Client';
import {canConnect} from './workflowCatalog';
export function validateWorkflow(nodes,edges,lookup){
 const errors=[];const ids=new Set(nodes.map(n=>n.id));
 if(!nodes.length)errors.push('Add at least one node.');
 nodes.forEach(n=>{const e=lookup(n.type);if(!e)errors.push(`"${n.type}" is no longer in the catalog.`);else if(e.kind==='catalog')errors.push(`${e.label} is listed only and cannot run yet.`);if(e?.type==='input'&&!n.config?.text?.trim())errors.push('A text input node is empty.');if(e?.hosted&&!n.config?.task?.trim())errors.push(`${e.label} needs a task.`);});
 edges.forEach(e=>{if(!ids.has(e.source)||!ids.has(e.target)||!canConnect(lookup(nodes.find(n=>n.id===e.source)?.type),lookup(nodes.find(n=>n.id===e.target)?.type)))errors.push('A connection is invalid.');});
 const order=topoOrder(nodes,edges);if(!order)errors.push('Connections form a loop.');
 return {errors:[...new Set(errors)],order};
}
export function topoOrder(nodes,edges){
 const indeg=Object.fromEntries(nodes.map(n=>[n.id,0]));edges.forEach(e=>{if(e.target in indeg)indeg[e.target]++;});
 const queue=nodes.filter(n=>!indeg[n.id]).map(n=>n.id),order=[];
 while(queue.length){const id=queue.shift();order.push(id);edges.filter(e=>e.source===id).forEach(e=>{if(--indeg[e.target]===0)queue.push(e.target);});}
 return order.length===nodes.length?order:null;
}
async function workflowDraft(workspace){
 const page=await base44.entities.NexusDraft.filter({owner_id:workspace.owner_id,workspace_id:workspace.id},{sort:'-updated_date',limit:1});
 return page.items[0]||base44.entities.NexusDraft.create({owner_id:workspace.owner_id,workspace_id:workspace.id,title:'Workflow draft',body:''});
}
export async function runWorkflow({workflow,workspace,lookup,onStep}){
 const {errors,order}=validateWorkflow(workflow.nodes,workflow.edges,lookup);if(errors.length)throw new Error(errors.join(' '));
 const steps=order.map(id=>{const n=workflow.nodes.find(x=>x.id===id);return {node_id:id,label:n.config?.label||lookup(n.type).label,status:'pending'};});
 const run=await base44.entities.NexusWorkflowRun.create({owner_id:workspace.owner_id,workspace_id:workspace.id,workflow_id:workflow.id,workflow_name:workflow.name,status:'running',steps});
 const outputs={},save=patch=>base44.entities.NexusWorkflowRun.update(run.id,patch);let draft=null;
 const set=(i,patch)=>{steps[i]={...steps[i],...patch};onStep([...steps]);};onStep([...steps]);
 for(let i=0;i<order.length;i++){
  const node=workflow.nodes.find(n=>n.id===order[i]),entry=lookup(node.type),ups=workflow.edges.filter(e=>e.target===node.id).map(e=>({entry:lookup(workflow.nodes.find(n=>n.id===e.source).type),value:outputs[e.source]}));
  const text=ups.filter(u=>u.entry.output==='text').map(u=>u.value).join('\n\n'),guidance=ups.filter(u=>u.entry.output==='guidance').map(u=>`${u.entry.label}: ${u.value}`);
  set(i,{status:'running',input:(text||node.config?.text||'').slice(0,4000)});
  try{
   let out;
   if(entry.type==='input')out=node.config.text;
   else if(entry.kind==='guidance')out=entry.instructions;
   else if(entry.type==='output')out=text;
   else if(entry.type==='tool:elevenlabs'){const {data}=await base44.functions.invoke('elevenLabsVoice',{action:'speak',text,workspace_id:workspace.id,title:node.config?.label||''});out=`Saved voice clip “${data.title}” to your Library (${data.characters} characters).`;}
   else{draft=draft||await workflowDraft(workspace);const {data}=await base44.functions.invoke('nexusAgent',{agent:entry.agent,draft_id:draft.id,task:node.config.task.slice(0,2000),consent:true,context:{workflow_input:text.slice(0,20000),workflow_guidance:guidance}});if(data?.error)throw new Error(data.error);out=[data.result.title,data.result.body,...(data.result.ideas||[]).map(x=>`• ${x.title}: ${x.body}`)].filter(Boolean).join('\n\n')||data.result.summary;}
   outputs[node.id]=out||'';set(i,{status:'completed',output:String(out||'').slice(0,8000)});await save({steps});
  }catch(e){const msg=e.response?.data?.error||e.message;set(i,{status:'failed',error:msg});steps.slice(i+1).forEach((_,j)=>set(i+1+j,{status:'skipped'}));await save({steps,status:'failed',error:msg.slice(0,1000)});return;}
 }
 await save({steps,status:'completed'});
}