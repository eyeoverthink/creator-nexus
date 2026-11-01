import {encodePhi,decodePhi,fromHex,toHex} from './fraymusPhiScale.ts';
import {decodeQuant} from './fraymusQuantBlocks.ts';
const pack=trits=>{const b=new Uint8Array(Math.ceil(trits.length/4));trits.forEach((t,i)=>{b[i>>2]|=(t<0?3:t)<<((i&3)*2);});return b;};
function header(count,mode,slots=0){
 const b=new Uint8Array(9),v=new DataView(b.buffer);b.set([70,82,76,49]);v.setUint16(4,count,true);b[6]=mode;v.setUint16(7,slots,true);return b;
}
function floatsBytes(weights){const b=new Uint8Array(weights.length*4),v=new DataView(b.buffer);weights.forEach((x,i)=>v.setFloat32(4*i,x,true));return b;}
function rawFrame(weights){const h=header(weights.length,0),body=floatsBytes(weights),b=new Uint8Array(h.length+body.length);b.set(h);b.set(body,9);return b;}
function ledgerFrame(trits,scale,slots,weights){
 const packed=pack(trits),scaleSize=scale.form==='phi'?3:8;
 const b=new Uint8Array(9+scaleSize+packed.length+slots.length*6),v=new DataView(b.buffer);b.set(header(trits.length,scaleSize===3?1:2,slots.length));
 if(scaleSize===3){v.setInt8(9,scale.e);v.setUint16(10,scale.m,true);}else v.setFloat64(9,scale.raw,true);
 b.set(packed,9+scaleSize);let p=9+scaleSize+packed.length;
 for(const i of slots){v.setUint16(p,i,true);v.setFloat32(p+2,weights[i],true);p+=6;}return b;
}
export function decodeFrl1(hex){
 const b=fromHex(hex),v=new DataView(b.buffer,b.byteOffset,b.byteLength);
 if(b.length<9||toHex(b.subarray(0,4))!=='46524c31')throw new Error('Invalid FRL1 header.');
 const count=v.getUint16(4,true),mode=b[6],n=v.getUint16(7,true);
 if(!count||count>256||n>count||mode>2)throw new Error('Invalid FRL1 dimensions or mode.');
 let weights=[],trits=[],scale=null;
 if(mode===0){if(n||b.length!==9+4*count)throw new Error('Invalid raw FRL1 length.');weights=Array.from({length:count},(_,i)=>v.getFloat32(9+4*i,true));}
 else{
  const size=mode===1?3:8,packedSize=Math.ceil(count/4),expected=9+size+packedSize+6*n;
  if(b.length!==expected)throw new Error('Invalid ledger length.');
  scale=mode===1?{form:'phi',e:v.getInt8(9),m:v.getUint16(10,true)}:{form:'raw-f64',raw:v.getFloat64(9,true)};
  const gamma=decodePhi(scale);if(!Number.isFinite(gamma)||gamma<0)throw new Error('Invalid nonnegative ledger scale.');
  for(let i=0;i<packedSize*4;i++){
   const c=(b[9+size+(i>>2)]>>>((i&3)*2))&3;
   if(c===2||(i>=count&&c))throw new Error('Reserved crumb or nonzero padding.');
   if(i<count)trits.push(c===3?-1:c);
  }
  weights=trits.map(t=>Math.fround(t*gamma));let p=9+size+packedSize,last=-1;
  for(let j=0;j<n;j++){
   const index=v.getUint16(p,true),value=v.getFloat32(p+2,true);p+=6;
   if(index<=last||index>=count||trits[index]!==0)throw new Error('Invalid or duplicate outlier slot.');
   weights[index]=value;last=index;
  }
 }
 if(weights.some(x=>!Number.isFinite(x)||Math.abs(x)>1e9))throw new Error('Non-finite or unsupported weight magnitude.');
 return {count,weights,trits,scale,outlier_count:n,container_bytes:b.length};
}
export function analyzeFraymusLedger(input){
 const source=input.source_format??'floats';
 if(source==='FRL1'){
  const decoded=decodeFrl1(input.block_hex);return {engine:'Fraymus phi75 weight ledger',status:'decoded',source_format:source,...decoded,export_format:'FRL1',export_hex:toHex(fromHex(input.block_hex)),notice:'Decoded container only. No original tensor was supplied to measure approximation error. This is not a GGUF model.'};
 }
 let weights,original,originalFormat,rounding=0;
 if(source==='floats'){
  weights=Array.from(Float32Array.from(input.weights));
  rounding=Math.max(...weights.map((x,i)=>Math.abs(x-input.weights[i])));
  original=rawFrame(weights);originalFormat='FRL1';
 }else{const d=decodeQuant(source,input.block_hex);weights=d.weights;original=Uint8Array.from(d.bytes);originalFormat=source;}
 if(weights.some(x=>!Number.isFinite(x)||Math.abs(x)>1e9))throw new Error('Unsupported weight magnitude.');
 const budget=input.budget??.05,n=weights.length,outlier=Array(n).fill(false);let gamma=0,trits=[];
 for(let pass=0;pass<4;pass++){
  const remaining=weights.filter((_,i)=>!outlier[i]);gamma=remaining.length?remaining.reduce((s,x)=>s+Math.abs(x),0)/remaining.length:0;
  trits=weights.map((w,i)=>outlier[i]?0:Math.max(-1,Math.min(1,Math.round(w/(gamma+1e-12))))||0);
  let changed=false;for(let i=0;i<n;i++)if(!outlier[i]&&Math.abs(weights[i]-trits[i]*gamma)>budget){outlier[i]=true;trits[i]=0;changed=true;}
  if(!changed)break;
 }
 const scale=encodePhi(gamma,input.tolerance),decodedScale=decodePhi(scale);
 // Enforce the actual rounded reconstruction budget AFTER phi snapping too.
 for(let i=0;i<n;i++)if(!outlier[i]&&Math.abs(Math.fround(trits[i]*decodedScale)-weights[i])>budget){outlier[i]=true;trits[i]=0;}
 const slots=outlier.flatMap((yes,i)=>yes?[i]:[]),ledger=ledgerFrame(trits,scale,slots,weights),decoded=decodeFrl1(toHex(ledger));
 const err=Math.max(...decoded.weights.map((w,i)=>Math.abs(w-weights[i]))),smaller=ledger.length<original.length;
 const selected=smaller?ledger:original,selectedFormat=smaller?'FRL1':originalFormat;
 const reconstruction=smaller?decoded.weights:weights;
 const replay=selectedFormat==='FRL1'?decodeFrl1(toHex(selected)).weights:decodeQuant(selectedFormat,toHex(selected)).weights;
 if(err>budget||replay.some((x,i)=>!Object.is(x,reconstruction[i])&&x!==reconstruction[i]))throw new Error('Ledger verification failed.');
 return {engine:'Fraymus phi75 weight ledger',status:'measured',source_format:source,count:n,budget,input_float32_rounding_max:rounding,gamma,scale,phi_scale_error:Math.abs(decodedScale-gamma),candidate_max_error:err,candidate_outliers:slots.length,candidate_container_bytes:ledger.length,original_container_bytes:original.length,selected:smaller?'phi_ledger':'original',selected_max_error:smaller?err:0,selected_bytes:selected.length,fp32_payload_bytes:n*4,reconstructed:reconstruction,round_trip_verified:true,export_format:selectedFormat,export_hex:toHex(selected),source_hex:toHex(original),notice:'Actual supplied float32 weights or one GGML block. Includes frame/scale/outlier bytes in storage decisions. Keeps original bytes when smaller. FRL1 is a custom weight container, not a GGUF file or runnable model. No speedup or end-to-end model-quality claim.'};
}