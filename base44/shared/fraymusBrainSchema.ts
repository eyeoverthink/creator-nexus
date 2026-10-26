import {z} from 'npm:zod@4.4.3';
import {fraymusAdaptiveInput} from './fraymusAdaptiveSchema.ts';
const number=z.number().min(-1000000).max(1000000);
const row=z.object({x:z.array(number).min(1).max(32),y:number}).strict();
export const fraymusBrainInput=z.object({
 brain_action:z.enum(['ledger','train','adaptive']),adaptive_input:fraymusAdaptiveInput.optional(),source_format:z.enum(['floats','Q8_0','Q5_0','Q6_K','Q4_K','FRL1']).optional(),
 weights:z.array(number).min(1).max(256).optional(),block_hex:z.string().max(8192).optional(),budget:z.number().min(0).max(1000000).optional(),tolerance:z.number().min(0).max(1).optional(),
 batch:z.array(row).min(1).max(32).optional(),validation:z.array(row).min(1).max(32).optional(),steps:z.number().int().min(1).max(40).optional(),learning_rate:z.number().min(.000001).max(1).optional(),trip:z.number().int().min(1).max(16).optional(),
 state_id:z.string().min(1).max(120).optional(),commit:z.boolean().optional()
}).strict().superRefine((a,ctx)=>{
  if(a.brain_action==='adaptive'&&!a.adaptive_input)ctx.addIssue({code:'custom',message:'Provide adaptive_input for the adaptive brain.'});
  if(a.brain_action!=='adaptive'&&a.adaptive_input)ctx.addIssue({code:'custom',message:'adaptive_input is only for the adaptive brain.'});
  if(a.brain_action==='adaptive'&&a.adaptive_input?.operation!=='initialize'&&!a.state_id)ctx.addIssue({code:'custom',message:'Adaptive operations resume an explicit retained state_id.'});
  if(a.brain_action==='adaptive'&&a.adaptive_input?.operation==='initialize'&&a.state_id)ctx.addIssue({code:'custom',message:'Initialize cannot replace a retained state.'});
  if(a.brain_action==='train'&&(!a.batch||!a.validation))ctx.addIssue({code:'custom',message:'Provide explicit training and validation batches.'});
 if(a.brain_action==='ledger'&&(a.source_format??'floats')==='floats'&&!a.weights)ctx.addIssue({code:'custom',message:'Provide actual float weights; no synthetic tensor is substituted.'});
 if(a.brain_action==='ledger'&&a.source_format&&a.source_format!=='floats'&&!a.block_hex)ctx.addIssue({code:'custom',message:'Provide the exact block hex.'});
 if(a.brain_action==='ledger'&&a.state_id)ctx.addIssue({code:'custom',message:'Only training resumes neuron state; decode ledgers using FRL1 hex.'});
});