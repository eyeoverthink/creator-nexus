import {useEffect,useState,useRef} from 'react';
import {base44} from '@/api/base44Client';
export default function useFraymusBrain(workspaceId){
 const [scope,setScope]=useState(''),[result,setResult]=useState(null),[records,setRecords]=useState([]),[cursor,setCursor]=useState(null),[hasMore,setHasMore]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState('');
 const last=useRef(null),generation=useRef(0);
 const call=async payload=>{const {data}=await base44.functions.invoke('fraymusBrain',payload);if(data.error)throw new Error(data.error);return data;};
 const page=(data,append=false)=>{setRecords(prev=>append?[...prev,...data.items]:data.items);setCursor(data.next_cursor);setHasMore(data.has_more);};
 useEffect(()=>{
  const gen=++generation.current;setBusy(true);setError('');setResult(null);setRecords([]);setScope('');last.current=null;
  call({action:'history',...(workspaceId?{workspace_id:workspaceId}:{})}).then(data=>{if(generation.current===gen){setScope(data.workspace_id);page(data);}}).catch(e=>{if(generation.current===gen)setError(e.response?.data?.error||e.message);}).finally(()=>{if(generation.current===gen)setBusy(false);});
  return()=>{generation.current++;};
 },[workspaceId]);
 const perform=async fn=>{const gen=generation.current;setBusy(true);setError('');try{await fn(gen);}catch(e){if(gen===generation.current)setError(e.response?.data?.error||e.message);}finally{if(gen===generation.current)setBusy(false);}};
 const run=args=>perform(async gen=>{const clean={...args,commit:false};last.current=clean;setResult(null);const data=await call({action:'run',workspace_id:scope,input:clean});if(gen===generation.current)setResult(data.result);});
 const save=()=>perform(async gen=>{const data=await call({action:'run',workspace_id:scope,input:{...last.current,commit:true}});if(gen!==generation.current)return;setResult(data.result);const history=await call({action:'history',workspace_id:scope});if(gen===generation.current)page(history);});
 const more=()=>perform(async gen=>{const data=await call({action:'history',workspace_id:scope,cursor});if(gen===generation.current)page(data,true);});
 const open=id=>perform(async gen=>{const data=await call({action:'read',workspace_id:scope,state_id:id});if(gen===generation.current){last.current=null;setResult(data.result);}});
 return {scope,result,records,hasMore,busy,error,run,save,more,open};
}