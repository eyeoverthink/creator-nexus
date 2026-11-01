import {streamPartnerReply} from '@/components/nexus/partner/fraymusPartnerOllama';
import {partnerSystemPrompt,partnerHistory} from '@/components/nexus/partner/fraymusPartnerPrompt';
import {builtinReply,providerReply} from '@/components/nexus/partner/fraymusPartnerCloud';
export function partnerEngine(profile,providers=[]){
 const provider=profile.providerId&&profile.providerId!=='builtin'?providers.find(x=>x.id===profile.providerId):null;
 if(provider&&profile.model)return {type:'provider',provider,label:`${provider.label} · ${profile.model}`};
 if(!profile.providerId&&profile.model)return {type:'local',label:`Ollama · ${profile.model}`};
 return {type:'builtin',label:'Built-in AI'};
}
const sentence=text=>/[.!?]$/.test(text)?text:text+'.';
const conversation=({profile,messages,selected})=>({system:partnerSystemPrompt(profile,selected,false),messages:partnerHistory(messages),temperature:0.35+profile.mood*0.004});
async function builtin(run,notice){const data=await builtinReply(conversation(run),run.signal);run.onText(data.text);return {text:data.text,usage:null,engine:'Built-in AI',notice};}
export async function runPartnerReply(run){
 const engine=partnerEngine(run.profile,run.providers);
 if(engine.type==='local'){
  try{return {...await streamPartnerReply(run),engine:engine.label};}
  catch(e){if(!e.offline)throw e;return builtin(run,`Local Ollama isn't connected: ${sentence(e.message)} The built-in AI replied instead.`);}
 }
 if(engine.type==='provider'){
  try{const data=await providerReply(engine.provider,run.profile.model,conversation(run),run.signal);run.onText(data.text);return {text:data.text,usage:data.usage,engine:engine.label};}
  catch(e){if(e.name==='AbortError')throw e;return builtin(run,`${engine.provider.label} couldn't answer: ${sentence(e.message)} The built-in AI replied instead.`);}
 }
 return builtin(run);
}