import {useState} from 'react';
import {Sparkles,RefreshCw,GitBranch,Play} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {base44} from '@/api/base44Client';

export default function AutonomousForgeBar({activeItem,onBuilt,onEvolved,onLog,onSpeak}){
 const [prompt,setPrompt]=useState(''),[targetUrl,setTargetUrl]=useState(''),[channel,setChannel]=useState('CODE'),[busy,setBusy]=useState(''),[autoLoop,setAutoLoop]=useState(false),[err,setErr]=useState('');

 const buildNewApp=async()=>{
  if(!prompt.trim()||busy)return;
  setBusy('build');setErr('');
  onLog?.(`Autonomous Forge started: "${prompt.trim().slice(0,50)}..."`);
  onSpeak?.('Spinning up the Autonomous Forge. Designing and verifying your live application now.');
  try{
   const {data}=await base44.functions.invoke('looseScrewForge',{action:'autonomous_build',prompt:prompt.trim(),target_url:targetUrl.trim(),channel});
   if(data?.item){
    onBuilt?.(data.item);
    setPrompt('');
    onLog?.(`Autonomous App Built -> [${data.item.channel}] ${data.item.title}`);
    onSpeak?.(data.item.voice_intro||`Autonomous build complete: ${data.item.title}`);
   }
  }catch(e){setErr(e.response?.data?.error||e.message||'Autonomous build failed');}
  finally{setBusy('');}
 };

 const evolveCurrent=async(customDirective)=>{
  if(busy||!activeItem)return;
  const dir=customDirective||prompt.trim()||'Autonomously upgrade this application with richer interactive controls, real-time visual telemetry, and deeper functionality.';
  setBusy('evolve');setErr('');
  onLog?.(`Autonomously evolving "${activeItem.title}"...`);
  try{
   const isPersisted=activeItem.id&&!/^(music|code|video)-\d+$/.test(activeItem.id);
   const {data}=await base44.functions.invoke('looseScrewForge',{
    action:isPersisted?'autonomous_evolve':'autonomous_build',
    item_id:isPersisted?activeItem.id:undefined,
    prompt:`Evolve "${activeItem.title}": ${dir}`,
    target_url:targetUrl.trim()||activeItem.external_link||'',
    channel:activeItem.channel||'CODE',
    existing_code:activeItem.code||'',
    existing_app_html:activeItem.app_html||''
   });
   if(data?.item){
    onEvolved?.(data.item);
    onLog?.(`Evolution cycle complete -> ${data.item.title}`);
    onSpeak?.(data.item.voice_intro||`Evolution complete for ${data.item.title}.`);
   }
  }catch(e){setErr(e.response?.data?.error||e.message||'Evolution failed');}
  finally{setBusy('');}
 };

 const pushToGitHub=async()=>{
  if(busy||!activeItem)return;
  setBusy('github');setErr('');
  try{
   const isPersisted=activeItem.id&&!/^(music|code|video)-\d+$/.test(activeItem.id);
   const {data}=await base44.functions.invoke('looseScrewForge',{
    action:'push_github',
    item_id:isPersisted?activeItem.id:undefined,
    title:activeItem.title,
    app_html:activeItem.app_html||'',
    code:activeItem.code||''
   });
   if(data?.html_url){
    onLog?.(`Pushed live to GitHub -> ${data.file_path}`);
    onSpeak?.(`Pushed ${activeItem.title} directly to eyeoverthink slash looseScrew on GitHub.`);
    window.open(data.html_url,'_blank','noopener,noreferrer');
   }
  }catch(e){setErr(e.response?.data?.error||e.message||'GitHub push failed');}
  finally{setBusy('');}
 };

 return <div className="rounded-lg border border-primary/50 bg-card p-3.5 space-y-2.5 font-mono">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <span className="text-xs font-bold text-primary flex items-center gap-1.5"><Sparkles size={14}/>AUTONOMOUS APP & REA FORGE (UN-SANDBOXED BUILDER)</span>
   <div className="flex flex-wrap items-center gap-1.5">
    <Button size="sm" variant="outline" disabled={!!busy} onClick={()=>evolveCurrent()} className="h-7 text-[11px] gap-1"><RefreshCw size={12} className={busy==='evolve'?'animate-spin':''}/>{busy==='evolve'?'Evolving App…':'🧬 Evolve Active App'}</Button>
    <Button size="sm" variant="outline" disabled={!!busy} onClick={pushToGitHub} className="h-7 text-[11px] gap-1"><GitBranch size={12}/>{busy==='github'?'Pushing…':'Push App to GitHub'}</Button>
   </div>
  </div>
  <div className="grid grid-cols-1 lg:grid-cols-[110px_1fr_240px_auto] gap-2">
   <select value={channel} onChange={e=>setChannel(e.target.value)} className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs">
    <option value="CODE">⌘ CODE/APP</option>
    <option value="MUSIC">♫ MUSIC/SYNTH</option>
    <option value="VIDEO">▶ SHADER/VID</option>
   </select>
   <input value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')buildNewApp();}} placeholder="Describe any app, synth workstation, visualizer, or REA rebuild to generate autonomously..." className="rounded-md border border-input bg-background px-3 py-1.5 text-xs"/>
   <input value={targetUrl} onChange={e=>setTargetUrl(e.target.value)} placeholder="Optional link/URL to inspect..." className="rounded-md border border-input bg-background px-3 py-1.5 text-xs"/>
   <Button size="sm" disabled={!!busy||!prompt.trim()} onClick={buildNewApp} className="text-xs gap-1.5"><Play size={12}/>{busy==='build'?'Building…':'Autonomous Build'}</Button>
  </div>
  {err&&<p className="text-xs text-destructive">{err}</p>}
 </div>;
}