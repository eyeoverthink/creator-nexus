// GGML block layouts inspected in fraymus-brain/kernel/gguf.js.
// Exact block decoders only: this is not a GGUF file loader or inference engine.
import {halfFloat,fromHex} from './fraymusPhiScale.ts';
export const QUANT_LAYOUT={Q8_0:{bytes:34,count:32},Q5_0:{bytes:22,count:32},Q6_K:{bytes:210,count:256},Q4_K:{bytes:144,count:256}};
export function decodeQuant(format,hex){
 const layout=QUANT_LAYOUT[format];if(!layout)throw new Error('Unsupported GGML block type.');
 const b=fromHex(hex),v=new DataView(b.buffer,b.byteOffset,b.byteLength);
 if(b.length!==layout.bytes)throw new Error(`${format} requires exactly ${layout.bytes} bytes, not a whole GGUF file.`);
 const out=new Float32Array(layout.count),h=offset=>halfFloat(v.getUint16(offset,true));
 if(format==='Q8_0'){const d=h(0);for(let i=0;i<32;i++)out[i]=d*v.getInt8(2+i);}
 if(format==='Q5_0'){
  const d=h(0),high=v.getUint32(2,true);
  for(let i=0;i<16;i++){out[i]=d*((b[6+i]&15|((high>>>i)&1)<<4)-16);out[i+16]=d*((b[6+i]>>>4|((high>>>(i+16))&1)<<4)-16);}
 }
 if(format==='Q6_K'){
  const d=h(208);
  for(let half=0;half<2;half++)for(let i=0;i<32;i++){
   const low=half*64,high=b[128+half*32+i],sc=192+half*8+Math.floor(i/16),base=half*128+i;
   out[base]=d*v.getInt8(sc)*((b[low+i]&15|((high>>>0)&3)<<4)-32);
   out[base+32]=d*v.getInt8(sc+2)*((b[low+32+i]&15|((high>>>2)&3)<<4)-32);
   out[base+64]=d*v.getInt8(sc+4)*((b[low+i]>>>4|((high>>>4)&3)<<4)-32);
   out[base+96]=d*v.getInt8(sc+6)*((b[low+32+i]>>>4|((high>>>6)&3)<<4)-32);
  }
 }
 if(format==='Q4_K'){
  const d=h(0),min=h(2),s=b.subarray(4,16);
  const pair=j=>j<4?[s[j]&63,s[j+4]&63]:[(s[j+4]&15)|((s[j-4]>>>6)<<4),(s[j+4]>>>4)|((s[j]>>>6)<<4)];
  for(let group=0;group<4;group++)for(let side=0;side<2;side++){
   const [scale,m]=pair(2*group+side);
   for(let i=0;i<32;i++){const q=b[16+group*32+i];out[group*64+side*32+i]=d*scale*(side?q>>>4:q&15)-min*m;}
  }
 }
 if(Array.from(out).some(x=>!Number.isFinite(x)))throw new Error('Block contains a non-finite scale or weight.');
 return {weights:Array.from(out),bytes:Array.from(b),count:out.length};
}