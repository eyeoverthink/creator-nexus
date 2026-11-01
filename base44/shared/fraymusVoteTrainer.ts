// Bounded single-neuron adaptation of the inspected phi75 vote trainer.
// Weight updates additionally require non-increasing caller-supplied validation loss.
import {encodePhi,decodePhi} from './fraymusPhiScale.ts';
const dot=(trits,x)=>trits.reduce((sum,t,i)=>t===1?sum+x[i]:t===-1?sum-x[i]:sum,0);
const predict=(n,x)=>decodePhi(n.scale)*dot(n.trits,x)+n.bias;
const loss=(n,batch)=>batch.reduce((sum,row)=>sum+(predict(n,row.x)-row.y)**2,0)/batch.length;
export function trainFraymusVotes(input,saved){
 const batch=input.batch,held=input.validation,dim=batch[0].x.length;
 if([...batch,...held].some(r=>r.x.length!==dim))throw new Error('All training and validation rows must have the same input width.');
 let neuron=saved?structuredClone(saved):{trits:Array(dim).fill(0),votes:Array(dim).fill(0),scale:encodePhi(.2),bias:0};
 if(neuron.trits?.length!==dim||neuron.votes?.length!==dim||neuron.trits.some(t=>![-1,0,1].includes(t))||neuron.votes.some(v=>!Number.isInteger(v)||Math.abs(v)>32767)||!Number.isFinite(neuron.bias)||!Number.isFinite(decodePhi(neuron.scale)))throw new Error('Saved neuron is incompatible with this batch.');
 const start={training:loss(neuron,batch),validation:loss(neuron,held)},trace=[];
 if(!Number.isFinite(start.training)||!Number.isFinite(start.validation))throw new Error('Saved neuron produces non-finite loss.');
 const rate=input.learning_rate??.35,trip=input.trip??4;
 for(let step=0;step<(input.steps??16);step++){
  const before=loss(neuron,batch),validationBefore=loss(neuron,held),scale=decodePhi(neuron.scale)||1e-6,grad=Array(dim).fill(0);let gb=0,gs=0;
  for(const row of batch){const e=predict(neuron,row.x)-row.y;gb+=e;gs+=e*dot(neuron.trits,row.x);for(let i=0;i<dim;i++)grad[i]+=e*scale*row.x[i];}
  const votes=[...neuron.votes],trits=[...neuron.trits];
  for(let i=0;i<dim;i++){
   votes[i]=Math.max(-32767,Math.min(32767,votes[i]+Math.sign(-grad[i])));
   if(votes[i]>=trip&&trits[i]<1){trits[i]++;votes[i]=0;}else if(votes[i]<=-trip&&trits[i]>-1){trits[i]--;votes[i]=0;}
  }
  const bias=neuron.bias-rate*gb/batch.length;
  const candidates=[{...neuron,trits,votes,bias},{...neuron,trits,votes,bias,scale:encodePhi(scale-rate*gs/batch.length)}];
  let best=neuron,after=before,validationAfter=validationBefore;
  for(const n of candidates){
   const a=loss(n,batch),h=loss(n,held);
   if(Number.isFinite(a)&&Number.isFinite(h)&&a<after-1e-15&&h<=validationBefore+1e-15){best=n;after=a;validationAfter=h;}
  }
  const kept=best!==neuron;if(kept)neuron=best;
  trace.push({step:step+1,kept,before,after,validation_before:validationBefore,validation_after:validationAfter});
 }
 return {engine:'Fraymus phi75 vote trainer',status:'measured',neuron,start,end:{training:loss(neuron,batch),validation:loss(neuron,held)},trace,kept:trace.filter(s=>s.kept).length,training_rows:batch.length,validation_rows:held.length,validation_role:'Caller-supplied acceptance set; not an unbiased final test set.',notice:'One linear neuron only. Held steps roll back weights and votes. No transformer, Needle3, Carbon-3B or hosted-agent weights are modified.'};
}