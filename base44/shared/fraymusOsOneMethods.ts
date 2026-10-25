import {solveFraymusHamiltonian} from './fraymusOsOneMath.ts';
import {transcodeFraymusPayload} from './fraymusOsOneCodec.ts';
import {fraymusOsOneOutline,FRAYMUS_OS_ONE_SOURCE} from './fraymusOsOneCatalog.ts';
import {compileFraymus} from './fraymusVmAssembly.ts';
import {executeFraymusVm,verifyFraymusVm} from './fraymusVmProof.ts';
import {repairFraymusSymbolic} from './fraymusSymbolicRepair.ts';
import {fraymusTernary} from './fraymusTernaryMemory.ts';
import {executeRetainedFraymus,fraymusExecutionBudget} from './fraymusRetainedSystems.ts';
import {fraymusMethodSchema} from './fraymusMethodSchema.ts';
import {runFraymusSignedDispatch} from './fraymusSignedDispatch.ts';
export function runFraymusMethod(input) {
  let result;
  if (input.method === 'outline') return fraymusOsOneOutline();
  if (input.method === 'opeg') {
    result = solveFraymusHamiltonian({g:input.g,gamma:input.gamma,epsilon:input.epsilon,goal:input.goal});
  } else if (['encode','decode'].includes(input.method)) {
    result = transcodeFraymusPayload({text:input.text,format:input.format,direction:input.method,carrier:input.carrier});
  } else throw new Error('Supported methods: outline, opeg, encode, decode.');
  return {...result,source:FRAYMUS_OS_ONE_SOURCE};
}
export async function executeFraymusMethod(base44,user,draft,agent,args) {
  const parsed=fraymusMethodSchema.safeParse(args);
  if(!parsed.success)return {error:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')};
  args=parsed.data;
  let value, parent=null,budget=null;
  if(args.method==='fraymus_repair') {
    const query={owner_id:user.id,workspace_id:draft.workspace_id,project:'Fraymus Symbolic Repair',source_entity:'FraymusSymbolicState',...(args.state_id?{id:args.state_id}:{})};
    const page=await base44.entities.NexusAsset.filter(query,{sort:'-created_date',limit:1});
    parent=page.items[0]||null;
    if(args.state_id&&!parent)return {error:'Fraymus state is not available in this workspace.'};
  }
  try {
    if(args.use_affect===true)budget=await fraymusExecutionBudget(base44,user,draft,args);
    if(args.method==='fraymus_compile')value=compileFraymus(args);
    else if(args.method==='fraymus_vm')value=await executeFraymusVm(budget?{...args,max_steps:budget.applied_max_steps}:args);
    else if(args.method==='fraymus_ternary'){
      if(args.commit===true)throw new Error('Quantization is stateless; retain labeled examples with Fraymus memory instead.');
      value=fraymusTernary(args);
    }
    else if(['fraymus_memory','fraymus_affect'].includes(args.method))value=await executeRetainedFraymus(base44,user,draft,args);
    else if(args.method==='fraymus_verify')value=await verifyFraymusVm(args);
    else if(args.method==='fraymus_dispatch_verify'){
      if(args.commit===true)throw new Error('Agent dispatch verification is read-only. Trust and accept messages through the signed-dispatch controls.');
      value=await runFraymusSignedDispatch(base44,user,draft.workspace_id,{action:'verify',envelope_json:args.envelope_json});
    }
    else if(args.method==='fraymus_repair')value=repairFraymusSymbolic(args,parent?JSON.parse(parent.body).state:null);
    else value=runFraymusMethod(args);
  } catch(error) { return {error:error.message}; }
  if(args.method==='fraymus_repair'&&args.commit===true&&value.status!=='rejected') {
    const asset=await base44.entities.NexusAsset.create({owner_id:user.id,workspace_id:draft.workspace_id,title:`Fraymus Symbolic Repair · generation ${value.state.generation}`,kind:'document',project:'Fraymus Symbolic Repair',source_entity:'FraymusSymbolicState',source_id:parent?.id||'',body:JSON.stringify({parent_id:parent?.id||null,state:value.state,evidence:{expression:value.expression,before:value.before_value,after:value.after_value,checks:value.checks}},null,2)});
    value={...value,state_id:asset.id,parent_state_id:parent?.id||null,committed:true};
  } else if(args.method==='fraymus_repair')value={...value,parent_state_id:parent?.id||null,committed:false};
  value={...value,...(budget?{affective_budget:budget}:{}),source:value.source||FRAYMUS_OS_ONE_SOURCE};
  await base44.entities.NexusEvent.create({owner_id:user.id,workspace_id:draft.workspace_id,agent,kind:'fraymus.method.executed',message:`Fraymus OS One: ${args.method} (${value.status||'completed'})`,body:JSON.stringify({method:args.method,format:args.format,byte_length:value.byte_length,receipt_id:value.receipt_id,status:value.status,source:value.source,state_id:value.state_id,parent_state_id:value.parent_state_id,committed:value.committed,changes:value.changes,steps:value.execution?.steps,proof_digest:value.certificate_json?JSON.parse(value.certificate_json).digest:undefined})});
  return value;
}