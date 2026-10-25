// Adapted from eyeoverthink/fraymus-brain kernel/phi75.js, SHA256
// ba86cc8bfa45e54155b6d0a648e763bb84ff0407aeced79a20f92f6960c5d1b7.
// FRL1 deliberately uses raw-f64 fallback: JS raw numbers are not four-byte floats.
const PHI=(1+Math.sqrt(5))/2;
export function phiPower(e){
 if(!Number.isInteger(e)||Math.abs(e)>78)throw new Error('Invalid phi exponent.');
 if(!e)return 1;let a=0,b=1;for(let i=1;i<Math.abs(e);i++){const c=a+b;a=b;b=c;}
 const v=b*PHI+a;return e<0?1/v:v;
}
export function encodePhi(value,tolerance){
 if(!Number.isFinite(value))throw new Error('Scale must be finite.');
 const tol=tolerance??Math.max(Math.abs(value)*1e-4,1e-8);
 if(!Number.isFinite(tol)||tol<0)throw new Error('Tolerance must be nonnegative.');
 if(value===0)return {form:'phi',e:0,m:0,error:0};
 const center=Math.round(Math.log(Math.abs(value))/Math.log(PHI));let best=null;
 for(let delta=-8;delta<=8;delta++){
  const e=center+delta;if(Math.abs(e)>78)continue;
  const m=Math.sign(value)*Math.round(Math.abs(value)*1024/phiPower(e));
  if(!m||Math.abs(m)>65535)continue;
  const error=Math.abs(m*phiPower(e)/1024-value);
  if(!best||error<best.error)best={form:'phi',e,m,error};
 }
 return best&&best.error<=tol?best:{form:'raw-f64',raw:value,error:0,nearest_error:best?.error??Math.abs(value)};
}
export function decodePhi(code){
 if(code?.form==='raw-f64'&&Number.isFinite(code.raw))return code.raw;
 if(code?.form!=='phi'||!Number.isInteger(code.m)||Math.abs(code.m)>65535)throw new Error('Invalid phi scale.');
 return code.m*phiPower(code.e)/1024;
}
export function halfFloat(h){
 const sign=h&0x8000?-1:1,e=(h>>>10)&31,m=h&1023;
 return e===31?(m?NaN:sign*Infinity):sign*(e?2**(e-15)*(1+m/1024):m*2**-24);
}
export const toHex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export function fromHex(text,max=4096){
 if(typeof text!=='string')throw new Error('Provide hexadecimal bytes.');
 const clean=text.replace(/\s/g,'');
 if(!clean.length||clean.length%2||clean.length>max*2||!/^[0-9a-f]+$/i.test(clean))throw new Error('Invalid or oversized hexadecimal payload.');
 return Uint8Array.from(clean.match(/../g),b=>parseInt(b,16));
}