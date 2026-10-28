import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import AudioResult from '@/components/nexus/studiotools/voice/AudioResult';
import {field,invoke} from '@/components/nexus/studiotools/toolKit';
export default function BuiltinVoiceForm({workspace,initialText=''}){
 const qc=useQueryClient();
 const voices=useQuery({queryKey:['voice-studio','voices'],queryFn:async()=>(await invoke('voiceStudio',{action:'voices'})).voices,staleTime:Infinity,retry:false});
 const [text,setText]=useState(initialText.slice(0,2500)),[voice,setVoice]=useState('river'),[language,setLanguage]=useState('');
 const speak=useMutation({mutationFn:()=>invoke('voiceStudio',{action:'speak',text,voice,language,workspace_id:workspace.id}),onSuccess:()=>qc.invalidateQueries({queryKey:['library-assets']})});
 return <form className="space-y-3" onSubmit={e=>{e.preventDefault();speak.mutate();}}>
  <label className="block text-xs text-muted-foreground">Text<textarea rows={5} maxLength={2500} value={text} onChange={e=>setText(e.target.value)} className={field}/></label>
  <div className="grid sm:grid-cols-2 gap-3"><label className="text-xs text-muted-foreground">Voice<select value={voice} onChange={e=>setVoice(e.target.value)} className={field}>{(voices.data||[]).map(v=><option key={v.id} value={v.id}>{v.label} · {v.style}</option>)}</select></label><label className="text-xs text-muted-foreground">Language (blank = auto)<input value={language} onChange={e=>setLanguage(e.target.value.toLowerCase().slice(0,2))} placeholder="en" className={field}/></label></div>
  <div className="flex items-center gap-3"><Button type="submit" disabled={!text.trim()||speak.isPending}>{speak.isPending?'Generating…':'Generate voice'}</Button><span className="text-xs text-muted-foreground">{text.length}/2500 · about 1 integration credit per 50 characters</span></div>
  {(speak.error||voices.error)&&<p role="alert" className="text-destructive text-sm">{(speak.error||voices.error).message}</p>}
  {speak.data&&<AudioResult url={speak.data.signed_url} title={speak.data.title} note="Saved to your Library (stored privately)"/>}
 </form>;
}