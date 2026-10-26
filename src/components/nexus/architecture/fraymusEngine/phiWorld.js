// Port of fraymus/PhiWorld.java and the world setup in jade/Window.initPhiWorld().
// Not ported: NerveCenter websocket broadcast, EscapeFragment death persistence, GenesisMemory, ConceptArena.
import {createRng} from './rng.js';
import {SelfHealer} from './selfHealer.js';
import {ColonyCoach} from './colonyCoach.js';
import {PhiNode} from './phiNode.js';
import {Inertia,HarmonicResonance,EntanglementLaw,ScottPredictionLaw,ResonanceSpikeLaw,BrainLaw,ReproductionLaw,BoundaryLaw} from './laws.js';

const MAX_LOG=50;
// name, x, y, vx, vy, energy (Window.initPhiWorld)
const FOUNDERS=[
 ['Alpha',0,0,0.5,0.3,1],['Beta',30,20,-0.3,0.2,0.9],['Gamma',-20,40,0.1,-0.4,0.8],
 ['Delta',50,-30,-0.2,0.1,0.95],['Epsilon',-40,-20,0.4,0.4,0.85],
];

export class PhiWorld{
 constructor(seed,nowMs){
  this.seed=seed;
  this.rng=createRng(seed);
  this.nodes=[];this.pending=[];this.laws=[];this.logs=[];
  this.healer=new SelfHealer(nowMs);
  this.coach=new ColonyCoach(this.rng);
  this.totalBirths=0;this.totalDeaths=0;this.worldTick=0;
 }

 addNode(node){this.pending.push(node);}
 addLaw(law){this.laws.push(law);}
 log(message){this.logs.push(message);if(this.logs.length>MAX_LOG)this.logs.shift();}

 step(dt,t){
  this.worldTick++;
  if(this.pending.length){
   this.nodes.push(...this.pending);
   this.totalBirths+=this.pending.length;
   this.pending.length=0;
  }
  for(const law of this.laws){
   if(law.pairwise){
    for(let i=0;i<this.nodes.length;i++)for(let j=i+1;j<this.nodes.length;j++)law.applyPair(this.nodes[i],this.nodes[j],dt);
   }else{
    for(const n of this.nodes)law.apply(n,dt);
   }
  }
  for(const n of this.nodes)n.update(dt,t,this.healer);
  this.coach.tick(this.nodes);
  const dead=this.nodes.filter(n=>!n.isAlive());
  for(const n of dead){
   this.healer.remove(n.name);
   this.totalDeaths++;
   if(this.worldTick%60===0)this.log(`[ENTROPY] ${n.name} expired (age ${n.age})`);
  }
  if(dead.length)this.nodes=this.nodes.filter(n=>n.isAlive());
 }
}

export function createFraymusWorld(seed,nowMs){
 const w=new PhiWorld(seed,nowMs);
 w.addLaw(new Inertia());
 w.addLaw(new HarmonicResonance());
 w.addLaw(new EntanglementLaw(w));
 w.addLaw(new ScottPredictionLaw(w,2));
 w.addLaw(new ResonanceSpikeLaw(w));
 w.addLaw(new BrainLaw(w));
 w.addLaw(new ReproductionLaw(w));
 w.addLaw(new BoundaryLaw(-180,180,-100,100));
 for(const [name,x,y,vx,vy,energy] of FOUNDERS){
  const n=new PhiNode(w.rng,name,x,y);
  n.vx=vx;n.vy=vy;n.energy=energy;
  w.addNode(n);
 }
 w.log('World initialized with 5 PhiNode entities');
 return w;
}