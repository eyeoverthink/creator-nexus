import {solveFraymusHamiltonian} from './fraymusOsOneMath.ts';
import {transcodeFraymusPayload} from './fraymusOsOneCodec.ts';
import {fraymusOsOneOutline,FRAYMUS_OS_ONE_SOURCE} from './fraymusOsOneCatalog.ts';
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
  let value;
  try { value=runFraymusMethod(args); } catch(error) { return {error:error.message}; }
  await base44.entities.NexusEvent.create({owner_id:user.id,workspace_id:draft.workspace_id,agent,kind:'fraymus.method.executed',message:`Fraymus OS One: ${args.method} (${value.status||'completed'})`,body:JSON.stringify({method:args.method,format:args.format,byte_length:value.byte_length,receipt_id:value.receipt_id,status:value.status,source:value.source})});
  return value;
}