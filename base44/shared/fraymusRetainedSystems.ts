import {fraymusMemory} from './fraymusTernaryMemory.ts';
import {executeFraymusAssociative} from './fraymusAssociativeMemory.ts';
import {fraymusAffect} from './fraymusAffectiveControls.ts';
const systems={fraymus_memory:{project:'Fraymus Ternary Memory',source:'FraymusTernaryState'},fraymus_affect:{project:'Fraymus Affective Controls',source:'FraymusAffectiveState'}};
export async function loadFraymusState(base44,user,workspaceId,method,stateId){
 const system=systems[method];if(!system)throw new Error('Unknown retained Fraymus system.');
 const page=await base44.entities.NexusAsset.filter({owner_id:user.id,workspace_id:workspaceId,kind:'document',project:system.project,source_entity:system.source,...(stateId?{id:stateId}:{})},{sort:'-created_date',limit:1});
 const parent=page.items[0]||null;
 if(stateId&&!parent)throw new Error('Fraymus state is not available in this workspace.');
 return {parent,state:parent?JSON.parse(parent.body).state:null};
}
export async function executeRetainedFraymus(base44,user,draft,args){
 if(args.method==='fraymus_memory'&&args.memory_mode==='associative'){
  const result=await executeFraymusAssociative(base44,user,draft.workspace_id,args);
  if(result.error)throw new Error(result.error);
  return result;
 }
 if(args.method==='fraymus_memory'&&args.memory_action==='recall'&&args.commit===true)throw new Error('Recall is read-only; it cannot commit or reinforce itself.');
 const {parent,state}=await loadFraymusState(base44,user,draft.workspace_id,args.method,args.state_id);
 let value=args.method==='fraymus_memory'?fraymusMemory(args,state):fraymusAffect(args,state);
 const system=systems[args.method];
 if(args.commit===true){
  const body=JSON.stringify({parent_id:parent?.id||null,state:value.state,evidence:{method:args.method,status:value.status,label:args.label,action:args.memory_action,provenance:args.provenance}},null,2);
  if(body.length>19000)throw new Error('Fraymus snapshot exceeds storage capacity; nothing was saved.');
  const asset=await base44.entities.NexusAsset.create({owner_id:user.id,workspace_id:draft.workspace_id,title:`${system.project} · ${args.memory_action||'observation'}`,kind:'document',project:system.project,source_entity:system.source,source_id:parent?.id||'',body});
  value={...value,committed:true,state_id:asset.id};
 }else value={...value,committed:false};
 return {...value,parent_state_id:parent?.id||null};
}
export async function fraymusExecutionBudget(base44,user,draft,args){
 if(args.method!=='fraymus_vm')throw new Error('Affective budgets apply only to Fraymus VM execution.');
 const {parent,state}=await loadFraymusState(base44,user,draft.workspace_id,'fraymus_affect',args.affect_state_id);
 if(!state)throw new Error('Retain a measured Fraymus affective observation before enabling its budget.');
 const age=Date.now()-Date.parse(state.observed_at),cap=state.vm_step_budget;
 if(!Number.isFinite(age)||age< -60000||age>3600000)throw new Error('Affective observation is stale; retain a new observation within the last hour.');
 if(!Number.isInteger(cap)||cap<1||cap>2000)throw new Error('Invalid retained Fraymus execution budget.');
 return {state_id:parent.id,requested_max_steps:args.max_steps??2000,applied_max_steps:Math.min(args.max_steps??2000,cap),observed_at:state.observed_at};
}