import {useState} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import OptionChips from '@/components/nexus/studiotools/OptionChips';
import ReaReport from '@/components/nexus/studiotools/rea/ReaReport';
import {field,invoke} from '@/components/nexus/studiotools/toolKit';
const MODES=[{id:'web',label:'Website',note:'Public page + its scripts'},{id:'github',label:'GitHub repo',note:'owner/repo or link'},{id:'source',label:'Source files',note:'Upload or paste code'}];
async function readFiles(list){const files=[...list].slice(0,20);return Promise.all(files.map(async f=>({name:f.name,text:(await f.text()).slice(0,200000)})));}
export default function ReaPanel({workspace}){
 const qc=useQueryClient();
 const [mode,setMode]=useState('web'),[target,setTarget]=useState(''),[feature,setFeature]=useState(''),[question,setQuestion]=useState(''),[files,setFiles]=useState([]),[paste,setPaste]=useState(''),[ok,setOk]=useState(false);
 const run=useMutation({mutationFn:async()=>{const sources=mode==='source'?[...(await readFiles(files)),...(paste.trim()?[{name:'pasted.txt',text:paste}]:[])]:undefined;return invoke('rea',{action:'analyze',mode,target:mode==='source'?(target||files[0]?.name||'Pasted source'):target,feature,question,files:sources,authorized:ok,workspace_id:workspace.id});},onSuccess:()=>qc.invalidateQueries({queryKey:['library-assets']})});
 const ready=ok&&(mode==='source'?files.length||paste.trim():target.trim());
 return <section className="space-y-4">
  <OptionChips label="What to analyze" options={MODES} value={mode} onChange={setMode}/>
  {mode==='source'?<div className="grid md:grid-cols-2 gap-3"><label className="text-xs text-muted-foreground">Source files (up to 20)<input type="file" multiple onChange={e=>setFiles([...e.target.files])} className="mt-1 block w-full text-sm"/></label><label className="text-xs text-muted-foreground">Or paste code<textarea rows={3} value={paste} onChange={e=>setPaste(e.target.value)} className={field}/></label></div>
   :<label className="block text-xs text-muted-foreground">{mode==='web'?'Website address':'Repository'}<input value={target} onChange={e=>setTarget(e.target.value)} placeholder={mode==='web'?'https://example.com':'owner/repo'} className={field}/></label>}
  <div className="grid md:grid-cols-2 gap-3"><label className="text-xs text-muted-foreground">Feature to trace (optional)<input value={feature} maxLength={200} onChange={e=>setFeature(e.target.value)} placeholder="e.g. checkout, video export" className={field}/></label><label className="text-xs text-muted-foreground">What do you want to learn? (optional)<input value={question} maxLength={1000} onChange={e=>setQuestion(e.target.value)} className={field}/></label></div>
  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ok} onChange={e=>setOk(e.target.checked)}/>I own this or am allowed to analyze it</label>
  <div className="flex flex-wrap items-center gap-3"><Button disabled={!ready||run.isPending} onClick={()=>run.mutate()}>{run.isPending?'Collecting evidence and analyzing…':'Run REA'}</Button><span className="text-xs text-muted-foreground">Uses app integration credits (one AI analysis)</span></div>
  {run.error&&<p role="alert" className="text-destructive text-sm">{run.error.message}</p>}
  {run.data&&<ReaReport data={run.data} target={mode==='source'?(target||'Source files'):target}/>}
 </section>;
}