import {ollamaUrl,ollamaRequest} from '@/components/nexus/models/ollamaClient';
import {partnerSystemPrompt,partnerHistory} from '@/components/nexus/partner/fraymusPartnerPrompt';
export async function discoverPartnerModels(profile,token){const data=await ollamaRequest(profile,token,'/api/tags');return (data.models||[]).map(model=>model.name).filter(Boolean);}
function blobBase64(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});}
const offline=message=>Object.assign(new Error(message),{offline:true});
export async function streamPartnerReply({profile,messages,selected,token,signal,onText}){
 if(!profile.model)throw new Error('Open Connections and select an installed Ollama model first.');
 const history=partnerHistory(messages),image=selected?.type==='image'&&selected.blob;
 if(image){if(selected.blob.size>5*1024*1024)throw new Error('Images sent to Ollama must be 5 MB or smaller.');if(!['image/png','image/jpeg','image/webp'].includes(selected.mime))throw new Error('Use a PNG, JPEG or WebP for vision.');history[history.length-1].images=[await blobBase64(selected.blob)];}
 const system=partnerSystemPrompt(profile,selected,!!image);
 let endpoint,response;
 try{endpoint=ollamaUrl(profile);}catch(e){throw offline(e.message);}
 try{response=await fetch(endpoint+'/api/chat',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({model:profile.model,messages:[{role:'system',content:system},...history],stream:true,options:{num_ctx:8192,num_predict:2000,temperature:0.35+profile.mood*0.004}}),signal});}
 catch(e){if(e.name==='AbortError')throw e;throw offline('Ollama could not be reached from this browser.');}
 if(!response.ok)throw offline(`Ollama returned ${response.status}. Check the selected model and allowed origins.`);
 if(!response.body)throw new Error('Ollama did not return a response stream.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let pending='',text='',done=false,usage=null;
 const parse=line=>{if(!line.trim())return;const record=JSON.parse(line);if(record.error)throw new Error(String(record.error));text+=record.message?.content||'';if(text.length>12000)throw new Error('Reply exceeded the 12,000-character limit; shorten the task.');onText(text);if(record.done){done=true;usage={input_tokens:record.prompt_eval_count??null,output_tokens:record.eval_count??null};}};
 try{while(true){const chunk=await reader.read();if(chunk.done)break;pending+=decoder.decode(chunk.value,{stream:true});if(pending.length>300000)throw new Error('Ollama returned an oversized record.');const lines=pending.split('\n');pending=lines.pop();for(const line of lines)parse(line);}pending+=decoder.decode();if(pending.trim())parse(pending);if(!done||!text.trim())throw new Error('Ollama ended without a complete reply. No mock response was substituted.');return {text,usage};}finally{await reader.cancel();reader.releaseLock();}
}