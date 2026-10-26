// Port of fraymus/LogicGate.java and fraymus/LogicBrain.java (8 boolean gates over 8 sensor bits).
export const OUT={SEEK:0,FLEE:1,REPRODUCE:2,MUTATE:3,CONSERVE:4,ENTANGLE_SEEK:5,ENERGY_BURST:6,EVOLVE_DNA:7};
const NAMES=['SEEK','FLEE','REPRODUCE','MUTATE','CONSERVE','ENTANGLE_SEEK','ENERGY_BURST','EVOLVE_DNA'];
export const wants=(outputs,i)=>outputs.length>i&&outputs[i]===1;

export class LogicGate{
 constructor(type,in1,in2){this.type=type;this.in1=in1;this.in2=in2;this.state=0;}
 static random(rng){return new LogicGate(rng.int(4),rng.int(8),rng.int(8));}
 compute(inputs){
  const v1=this.in1<inputs.length?inputs[this.in1]:0,v2=this.in2<inputs.length?inputs[this.in2]:0;
  switch(this.type){
   case 0:this.state=v1&v2;break;
   case 1:this.state=v1|v2;break;
   case 2:this.state=v1^v2;break;
   case 3:this.state=(v1&v2)===0?1:0;break;
   default:break;
  }
  return this.state;
 }
 mutate(rng){if(rng.bool())this.in1=rng.int(8);else this.type=rng.int(4);}
 copy(){return new LogicGate(this.type,this.in1,this.in2);}
}

export class LogicBrain{
 constructor(rng,numGates=8,gates=null){
  this.rng=rng;
  this.gates=gates||Array.from({length:Math.max(numGates,8)},()=>LogicGate.random(rng));
  this.lastOutputs=new Array(this.gates.length).fill(0);
 }

 compute(inputs){
  this.lastOutputs=this.gates.map(g=>g.compute(inputs));
  return this.lastOutputs;
 }

 static sensors(nearbyCount,avgFreqDiff,energy,phiResonance,coherence,phase,spikeActive,age){
  return [
   nearbyCount>2?1:0,avgFreqDiff<5?1:0,energy>0.7?1:0,phiResonance>0.8?1:0,
   coherence>0.9?1:0,phase>Math.fround(Math.PI)?1:0,spikeActive?1:0,age>500?1:0,
  ];
 }

 interpret(outputs){
  const active=[];
  for(let i=0;i<Math.min(outputs.length,NAMES.length);i++)if(outputs[i]===1)active.push(NAMES[i]);
  return active.length?active.join('+'):'IDLE';
 }

 mutate(){if(this.gates.length)this.gates[this.rng.int(this.gates.length)].mutate(this.rng);}

 crossover(partner){
  const child=[],mid=Math.floor(this.gates.length/2);
  for(let i=0;i<mid&&i<this.gates.length;i++)child.push(this.gates[i].copy());
  for(let i=mid;i<partner.gates.length;i++)child.push(partner.gates[i].copy());
  while(child.length<8)child.push(LogicGate.random(this.rng));
  const brain=new LogicBrain(this.rng,8,child);
  if(this.rng.double()<0.1)brain.mutate();
  return brain;
 }
}