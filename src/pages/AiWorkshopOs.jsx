import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft,Maximize2,ExternalLink,Activity,Layers3,Users} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {AI_WORKSHOP_OS_HTML} from '@/components/nexus/loosescrew/aiWorkshopOsHtml';
import FraymusStudioTelemetry from '@/components/nexus/FraymusStudioTelemetry';
import FraymusHivePanel from '@/components/nexus/hive/FraymusHivePanel';

export default function AiWorkshopOs(){
 const [showTelemetry,setShowTelemetry]=useState(false);
 const [showHive,setShowHive]=useState(false);
 const popOut=()=>{
  const w=window.open('','_blank');
  if(!w)return;
  w.document.open();w.document.write(AI_WORKSHOP_OS_HTML);w.document.close();
 };
 return <div className="fixed inset-0 bg-background flex flex-col">
  <header className="h-10 px-3 bg-card border-b border-border flex items-center justify-between font-mono text-xs z-20">
   <div className="flex items-center gap-3">
    <Link to="/studio" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><Layers3 size={13}/>Studio Panel</Link>
    <span className="text-border">|</span>
    <Link to="/loose-screw" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><ArrowLeft size={13}/>looseScrew Lab</Link>
    <span className="text-border">|</span>
    <strong className="text-primary">F.R.A.Y.M.U.S. // Tycho dream.srv — 3D Monolith &amp; 15-Agent Hive</strong>
   </div>
   <div className="flex items-center gap-2">
    <Button size="sm" variant={showHive?'default':'outline'} onClick={()=>{setShowHive(v=>!v);if(!showHive)setShowTelemetry(false);}} className="h-7 font-mono text-[11px] gap-1"><Users size={11}/>{showHive?'Hide 15-Agent Hive':'🐝 15-Agent Hive & Digest'}</Button>
    <Button size="sm" variant={showTelemetry?'default':'outline'} onClick={()=>{setShowTelemetry(v=>!v);if(!showTelemetry)setShowHive(false);}} className="h-7 font-mono text-[11px] gap-1"><Activity size={11}/>{showTelemetry?'Hide RSA/RSI Telemetry':'Live RSA · RSI · Sentiment'}</Button>
    <Button size="sm" variant="outline" onClick={popOut} className="h-7 font-mono text-[11px] gap-1"><Maximize2 size={11}/>Pop Out Native Window</Button>
    <a href="https://github.com/eyeoverthink/looseScrew" target="_blank" rel="noopener noreferrer" className="inline-flex h-7 items-center gap-1 rounded border border-primary/50 bg-selection px-2.5 text-[11px] text-primary"><ExternalLink size={11}/>GitHub</a>
   </div>
  </header>
  {showHive&&<div className="max-h-[58vh] overflow-y-auto border-b border-border bg-background/95 z-20"><FraymusHivePanel/></div>}
  {showTelemetry&&<div className="max-h-[54vh] overflow-y-auto border-b border-border bg-background/95 p-4 z-20"><FraymusStudioTelemetry/></div>}
  <iframe title="AI WORKSHOP OS & F.R.A.Y.M.U.S." srcDoc={AI_WORKSHOP_OS_HTML} className="flex-1 w-full border-0"/>
 </div>;
}