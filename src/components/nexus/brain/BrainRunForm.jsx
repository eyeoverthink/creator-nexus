import {useState} from 'react';
import {Button} from '@/components/ui/button';
export default function BrainRunForm({kind,busy,onRun}){
 const [source,setSource]=useState('floats'),[text,setText]=useState(''),[budget,setBudget]=useState('.05'),[error,setError]=useState('');
 const submit=e=>{e.preventDefault();setError('');try{
  let args;if(kind==='ledger'){
   const value=Number(budget);if(budget===''||!Number.isFinite(value)||value<0)throw new Error('Enter a nonnegative error budget.');
   let weights;if(source==='floats'){const tokens=text.trim().split(/[\s,]+/);weights=tokens.map(Number);if(!text.trim()||weights.some(x=>!Number.isFinite(x)))throw new Error('Every supplied weight must be a number.');}
   args={brain_action:'ledger',source_format:source,budget:value,...(source==='floats'?{weights}:{block_hex:text})};
  }else{args={...JSON.parse(text),brain_action:'train'};delete args.commit;}
  onRun(args);
 }catch(e){setError(e.message);}};
 return <form onSubmit={submit} className="space-y-3"><p className="text-muted-foreground">{kind==='ledger'?'Paste actual weights or exactly one quantized block. No synthetic tensor is substituted.':'Supply JSON containing batch and validation arrays of {"x":[numbers],"y":number}, plus optional steps, learning_rate, trip and state_id. Validation participates in acceptance; use a separate final test set for independent evaluation.'}</p>
 {kind==='ledger'&&<div className="flex flex-wrap gap-3"><label>Input format<select disabled={busy} value={source} onChange={e=>setSource(e.target.value)} className="block mt-1 rounded-md bg-secondary border border-input p-2">{['floats','Q8_0','Q5_0','Q6_K','Q4_K','FRL1'].map(s=><option key={s}>{s}</option>)}</select></label><label>Maximum absolute error<input disabled={busy} type="number" min="0" max="1000000" step="any" required value={budget} onChange={e=>setBudget(e.target.value)} className="block mt-1 rounded-md bg-secondary border border-input p-2"/></label></div>}
 <label className="block">{kind==='ledger'?(source==='floats'?'Comma- or space-separated float weights':'Exact hexadecimal bytes'):'Training request JSON'}<textarea disabled={busy} value={text} onChange={e=>setText(e.target.value)} rows={6} maxLength={36000} required spellCheck={false} className="mt-1 w-full rounded-md bg-secondary border border-input p-2 font-mono"/></label><Button disabled={busy} type="submit">{busy?'Measuring…':kind==='ledger'?'Measure and verify ledger':'Run gated vote training'}</Button>{error&&<p role="alert" className="text-destructive">{error}</p>}</form>;
}