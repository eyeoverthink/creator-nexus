// Port of fraymus/Laws.java. Law-level counters are shared across nodes exactly as in the source
// (PhiWorld.step calls apply() once per node per tick), so cadence depends on population size.
// Not ported: GenesisMemory.record* calls (hash-chained event log).
import {OUT,LogicBrain,wants} from './logicBrain.js';
import {specializationBonus} from './antRole.js';

const TWO_PI=Math.PI*2;
const MAX_POPULATION=30;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const wrapPhase=p=>{while(p>Math.PI)p-=TWO_PI;while(p<-Math.PI)p+=TWO_PI;return p;};

export class Inertia{
 apply(n,dt){n.x+=n.vx*dt;n.y+=n.vy*dt;}
}

export class HarmonicResonance{
 apply(n,dt){
  n.phase+=n.frequency*dt;
  if(n.phase>TWO_PI)n.phase-=TWO_PI;
 }
}

export class EntanglementLaw{
 constructor(world){this.world=world;this.pairwise=true;this.pairTick=0;}
 apply(){}
 applyPair(a,b,dt){
  if(Math.abs(a.frequency-b.frequency)>0.5)return;
  const d=wrapPhase(a.phase-b.phase),correction=-2*d;
  a.phase+=correction*dt;b.phase-=correction*dt;
  a.energy=Math.min(1,a.energy+0.05*dt);b.energy=Math.min(1,b.energy+0.05*dt);
  if(++this.pairTick%180===0)this.world.log(`[ENTANGLE] ${a.name} <-> ${b.name} (sync: ${Math.abs(d).toFixed(3)})`);
 }
}

export class ScottPredictionLaw{
 constructor(world,lookAhead){this.world=world;this.lookAhead=lookAhead;this.tick=0;}
 apply(n){
  const fx=n.x+n.vx*this.lookAhead,fy=n.y+n.vy*this.lookAhead;
  this.tick++;
  if((Math.abs(n.vx)>0.5||Math.abs(n.vy)>0.5)&&this.tick%120===0)this.world.log(`[SCOTT-4D] ${n.name} -> Future(${fx.toFixed(1)}, ${fy.toFixed(1)})`);
 }
}

export class ResonanceSpikeLaw{
 constructor(world){this.world=world;}
 apply(n,dt){
  const clock=n.quantumClock;
  if(!clock.spikeActive)return;
  n.boostEnergy(0.03*dt);
  n.consciousness.evolve();
  if(clock.resonanceSpikeCount%10===1)this.world.log(`[SPIKE] ${n.name} phi=${clock.phiResonance.toFixed(4)} osc=${clock.oscillationCount.toFixed(0)}`);
 }
}

export class BrainLaw{
 constructor(world){this.world=world;this.tick=0;}
 apply(n,dt){
  this.tick++;
  if(this.tick%6!==0)return;
  let nearby=0,entangled=0,freqDiff=0,nearest=null,nearestDist=Infinity;
  for(const o of this.world.nodes){
   if(o===n)continue;
   const dist=Math.hypot(o.x-n.x,o.y-n.y);
   if(dist<50){
    nearby++;freqDiff+=Math.abs(n.frequency-o.frequency);
    if(Math.abs(n.frequency-o.frequency)<0.5)entangled++;
   }
   if(dist<nearestDist){nearest=o;nearestDist=dist;}
  }
  const spike=n.quantumClock.spikeActive;
  const sensors=LogicBrain.sensors(nearby,nearby>0?freqDiff/nearby:100,n.energy,n.phiResonance,n.consciousness.coherence,n.phase,spike,n.age);
  const out=n.brain.compute(sensors);
  const decision=n.brain.interpret(out);
  const bonus=specializationBonus(n.role,out);
  if(bonus>0)n.boostEnergy(bonus*dt);
  const ae=n.adaptiveEngine;
  ae.recordFitnessSample(n.energy,spike,entangled,false);
  const trial=ae.tickTrial(n.brain);
  if(trial==='ADOPTED')this.world.log(`[ADAPT] ${n.name} adopted new strategy (fitness=${ae.currentFitness.toFixed(3)})`);
  else if(trial==='REVERTED')this.world.log(`[ADAPT] ${n.name} reverted trial (not fit enough)`);
  if(wants(out,OUT.SEEK)&&nearest){
   const dx=nearest.x-n.x,dy=nearest.y-n.y,d=Math.hypot(dx,dy);
   if(d>1){n.vx+=dx/d*2*dt;n.vy+=dy/d*2*dt;}
  }
  if(wants(out,OUT.FLEE)&&nearest){
   const dx=n.x-nearest.x,dy=n.y-nearest.y,d=Math.hypot(dx,dy);
   if(d>0.5){n.vx+=dx/d*3*dt;n.vy+=dy/d*3*dt;}
  }
  if(wants(out,OUT.CONSERVE)){n.vx*=0.95;n.vy*=0.95;n.boostEnergy(0.005*dt);}
  if(wants(out,OUT.MUTATE)&&spike&&!ae.inTrial){
   ae.beginTrial(n.brain);
   if(this.tick%60===0)this.world.log(`[TRIAL] ${n.name} began mutation trial during spike`);
  }
  if(wants(out,OUT.ENERGY_BURST)&&n.energy>0.5){
   n.energy-=0.02;
   n.vx+=Math.cos(n.phase)*5*dt;n.vy+=Math.sin(n.phase)*5*dt;
  }
  if(wants(out,OUT.EVOLVE_DNA)){n.dna.evolve();n.frequency=n.dna.harmonicFrequency;}
  n.vx=clamp(n.vx,-15,15);n.vy=clamp(n.vy,-15,15);
  if(this.tick%300===0&&decision!=='IDLE')this.world.log(`[BRAIN] ${n.name} -> ${decision}`);
 }
}

export class ReproductionLaw{
 constructor(world){this.world=world;this.tick=0;this.childCount=0;}
 apply(n){
  this.tick++;
  if(this.tick%120!==0)return;
  const w=this.world;
  if(w.nodes.length>=MAX_POPULATION||!n.canReproduce())return;
  if(!wants(n.brain.lastOutputs,OUT.REPRODUCE))return;
  if(!n.quantumClock.spikeActive&&n.energy<0.9)return;
  this.childCount++;
  const name=`${n.name}-${this.childCount}`;
  const ox=Math.cos(n.phase)*5,oy=Math.sin(n.phase)*5;
  const child=n.reproduce(w.rng,null,name,n.x+ox,n.y+oy);
  child.vx=ox*0.5;child.vy=oy*0.5;
  child.role=w.coach.suggestRoleForChild(n);
  w.addNode(child);
  w.log(`[BIRTH] ${n.name} spawned ${name}`);
 }
}

export class BoundaryLaw{
 constructor(minX,maxX,minY,maxY){this.minX=minX;this.maxX=maxX;this.minY=minY;this.maxY=maxY;}
 apply(n){
  if(n.x<this.minX){n.x=this.minX;n.vx=Math.abs(n.vx)*0.5;}
  if(n.x>this.maxX){n.x=this.maxX;n.vx=-Math.abs(n.vx)*0.5;}
  if(n.y<this.minY){n.y=this.minY;n.vy=Math.abs(n.vy)*0.5;}
  if(n.y>this.maxY){n.y=this.maxY;n.vy=-Math.abs(n.vy)*0.5;}
 }
}