// Port of fraymus/QuantumClock.java. Not ported: quantumFingerprint (PhiConstants.quantumHash) and the
// phiTime/resonanceTime/coherence readouts, none of which feed back into the simulation.
import {PHI,applyHarmonicLaw} from './phiConstants.js';

export class QuantumClock{
 constructor(frequency){
  this.pendulumFrequency=frequency;
  this.oscillationCount=0;
  this.phiResonance=0;
  this.resonanceSpikeCount=0;
  this.spikeActive=false;
  this.phaseOffset=(frequency*PHI)%1;
 }

 tick(dt){
  this.oscillationCount+=dt*this.pendulumFrequency;
  this.phiResonance=(PHI*this.oscillationCount*0.001+this.phaseOffset)%1;
  const wasSpiking=this.spikeActive;
  this.spikeActive=this.phiResonance>0.95;
  if(this.spikeActive&&!wasSpiking)this.resonanceSpikeCount++;
 }

 setPendulumFrequency(freq){this.pendulumFrequency=applyHarmonicLaw(freq);}
}