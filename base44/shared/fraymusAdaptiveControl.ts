import {fraymusAffect} from './fraymusAffectiveControls.ts';
export const adaptiveClamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
export function adaptiveControl(state,input,td){
 if(input.affect){const result=fraymusAffect({...input.affect,reward_delta:input.affect.reward_delta??adaptiveClamp(td?.delta??0,-1,1)},state.affect);state.affect=result.state;}
 const age=state.affect?Math.max(0,Date.now()-Date.parse(state.affect.observed_at)):Infinity;
 const decay=Math.exp(-age/300000),emotions=Object.fromEntries(Object.entries(state.affect?.emotions||{}).map(([k,v])=>[k,v*decay]));
 const fear=emotions.FEAR||0,curiosity=emotions.CURIOSITY||0,joy=emotions.JOY||0,sadness=emotions.SADNESS||0;
 const integrity=state.affect?1-(1-state.affect.interoception.integrity)*decay:1,bond=state.affect?state.affect.interoception.bond*decay:0;
 const acetylcholine=adaptiveClamp(.5+.3*curiosity+.2*(state.affect?.interoception.uncertainty||0)*decay-.2*fear,.05,1);
 const serotonin=adaptiveClamp(.5+.2*(integrity-1)+.15*bond-.15*(emotions.ANGER||0),.05,1);
 const norepinephrine=adaptiveClamp(.5+.25*(state.affect?.affect?.arousal||0)*decay+.2*fear,.05,1);
 const energy=state.affect?1-(1-state.affect.interoception.energy)*decay:1;
 const dopamine=adaptiveClamp(.5+.25*joy+.2*curiosity-.2*sadness+.2*adaptiveClamp(td?.delta??0,-1,1),.05,1);
 const risk=adaptiveClamp(.65-.52*fear+.25*curiosity,.05,1);
 const spike_limit=Math.max(1,Math.min(input.max_spikes_per_tick,Math.floor(input.max_spikes_per_tick*energy*(1-.7*fear))));
 const replay_limit=Math.min(6,Math.max(1,Math.floor(energy*(2+4*sadness))));
 return {learning_rate:input.learning_rate*(.25+.75*dopamine)*(1-.7*fear),spike_limit,replay_limit,dopamine,acetylcholine,serotonin,norepinephrine,attention_gain:adaptiveClamp(.5+acetylcholine,.5,1.5),focus_threshold:Math.max(5,Math.min(8,6+Math.round(2*(norepinephrine-.5)))),integrity_passes:1+Math.round(3*fear+2*(1-integrity)),prediction_similarity_floor:adaptiveClamp(input.minimum_similarity+.45*(.65-risk),-1,1),creator_priority_bias:adaptiveClamp(bond*(.5+.5*(emotions.AFFECTION||0))),trust_reinforce_gain:adaptiveClamp(1+.85*Math.max(joy,emotions.PRIDE||0)*dopamine,1,2.2),replay_loss_bias:sadness,replay_patience:serotonin,risk_budget:risk,emotions,decay_factor:decay,marker:{valence:(state.affect?.affect?.valence??0)*decay,arousal:(state.affect?.affect?.arousal??0)*decay},notice:'Decaying numerical control signals, not subjective feelings. These dials affect this bounded adaptive simulation only; never authorization or external model weights.'};
}