import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {W,H,createSignalState,applyCommand,renderFrame} from '@/components/nexus/architecture/headroomSignalEngine';

export default function HeadroomSignalPort(){
 const canvas=useRef(null),state=useRef(createSignalState());
 const [cmd,setCmd]=useState('{"speak": "I am Fraymus. I am the signal in the noise.", "neural": 0.8}');
 const [error,setError]=useState('');
 useEffect(()=>{
  const ctx=canvas.current.getContext('2d',{willReadFrequently:true});let id,last=0;
  const loop=now=>{id=requestAnimationFrame(loop);if(now-last<1000/30)return;last=now;renderFrame(ctx,state.current,now/1000);};
  id=requestAnimationFrame(loop);return()=>{cancelAnimationFrame(id);speechSynthesis.cancel();};
 },[]);
 const send=()=>{
  setError('');let data;
  try{data=JSON.parse(cmd);}catch{setError('Invalid JSON command.');return;}
  applyCommand(state.current,data);
  if('speak' in data){const u=new SpeechSynthesisUtterance(String(data.speak));u.onstart=()=>{state.current.speaking=true;};u.onend=u.onerror=()=>{state.current.speaking=false;};speechSynthesis.cancel();speechSynthesis.speak(u);}
 };
 const loadThought=file=>{if(!file)return;const img=new Image();img.onload=()=>{state.current.thought=img;};img.src=URL.createObjectURL(file);};
 return <section className="space-y-4">
  <canvas ref={canvas} width={W} height={H} className="w-full max-w-4xl rounded border border-border bg-black" aria-label="Headroom broadcast signal"/>
  <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>{state.current.glitch=1;}}>Trigger glitch (g)</Button><label className="inline-flex h-8 items-center rounded-md border border-input px-3 text-sm cursor-pointer">Load thought image<input type="file" accept="image/*" className="sr-only" onChange={e=>loadThought(e.target.files[0])}/></label></div>
  <label className="block text-sm">Stdin command (same JSON protocol as HeadroomNode.py)<Textarea className="mt-2 font-mono text-xs" rows={3} value={cmd} onChange={e=>setCmd(e.target.value)}/></label>
  {error&&<p role="alert" className="text-destructive text-sm">{error}</p>}
  <Button onClick={send}>Send command</Button>
 </section>;
}