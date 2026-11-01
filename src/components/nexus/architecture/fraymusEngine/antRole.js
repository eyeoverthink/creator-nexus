// Port of fraymus/AntRole.java: colours, concentration factors, brain bias and frequency-based assignment.
// Not ported: generateCodeFragment (needs SelfCodeEvolver / KnowledgeScraper, which are not part of this slice).
import {OUT} from './logicBrain.js';

export const ROLE_LIST=[
 {key:'LOGIC_GATE',name:'Logic Gate',color:[0,1,0.4],concentration:0.8,bias:OUT.MUTATE},
 {key:'MATH_PROCESSOR',name:'Math Processor',color:[0.4,0.6,1],concentration:0.7,bias:OUT.EVOLVE_DNA},
 {key:'CIRCUIT_BUILDER',name:'Circuit Builder',color:[1,0.5,0],concentration:0.9,bias:OUT.ENERGY_BURST},
 {key:'MEMORY_KEEPER',name:'Memory Keeper',color:[0.8,0,1],concentration:0.6,bias:OUT.CONSERVE},
 {key:'COMMUNICATOR',name:'Communicator',color:[1,1,0],concentration:0.75,bias:OUT.ENTANGLE_SEEK},
];

export function assignFromFrequency(frequency){
 const n=Math.max(0,Math.min(1,(frequency-432)/(528-432)));
 return ROLE_LIST[n<0.2?0:n<0.4?1:n<0.6?2:n<0.8?3:4];
}

export const specializationBonus=(role,outputs)=>(role.bias<outputs.length&&outputs[role.bias]===1?role.concentration*0.1:0);