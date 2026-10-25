// Adapted from source-pinned sovereignEcosystem.js. Hash features, not neural embeddings.
const finiteVector=(v,max=256)=>{
 if(!Array.isArray(v)||!v.length||v.length>max||v.some(n=>!Number.isFinite(n)||Math.abs(n)>1e6))throw new Error(`Provide 1–${max} finite vector values within ±1000000.`);
 return v;
};
export function fraymusTernary(input){
 if(input.ternary_action==='unpack'){
  const bytes=input.packed,count=input.count;
  if(!Number.isInteger(count)||count<1||count>256||!Array.isArray(bytes)||bytes.length!==Math.ceil(count/4)||bytes.some(b=>!Number.isInteger(b)||b<0||b>255))throw new Error('Packed length must match 1–256 trits.');
  const trits=[];
  for(let i=0;i<bytes.length*4;i++){const code=(bytes[i>>2]>>((i&3)*2))&3;if(code===2)throw new Error('Reserved ternary crumb 10 is invalid.');if(i>=count){if(code!==0)throw new Error('Nonzero ternary padding is invalid.');}else trits.push(code===3?-1:code);}
  return {engine:'Fraymus Ternary Memory',status:'decoded',trits,count};
 }
 if(input.ternary_action!==undefined&&input.ternary_action!=='quantize')throw new Error('Use quantize or unpack.');
 const weights=finiteVector(input.vector),gamma=weights.reduce((n,x)=>n+Math.abs(x),0)/weights.length;
 const trits=weights.map(w=>Math.max(-1,Math.min(1,Math.round(w/(gamma+1e-9))))||0),packed=Array(Math.ceil(trits.length/4)).fill(0);
 trits.forEach((t,i)=>{packed[i>>2]|=(t<0?3:t>0?1:0)<<((i&3)*2);});
 const reconstructed=trits.map(t=>t*gamma),mean_absolute_error=weights.reduce((n,w,i)=>n+Math.abs(w-reconstructed[i]),0)/weights.length;
 let forward=null;
 if(input.activations!==undefined){const x=finiteVector(input.activations);if(x.length!==weights.length)throw new Error('Activation and vector dimensions must match.');let accumulator=0,reference=0,adds=0,subtracts=0,skips=0;trits.forEach((t,i)=>{reference+=t*x[i];if(t===1){accumulator+=x[i];adds++;}else if(t===-1){accumulator-=x[i];subtracts++;}else skips++;});forward={value:gamma*accumulator,reference:gamma*reference,verified:accumulator===reference,additions:adds,subtractions:subtracts,skipped_zeros:skips};}
 return {engine:'Fraymus Ternary Memory',status:'quantized',trits,packed,count:trits.length,gamma,reconstructed,mean_absolute_error,forward,storage:{packed_bytes:packed.length,scale_bytes:8,total_bytes:packed.length+8,original_float64_bytes:weights.length*8},notice:'Lossy vector quantization with exact crumb round trips. No language-model weights, GGUF files or claimed speedups are produced.'};
}
function hash(text){let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193);}return h>>>0;}
export function fraymusEmbed(text){
 if(typeof text!=='string'||!text.trim()||text.length>2000)throw new Error('Memory text must contain 1–2000 characters.');
 const tokens=text.toLowerCase().split(/[^a-z0-9_+-]+/).filter(Boolean);if(!tokens.length)throw new Error('Hash memory requires at least one ASCII word or number.');
 const v=new Float32Array(64);
 tokens.forEach((t,i)=>{const h=hash(`${t}#${i}`),sign=h&0x40000?1:-1;v[h&63]+=sign;v[(h>>>6)&63]-=.618*sign;v[(h>>>12)&63]+=.382*sign;});
 const norm=Math.hypot(...v)||1;return Array.from(v,x=>Number((x/norm).toFixed(8)));
}
const cosine=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0)/(Math.hypot(...a)*Math.hypot(...b)||1);
export function fraymusMemory(input,saved){
 const state=saved?structuredClone(saved):{version:1,classes:[],triads:[],updates:0};
 if(state.version!==1||!Array.isArray(state.classes)||state.classes.length>4||!Array.isArray(state.triads)||state.triads.length>8)throw new Error('Invalid Fraymus memory snapshot.');
 const action=input.memory_action;
 if(!['recall','learn','triad'].includes(action))throw new Error('Use recall, learn or triad.');
 if(action==='triad'){
  const t=input.triad;
  if(!t||['concept','thesis','antithesis','synthesis'].some(k=>typeof t[k]!=='string'||!t[k].trim()||t[k].length>160))throw new Error('Triad requires concept, thesis, antithesis and synthesis, each 1–160 characters.');
  if(state.triads.length===8)throw new Error('Memory holds eight triads; branch from an earlier state to keep all history.');
  state.triads.push({id:`triad_${state.triads.length+1}`,concept:t.concept,nodes:[{polarity:1,text:t.thesis},{polarity:-1,text:t.antithesis},{polarity:0,text:t.synthesis}]});state.updates++;
  return {engine:'Fraymus Ternary Memory',status:'triad_created',state,triad:state.triads.at(-1),notice:'User-supplied thesis, antithesis and synthesis, not autonomous reasoning or a verified causal graph.'};
 }
 const x=fraymusEmbed(input.text);
 const rank=()=>state.classes.map(c=>({label:c.label,samples:c.samples,similarity:Math.max(-1,Math.min(1,.62*cosine(x,c.centroid)+.38*Math.max(...c.prototypes.map(p=>cosine(x,p)))))})).sort((a,b)=>b.similarity-a.similarity);
 const before=rank();
 if(action==='learn'){
  if(typeof input.label!=='string'||!input.label.trim()||input.label.length>60)throw new Error('Learning requires an explicit class label, 1–60 characters.');
  let c=state.classes.find(c=>c.label===input.label);
  if(!c){if(state.classes.length===4)throw new Error('Memory holds four classes; no class has been evicted.');c={label:input.label,samples:0,centroid:Array(64).fill(0),prototypes:[]};state.classes.push(c);}
  if(c.samples>=100000)throw new Error('Class sample capacity reached.');
  c.centroid=c.centroid.map((v,i)=>Number(((v*c.samples+x[i])/(c.samples+1)).toFixed(8)));c.samples++;c.prototypes=[x,...c.prototypes].slice(0,2);state.updates++;
 }
 const threshold=input.minimum_similarity??.25;if(!Number.isFinite(threshold)||threshold< -1||threshold>1)throw new Error('Similarity threshold must be between -1 and 1.');
 const ranked=rank(),match=ranked[0]?.similarity>=threshold?ranked[0].label:null;
 return {engine:'Fraymus Ternary Memory',status:action==='learn'?'learned':state.classes.length?'recalled':'empty',match,ranked,before,minimum_similarity:threshold,state,notice:'Deterministic 64-dimensional ASCII token-position hashes and supervised nearest-class means. Similarity is not a probability, semantic understanding or a guarantee against forgetting. Recall does not reinforce itself.'};
}