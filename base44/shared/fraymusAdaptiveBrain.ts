import {fraymusAdaptiveInput,fraymusAdaptiveState,digestAdaptive} from './fraymusAdaptiveSchema.ts';
import {adaptiveControl} from './fraymusAdaptiveControl.ts';
import {advanceAdaptiveGraph,validateAdaptiveGraph} from './fraymusSpikingGraph.ts';
import {adaptiveMemory,adaptiveTransition,verifyAdaptiveMemories} from './fraymusAdaptiveMemory.ts';
import {adaptiveSensoryInput,adaptiveIntegrityChecks} from './fraymusAdaptiveAttention.ts';
export const FRAYMUS_ADAPTIVE_SOURCE={implementation:'fraymus.adaptive/1',derivation:'Original bounded numerical integration informed by supplied FlyGNN message passing, Babel witness separation, continuity/security material and the requested LIF/STDP/TD model; not imported bundled HTML.',fly_artifact_sha256:'da98fe2f0f7775c235879a05a0d904a7a635b09e2796ecb16660a8d570fc9a21',agent_pipeline_artifact:'6adea376344f48822f9ceae5'};
export async function runFraymusAdaptive(input,previous){
 const a=fraymusAdaptiveInput.parse(input);let state;
 if(a.operation==='initialize'){
  if(previous)throw new Error('Initialize cannot overwrite a retained brain state.');
  state={version:1,encoder:'fraymus.lexical-hdc/1',clock:0,sequence:0,neurons:a.graph.neurons.map(n=>({...n,voltage:0,last_spike:null})),edges:a.graph.edges.map(e=>({...e,eligibility:0,last_arrival:null})),queue:[],memories:[],predictions:[],trust:[],values:[],affect:null,updated_at:new Date().toISOString()};
 }else{if(!previous)throw new Error('Resume a retained adaptive state with state_id.');state=fraymusAdaptiveState.parse(structuredClone(previous));}
 validateAdaptiveGraph(state);await verifyAdaptiveMemories(state);state.sequence++;
 let control=adaptiveControl(state,a,null);const transition=await adaptiveTransition(state,a.transition,control.learning_rate);
 if(transition)control=adaptiveControl(state,{...a,affect:undefined},transition);
 const integrity=await adaptiveIntegrityChecks(state,control);
   let operation={initialized:a.operation==='initialize'};
   if(a.operation==='advance'){const sensory=await adaptiveSensoryInput(state,a);operation={...advanceAdaptiveGraph(state,a,control,sensory.packed),sensory:sensory.receipt};}
 else if(a.operation!=='initialize')operation=await adaptiveMemory(state,a,control);
 state.updated_at=new Date().toISOString();state=fraymusAdaptiveState.parse(state);validateAdaptiveGraph(state);await verifyAdaptiveMemories(state);
 return {engine:'Fraymus Adaptive Brain',status:'computed',operation:a.operation,source:FRAYMUS_ADAPTIVE_SOURCE,result:operation,transition,controls:control,integrity,adaptive_state:state,adaptive_state_sha256:await digestAdaptive(state),counts:{neurons:state.neurons.length,edges:state.edges.length,memories:state.memories.length,predictions:state.predictions.length,clock:state.clock},provenance:a.provenance,notice:'Bounded inspectable simulation with supplied observations. No biological fidelity, consciousness, real feelings, language-model weight changes, native model inference, perfect recall, autonomous code execution or cryptographic proof of truth. SHA-256 detects content changes, not who authored them.'};
}