// Port of fraymus/StrategyGenome.java and fraymus/AdaptiveLogicEngine.java (300-tick mutation trials).
// Not ported: StrategyGenome.hash (SHA-256 prefix, display only).
const TRIAL_DURATION=300,MAX_STRATEGIES=10,MIN_IMPROVEMENT=0.05;

export class StrategyGenome{
 constructor(types,in1,in2,fitness=0,generation=0){
  this.gateTypes=types;this.input1s=in1;this.input2s=in2;
  this.fitnessScore=fitness;this.generationBorn=generation;
  this.survivedTicks=0;this.reproductionCount=0;
 }
 static fromBrain(brain,generation){
  return new StrategyGenome(brain.gates.map(g=>g.type),brain.gates.map(g=>g.in1),brain.gates.map(g=>g.in2),0,generation);
 }
 applyTo(brain){
  const n=Math.min(this.gateTypes.length,brain.gates.length);
  for(let i=0;i<n;i++){const g=brain.gates[i];g.type=this.gateTypes[i];g.in1=this.input1s[i];g.in2=this.input2s[i];}
 }
 similarity(other){
  let matches=0;
  const total=Math.min(this.gateTypes.length,other.gateTypes.length);
  for(let i=0;i<total;i++){
   if(this.gateTypes[i]===other.gateTypes[i])matches++;
   if(this.input1s[i]===other.input1s[i])matches++;
   if(this.input2s[i]===other.input2s[i])matches++;
  }
  return matches/(total*3);
 }
 copy(){return new StrategyGenome([...this.gateTypes],[...this.input1s],[...this.input2s],this.fitnessScore,this.generationBorn);}
 encode(){
  const gates=this.gateTypes.map((t,i)=>`${t},${this.input1s[i]},${this.input2s[i]}`).join(';');
  return `SG|${gates}|${this.fitnessScore.toFixed(4)}|${this.generationBorn}`;
 }
 static decode(encoded){
  const parts=encoded.split('|');
  if(parts.length<4||parts[0]!=='SG')return null;
  const types=[],in1=[],in2=[];
  for(const g of parts[1].split(';')){
   const v=g.split(',');
   types.push(parseInt(v[0],10));in1.push(parseInt(v[1],10));in2.push(parseInt(v[2],10));
  }
  return new StrategyGenome(types,in1,in2,parseFloat(parts[2]),parseInt(parts[3],10));
 }
}

export class AdaptiveLogicEngine{
 constructor(brain,generation){
  this.provenStrategies=[];
  this.currentBaseline=StrategyGenome.fromBrain(brain,generation);
  this.trialStrategy=null;
  this.inTrial=false;this.trialTicksRemaining=0;this.preTrialFitness=0;
  this.fitnessAccumulator=0;this.fitnessSamples=0;this.currentFitness=0;
  this.adaptationCount=0;this.revertCount=0;this.totalTrials=0;
  this.generation=generation;
 }

 recordFitnessSample(energy,spikeActive,nearbyEntangled,reproduced){
  let sample=energy*0.4;
  if(spikeActive)sample+=0.2;
  sample+=Math.min(nearbyEntangled*0.1,0.3);
  if(reproduced)sample+=0.3;
  this.fitnessAccumulator+=sample;
  this.fitnessSamples++;
  this.currentFitness=this.fitnessAccumulator/this.fitnessSamples;
 }

 beginTrial(brain){
  if(this.inTrial)return;
  this.currentBaseline=StrategyGenome.fromBrain(brain,this.generation);
  this.preTrialFitness=this.currentFitness;
  this.fitnessAccumulator=0;this.fitnessSamples=0;
  brain.mutate();
  this.trialStrategy=StrategyGenome.fromBrain(brain,this.generation);
  this.inTrial=true;this.trialTicksRemaining=TRIAL_DURATION;this.totalTrials++;
 }

 tickTrial(brain){
  if(!this.inTrial)return 'NOT_IN_TRIAL';
  this.trialTicksRemaining--;
  if(this.trialTicksRemaining>0)return 'IN_PROGRESS';
  const trialFitness=this.fitnessSamples>0?this.fitnessAccumulator/this.fitnessSamples:0;
  if(trialFitness-this.preTrialFitness>MIN_IMPROVEMENT){
   this.trialStrategy.fitnessScore=trialFitness;
   this.trialStrategy.survivedTicks=TRIAL_DURATION;
   this.addProvenStrategy(this.trialStrategy);
   this.currentBaseline=this.trialStrategy;
   this.adaptationCount++;this.inTrial=false;
   return 'ADOPTED';
  }
  this.currentBaseline.applyTo(brain);
  this.revertCount++;this.inTrial=false;
  return 'REVERTED';
 }

 // Source behaviour kept: a near-duplicate (similarity > 0.9) only replaces its twin when fitter;
 // otherwise it is still appended, so duplicates accumulate until the 10-strategy cap evicts the weakest.
 addProvenStrategy(strategy){
  let replace=-1;
  for(let i=0;i<this.provenStrategies.length;i++){
   if(this.provenStrategies[i].similarity(strategy)>0.9){
    if(strategy.fitnessScore>this.provenStrategies[i].fitnessScore)replace=i;
    break;
   }
  }
  if(replace>=0){this.provenStrategies[replace]=strategy;return;}
  this.provenStrategies.push(strategy);
  if(this.provenStrategies.length>MAX_STRATEGIES){
   let weakest=0;
   for(let i=1;i<this.provenStrategies.length;i++){
    if(this.provenStrategies[i].fitnessScore<this.provenStrategies[weakest].fitnessScore)weakest=i;
   }
   this.provenStrategies.splice(weakest,1);
  }
 }

 inheritStrategies(parent){
  for(const s of parent.provenStrategies){
   const inherited=s.copy();
   inherited.fitnessScore*=0.8;
   this.addProvenStrategy(inherited);
  }
 }

 encodeStrategies(){return this.provenStrategies.map(s=>s.encode()).join('##');}

 decodeStrategies(encoded){
  if(!encoded)return;
  for(const part of encoded.split('##')){
   const genome=StrategyGenome.decode(part);
   if(genome)this.addProvenStrategy(genome);
  }
 }
}