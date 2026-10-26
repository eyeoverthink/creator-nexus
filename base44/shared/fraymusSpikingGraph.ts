import {adaptiveClamp} from './fraymusAdaptiveControl.ts';
import {ADAPTIVE_LIMITS as L} from './fraymusAdaptiveLimits.ts';
import {unpackFraymusAssociative} from './fraymusAssociativeVectors.ts';
export function validateAdaptiveGraph(state){
 const ids=new Set(state.neurons.map(n=>n.id));if(ids.size!==state.neurons.length)throw new Error('Neuron IDs must be unique.');
 const pairs=new Set();for(const e of state.edges){const pair=JSON.stringify([e.source,e.target]);if(!ids.has(e.source)||!ids.has(e.target)||e.source===e.target||pairs.has(pair))throw new Error('Edges require distinct known neurons and unique source-target pairs.');pairs.add(pair);}
 if(state.neurons.some(n=>n.last_spike!==null&&n.last_spike>state.clock)||state.edges.some(e=>e.last_arrival!==null&&e.last_arrival>state.clock)||state.sensory_trace?.at>state.clock)throw new Error('Graph event time exceeds its clock.');
 if(state.queue.some(q=>q.edge>=state.edges.length||q.at<=state.clock||q.at>state.clock+8))throw new Error('Invalid delayed-spike queue.');
}
function projection(state,packed,threshold=6){
 if(!packed)return new Map();const bytes=unpackFraymusAssociative(packed),drive=new Map();
 state.neurons.forEach((n,i)=>{let active=0;for(let k=0;k<8;k++){const bit=(i*131+k*509)%4096;active+=(bytes[bit>>3]>>(bit&7))&1;}drive.set(n.id,active>=threshold?4:0);});return drive;
}
export function advanceAdaptiveGraph(state,input,control,packed=null){
 const started=performance.now();validateAdaptiveGraph(state);
 const byId=new Map(state.neurons.map(n=>[n.id,n])),incoming=new Map(),outgoing=new Map(),stimuli=new Map(),buckets=new Map();
 state.edges.forEach((e,i)=>{if(!incoming.has(e.target))incoming.set(e.target,[]);incoming.get(e.target).push(i);if(!outgoing.has(e.source))outgoing.set(e.source,[]);outgoing.get(e.source).push(i);});
 for(const s of input.stimuli){if(!byId.has(s.neuron))throw new Error('Stimulus references an unknown neuron.');if(!stimuli.has(s.tick))stimuli.set(s.tick,[]);stimuli.get(s.tick).push(s);}
 const schedule=q=>{if(!buckets.has(q.at))buckets.set(q.at,[]);buckets.get(q.at).push(q);};
 state.queue.forEach(schedule);let pending=state.queue.length,peak=pending;
 const hdc=projection(state,packed,control.focus_threshold??6),events=[];
 for(const [key,value] of hdc)hdc.set(key,adaptiveClamp(value*(control.attention_gain??1),0,6));
 let changed=0,spikeCount=0,arrivals=0;
 for(let tick=0;tick<input.ticks;tick++){
  state.clock++;const current=new Map(hdc),due=buckets.get(state.clock)||[];buckets.delete(state.clock);pending-=due.length;
  for(const e of state.edges)e.eligibility*=Math.exp(-1/20);
  for(const q of due){const e=state.edges[q.edge],post=byId.get(e.target);current.set(e.target,(current.get(e.target)||0)+q.amount);arrivals++;const dt=post.last_spike===null?null:state.clock-post.last_spike;if(dt!==null&&dt>0)e.eligibility=adaptiveClamp(e.eligibility-Math.exp(-dt/20),-4,4);e.last_arrival=state.clock;}
  for(const s of stimuli.get(tick)||[])current.set(s.neuron,(current.get(s.neuron)||0)+s.current);
  for(const n of state.neurons){const leak=Math.exp(-1/n.tau);n.voltage=adaptiveClamp(n.voltage*leak+adaptiveClamp(current.get(n.id)||0,-8,8)*(1-leak),-8,8);}
  const firing=state.neurons.filter(n=>n.voltage>=n.threshold).sort((a,b)=>b.voltage-a.voltage||a.id.localeCompare(b.id)).slice(0,control.spike_limit);
  for(const n of firing){n.voltage=0;n.last_spike=state.clock;spikeCount++;if(events.length<32)events.push({tick:state.clock,neuron:n.id});
   for(const i of incoming.get(n.id)||[]){const e=state.edges[i];if(e.last_arrival!==null){const dt=state.clock-e.last_arrival;if(dt>0)e.eligibility=adaptiveClamp(e.eligibility+Math.exp(-dt/20),-4,4);}}
   for(const i of outgoing.get(n.id)||[]){const e=state.edges[i];schedule({at:state.clock+e.delay,edge:i,amount:e.weight*(e.type==='inhibitory'?-1:1)});pending++;}
  }
  peak=Math.max(peak,pending);if(pending>L.queue)throw new Error('Delayed-event capacity exceeded; reduce spikes, edges or delays. No state was retained.');
  for(const e of state.edges){const w=adaptiveClamp(e.weight+control.learning_rate*e.eligibility);if(w!==e.weight)changed++;e.weight=w;}
 }
 state.queue=[...buckets.keys()].sort((a,b)=>a-b).flatMap(at=>buckets.get(at));
 return {ticks:input.ticks,spikes:spikeCount,synaptic_arrivals:arrivals,weight_updates:changed,spikes_per_neuron_tick:spikeCount/(state.neurons.length*input.ticks),events,event_log_truncated:spikeCount>events.length,queued_events:pending,hdc_drive:packed!==null,execution:{elapsed_ms:performance.now()-started,neuron_ticks:state.neurons.length*input.ticks,edge_ticks:state.edges.length*input.ticks,queue_peak:peak,synapse_lookup:'adjacency-indexed',event_scheduler:'tick-buckets'},algorithm:'Discrete-time LIF, competitive sparse firing, delayed signed transmission and arrival-aware STDP eligibility. Measured runtime is this invocation, not a biological fidelity or energy-saving claim.'};
}