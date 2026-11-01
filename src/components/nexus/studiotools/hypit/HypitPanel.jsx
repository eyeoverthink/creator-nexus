import {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import LibraryMediaPicker from '@/components/nexus/studiotools/LibraryMediaPicker';
import HypitResult from '@/components/nexus/studiotools/hypit/HypitResult';
import {extractFrames} from '@/components/nexus/studiotools/hypit/extractFrames';
import {field,invoke,uploadPrivate,toolError} from '@/components/nexus/studiotools/toolKit';
const LIMIT=25*1024*1024;
export default function HypitPanel({workspace,onSend}){
 const qc=useQueryClient();
 const [src,setSrc]=useState(null),[count,setCount]=useState(8),[transcribe,setTranscribe]=useState(true),[transcript,setTranscript]=useState(''),[goal,setGoal]=useState('');
 const [frames,setFrames]=useState([]),[status,setStatus]=useState(''),[error,setError]=useState(''),[result,setResult]=useState(null);
 const run=async()=>{setError('');setResult(null);try{
  setStatus('Sampling frames…');const {duration,frames:f}=await extractFrames(src.file||src.url,count);setFrames(f);
  setStatus('Uploading frames…');const uris=await Promise.all(f.map((x,i)=>uploadPrivate(x.blob,`hypit-frame-${i+1}.jpg`)));
  let video_uri=null;if(transcribe&&!transcript.trim()){if(src.file_uri)video_uri=src.file_uri;else if(src.file.size<=LIMIT){setStatus('Uploading video for transcription…');video_uri=await uploadPrivate(src.file,src.file.name);}}
  setStatus('Analyzing with AI…');
  setResult(await invoke('hypit',{action:'analyze',frames:f.map((x,i)=>({t:x.t,file_uri:uris[i]})),video_uri,duration,title:src.name,goal,transcript,workspace_id:workspace.id}));
  qc.invalidateQueries({queryKey:['library-assets']});
 }catch(e){setError(toolError(e));}finally{setStatus('');}};
 return <section className="space-y-4">
  <div className="grid md:grid-cols-2 gap-3"><label className="block text-xs text-muted-foreground">Video from your computer<input type="file" accept="video/*" onChange={e=>{const f=e.target.files?.[0];if(f)setSrc({file:f,name:f.name});e.target.value='';}} className="mt-1 block w-full text-sm"/></label><LibraryMediaPicker kind="video" onPick={p=>setSrc({url:p.url,file_uri:p.file_uri,name:p.title})}/></div>
  {src&&<p className="text-sm">Selected: {src.name}{src.file&&src.file.size>LIMIT&&transcribe?' · over 25 MB, so paste a transcript if it has speech':''}</p>}
  <div className="grid md:grid-cols-3 gap-3"><label className="text-xs text-muted-foreground">Frames to study<select value={count} onChange={e=>setCount(Number(e.target.value))} className={field}>{[6,8,10,12].map(n=><option key={n}>{n}</option>)}</select></label><label className="flex items-center gap-2 text-sm pt-5"><input type="checkbox" checked={transcribe} onChange={e=>setTranscribe(e.target.checked)}/>Transcribe the speech</label><label className="text-xs text-muted-foreground">What do you want to make?<input value={goal} maxLength={1000} onChange={e=>setGoal(e.target.value)} placeholder="e.g. a 30s promo for my new track" className={field}/></label></div>
  <label className="block text-xs text-muted-foreground">Transcript (optional, skips transcription)<textarea rows={2} maxLength={12000} value={transcript} onChange={e=>setTranscript(e.target.value)} className={field}/></label>
  <div className="flex flex-wrap items-center gap-3"><Button disabled={!src||!!status} onClick={run}>Analyze video</Button><span className="text-xs text-muted-foreground">Uses app integration credits (one AI analysis{transcribe?' + transcription':''})</span>{status&&<span role="status" className="text-sm text-muted-foreground">{status}</span>}</div>
  {error&&<p role="alert" className="text-destructive text-sm">{error}</p>}
  {frames.length>0&&<div className="flex gap-2 overflow-x-auto">{frames.map(f=><figure key={f.t} className="shrink-0"><img src={f.preview} alt={`Frame at ${f.t}s`} className="h-24 rounded border border-border"/><figcaption className="text-xs text-muted-foreground">{f.t}s</figcaption></figure>)}</div>}
  {result&&<HypitResult data={result} onSend={onSend}/>}
 </section>;
}