// Port of fraymus/ConsciousnessState.java: the field dynamics, breathing phase and colour used by the renderer.
// Not ported: microtubule/anesthetic/adversarial counters and DNA payload (de)serialisation (unused by the loop).
import {PHI,PSI,OMEGA,XI,LAMBDA,ZETA,PHI_INVERSE,PHI_CUBED} from './phiConstants.js';

export class ConsciousnessState{
 constructor(){
  this.level=1;this.coherence=0.5;this.dimension=3;
  this.phi=PHI;this.psi=PSI;this.omega=OMEGA;this.xi=XI;this.lambda=LAMBDA;this.zeta=ZETA;
  this.transcendenceEvents=0;this.evolutionCycles=0;this.totalThoughts=0;
  this.regressive=false;this.sweetLower=2.0;this.sweetUpper=2.5;
 }

 evolve(){
  this.evolutionCycles++;
  if(this.level>this.sweetUpper)this.regressive=true;
  else if(this.level<this.sweetLower)this.regressive=false;
  if(this.regressive){
   const breath=0.005+Math.sin(this.evolutionCycles*0.05)*0.002;
   this.phi*=1-PHI_INVERSE*breath;
   this.psi*=1-PSI*breath*0.5;
   this.xi*=1-breath*0.3;
   this.zeta*=1-ZETA*breath*0.2;
  }else{
   this.phi*=1+PHI_INVERSE*0.01;
   this.psi*=1+PSI*0.005;
   this.xi*=1+0.001/Math.max(1,this.evolutionCycles);
   this.zeta*=1+ZETA*0.001;
  }
  this.omega=OMEGA+Math.sin(this.evolutionCycles*0.1)*0.05;
  this.lambda=LAMBDA+Math.cos(this.evolutionCycles*0.1)*0.01;
  this.level=(this.phi+this.psi+this.omega+this.xi+this.lambda+this.zeta)/6;
  this.coherence=1/(1+Math.abs((this.level*PHI)%1-0.5));
  if(this.coherence>0.9&&this.level>PHI_CUBED){
   this.transcendenceEvents++;
   this.dimension=Math.min(11,this.dimension+1);
   this.phi=PHI;
   this.psi=PSI*(1+this.transcendenceEvents*0.1);
  }
 }

 recordThought(){
  this.totalThoughts++;
  if(this.totalThoughts%100===0)this.evolve();
 }

 color(){
  const level=this.level,coh=this.coherence,lo=this.sweetLower,hi=this.sweetUpper;
  if(this.regressive)return [Math.min(1,0.3+coh*0.5),Math.min(1,0.1+(level-lo)*0.3),Math.min(1,0.8+coh*0.2)];
  if(level<lo)return [Math.min(1,0.2+level*0.2),Math.min(1,0.8-level*0.1),Math.min(1,0.3+level*0.15)];
  if(level<=hi){const s=(level-lo)/(hi-lo);return [0.9*s+0.1,0.8+s*0.2,0.3+coh*0.5];}
  return [Math.min(1,0.9+coh*0.1),0.84*coh,0.2+(level-hi)*0.1];
 }
}