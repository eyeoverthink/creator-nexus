import {ollamaRequest} from '@/components/nexus/models/ollamaClient';
export async function runOllamaAgent(ollama,start){
 if(!ollama.model?.trim())throw new Error('Enter your Ollama model name.');
 const data=await ollamaRequest({endpoint:ollama.endpoint},'','/api/chat',{model:ollama.model.trim(),messages:start.messages,format:start.schema,stream:false,options:{num_ctx:16384,temperature:0.3}});
 if(data.done_reason==='length')throw new Error('Ollama hit its output limit before finishing.');
 return data.message?.content||'';
}