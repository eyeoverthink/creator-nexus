import {Link} from 'react-router-dom';
import {ArrowLeft,Maximize2,ExternalLink} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {AI_WORKSHOP_OS_HTML} from '@/components/nexus/loosescrew/aiWorkshopOsHtml';

export default function AiWorkshopOs(){
 const popOut=()=>{
  const w=window.open('','_blank');
  if(!w)return;
  w.document.open();w.document.write(AI_WORKSHOP_OS_HTML);w.document.close();
 };
 return <div className="fixed inset-0 bg-background flex flex-col">
  <header className="h-10 px-3 bg-card border-b border-border flex items-center justify-between font-mono text-xs z-20">
   <div className="flex items-center gap-3">
    <Link to="/loose-screw" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><ArrowLeft size={13}/>looseScrew Lab</Link>
    <span className="text-border">|</span>
    <strong className="text-primary">AI WORKSHOP OS & F.R.A.Y.M.U.S. — J.A.R.V.I.S. Neural Architecture</strong>
    <span className="hidden md:inline text-muted-foreground">φ⁷⁵ Seal = 4721424167835376.00 · 538 Notes · 1,947 Synapses</span>
   </div>
   <div className="flex items-center gap-2">
    <Button size="sm" variant="outline" onClick={popOut} className="h-7 font-mono text-[11px] gap-1"><Maximize2 size={11}/>Pop Out Native Window</Button>
    <a href="https://github.com/eyeoverthink/looseScrew" target="_blank" rel="noopener noreferrer" className="inline-flex h-7 items-center gap-1 rounded border border-primary/50 bg-selection px-2.5 text-[11px] text-primary"><ExternalLink size={11}/>GitHub</a>
   </div>
  </header>
  <iframe title="AI WORKSHOP OS & F.R.A.Y.M.U.S." srcDoc={AI_WORKSHOP_OS_HTML} className="flex-1 w-full border-0"/>
 </div>;
}