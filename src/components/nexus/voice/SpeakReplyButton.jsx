import {useEffect,useRef,useState} from 'react';
import {Volume2,Square} from 'lucide-react';
import {speakWithAgentVoice} from '@/components/nexus/voice/speakWithAgentVoice';
export default function SpeakReplyButton({text,title}){
 const player=useRef(null),[state,setState]=useState('idle'),[error,setError]=useState('');
 useEffect(()=>()=>player.current?.stop(),[]);
 const toggle=async()=>{
  if(state==='playing'){player.current?.stop();setState('idle');return;}
  setState('loading');setError('');
  try{player.current=await speakWithAgentVoice(text,{title});player.current.audio.onended=()=>setState('idle');setState('playing');}
  catch(e){setError(e.message);setState('idle');}
 };
 return <span className="inline-flex flex-wrap items-center gap-2 text-xs"><button type="button" onClick={toggle} disabled={state==='loading'} className="text-link inline-flex items-center gap-1">{state==='playing'?<Square size={13}/>:<Volume2 size={13}/>}{state==='loading'?'Preparing voice…':state==='playing'?'Stop':'Read aloud in my voice'}</button>{error&&<span role="alert" className="text-destructive">{error}</span>}</span>;
}