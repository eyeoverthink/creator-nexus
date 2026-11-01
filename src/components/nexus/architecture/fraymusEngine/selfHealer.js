// Port of fraymus/SelfHealer.java: periodic brain snapshots and restore when fitness or energy collapses.
const SNAPSHOT_INTERVAL=300,FITNESS_THRESHOLD=0.15,ENERGY_THRESHOLD=0.05;

export class SelfHealer{
 constructor(nowMs=()=>Date.now()){
  this.nowMs=nowMs;
  this.snapshots=new Map();this.counters=new Map();
  this.totalHeals=0;this.totalSnapshots=0;
 }

 snapshot(brain,fitness,energy){
  return {
   types:brain.gates.map(g=>g.type),in1:brain.gates.map(g=>g.in1),in2:brain.gates.map(g=>g.in2),
   fitness,energy,timestamp:this.nowMs(),
  };
 }

 tick(node){
  const counter=(this.counters.get(node.name)||0)+1;
  this.counters.set(node.name,counter);
  const fitness=node.adaptiveEngine.currentFitness;
  if(counter%SNAPSHOT_INTERVAL===0&&fitness>FITNESS_THRESHOLD&&node.energy>ENERGY_THRESHOLD){
   this.snapshots.set(node.name,this.snapshot(node.brain,fitness,node.energy));
   this.totalSnapshots++;
  }
  const last=this.snapshots.get(node.name);
  if(last&&this.needsHealing(node,last))this.heal(node,last);
 }

 needsHealing(node,snap){
  if(node.adaptiveEngine.currentFitness<FITNESS_THRESHOLD&&snap.fitness>FITNESS_THRESHOLD*2)return true;
  if(node.energy<ENERGY_THRESHOLD&&snap.energy>ENERGY_THRESHOLD*3)return this.nowMs()-snap.timestamp>5000;
  return false;
 }

 heal(node,snap){
  const n=Math.min(node.brain.gates.length,snap.types.length);
  for(let i=0;i<n;i++){const g=node.brain.gates[i];g.type=snap.types[i];g.in1=snap.in1[i];g.in2=snap.in2[i];}
  node.boostEnergy(0.15);
  this.totalHeals++;
  this.snapshots.set(node.name,this.snapshot(node.brain,node.adaptiveEngine.currentFitness,node.energy));
 }

 remove(name){this.snapshots.delete(name);this.counters.delete(name);}
}