// Port of fraymus/LivingDNA.java and fraymus/PhiNode.java.
// Not ported: MorseCircuit.tickEntity (text-buffer side channel), BigInteger signature object, toJavaCode.
import {ConsciousnessState} from './consciousness.js';
import {QuantumClock} from './quantumClock.js';
import {LogicBrain} from './logicBrain.js';
import {AdaptiveLogicEngine} from './adaptiveLogic.js';
import {assignFromFrequency} from './antRole.js';
import {cloakedTraits} from './cloakedIdentity.js';

export class LivingDNA{
 constructor(rng,freq,resonance,evolutionRate){
  if(freq===undefined){
   this.harmonicFrequency=432+rng.double()*20;
   this.resonance=0.5+rng.double();
   this.evolutionRate=0.05;
  }else{
   this.harmonicFrequency=freq;this.resonance=resonance;this.evolutionRate=evolutionRate;
  }
  this.generation=1;
  this.inheritedStrategies='';
 }
 evolve(){
  this.harmonicFrequency+=this.evolutionRate;
  if(this.harmonicFrequency>528)this.harmonicFrequency=432;
 }
 pulse(t){return Math.sin(this.harmonicFrequency*t*0.0001)*this.resonance;}
 copy(rng){
  const child=new LivingDNA(rng,this.harmonicFrequency,this.resonance,this.evolutionRate);
  child.generation=this.generation;
  child.inheritedStrategies=this.inheritedStrategies;
  return child;
 }
}

export class PhiNode{
 constructor(rng,name,x,y,{dna=null,brain=null,freq=0}={}){
  this.name=name;this.x=x;this.y=y;this.vx=0;this.vy=0;
  this.energy=1;this.phase=0;this.phiResonance=0;this.age=0;this.pulse=0;this.spikeFlash=false;
  this.dna=dna||(freq>0?new LivingDNA(rng,freq,1,0.05):new LivingDNA(rng));
  this.brain=brain||new LogicBrain(rng,8);
  this.consciousness=new ConsciousnessState();
  this.frequency=this.dna.harmonicFrequency;
  this.quantumClock=new QuantumClock(this.frequency);
  this.adaptiveEngine=new AdaptiveLogicEngine(this.brain,this.dna.generation);
  if(this.dna.inheritedStrategies)this.adaptiveEngine.decodeStrategies(this.dna.inheritedStrategies);
  const traits=cloakedTraits(name);
  this.r=traits.r;this.g=traits.g;this.b=traits.b;
  this.baseSize=traits.baseSize;this.size=traits.baseSize;
  this.role=assignFromFrequency(this.frequency);
 }

 update(dt,t,healer){
  this.age++;
  this.pulse=this.dna.pulse(t);
  this.size=Math.max(1,this.baseSize+this.pulse*5);
  this.dna.evolve();
  this.frequency=this.dna.harmonicFrequency;
  this.quantumClock.setPendulumFrequency(this.frequency);
  this.quantumClock.tick(dt);
  this.phiResonance=this.quantumClock.phiResonance;
  this.spikeFlash=this.quantumClock.spikeActive;
  this.energy=Math.max(0,this.energy-0.01*dt);
  this.consciousness.recordThought();
  healer.tick(this);
 }

 canReproduce(){return this.size>15&&this.energy>0.7;}
 isAlive(){return this.energy>0.001;}
 boostEnergy(amount){this.energy=Math.min(1,this.energy+amount);}

 reproduce(rng,partner,childName,x,y){
  const childDna=this.dna.copy(rng);
  childDna.generation=this.dna.generation+1;
  childDna.inheritedStrategies=this.adaptiveEngine.encodeStrategies();
  const childBrain=this.brain.crossover(partner?partner.brain:this.brain);
  this.baseSize*=0.6;
  this.energy*=0.7;
  const child=new PhiNode(rng,childName,x,y,{dna:childDna,brain:childBrain});
  child.adaptiveEngine.inheritStrategies(this.adaptiveEngine);
  if(partner)child.adaptiveEngine.inheritStrategies(partner.adaptiveEngine);
  this.adaptiveEngine.currentBaseline.reproductionCount++;
  return child;
 }
}