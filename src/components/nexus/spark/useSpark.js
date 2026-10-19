import {useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import useWorkspaceAccess from '@/components/nexus/useWorkspaceAccess';
import {sparkCall,scope} from '@/components/nexus/spark/sparkClient';
export default function useSpark(){
 const cache=useQueryClient(),lock=useRef(false),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[approval,setApproval]=useState(null),[batch,setBatch]=useState(()=>new URLSearchParams(window.location.search).get('batch')||''),[result,setResult]=useState(null),[review,setReview]=useState(null);
 const workspaceAccess=useWorkspaceAccess(),boot=workspaceAccess.boot;
 const rawWorkspace=workspaceAccess.workspace||boot.data?.workspace||boot.data;
 const workspace=rawWorkspace?.id?rawWorkspace:null;
 const profile=useQuery({queryKey:['spark','profile',workspace?.id],enabled:!!workspace?.id,queryFn:async()=>(await base44.entities.SparkProfile.filter(scope(workspace),{sort:'-version',limit:1})).items[0]||null});
 const latest=useQuery({queryKey:['spark','latest',workspace?.id],enabled:!!workspace?.id,queryFn:async()=>(await base44.entities.SparkCard.filter(scope(workspace),{sort:'-created_date',limit:1,fields:['batch_id']})).items[0]?.batch_id||''});
 const selectedBatch=batch||latest.data;
 const cards=useQuery({queryKey:['spark','cards',workspace?.id,selectedBatch],enabled:!!workspace?.id&&!!selectedBatch,queryFn:()=>base44.entities.SparkCard.filter({...scope(workspace),batch_id:selectedBatch},{sort:'card_id',limit:5})});
 async function act(action,values={},onSuccess){if(lock.current)return null;lock.current=true;setBusy(action);setError('');setNotice('');try{const data=await sparkCall({action,workspace_id:workspace?.id,...values});setNotice([data.warning,...(data.logging_warnings||[])].filter(Boolean).join(' '));if(action==='save_interview'&&workspace?.id&&data?.profile){cache.setQueryData(['spark','profile',workspace.id],{id:data.creator_dna_id,owner_id:workspace.owner_id,workspace_id:workspace.id,version:data.version,profile:data.profile,answers:values.answers,status:'active'});}if(action==='run_spark'){setResult(data);setBatch(data.batch_id);if(Array.isArray(data.cards)&&workspace?.id){cache.setQueryData(['spark','latest',workspace.id],data.batch_id);cache.setQueryData(['spark','cards',workspace.id,data.batch_id],{items:data.cards.map(c=>({...c,id:c.spark_id||c.id,batch_id:data.batch_id}))});}}await cache.invalidateQueries({queryKey:['spark']});await cache.invalidateQueries({queryKey:['learning-logs']});onSuccess?.(data);return data;}catch(e){setError(e.message);if(e.code==='already_queued')await cache.invalidateQueries({queryKey:['spark']});return null;}finally{lock.current=false;setBusy('');}}
 const ask=(action,values={},onSuccess)=>{if(!busy)setApproval({action,values,onSuccess,label:action==='run_spark'?'Find Spark cards: Reddit RSS selection, web radar with at most one recovery search, generation, and one validation retry (up to five model calls)':action==='save_interview'?'Normalize your five interview answers (one model call)':'Draft one narration for human review (one model call)'});};
 const confirm=()=>{const request=approval;setApproval(null);if(request)act(request.action,{...request.values,consent:true},request.onSuccess);};
 const make=card=>{if(card.narration)setReview({card,narration:card.narration,job_check:{warnings:[]}});else ask('draft_script',{spark_id:card.id},data=>setReview({card,...data}));};
 return {workspace,workspaceAccess,boot,profile,latest,cards,selectedBatch,setBatch,result,busy,error,notice,approval,confirm,cancel:()=>setApproval(null),ask,act,make,review,setReview};
}