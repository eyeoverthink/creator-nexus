import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export default function useRegression(workspace,source,agent,metric){
 const cache=useQueryClient(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[cursor,setCursor]=useState(undefined);
 const key=['regression',workspace?.id,source,agent,metric],payload={workspace_id:workspace?.id,source,agent,metric};
 const invoke=async values=>{const {data}=await base44.functions.invoke('nexusRegression',{...payload,...values});if(data.error)throw new Error(data.error);return data;};
 const query=useQuery({queryKey:key,enabled:!!workspace,staleTime:60000,refetchOnWindowFocus:false,retry:false,queryFn:()=>invoke({action:'load'})});
 const act=async values=>{
  if(busy)return;setBusy(true);setError('');setMessage('');
  try{
   const result=await invoke(values);
   if(values.action==='analyze')cache.setQueryData(key,result);
   if(values.action==='sync'){
    setCursor(result.has_more?result.next_cursor:undefined);
    setMessage(`Synced ${result.synced} saved results.${result.skipped.length?' Skipped '+result.skipped.length+': '+result.skipped.map(s=>s.reason).join('; '):''}${result.has_more?' More saved results are available.':''}`);
    await cache.invalidateQueries({queryKey:key});
   }
   if(values.action==='adopt'){
    cache.setQueryData(key,old=>({...old,logs:old.logs.map(log=>({...log,adopted:log.id===values.run_id?values.enabled:values.enabled?false:log.adopted}))}));
    setMessage(values.enabled?'Guidance enabled for relevant future agent tasks. No model weights changed.':'Guidance disabled.');
   }
   if(values.action==='history')cache.setQueryData(key,old=>({...old,logs:[...old.logs,...result.items],more_logs:result.has_more,log_cursor:result.next_cursor}));
  }catch(e){setError(e.response?.data?.error||e.message);}finally{setBusy(false);}
 };
 return {...query,busy,error:error||query.error?.response?.data?.error||query.error?.message,message,sync:()=>act({action:'sync',...(cursor?{cursor}:{})}),hasSyncMore:!!cursor,analyze:(values,horizon)=>act({action:'analyze',...(values?{values}:{}),horizon}),adopt:(run_id,enabled)=>act({action:'adopt',run_id,enabled}),more:()=>act({action:'history',cursor:query.data.log_cursor})};
}