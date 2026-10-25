import {useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
import {sign} from '@/lib/fraymusMail';
export default function useFraymusDispatch(workspaceId,visitor){
 const [data,setData]=useState({trusted_keys:[],receipts:[]}),[busy,setBusy]=useState(true),[error,setError]=useState(''),[result,setResult]=useState(null);
 const call=async input=>(await base44.functions.invoke('fraymusDispatch',{workspace_id:workspaceId,...input})).data;
 const load=async more=>{const page=await call({action:'status',...(more&&data.next_cursor?{cursor:data.next_cursor}:{})});setData(old=>({...page,receipts:more?[...old.receipts,...page.receipts]:page.receipts}));};
 useEffect(()=>{let live=true;setData({trusted_keys:[],receipts:[]});setResult(null);setError('');if(!workspaceId){setBusy(false);return;}setBusy(true);call({action:'status'}).then(page=>{if(live)setData(page);}).catch(e=>{if(live)setError(e.response?.data?.error||e.message);}).finally(()=>{if(live)setBusy(false);});return()=>{live=false;};},[workspaceId]);
 const run=async work=>{setBusy(true);setError('');setResult(null);try{await work();}catch(e){setError(e.response?.data?.error||e.message);}finally{setBusy(false);}};
 const trust=()=>run(async()=>{if(!window.confirm(`Trust this exact browser public key in this workspace?\n${visitor.number}\n${visitor.public}`))return;await call({action:'pin',public_key:visitor.public,confirmed:true});await load(false);});
 const revoke=()=>run(async()=>{if(!window.confirm('Revoke this browser key for future signed dispatches?'))return;await call({action:'revoke',public_key:visitor.public,confirmed:true});await load(false);});
 const send=(subject,text)=>run(async()=>{const prepared=await call({action:'prepare',public_key:visitor.public,subject,program:{html:text}});const envelope={...prepared.envelope,sig:await sign(visitor.secret,prepared.canonical)};const accepted=await call({action:'accept',envelope_json:JSON.stringify(envelope)});setResult(accepted);await load(false);});
 return {data,busy,error,result,trust,revoke,send,more:()=>run(()=>load(true))};
}