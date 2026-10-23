import {base44} from '@/api/base44Client';

export function ollamaUrl(settings){
 const u=new URL(settings.endpoint.trim());
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw new Error('Use an HTTP or HTTPS Ollama address without credentials, query parameters, or fragments.');
 return u.toString().replace(/\/$/,'');
}
export async function ollamaRequest(settings,token,path,body){
 const endpoint=ollamaUrl(settings);
 const u=new URL(endpoint);
 const loopback=['localhost','127.0.0.1','[::1]'].includes(u.hostname);
 const needsCloudBridge=!loopback&&window.location.protocol==='https:'&&u.protocol==='http:';
 if(needsCloudBridge||!loopback){
  try{
   const {data}=await base44.functions.invoke('openclawGateway',{action:'ollama_proxy',endpoint,path,payload:body||null,token:token||''});
   if(data?.error)throw new Error(String(data.error));
   return data;
  }catch(err){
   const msg=err?.response?.data?.error||err?.message||'Cannot reach remote GPU Ollama endpoint.';
   throw new Error(msg);
  }
 }
 let response;
 try{response=await fetch(endpoint+path,{method:body?'POST':'GET',credentials:'omit',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(body?240000:15000)});}catch(error){throw new Error(error.name==='TimeoutError'?'Ollama timed out. Check that the computer is awake and the model fits its memory.':'Cannot reach Ollama from this browser. Check the address, Tailscale, allowed origins, browser local-network permission, and HTTPS.');}
 if(!response.ok)throw new Error('Ollama returned '+response.status+'. '+(response.status===403?'Check allowed origins and your proxy’s Host header.':'Check your running model or proxy authentication.'));
 const data=await response.json();if(data.error)throw new Error(String(data.error).slice(0,500));return data;
}
export async function runOllama(settings,token,prepared){
 if(!settings.model.trim())throw new Error('Choose one of your Ollama models in Learning Lab → Models.');
 const data=await ollamaRequest(settings,token,'/api/chat',{model:settings.model,messages:prepared.messages,format:prepared.schema,stream:false,options:{num_ctx:32768,num_predict:10000,temperature:0.3}});
 if(data.done_reason==='length')throw new Error('The model reached its output limit. No changes were applied; try a shorter draft.');
 const result=JSON.parse(data.message?.content||'null');
 if(!result||!['edit','feed','note'].includes(result.kind)||typeof result.title!=='string'||result.title.length>160||typeof result.body!=='string'||result.body.length>20000||typeof result.summary!=='string'||result.summary.length>500||!Array.isArray(result.ideas)||result.ideas.length>5||result.ideas.some(i=>typeof i.title!=='string'||i.title.length>160||typeof i.body!=='string'||i.body.length>1200||typeof i.tag!=='string'||i.tag.length>30))throw new Error('This model did not return a valid draft action. No changes were applied. Try a model with structured-output support.');
 return result;
}