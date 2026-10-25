import {fraymusBrainInput} from './fraymusBrainSchema.ts';
import {analyzeFraymusLedger} from './fraymusWeightLedger.ts';
import {trainFraymusVotes} from './fraymusVoteTrainer.ts';
export const FRAYMUS_BRAIN_SOURCE={repository:'eyeoverthink/fraymus-brain',file:'kernel/phi75.js',inspected_sha256:'ba86cc8bfa45e54155b6d0a648e763bb84ff0407aeced79a20f92f6960c5d1b7',mode:'Bounded adaptation, not the complete upstream kernel',source_url:'https://raw.githubusercontent.com/eyeoverthink/fraymus-brain/main/kernel/phi75.js'};
export async function executeFraymusBrain(base44,user,workspaceId,input){
 const parsed=fraymusBrainInput.safeParse(input);
 if(!parsed.success)return {error:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')};
 const a=parsed.data;let parent=null,saved=null;
 if(a.state_id){
  const page=await base44.entities.NexusAsset.filter({id:a.state_id,owner_id:user.id,workspace_id:workspaceId,project:'Fraymus Brain',source_entity:'FraymusBrainState'},{limit:1});
  parent=page.items[0];if(!parent)return {error:'Brain state is not available in this workspace.'};
  try{saved=JSON.parse(parent.body).report.neuron;}catch{return {error:'Saved brain state is malformed.'};}
  if(!saved)return {error:'Only retained neuron training can be resumed.'};
 }
 let result;
 try{result=a.brain_action==='ledger'?analyzeFraymusLedger(a):trainFraymusVotes(a,saved);}catch(e){return {error:e.message};}
 const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
 const {commit,...measuredInput}=a,inputDigest=await hash(JSON.stringify(measuredInput));
 result={...result,input_sha256:inputDigest,source:FRAYMUS_BRAIN_SOURCE,parent_state_id:parent?.id||null,committed:false};
 if(a.commit===true){
  const body=JSON.stringify({version:1,report:result});
  if(body.length>19000)return {error:'This result exceeds the Library text limit; download it instead or reduce the batch size.'};
  const record=await base44.entities.NexusAsset.create({owner_id:user.id,workspace_id:workspaceId,title:`Fraymus Brain · ${a.brain_action} · ${new Date().toISOString()}`,kind:'document',project:'Fraymus Brain',source_entity:'FraymusBrainState',source_id:parent?.id||'',body});
  result={...result,state_id:record.id,committed:true};
 }
 return result;
}