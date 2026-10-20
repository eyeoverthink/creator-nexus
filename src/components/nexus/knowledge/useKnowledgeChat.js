import {useRef,useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import useLearningRecords from '@/components/nexus/learning/useLearningRecords';
import {ollamaRequest} from '@/components/nexus/models/ollamaClient';
import {buildAgentCrossTabContext} from '@/lib/crossTabMemory';
export default function useKnowledgeChat(workspace,models){
 const cache=useQueryClient(),lock=useRef(false);
 const [agent,setAgent]=useState('researcher'),[question,setQuestion]=useState(''),[useLibrary,setUseLibrary]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[approval,setApproval]=useState(null),[pendingTurn,setPendingTurn]=useState(null);
 const history=useLearningRecords('NexusChatTurn',workspace,agent);
 const persist=async turn=>{await base44.entities.NexusChatTurn.create(turn);setPendingTurn(null);await cache.invalidateQueries({queryKey:['learning','NexusChatTurn',workspace.id]});};
 async function execute(request){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{
   const local=request.settings.provider==='ollama';
   if(local&&!request.settings.model.trim())throw new Error('Choose an Ollama model in the Models tab first.');
   const {data}=await base44.functions.invoke('nexusKnowledge',{operation:local?'prepare_ollama':'chat',workspace_id:workspace.id,agent:request.agent,question:request.question,use_library:request.useLibrary,cross_tab_context:buildAgentCrossTabContext(),consent:!local});
   if(data.error)throw new Error(data.error);
   let result=data;
   if(local){
    const response=await ollamaRequest(request.settings,request.token,'/api/chat',{model:request.settings.model,messages:data.messages,format:data.schema,stream:false,options:{num_ctx:32768,num_predict:4000,temperature:0.3}});
    if(response.done_reason==='length')throw new Error('The model reached its answer limit. Try a shorter question.');
    let answer;try{answer=JSON.parse(response.message?.content||'null');}catch{throw new Error('The model did not return a structured answer. Try a model with structured-output support.');}
    if(!answer||typeof answer.answer!=='string'||!answer.answer.trim()||answer.answer.length>12000||!Array.isArray(answer.source_ids))throw new Error('The model returned an invalid answer. Try a different model.');
    result={answer:answer.answer,sources:data.sources.filter(source=>answer.source_ids.includes(source.id))};
   }
   const turn={owner_id:workspace.owner_id,workspace_id:workspace.id,agent:request.agent,question:request.question,answer:result.answer,sources:result.sources||[],provider:local?'ollama':'hosted',model:local?request.settings.model:'automatic'};
   setPendingTurn(turn);setQuestion(current=>current.trim()===request.question?'':current);await persist(turn);
  }catch(e){setError(e.response?.data?.error||e.message);}finally{lock.current=false;setBusy(false);}
 }
 function send(){if(busy||pendingTurn||!question.trim())return;const request={agent,question:question.trim(),useLibrary,settings:{...models.settings},token:models.token};if(request.settings.provider==='ollama')execute(request);else setApproval({label:'Answer this question using your library and selected agent',...request});}
 const confirm=()=>{const request=approval;setApproval(null);if(request)execute(request);};
 const savePending=async()=>{if(lock.current||!pendingTurn)return;lock.current=true;setBusy(true);setError('');try{await persist(pendingTurn);}catch(e){setError('Your answer is shown below but could not be saved: '+(e.response?.data?.error||e.message));}finally{lock.current=false;setBusy(false);}};
 return {agent,setAgent,question,setQuestion,useLibrary,setUseLibrary,busy,error,approval,confirm,cancel:()=>setApproval(null),send,history,pendingTurn,savePending};
}