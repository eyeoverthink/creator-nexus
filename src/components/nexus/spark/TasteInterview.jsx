import {useEffect,useState} from 'react';
import {questions} from '@/components/nexus/spark/sparkClient';
import SparkProfileView from '@/components/nexus/spark/SparkProfileView';
import {Button} from '@/components/ui/button';

function emptyAnswers(source){
 return Object.fromEntries(questions.map(([key])=>[key,source?.[key]||'']));
}

export default function TasteInterview({spark}){
 const draftKey=spark.workspace?.id?`spark_interview_draft_${spark.workspace.id}`:'spark_interview_draft_default';
 const [redo,setRedo]=useState(()=>{
  try{return JSON.parse(localStorage.getItem(draftKey)||'{}').redo===true;}catch{return false;}
 });
 const [answers,setAnswers]=useState(()=>{
  try{
   const saved=JSON.parse(localStorage.getItem(draftKey)||'{}');
   if(saved?.answers&&Object.values(saved.answers).some(Boolean))return emptyAnswers(saved.answers);
  }catch{}
  return emptyAnswers(spark.profile.data?.answers);
 });
 const [savedMsg,setSavedMsg]=useState('');

 useEffect(()=>{
  const serverAnswers=spark.profile.data?.answers;
  if(!serverAnswers)return;
  try{
   const local=JSON.parse(localStorage.getItem(draftKey)||'{}');
   if(local?.dirty)return;
  }catch{}
  setAnswers(emptyAnswers(serverAnswers));
 },[spark.profile.data?.id,spark.profile.data?.version,draftKey]);

 const updateAnswer=(key,val)=>{
  setSavedMsg('');
  setAnswers(prev=>{
   const next={...prev,[key]:val};
   try{localStorage.setItem(draftKey,JSON.stringify({answers:next,redo:true,dirty:true}));}catch{}
   return next;
  });
 };

 const toggleRedo=()=>{
  setSavedMsg('');
  const nextRedo=!redo;
  if(nextRedo&&spark.profile.data?.answers){
   const merged=emptyAnswers({...spark.profile.data.answers,...Object.fromEntries(Object.entries(answers).filter(([,v])=>v?.trim()))});
   setAnswers(merged);
   try{localStorage.setItem(draftKey,JSON.stringify({answers:merged,redo:true,dirty:false}));}catch{}
  }else if(!nextRedo){
   try{localStorage.removeItem(draftKey);}catch{}
   if(spark.profile.data?.answers)setAnswers(emptyAnswers(spark.profile.data.answers));
  }
  setRedo(nextRedo);
 };

 const handleSubmit=async(e,runAfter=false)=>{
  e?.preventDefault();
  setSavedMsg('');
  const res=await spark.saveInterviewAndRun(answers,runAfter,()=>{
   setRedo(false);
   setSavedMsg(runAfter?'Saved profile and generated 5 new sparks.':'Saved taste profile v'+(spark.profile.data?.version?spark.profile.data.version+1:1)+'.');
  });
  return res;
 };

 if(spark.profile.isPending&&!spark.profile.data)return <p role="status" className="text-sm text-muted-foreground">Loading taste profile…</p>;
 if(spark.profile.error&&!spark.profile.data)return <p role="alert" className="text-destructive text-sm">{spark.profile.error.message}</p>;
 return <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-5">
  <header className="flex flex-wrap items-center justify-between gap-3">
   <div className="flex items-center gap-3">
    <h2 className="font-heading text-xl">Taste profile</h2>
    {savedMsg&&<span role="status" className="text-xs text-success">{savedMsg}</span>}
   </div>
   {spark.profile.data&&<Button variant="outline" size="sm" disabled={!!spark.busy} onClick={toggleRedo}>{redo?'Keep current profile':'Redo interview'}</Button>}
  </header>
  {spark.profile.data&&!redo?<SparkProfileView record={spark.profile.data}/>:<form className="space-y-4" onSubmit={e=>handleSubmit(e,false)}>
   {questions.map(([key,label])=><label key={key} className="block text-sm">{label}<textarea required maxLength={1000} rows={2} value={answers[key]||''} onChange={e=>updateAnswer(key,e.target.value)} className="mt-2 block w-full rounded-lg bg-secondary border border-input p-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"/><span className="block text-right text-[11px] text-muted-foreground mt-1">{(answers[key]||'').length}/1000</span></label>)}
   <p className="text-xs text-muted-foreground">Your progress is auto-saved locally while you type. Saving normalizes your five answers and persists a new profile version.</p>
   <div className="flex flex-wrap items-center gap-3">
    <Button variant="default" className="h-10" disabled={!!spark.busy||!!spark.approval} type="submit">{spark.busy==='save_interview'?'Saving profile…':'Save my taste profile'}</Button>
    <Button variant="outline" className="h-10" disabled={!!spark.busy||!!spark.approval} type="button" onClick={e=>handleSubmit(e,true)}>{spark.busy==='run_spark'?'Generating sparks…':'Save & find 5 new sparks'}</Button>
   </div>
  </form>}
 </section>;
}