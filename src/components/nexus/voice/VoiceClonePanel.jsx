import {useRef,useState} from 'react';
import {Upload,Loader2,Check} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {voiceError} from '@/components/nexus/voice/useElevenLabs';
const field='mt-1 w-full rounded border border-input bg-card p-2 text-sm text-foreground';
const MAX_BYTES=25*1024*1024;
const seconds=file=>new Promise(res=>{const url=URL.createObjectURL(file),a=new Audio();const done=v=>{URL.revokeObjectURL(url);res(v);};a.preload='metadata';a.onloadedmetadata=()=>done(isFinite(a.duration)?a.duration:0);a.onerror=()=>done(0);a.src=url;});
export default function VoiceClonePanel({clone,onCloned}){
 const input=useRef(null);
 const [files,setFiles]=useState([]),[length,setLength]=useState(0),[name,setName]=useState('My voice'),[noise,setNoise]=useState(false),[agents,setAgents]=useState(true),[consent,setConsent]=useState(false),[error,setError]=useState('');
 const pick=async list=>{const chosen=[...list].filter(f=>f.type.startsWith('audio/')||/\.(mp3|wav|m4a|ogg|flac|webm|aac)$/i.test(f.name)).slice(0,5);if(!chosen.length){setError('Choose audio recordings (MP3, WAV, M4A…).');return;}if(chosen.some(f=>f.size>MAX_BYTES)){setError('Each recording must be 25 MB or smaller.');return;}setError('');setFiles(chosen);setLength((await Promise.all(chosen.map(seconds))).reduce((a,b)=>a+b,0));};
 const submit=e=>{e.preventDefault();clone.mutate({files,name:name.trim(),removeNoise:noise,useForAgents:agents},{onSuccess:d=>{setFiles([]);setLength(0);onCloned?.(d);}});};
 return <form onSubmit={submit} className="rounded border border-border bg-card p-4 space-y-3">
  <div><h4 className="text-sm font-semibold">Clone my voice</h4><p className="text-xs text-muted-foreground mt-1">Upload 1–5 clean recordings of you talking, ideally 1–3 minutes in total with no music. ElevenLabs makes an instant clone in your account.</p></div>
  <input ref={input} type="file" accept="audio/*" multiple hidden onChange={e=>{pick(e.target.files);e.target.value='';}}/>
  <Button type="button" variant="outline" onClick={()=>input.current?.click()} disabled={clone.isPending}><Upload/>Upload my voice</Button>
  {files.length>0&&<ul className="text-xs text-muted-foreground space-y-1">{files.map(f=><li key={f.name}>{f.name} · {(f.size/1048576).toFixed(1)} MB</li>)}<li>About {Math.round(length)} seconds in total{length>0&&length<30?' · add more for a closer match':''}</li></ul>}
  <label className="block text-xs text-muted-foreground">Voice name<input value={name} maxLength={60} onChange={e=>setName(e.target.value)} className={field}/></label>
  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={noise} onChange={e=>setNoise(e.target.checked)}/>Remove background noise (only for noisy recordings)</label>
  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={agents} onChange={e=>setAgents(e.target.checked)}/>Use this voice for my agents' replies</label>
  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>This is my own voice</label>
  {(error||clone.error)&&<p role="alert" className="text-sm text-destructive">{error||voiceError(clone.error)}</p>}
  {clone.data&&!files.length&&<p role="status" className="text-sm text-success inline-flex items-center gap-2"><Check size={14}/>“{clone.data.name}” is ready{clone.data.agent_voice?' and your agents now speak with it':''}.</p>}
  <Button type="submit" disabled={!files.length||!name.trim()||!consent||clone.isPending}>{clone.isPending&&<Loader2 className="animate-spin"/>}{clone.isPending?'Uploading and cloning…':'Clone my voice'}</Button>
 </form>;
}