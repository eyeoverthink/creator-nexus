import {useEffect,useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import useWorkspaceAccess from '@/components/nexus/useWorkspaceAccess';
import {sparkCall,scope} from '@/components/nexus/spark/sparkClient';
import {resolveSparkCardImage} from '@/components/nexus/spark/SparkCardImage';

function normalizeCard(c,batchId){
 const cardId=c.card_id||(/^S[1-5]$/.test(c.id)?c.id:'S1');
 const recordId=c.spark_id||c.id;
 const img=c.image_url||c.why_now?.image_url||resolveSparkCardImage({...c,id:recordId,card_id:cardId,batch_id:batchId||c.batch_id});
 return {...c,id:recordId,card_id:cardId,batch_id:batchId||c.batch_id,image_url:img,why_now:{...(c.why_now||{}),image_url:img}};
}

export default function useSpark(){
 const cache=useQueryClient(),lock=useRef(false),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[approval,setApproval]=useState(null),[result,setResult]=useState(null),[review,setReview]=useState(null);
 const workspaceAccess=useWorkspaceAccess(),boot=workspaceAccess.boot;
 const rawWorkspace=workspaceAccess.workspace||boot.data?.workspace||boot.data;
 const workspace=rawWorkspace?.id?rawWorkspace:null;
 const [batch,setBatchState]=useState(()=>new URLSearchParams(window.location.search).get('batch')||'');
 useEffect(()=>{
  if(!workspace?.id||batch)return;
  try{const saved=localStorage.getItem(`spark_selected_batch_${workspace.id}`);if(saved)setBatchState(saved);}catch{}
 },[workspace?.id,batch]);
 const setBatch=next=>{
  setBatchState(next);
  if(workspace?.id){try{if(next)localStorage.setItem(`spark_selected_batch_${workspace.id}`,next);else localStorage.removeItem(`spark_selected_batch_${workspace.id}`);}catch{}}
 };
 const profile=useQuery({
  queryKey:['spark','profile',workspace?.id],
  enabled:!!workspace?.id,
  queryFn:async()=>{
   const item=(await base44.entities.SparkProfile.filter(scope(workspace),{sort:'-version',limit:1})).items[0]||null;
   if(item&&workspace?.id){try{localStorage.setItem(`spark_saved_profile_${workspace.id}`,JSON.stringify(item));}catch{}}
   return item;
  },
  initialData:()=>{
   if(!workspace?.id)return undefined;
   try{const raw=localStorage.getItem(`spark_saved_profile_${workspace.id}`);return raw?JSON.parse(raw):undefined;}catch{return undefined;}
  }
 });
 const latest=useQuery({queryKey:['spark','latest',workspace?.id],enabled:!!workspace?.id,queryFn:async()=>(await base44.entities.SparkCard.filter(scope(workspace),{sort:'-created_date',limit:1,fields:['batch_id']})).items[0]?.batch_id||''});
 const selectedBatch=batch||latest.data;
 const cards=useQuery({
  queryKey:['spark','cards',workspace?.id,selectedBatch],
  enabled:!!workspace?.id&&!!selectedBatch,
  queryFn:async()=>{
   const page=await base44.entities.SparkCard.filter({...scope(workspace),batch_id:selectedBatch},{sort:'card_id',limit:5});
   return {...page,items:(page.items||[]).map(c=>normalizeCard(c,selectedBatch))};
  }
 });
 async function act(action,values={},onSuccess){
  if(lock.current)return null;
  lock.current=true;setBusy(action);setError('');setNotice('');
  try{
   const data=await sparkCall({action,workspace_id:workspace?.id,consent:true,...values});
   setNotice([data.warning,...(data.logging_warnings||[])].filter(Boolean).join(' '));
   if(action==='save_interview'&&workspace?.id&&data?.profile){
    const savedProfile={id:data.creator_dna_id,owner_id:workspace.owner_id,workspace_id:workspace.id,version:data.version,profile:data.profile,answers:data.answers||values.answers,status:'active'};
    cache.setQueryData(['spark','profile',workspace.id],savedProfile);
    try{
     localStorage.setItem(`spark_saved_profile_${workspace.id}`,JSON.stringify(savedProfile));
     localStorage.removeItem(`spark_interview_draft_${workspace.id}`);
    }catch{}
   }
   if(action==='run_spark'){
    setResult(data);
    setBatch(data.batch_id);
    if(Array.isArray(data.cards)&&workspace?.id){
     const normalized=data.cards.map(c=>normalizeCard(c,data.batch_id));
     cache.setQueryData(['spark','latest',workspace.id],data.batch_id);
     cache.setQueryData(['spark','cards',workspace.id,data.batch_id],{items:normalized});
    }
   }
   await Promise.all([
    cache.invalidateQueries({queryKey:['spark','batches']}),
    cache.invalidateQueries({queryKey:['spark','latest']}),
    cache.invalidateQueries({queryKey:['origin']}),
    cache.invalidateQueries({queryKey:['learning-logs']})
   ]);
   onSuccess?.(data);
   return data;
  }catch(e){
   setError(e.message);
   if(e.code==='already_queued')await cache.invalidateQueries({queryKey:['spark']});
   return null;
  }finally{lock.current=false;setBusy('');}
 }
 async function saveInterviewAndRun(answers,runAfter=false,onDone){
  const saved=await act('save_interview',{answers,consent:true});
  if(!saved)return null;
  if(runAfter){
   await act('run_spark',{creator_dna_id:saved.creator_dna_id,consent:true});
  }
  onDone?.(saved);
  return saved;
 }
 const ask=(action,values={},onSuccess)=>{if(!busy)setApproval({action,values,onSuccess,label:action==='run_spark'?'Find Spark cards: Reddit RSS selection, web radar with at most one recovery search, generation, and one validation retry (up to five model calls)':action==='save_interview'?'Normalize your five interview answers (one model call)':'Draft one narration for human review (one model call)'});};
 const confirm=()=>{const request=approval;setApproval(null);if(request)act(request.action,{...request.values,consent:true},request.onSuccess);};
 const make=card=>{if(card.narration)setReview({card,narration:card.narration,job_check:{warnings:[]}});else ask('draft_script',{spark_id:card.id},data=>setReview({card,...data}));};
 return {workspace,workspaceAccess,boot,profile,latest,cards,selectedBatch,setBatch,result,busy,error,notice,approval,confirm,cancel:()=>setApproval(null),ask,act,saveInterviewAndRun,make,review,setReview};
}