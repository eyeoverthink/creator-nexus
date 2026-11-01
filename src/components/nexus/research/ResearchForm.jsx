import {useState} from 'react';
import {Loader2,Search,Plus,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
const TYPES=[['url','Business URL'],['github','GitHub profile'],['instagram','Instagram'],['dnb','D&B / DUNS info (paste)'],['text','Pasted info']];
const TOPICS='top 10 ways to make money with AI, AI skills that pay, AI agents business, AI agency, agentic AI, AI business ideas, AI career, AI employee';
const field='rounded border border-input bg-card p-2 text-sm';
export default function ResearchForm({run}){
 const [query,setQuery]=useState(''),[sources,setSources]=useState([{type:'url',value:''}]),[topics,setTopics]=useState(TOPICS),[image,setImage]=useState(null);
 const upd=(i,k,v)=>setSources(sources.map((s,j)=>j===i?{...s,[k]:v}:s));
 const long=t=>t==='text'||t==='dnb';
 const submit=e=>{e.preventDefault();run.mutate({query,image,sources:sources.filter(s=>s.value.trim()),youtube_topics:topics.split(',').map(t=>t.trim()).filter(Boolean)});};
 return <form onSubmit={submit} className="space-y-4 max-w-3xl">
  <label className="block text-xs text-muted-foreground">What are you looking for? (natural language)<input value={query} onChange={e=>setQuery(e.target.value)} maxLength={1000} placeholder="e.g. AI agent services local businesses will pay for" className={`${field} mt-1 w-full`}/></label>
  <div className="space-y-2"><p className="text-xs text-muted-foreground">Sources</p>{sources.map((s,i)=><div key={i} className="flex gap-2 items-start">
   <select value={s.type} onChange={e=>upd(i,'type',e.target.value)} aria-label="Source type" className={field}>{TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
   {long(s.type)?<textarea rows={3} value={s.value} onChange={e=>upd(i,'value',e.target.value)} maxLength={6000} aria-label="Source content" className={`${field} flex-1`}/>:<input value={s.value} onChange={e=>upd(i,'value',e.target.value)} placeholder={s.type==='url'?'https://…':'@handle or link'} aria-label="Source address" className={`${field} flex-1`}/>}
   <Button type="button" variant="ghost" size="icon" aria-label="Remove source" onClick={()=>setSources(sources.filter((_,j)=>j!==i))}><X/></Button>
  </div>)}{sources.length<8&&<Button type="button" variant="outline" size="sm" onClick={()=>setSources([...sources,{type:'url',value:''}])}><Plus/>Add source</Button>}</div>
  <label className="block text-xs text-muted-foreground">Image (optional, stored privately)<input type="file" accept="image/*" onChange={e=>setImage(e.target.files?.[0]||null)} className="mt-1 block text-sm"/></label>
  <label className="block text-xs text-muted-foreground">YouTube trend topics (comma separated, up to 8)<textarea rows={2} value={topics} onChange={e=>setTopics(e.target.value)} className={`${field} mt-1 w-full`}/></label>
  {run.error&&<p role="alert" className="text-sm text-destructive">{run.error.message}</p>}
  <Button type="submit" disabled={run.isPending}>{run.isPending?<Loader2 className="animate-spin"/>:<Search/>}{run.isPending?'Researching…':'Run research'}</Button>
  <p className="text-xs text-muted-foreground">Research only reads and summarizes. Nothing is posted, sent, bought or changed anywhere.</p>
 </form>;
}