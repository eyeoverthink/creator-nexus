import {useCallback,useEffect,useRef,useState} from 'react';
import {base44} from '@/api/base44Client';
export default function useVocalEmotion(workspaceId){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),generation=useRef(0);
 const call=useCallback(async(action,extra={})=>{const {data}=await base44.functions.invoke('fraymusBrain',{action,workspace_id:workspaceId,...extra});if(data.error)throw new Error(data.error);return data;},[workspaceId]);
 const load=useCallback(async()=>{if(!workspaceId)return;const gen=generation.current;setBusy(true);setError('');try{const next=await call('emotion_list');if(gen===generation.current)setData(next);}catch(e){if(gen===generation.current)setError(e.response?.data?.error||e.message);}finally{if(gen===generation.current)setBusy(false);}},[workspaceId,call]);
 useEffect(()=>{generation.current++;setData(null);setError('');setBusy(false);load();return()=>{generation.current++;};},[load]);
 async function act(action,extra={}){const gen=generation.current;setBusy(true);setError('');try{await call(action,extra);if(gen!==generation.current)return false;await load();return true;}catch(e){if(gen===generation.current)setError(e.response?.data?.error||e.message);return false;}finally{if(gen===generation.current)setBusy(false);}}
 async function more(){const gen=generation.current;setBusy(true);setError('');try{const next=await call('emotion_list',{cursor:data.next_cursor});if(gen===generation.current)setData(previous=>({...next,items:[...previous.items,...next.items]}));}catch(e){if(gen===generation.current)setError(e.response?.data?.error||e.message);}finally{if(gen===generation.current)setBusy(false);}}
 return {data,busy,error,load,more,save:(report,enabled)=>act('emotion_import',{report,enabled}),toggle:record=>act('emotion_toggle',{id:record.id,enabled:!record.enabled}),remove:id=>act('emotion_delete',{id})};
}