import {base44} from '@/api/base44Client';
const stopped=()=>new DOMException('Reply stopped.','AbortError');
function untilAbort(promise,signal){
 if(!signal)return promise;
 if(signal.aborted)return Promise.reject(stopped());
 return new Promise((resolve,reject)=>{const stop=()=>reject(stopped());signal.addEventListener('abort',stop,{once:true});promise.then(resolve,reject).finally(()=>signal.removeEventListener('abort',stop));});
}
async function call(payload,signal){
 try{const {data}=await untilAbort(base44.functions.invoke('partnerModels',payload),signal);return data;}
 catch(e){if(e.name==='AbortError')throw e;throw new Error(e.response?.data?.error||e.message);}
}
const account=provider=>({kind:provider.kind,base_url:provider.base_url,api_key:provider.api_key});
export const findProviderModels=provider=>call({action:'models',provider:account(provider)}).then(data=>data.models);
export const providerReply=(provider,model,conversation,signal)=>call({action:'chat',engine:'provider',provider:account(provider),model,...conversation},signal);
export const builtinReply=(conversation,signal)=>call({action:'chat',engine:'builtin',...conversation},signal);