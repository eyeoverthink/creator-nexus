export const commit='054be5f81488715fbafc8eb427d6847723402268';
export const base=`https://raw.githubusercontent.com/eyeoverthink/babel-engine/${commit}/`;
export const references={'Overview':'README.md','Engine source':'v16/engine16.js','Experiment notes':'v16/IMPLEMENTATION16_NOTES.md','Published results':'v16/results_dyad16.md','License':'LICENSE'};
export async function readReference(path){const response=await fetch(base+path);if(!response.ok)throw new Error('Babel source could not be loaded.');return response.text();}
export async function runBabel(seed,rounds){
 const [source,license]=await Promise.all([readReference('v16/engine16.js'),readReference('LICENSE')]);const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source));
 if([...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')!=='b18007328dbbfd622fe407bf9d93c344364616f2bef31413002b22736361f946')throw new Error('Engine integrity check failed.');
 const wrapper=`\nonmessage=({data})=>{try{E.reset(data.seed);const before=E.evaluate();E.reset(data.seed);E.train(data.rounds);const after=E.evaluate();postMessage({before,after});}catch(e){postMessage({error:e.message});}};`;
 const url=URL.createObjectURL(new Blob(['/*\n'+license+'\n*/\n',source,wrapper],{type:'text/javascript'}));
 return new Promise((resolve,reject)=>{const worker=new Worker(url);const finish=(error,value)=>{clearTimeout(timer);worker.terminate();URL.revokeObjectURL(url);error?reject(error):resolve(value);};const timer=setTimeout(()=>finish(new Error('Experiment exceeded 90 seconds. Reduce training rounds.')),90000);worker.onmessage=({data})=>finish(data.error?new Error(data.error):null,data);worker.onerror=e=>finish(new Error(e.message||'Engine could not start.'));worker.postMessage({seed,rounds});});
}