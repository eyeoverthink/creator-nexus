import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {runOllamaAgent} from '@/components/nexus/agents/runOllamaAgent';
const call=async p=>{try{return (await base44.functions.invoke('starterAgents',p)).data;}catch(e){throw new Error(e.response?.data?.error||e.message);}};
const page=(entity,key)=>async()=>(await base44.entities[entity].filter({agent_key:key},{sort:'-created_date',limit:30})).items;
export function useRoster(){return useQuery({queryKey:['starter-agents'],queryFn:()=>call({action:'bootstrap'})});}
export function useAgentRecords(key){
 const runs=useQuery({queryKey:['sa','runs',key],enabled:!!key,queryFn:page('StarterAgentRun',key)});
 const drafts=useQuery({queryKey:['sa','drafts',key],enabled:!!key,queryFn:page('StarterAgentDraft',key)});
 const actions=useQuery({queryKey:['sa','actions',key],enabled:!!key,queryFn:page('StarterAgentAction',key)});
 const audit=useQuery({queryKey:['sa','audit',key],enabled:!!key,queryFn:page('StarterAgentAudit',key)});
 const counts=useQuery({queryKey:['sa','counts',key],enabled:!!key,queryFn:async()=>{const S=base44.entities;const [runs,drafts,pending,executed,blocked]=await Promise.all([S.StarterAgentRun.count({agent_key:key}),S.StarterAgentDraft.count({agent_key:key}),S.StarterAgentAction.count({agent_key:key,status:'pending'}),S.StarterAgentAction.count({agent_key:key,status:'executed'}),S.StarterAgentAction.count({agent_key:key,status:'blocked'})]);return {runs,drafts,pending,executed,blocked};}});
 return {runs,drafts,actions,audit,counts};
}
export function useAgentMutations(key){
 const qc=useQueryClient(),refresh=()=>{qc.invalidateQueries({queryKey:['sa']});qc.invalidateQueries({queryKey:['starter-agents']});};
 const save=useMutation({mutationFn:patch=>call({action:'save_agent',agent_key:key,patch}),onSuccess:refresh});
 const run=useMutation({mutationFn:async({outcome,context,provider,ollama})=>{
  const start=await call({action:'start_run',agent_key:key,outcome,context,provider,model:provider==='ollama'?ollama.model:''});
  if(provider!=='ollama')return start;
  try{const output=await runOllamaAgent(ollama,start);return await call({action:'complete_run',run_id:start.run_id,output});}
  catch(e){if(!/^Run failed|Model did not/.test(e.message))await call({action:'fail_run',run_id:start.run_id,error:e.message}).catch(()=>null);throw e;}
 },onSettled:refresh});
 const decide=useMutation({mutationFn:({action,decision})=>call({action:'decide',action_id:action.id,decision,payload_sha256:action.payload_sha256}),onSettled:refresh});
 return {save,run,decide};
}