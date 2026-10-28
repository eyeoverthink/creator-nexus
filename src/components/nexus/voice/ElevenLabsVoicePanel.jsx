import {useEffect,useState} from 'react';
import {Loader2,Mic} from 'lucide-react';
import {Button} from '@/components/ui/button';
import useElevenLabs,{voiceError} from '@/components/nexus/voice/useElevenLabs';
import ElevenLabsQuota from '@/components/nexus/voice/ElevenLabsQuota';
import ElevenLabsResult from '@/components/nexus/voice/ElevenLabsResult';
const field='mt-1 w-full rounded border border-input bg-card p-2 text-sm text-foreground';
const MAX=2500;
export default function ElevenLabsVoicePanel({workspaceId,initialText=''}){
 const {status,voices,speak}=useElevenLabs(workspaceId);
 const [text,setText]=useState(initialText.slice(0,MAX)),[voiceId,setVoiceId]=useState(''),[modelId,setModelId]=useState(''),[title,setTitle]=useState('');
 const models=status.data?.models,left=status.data?.characters_left;
 useEffect(()=>{if(!voiceId&&voices.data?.length)setVoiceId((voices.data.find(v=>v.is_default)||voices.data[0]).voice_id);},[voices.data,voiceId]);
 useEffect(()=>{if(!modelId&&models?.length)setModelId((models.find(m=>m.is_default)||models[0]).model_id);},[models,modelId]);
 const submit=e=>{e.preventDefault();speak.mutate({text,voice_id:voiceId,model_id:modelId,title});};
 return <section aria-label="ElevenLabs voice" className="max-w-3xl space-y-4">
  <div><h3 className="text-base font-semibold flex items-center gap-2"><Mic size={16}/>ElevenLabs voice</h3><p className="text-xs text-muted-foreground mt-1">Speaks your text with your saved ElevenLabs key and voices. Every clip is saved privately to your Library as an MP3.</p></div>
  <ElevenLabsQuota status={status}/>
  <form onSubmit={submit} className="space-y-3">
   <div className="grid sm:grid-cols-2 gap-3">
    <label className="text-xs text-muted-foreground">Voice<select value={voiceId} onChange={e=>setVoiceId(e.target.value)} disabled={!voices.data?.length} className={field}>{voices.isPending&&<option value="">Loading voices…</option>}{(voices.data||[]).map(v=><option key={v.voice_id} value={v.voice_id}>{v.name}{v.is_default?' · default':''} ({v.category})</option>)}</select></label>
    <label className="text-xs text-muted-foreground">Model<select value={modelId} onChange={e=>setModelId(e.target.value)} disabled={!models?.length} className={field}>{(models||[]).map(m=><option key={m.model_id} value={m.model_id}>{m.name}{m.is_default?' · default':''}</option>)}</select></label>
   </div>
   <label className="block text-xs text-muted-foreground">Title (optional)<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={160} placeholder="e.g. Intro narration, take 1" className={field}/></label>
   <label className="block text-xs text-muted-foreground">Text<textarea value={text} onChange={e=>setText(e.target.value)} maxLength={MAX} rows={6} placeholder="What should your voice say?" className={field}/></label>
   <p className="text-xs text-muted-foreground">{text.length.toLocaleString()} / {MAX.toLocaleString()} characters{typeof left==='number'&&text.length>left?` · more than the ${left.toLocaleString()} characters left on your plan`:''}</p>
   {voices.error&&<p role="alert" className="text-sm text-destructive">{voiceError(voices.error)}</p>}
   {speak.error&&<p role="alert" className="text-sm text-destructive">{voiceError(speak.error)}</p>}
   <Button type="submit" disabled={speak.isPending||!text.trim()||!voiceId||!modelId}>{speak.isPending?<Loader2 className="animate-spin"/>:<Mic/>}{speak.isPending?'Generating voice…':'Generate voice'}</Button>
  </form>
  {speak.data&&<ElevenLabsResult result={speak.data}/>}
 </section>;
}