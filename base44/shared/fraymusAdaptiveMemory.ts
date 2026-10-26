import {encodeFraymusAssociative,packFraymusAssociative,unpackFraymusAssociative,compareFraymusAssociative} from './fraymusAssociativeVectors.ts';
import {digestAdaptive} from './fraymusAdaptiveSchema.ts';
import {adaptiveClamp} from './fraymusAdaptiveControl.ts';
import {advanceAdaptiveGraph} from './fraymusSpikingGraph.ts';
export function adaptiveVector(text){return packFraymusAssociative(encodeFraymusAssociative(text).bytes);}
const immutableMemory=m=>({text:m.text,label:m.label,vector:m.vector,marker:m.marker,provenance:m.provenance,observed_at:m.observed_at});
export async function verifyAdaptiveMemories(state){
 const ids=new Set();for(const m of state.memories){if(ids.has(m.id)||await digestAdaptive(immutableMemory(m))!==m.id)throw new Error('Memory digest or identity mismatch.');ids.add(m.id);unpackFraymusAssociative(m.vector);}
 if(state.predictions.some(p=>!ids.has(p.memory_id)))throw new Error('Prediction refers to a missing memory.');
}
export async function adaptiveTransition(state,t,rate){
 if(!t)return null;const key=await digestAdaptive(t.context),next=t.terminal?null:await digestAdaptive(t.next_context);
 let row=state.values.find(v=>v.key===key);if(!row){if(state.values.length>=8)throw new Error('TD context capacity is eight; start a separate bounded state.');row={key,value:0};state.values.push(row);}
 const before=row.value,nextValue=t.terminal?0:state.values.find(v=>v.key===next)?.value??0,delta=t.reward+t.discount*nextValue-before;
 row.value=adaptiveClamp(before+rate*delta,-10,10);return {context_hash:key,before,after:row.value,delta,reward:t.reward,terminal:t.terminal,notice:'TD update of this explicit toy value table only, not an LLM value function.'};
}
export async function adaptiveMemory(state,a,control){
 if(a.operation==='remember'){
  const vector=adaptiveVector(a.text),existing=state.memories.find(m=>m.text===a.text&&m.label===a.label);if(existing)return {memory_id:existing.id,duplicate:true};
  if(state.memories.length>=6)throw new Error('Memory capacity is six observations per state; no observation is silently evicted.');
  const m={text:a.text,label:a.label,vector,marker:control.marker,provenance:a.provenance,observed_at:new Date().toISOString()};const id=await digestAdaptive(m);state.memories.push({...m,id,replays:0});return {memory_id:id,stored_observations:state.memories.length,witness_created:false};
 }
 if(a.operation==='predict'){
  const vector=unpackFraymusAssociative(adaptiveVector(a.text));const candidates=state.memories.map(m=>({memory:m,similarity:compareFraymusAssociative(vector,unpackFraymusAssociative(m.vector))})).filter(m=>m.similarity>=a.minimum_similarity).sort((x,y)=>y.similarity-x.similarity||x.memory.id.localeCompare(y.memory.id));
  if(!candidates.length)return {prediction:null,abstained:true,reason:'No retained lexical association passed the configured similarity threshold.'};
  const best=candidates[0],key=await digestAdaptive(a.text),trust=state.trust.find(t=>t.key===key&&t.label===best.memory.label),confidence=adaptiveClamp(.15+.2*(trust?.hits||0)-.2*(trust?.misses||0),.05,.85);
  if(state.predictions.length>=8){const at=state.predictions.findIndex(p=>p.resolved);if(at<0)throw new Error('Resolve an outstanding prediction before issuing another.');state.predictions.splice(at,1);}
  const p={id:await digestAdaptive({key,label:best.memory.label,sequence:state.sequence}),key,label:best.memory.label,memory_id:best.memory.id,similarity:best.similarity,resolved:false};state.predictions.push(p);
  return {prediction:p,trust_score:confidence,notice:'Lexical association with witnessed-outcome score, not calibrated probability. Issuing predictions never increases trust.'};
 }
 if(a.operation==='witness'){
  const p=state.predictions.find(p=>p.id===a.prediction_id);if(!p||p.resolved)throw new Error('Prediction is missing or already witnessed.');let t=state.trust.find(t=>t.key===p.key&&t.label===p.label);
  if(!t){if(state.trust.length>=8)throw new Error('Witnessed trust-table capacity is eight.');t={key:p.key,label:p.label,hits:0,misses:0};state.trust.push(t);}
  const matched=p.label===a.observed_label;if(t.hits>=1000000||t.misses>=1000000)throw new Error('Witness counter capacity reached.');if(matched)t.hits++;else t.misses++;p.resolved=true;p.observed_label=a.observed_label;
  return {prediction_id:p.id,matched,trust_score:adaptiveClamp(.15+.2*t.hits-.2*t.misses,.05,.85),hits:t.hits,misses:t.misses,provenance:a.provenance,notice:'Explicit caller-reported outcome; not independent attestation. The same prediction cannot be witnessed twice.'};
 }
 if(a.operation==='replay'){
  const selected=[...state.memories].sort((x,y)=>x.replays-y.replays||y.marker.arousal-x.marker.arousal||x.id.localeCompare(y.id)).slice(0,Math.min(a.replay_count,control.replay_limit));
  const receipts=[];for(const m of selected){if(m.replays>=1000000)throw new Error('Replay counter capacity reached.');const report=advanceAdaptiveGraph(state,{...a,ticks:Math.min(a.ticks,8),stimuli:[]},control,m.vector);m.replays++;receipts.push({memory_id:m.id,replays:m.replays,...report});}
  return {replayed:receipts.length,receipts,trust_updates:0,witnesses_created:0,notice:'Bounded replay of digest-checked observations into the toy graph, not new evidence, perfect recall or a guarantee against forgetting.'};
 }
 return {};
}