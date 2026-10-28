import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {voiceError} from '@/components/nexus/voice/useElevenLabs';
export default function AgentVoicePicker({voices,setAgentVoice}){
 const list=[...(voices.data||[])].sort((a,b)=>(b.category==='cloned')-(a.category==='cloned')),current=list.find(v=>v.is_agent_voice);
 const [choice,setChoice]=useState(''),value=choice||current?.voice_id||'';
 return <div className="rounded border border-border bg-card p-4 space-y-2">
  <h4 className="text-sm font-semibold">Agent voice</h4>
  <p className="text-xs text-muted-foreground">Your partner, studio agents, workflows and remote API speak with this voice. {current?`Now: ${current.name}.`:'Not chosen yet, so your saved default voice is used.'}</p>
  <div className="flex flex-wrap gap-2"><select aria-label="Agent voice" value={value} onChange={e=>setChoice(e.target.value)} disabled={!list.length} className="h-9 rounded border border-input bg-background px-2 text-sm">{!value&&<option value="">Choose a voice…</option>}{list.map(v=><option key={v.voice_id} value={v.voice_id}>{v.name} ({v.category})</option>)}</select><Button type="button" variant="outline" disabled={!value||value===current?.voice_id||setAgentVoice.isPending} onClick={()=>setAgentVoice.mutate(value)}>{setAgentVoice.isPending?'Saving…':'Use for agent replies'}</Button></div>
  {setAgentVoice.error&&<p role="alert" className="text-sm text-destructive">{voiceError(setAgentVoice.error)}</p>}
 </div>;
}