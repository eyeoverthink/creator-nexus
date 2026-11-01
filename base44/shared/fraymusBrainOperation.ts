import {fraymusBrainInput} from './fraymusBrainSchema.ts';
import {analyzeFraymusLedger} from './fraymusWeightLedger.ts';
import {trainFraymusVotes} from './fraymusVoteTrainer.ts';
import {runFraymusAdaptive} from './fraymusAdaptiveBrain.ts';
import {digestAdaptive} from './fraymusAdaptiveSchema.ts';
import {readFraymusBrainReport,storeFraymusBrainReport} from './fraymusBrainStorage.ts';
export const FRAYMUS_BRAIN_SOURCE={repository:'eyeoverthink/fraymus-brain',file:'kernel/phi75.js',inspected_sha256:'ba86cc8bfa45e54155b6d0a648e763bb84ff0407aeced79a20f92f6960c5d1b7',mode:'Bounded adaptation, not the complete upstream kernel',source_url:'https://raw.githubusercontent.com/eyeoverthink/fraymus-brain/main/kernel/phi75.js'};
export async function executeFraymusBrain(base44,user,workspaceId,input){
 const parsed=fraymusBrainInput.safeParse(input);
 if(!parsed.success)return {error:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')};
 const a=parsed.data;let parent=null,saved=null;
 if(a.state_id){
  const page=await base44.entities.NexusAsset.filter({id:a.state_id,owner_id:user.id,workspace_id:workspaceId,project:'Fraymus Brain',source_entity:'FraymusBrainState'},{limit:1});
  parent=page.items[0];if(!parent)return {error:'Brain state is not available in this workspace.'};
  try{const report=await readFraymusBrainReport(base44,parent);
      if(a.brain_action==='adaptive'){
       saved=report.adaptive_state;
       if(!saved||await digestAdaptive(saved)!==report.adaptive_state_sha256)return {error:'Adaptive state is missing or its digest changed.'};
      }else saved=report.neuron;
     }catch{return {error:'Saved brain state is malformed.'};}
     if(!saved)return {error:'The retained state is incompatible with this brain action.'};
 }
 let result;
 try{result=a.brain_action==='adaptive'?await runFraymusAdaptive(a.adaptive_input,saved):a.brain_action==='ledger'?analyzeFraymusLedger(a):trainFraymusVotes(a,saved);}catch(e){return {error:e.message};}
 const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
 const {commit,...measuredInput}=a,inputDigest=await hash(JSON.stringify(measuredInput));
 result={...result,input_sha256:inputDigest,source:result.source||FRAYMUS_BRAIN_SOURCE,parent_state_id:parent?.id||null,committed:false};
 if(a.commit===true){
  const storage=await storeFraymusBrainReport(base44,result);
     const record=await base44.entities.NexusAsset.create({owner_id:user.id,workspace_id:workspaceId,title:`Fraymus Brain · ${a.brain_action} · ${new Date().toISOString()}`,kind:'document',project:'Fraymus Brain',source_entity:'FraymusBrainState',source_id:parent?.id||'',...storage});
  result={...result,state_id:record.id,committed:true};
 }
 return result;
}