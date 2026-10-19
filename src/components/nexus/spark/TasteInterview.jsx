import {useState} from 'react';
import {questions} from '@/components/nexus/spark/sparkClient';
import SparkProfileView from '@/components/nexus/spark/SparkProfileView';
import {Button} from '@/components/ui/button';
export default function TasteInterview({spark}){
 const [redo,setRedo]=useState(false),[answers,setAnswers]=useState(()=>Object.fromEntries(questions.map(([key])=>[key,spark.profile.data?.answers?.[key]||''])));
 const toggleRedo=()=>{
  if(!redo&&spark.profile.data?.answers){
   setAnswers(prev=>({...prev,...Object.fromEntries(questions.map(([key])=>[key,spark.profile.data.answers[key]||prev[key]||'']))}));
  }
  setRedo(!redo);
 };
 if(spark.profile.isPending)return <p role="status" className="text-sm text-muted-foreground">Loading taste profile…</p>;
 if(spark.profile.error)return <p role="alert" className="text-destructive text-sm">{spark.profile.error.message}</p>;
 return <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-5"><header className="flex items-center justify-between gap-3"><h2 className="font-heading text-xl">Taste profile</h2>{spark.profile.data&&<Button variant="outline" size="sm" disabled={!!spark.busy} onClick={toggleRedo}>{redo?'Keep current profile':'Redo interview'}</Button>}</header>{spark.profile.data&&!redo?<SparkProfileView record={spark.profile.data}/>:<form className="space-y-4" onSubmit={e=>{e.preventDefault();spark.ask('save_interview',{answers},()=>setRedo(false));}}>{questions.map(([key,label])=><label key={key} className="block text-sm">{label}<textarea required maxLength={1000} rows={2} value={answers[key]} onChange={e=>setAnswers({...answers,[key]:e.target.value})} className="mt-2 block w-full rounded-lg bg-secondary border border-input p-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"/><span className="block text-right text-[11px] text-muted-foreground mt-1">{answers[key].length}/1000</span></label>)}<p className="text-xs text-muted-foreground">Only what you wrote is used. Nothing is inferred about you.</p><Button variant={spark.profile.data?'outline':'default'} className="h-10" disabled={!!spark.busy||!!spark.approval} type="submit">{spark.busy==='save_interview'?'Saving profile…':'Save my taste profile'}</Button></form>}</section>;
}