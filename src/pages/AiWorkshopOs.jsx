import {useState,useRef,useCallback,useEffect} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft,Maximize2,ExternalLink,Activity,Layers3,Users,Cpu} from 'lucide-react';
import {Button} from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import {AI_WORKSHOP_OS_HTML} from '@/components/nexus/loosescrew/aiWorkshopOsHtml';
import FraymusStudioTelemetry from '@/components/nexus/FraymusStudioTelemetry';
import FraymusHivePanel from '@/components/nexus/hive/FraymusHivePanel';
import CrossTabMemoryBar from '@/components/nexus/CrossTabMemoryBar';
import SovereignOsSpawnerPanel from '@/components/nexus/loosescrew/SovereignOsSpawnerPanel';
import CounterfactualEvolutionSimulator from '@/components/nexus/spark/CounterfactualEvolutionSimulator';

export default function AiWorkshopOs(){
 const [showPreflightLab,setShowPreflightLab]=useState(true);
 const [showOsSpawner,setShowOsSpawner]=useState(false);
 const [showTelemetry,setShowTelemetry]=useState(false);
 const [showHive,setShowHive]=useState(false);
 const iframeRef=useRef(null);
 const latestSystemsRef=useRef([]);

 const syncSystemsToMonolith=useCallback((systems,focusSystem=null)=>{
  if(Array.isArray(systems)&&systems.length)latestSystemsRef.current=systems;
  const win=iframeRef.current?.contentWindow;
  if(win){
   try{
    win.postMessage({type:'NEXUS_SYNC_SOVEREIGN_OS',systems:latestSystemsRef.current,focusSystem},'*');
   }catch{}
  }
 },[]);

 useEffect(()=>{
  base44.functions.invoke('nexusEvolution',{action:'list_sovereign_os'}).then(({data})=>{
   if(Array.isArray(data?.systems)){
    setTimeout(()=>syncSystemsToMonolith(data.systems,null),450);
   }
  }).catch(()=>{});
 },[syncSystemsToMonolith]);

 const popOut=()=>{
  const w=window.open('','_blank');
  if(!w)return;
  w.document.open();w.document.write(AI_WORKSHOP_OS_HTML);w.document.close();
 };
 return <div className="fixed inset-0 bg-background flex flex-col">
  <header className="min-h-10 py-1.5 px-3 bg-card border-b border-border flex flex-wrap items-center justify-between gap-2 font-mono text-xs z-20">
   <div className="flex flex-wrap items-center gap-2.5">
    <Link to="/studio" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"><Layers3 size={13}/>Studio</Link>
    <span className="text-border">|</span>
    <Link to="/loose-screw" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"><ArrowLeft size={13}/>looseScrew</Link>
    <span className="text-border">|</span>
    <strong className="text-primary truncate">F.R.A.Y.M.U.S. // 3D Monolith &amp; Sovereign OS Engine</strong>
   </div>
   <div className="flex flex-wrap items-center gap-1.5">
    <Button size="sm" variant={showPreflightLab?'default':'outline'} onClick={()=>{setShowPreflightLab(v=>!v);if(!showPreflightLab){setShowOsSpawner(false);setShowHive(false);setShowTelemetry(false);}}} className="h-7 font-mono text-[10.5px] px-2.5 gap-1"><Activity size={11}/>{showPreflightLab?'Hide Pre-Flight & Model Lab':'🎯 Pre-Flight & Ternary Model Lab'}</Button>
    <Button size="sm" variant={showOsSpawner?'default':'outline'} onClick={()=>{setShowOsSpawner(v=>!v);if(!showOsSpawner){setShowPreflightLab(false);setShowHive(false);setShowTelemetry(false);}}} className="h-7 font-mono text-[10.5px] px-2.5 gap-1"><Cpu size={11}/>{showOsSpawner?'Hide OS Engine':'⚛ Sovereign OS'}</Button>
    <Button size="sm" variant={showHive?'default':'outline'} onClick={()=>{setShowHive(v=>!v);if(!showHive){setShowPreflightLab(false);setShowTelemetry(false);setShowOsSpawner(false);}}} className="h-7 font-mono text-[10.5px] px-2.5 gap-1"><Users size={11}/>{showHive?'Hide Hive':'🐝 15-Agent Hive'}</Button>
    <Button size="sm" variant={showTelemetry?'default':'outline'} onClick={()=>{setShowTelemetry(v=>!v);if(!showTelemetry){setShowPreflightLab(false);setShowHive(false);setShowOsSpawner(false);}}} className="h-7 font-mono text-[10.5px] px-2.5 gap-1"><Activity size={11}/>{showTelemetry?'Hide Telemetry':'RSA · RSI'}</Button>
    <Button size="sm" variant="outline" onClick={popOut} className="h-7 font-mono text-[10.5px] px-2.5 gap-1"><Maximize2 size={11}/>Pop Out</Button>
    <a href="https://github.com/eyeoverthink/looseScrew" target="_blank" rel="noopener noreferrer" className="inline-flex h-7 items-center gap-1 rounded border border-primary/50 bg-selection px-2 text-[10.5px] text-primary"><ExternalLink size={11}/>GitHub</a>
   </div>
  </header>
  <CrossTabMemoryBar/>
  {showPreflightLab&&<CounterfactualEvolutionSimulator/>}
  {showOsSpawner&&<SovereignOsSpawnerPanel onSyncToMonolith={syncSystemsToMonolith}/>}
  {showHive&&<div className="max-h-[58vh] overflow-y-auto border-b border-border bg-background/95 z-20"><FraymusHivePanel/></div>}
  {showTelemetry&&<div className="max-h-[54vh] overflow-y-auto border-b border-border bg-background/95 p-4 z-20"><FraymusStudioTelemetry/></div>}
  <iframe ref={iframeRef} onLoad={()=>syncSystemsToMonolith(latestSystemsRef.current,null)} title="AI WORKSHOP OS & F.R.A.Y.M.U.S." srcDoc={AI_WORKSHOP_OS_HTML} className="flex-1 w-full border-0"/>
 </div>;
}