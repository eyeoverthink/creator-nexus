// Port of the role-accounting part of fraymus/ColonyCoach.java: the 180-tick colony evaluation and
// suggestRoleForChild. Not ported: code generation, ConceptArena evolution and coaching narration.
import {ROLE_LIST,assignFromFrequency} from './antRole.js';

const EVALUATION_INTERVAL=180;

export class ColonyCoach{
 constructor(rng){
  this.rng=rng;
  this.tickCounter=0;
  this.counts=new Map(ROLE_LIST.map(r=>[r,0]));
  this.health=0.5;this.diversity=0;this.resonance=0;
 }

 tick(nodes){
  this.tickCounter++;
  if(this.tickCounter%EVALUATION_INTERVAL===0)this.evaluate(nodes);
 }

 evaluate(nodes){
  for(const r of ROLE_LIST)this.counts.set(r,0);
  let totalFitness=0,totalEnergy=0,spikes=0;
  for(const n of nodes){
   this.counts.set(n.role,this.counts.get(n.role)+1);
   totalFitness+=n.adaptiveEngine.currentFitness;totalEnergy+=n.energy;
   if(n.spikeFlash)spikes++;
  }
  const pop=nodes.length;
  if(pop===0)return;
  this.health=(totalEnergy/pop+totalFitness/pop)/2;
  this.diversity=ROLE_LIST.filter(r=>this.counts.get(r)>0).length/ROLE_LIST.length;
  this.resonance=spikes/Math.max(1,pop);
 }

 suggestRoleForChild(parent){
  let missing=null,least=Infinity;
  for(const r of ROLE_LIST){const c=this.counts.get(r);if(c<least){least=c;missing=r;}}
  if(missing&&least===0)return missing;
  if(this.rng.double()<parent.role.concentration*0.6)return parent.role;
  return assignFromFrequency(parent.frequency);
 }
}