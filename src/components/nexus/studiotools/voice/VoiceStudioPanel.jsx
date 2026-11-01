import {useEffect,useState} from 'react';
import OptionChips from '@/components/nexus/studiotools/OptionChips';
import ElevenLabsVoicePanel from '@/components/nexus/voice/ElevenLabsVoicePanel';
import BuiltinVoiceForm from '@/components/nexus/studiotools/voice/BuiltinVoiceForm';
import KokoroVoiceForm from '@/components/nexus/studiotools/voice/KokoroVoiceForm';
const ENGINES=[{id:'elevenlabs',label:'Your ElevenLabs voices',note:'Uses your ElevenLabs characters'},{id:'builtin',label:'Built-in voices',note:'Uses app integration credits'},{id:'kokoro',label:'Kokoro on your VPS',note:'Free · needs your runner on'}];
export default function VoiceStudioPanel({workspace,handoff}){
 const [engine,setEngine]=useState('elevenlabs'),[seed,setSeed]=useState({text:'',at:0});
 useEffect(()=>{if(handoff?.text)setSeed({text:handoff.text,at:handoff.at});},[handoff?.at]);
 return <section className="space-y-4"><OptionChips label="Voice engine" options={ENGINES} value={engine} onChange={setEngine}/>
  {engine==='elevenlabs'&&<ElevenLabsVoicePanel key={seed.at} workspaceId={workspace.id} initialText={seed.text}/>}
  {engine==='builtin'&&<BuiltinVoiceForm key={seed.at} workspace={workspace} initialText={seed.text}/>}
  {engine==='kokoro'&&<KokoroVoiceForm key={seed.at} workspace={workspace} initialText={seed.text}/>}
 </section>;
}