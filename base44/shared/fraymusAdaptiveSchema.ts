import {z} from 'npm:zod@4.4.3';
const finite=z.number().finite(),unit=finite.min(0).max(1),signed=finite.min(-1).max(1);
const id=z.string().regex(/^[A-Za-z0-9_.:-]{1,48}$/),text=z.string().trim().min(1).max(240),digest=z.string().regex(/^[a-f0-9]{64}$/);
const neuron=z.object({id,threshold:finite.min(.01).max(4).default(1),tau:finite.min(1).max(1000).default(10)}).strict();
const edge=z.object({source:id,target:id,weight:unit,type:z.enum(['excitatory','inhibitory']),delay:z.number().int().min(1).max(8)}).strict();
export const adaptiveGraph=z.object({neurons:z.array(neuron).min(1).max(32),edges:z.array(edge).max(32)}).strict();
const affect=z.object({interoception:z.object({energy:unit,integrity:unit,bond:unit,uncertainty:unit}).strict(),appraisal:z.object({goalRelevance:signed,likelihood:unit,agency:signed,control:signed,fairness:signed,novelty:unit}).strict(),provenance:z.string().trim().min(1).max(300),observed_at:z.string().datetime({offset:true}),reward_delta:signed.optional(),urgency:unit.optional()}).strict();
export const fraymusAdaptiveInput=z.object({
 operation:z.enum(['initialize','advance','remember','predict','witness','replay']),provenance:z.string().trim().min(1).max(300),graph:adaptiveGraph.optional(),
 text:text.optional(),label:z.string().trim().min(1).max(60).optional(),prediction_id:digest.optional(),observed_label:z.string().trim().min(1).max(60).optional(),
 ticks:z.number().int().min(1).max(64).default(8),learning_rate:finite.min(0).max(.2).default(.02),max_spikes_per_tick:z.number().int().min(1).max(4).default(1),
 stimuli:z.array(z.object({tick:z.number().int().min(0).max(63),neuron:id,current:finite.min(-4).max(4)}).strict()).max(64).default([]),
 replay_count:z.number().int().min(1).max(6).default(2),minimum_similarity:signed.default(.15),affect:affect.optional(),
  refresh_sensory:z.boolean().default(false),preferred_labels:z.array(z.string().trim().min(1).max(60)).max(6).default([]),
 transition:z.object({context:text,next_context:text.optional(),reward:signed,discount:unit.default(.95),terminal:z.boolean().default(false)}).strict().optional()
}).strict().superRefine((a,c)=>{
 const fail=message=>c.addIssue({code:'custom',message});
 if(a.operation==='initialize'&&!a.graph)fail('Initialize requires an explicit bounded graph.');
 if(a.operation!=='initialize'&&a.graph)fail('A resumed graph cannot be replaced.');
 if(['remember','predict'].includes(a.operation)&&!a.text)fail('Provide explicit context text.');
 if(a.operation==='remember'&&!a.label)fail('Remember requires an observed label.');
 if(a.operation==='witness'&&(!a.prediction_id||!a.observed_label))fail('Witness requires a pending prediction ID and an explicitly observed label.');
 if(a.transition&&!a.transition.terminal&&!a.transition.next_context)fail('A nonterminal TD transition needs next_context.');
 if(a.operation!=='advance'&&(a.transition||a.stimuli.length))fail('Transitions and stimuli belong to advance only.');
 if(a.stimuli.some(s=>s.tick>=a.ticks))fail('Every stimulus must fall inside the requested tick window.');
});
const storedNeuron=neuron.extend({voltage:finite.min(-8).max(8),last_spike:z.number().int().nonnegative().nullable()});
const storedEdge=edge.extend({eligibility:finite.min(-4).max(4),last_arrival:z.number().int().nonnegative().nullable()});
const marker=z.object({valence:signed,arousal:unit}).strict();
const memory=z.object({id:digest,text,label:z.string().min(1).max(60),vector:z.string().length(684),marker,provenance:z.string().min(1).max(300),observed_at:z.string().datetime({offset:true}),replays:z.number().int().min(0).max(1000000)}).strict();
const prediction=z.object({id:digest,key:digest,label:z.string().min(1).max(60),memory_id:digest,similarity:signed,resolved:z.boolean(),observed_label:z.string().max(60).optional(),prediction_marker:marker.optional(),witness_marker:marker.optional(),witness_provenance:z.string().min(1).max(300).optional(),witnessed_at:z.string().datetime({offset:true}).optional(),reinforcement_gain:finite.min(1).max(2.2).optional()}).strict();
export const fraymusAdaptiveState=z.object({version:z.literal(1),encoder:z.literal('fraymus.lexical-hdc/1'),clock:z.number().int().min(0).max(1000000000),sequence:z.number().int().min(0).max(1000000000),neurons:z.array(storedNeuron).min(1).max(32),edges:z.array(storedEdge).max(32),queue:z.array(z.object({at:z.number().int().nonnegative(),edge:z.number().int().min(0).max(31),amount:signed}).strict()).max(64),memories:z.array(memory).max(6),predictions:z.array(prediction).max(8),trust:z.array(z.object({key:digest,label:z.string().min(1).max(60),hits:z.number().int().min(0).max(1000000),misses:z.number().int().min(0).max(1000000),reinforced_hits:finite.min(0).max(2200000).optional()}).strict()).max(8),sensory_trace:z.object({context_hash:digest,at:z.number().int().nonnegative()}).strict().optional(),values:z.array(z.object({key:digest,value:finite.min(-10).max(10)}).strict()).max(8),affect:affect.passthrough().nullable(),updated_at:z.string().datetime({offset:true})}).strict();
export async function digestAdaptive(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),b=>b.toString(16).padStart(2,'0')).join('');}