import {digestAdaptive} from './fraymusAdaptiveSchema.ts';
import {adaptiveVector,verifyAdaptiveMemories} from './fraymusAdaptiveMemory.ts';
import {validateAdaptiveGraph} from './fraymusSpikingGraph.ts';
export async function adaptiveSensoryInput(state,input){
 if(!input.text)return {packed:null,receipt:{supplied:false,projection_skipped:false}};
 const contextHash=await digestAdaptive(input.text),repeated=state.sensory_trace?.context_hash===contextHash;
 const packed=repeated&&!input.refresh_sensory?null:adaptiveVector(input.text);
 if(packed)state.sensory_trace={context_hash:contextHash,at:state.clock};
 return {packed,receipt:{supplied:true,context_hash:contextHash,projection_skipped:packed===null,refreshed:repeated&&Boolean(input.refresh_sensory),notice:'Exact-text sensory repetition gate only, not semantic prediction. Delayed synapses, supplied currents and voltage decay still advance.'}};
}
export async function adaptiveIntegrityChecks(state,control){
 let checks=0;
 for(let pass=1;pass<control.integrity_passes;pass++){
  validateAdaptiveGraph(state);await verifyAdaptiveMemories(state);
  for(const memory of state.memories){if(adaptiveVector(memory.text)!==memory.vector)throw new Error('Retained lexical vector does not match its source text.');checks++;}
 }
 return {passes:control.integrity_passes,reference_vector_checks:checks,notice:'Repeated structural/digest checks plus deterministic re-encoding, not an independent witness, signature, Z3 proof or authorization gate.'};
}