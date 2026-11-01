import {compileFraymus,validateFraymusProgram} from './fraymusVmAssembly.ts';
import {runFraymusVm} from './fraymusVmRuntime.ts';
const sha=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
function canonical(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';}
export async function executeFraymusVm(input){
 const compiled=compileFraymus(input),max_steps=input.max_steps??2000;
 const execution=runFraymusVm(compiled.program,max_steps);
 const payload={version:1,engine:'Fraymus VM i32 strict/1',program:compiled.program,max_steps,execution};
 const certificate={...payload,digest:await sha(canonical(payload))};
 return {...compiled,status:execution.status,execution,certificate_json:JSON.stringify(certificate),notice:'Replay-verifiable execution certificate, not a trusted-identity signature or a proof of program safety. No host code executes.'};
}
export async function verifyFraymusVm(input){
 if(typeof input.certificate_json!=='string'||input.certificate_json.length>24000)throw new Error('Provide certificate_json up to 24000 characters.');
 const cert=JSON.parse(input.certificate_json);
 if(cert.version!==1||cert.engine!=='Fraymus VM i32 strict/1'||typeof cert.digest!=='string'||!cert.execution||!Number.isInteger(cert.max_steps)||cert.max_steps<1||cert.max_steps>10000)throw new Error('Invalid Fraymus certificate.');
 const program=validateFraymusProgram(cert.program);
 const execution=runFraymusVm(program,cert.max_steps);
 const payload={version:1,engine:'Fraymus VM i32 strict/1',program,max_steps:cert.max_steps,execution:cert.execution};
 const digest=await sha(canonical(payload));
 const digest_valid=digest===cert.digest,replay_matches=canonical(execution)===canonical(cert.execution);
 return {engine:'Fraymus VM',status:digest_valid&&replay_matches?'verified':'rejected',digest_valid,replay_matches,execution,notice:'Replay consistency only; this does not authenticate a sender.'};
}