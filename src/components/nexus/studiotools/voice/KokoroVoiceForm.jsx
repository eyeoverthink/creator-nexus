import {useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import useToolJobPoll from '@/components/nexus/useToolJobPoll';
import AudioResult from '@/components/nexus/studiotools/voice/AudioResult';
import {field,invoke,signedUrl,saveBlobToLibrary,toolError} from '@/components/nexus/studiotools/toolKit';
export default function KokoroVoiceForm({workspace,initialText=''}){
 const voices=useQuery({queryKey:['kokoro','voices'],queryFn:async()=>(await invoke('nexusTTS',{action:'voices'})).voices,staleTime:Infinity,retry:false});
 const [text,setText]=useState(initialText.slice(0,1500)),[voice,setVoice]=useState('af_heart'),[speed,setSpeed]=useState(1);
 const [jobId,setJobId]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[clip,setClip]=useState(null),[saved,setSaved]=useState('');
 const poll=useToolJobPoll(jobId,jobId?'tts':null);
 useEffect(()=>{if(poll?.status!=='done'||!poll.audio_url)return;(async()=>{const url=/^https?:/.test(poll.audio_url)?poll.audio_url:await signedUrl(poll.audio_url);setClip({url,title:text.slice(0,80)});setJobId(null);})().catch(e=>setError(toolError(e)));},[poll?.status,poll?.audio_url]);
 useEffect(()=>{if(poll?.status==='failed'){setError(poll.error||'Kokoro job failed.');setJobId(null);}},[poll?.status]);
 const queue=async e=>{e.preventDefault();setBusy(true);setError('');setClip(null);setSaved('');try{setJobId((await invoke('nexusTTS',{action:'speak',text,voice,speed,workspace_id:workspace.id})).event_id);}catch(err){setError(toolError(err));}finally{setBusy(false);}};
 const save=async()=>{setBusy(true);try{const blob=await (await fetch(clip.url)).blob();await saveBlobToLibrary({workspace,blob,fileName:`kokoro-${voice}-${Date.now()}.${blob.type.includes('wav')?'wav':'mp3'}`,title:`Voice · ${clip.title}`,project:'Voice Studio',body:text});setSaved('Saved to your Library (stored privately).');}catch(err){setError(toolError(err));}finally{setBusy(false);}};
 return <form className="space-y-3" onSubmit={queue}>
  <label className="block text-xs text-muted-foreground">Text<textarea rows={5} maxLength={1500} value={text} onChange={e=>setText(e.target.value)} className={field}/></label>
  <div className="grid sm:grid-cols-2 gap-3"><label className="text-xs text-muted-foreground">Voice<select value={voice} onChange={e=>setVoice(e.target.value)} className={field}>{(voices.data||[{id:'af_heart',label:'Heart'}]).map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select></label><label className="text-xs text-muted-foreground">Speed {speed}×<input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="mt-3 w-full accent-primary"/></label></div>
  <div className="flex items-center gap-3"><Button type="submit" disabled={!text.trim()||busy||!!jobId}>Send to my VPS</Button>{jobId&&<Button type="button" variant="outline" onClick={()=>setJobId(null)}>Stop waiting</Button>}<span className="text-xs text-muted-foreground">Free · runs Kokoro on your VPS runner</span></div>
  {jobId&&<p role="status" className="text-sm text-muted-foreground">Queued. Waiting for your VPS runner to pick it up… If the runner is off, it will run when it comes back.</p>}
  {error&&<p role="alert" className="text-destructive text-sm">{error}</p>}
  {clip&&<><AudioResult url={clip.url} title={clip.title}/><Button type="button" variant="outline" disabled={busy} onClick={save}>Save to Library</Button></>}{saved&&<p role="status" className="text-sm text-muted-foreground">{saved}</p>}
 </form>;
}