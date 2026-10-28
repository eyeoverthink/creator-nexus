import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {FraymusEngine,VIEW_W,VIEW_H} from '@/components/nexus/architecture/fraymusEngine/fraymusEngine';
import FraymusEngineHud from '@/components/nexus/architecture/FraymusEngineHud';

export default function FraymusEngineViewport(){
 const canvas=useRef(null),engine=useRef(null);
 const [stats,setStats]=useState(null);
 const [error,setError]=useState('');

 useEffect(()=>{
  const el=canvas.current;
  let eng;
  try{eng=new FraymusEngine(el);}catch(e){setError(e.message);return undefined;}
  engine.current=eng;
  eng.start();
  const inp=eng.input;
  let last=null;
  const onWheel=e=>{e.preventDefault();inp.scrollY-=e.deltaY*(e.deltaMode===1?33:1)/100;};
  const onDown=e=>{
   if(e.button!==0&&e.button!==1)return;
   e.preventDefault();
   inp.dragging=true;last=[e.clientX,e.clientY];
   el.setPointerCapture(e.pointerId);
  };
  const onMove=e=>{
   if(!inp.dragging||!last)return;
   const scale=VIEW_W/el.clientWidth;
   inp.dx+=(e.clientX-last[0])*scale;inp.dy+=(e.clientY-last[1])*scale;
   last=[e.clientX,e.clientY];
  };
  const onUp=()=>{inp.dragging=false;last=null;};
  el.addEventListener('wheel',onWheel,{passive:false});
  el.addEventListener('pointerdown',onDown);
  el.addEventListener('pointermove',onMove);
  el.addEventListener('pointerup',onUp);
  el.addEventListener('pointercancel',onUp);
  const timer=setInterval(()=>setStats(eng.snapshot()),500);
  return()=>{
   clearInterval(timer);
   el.removeEventListener('wheel',onWheel);
   el.removeEventListener('pointerdown',onDown);
   el.removeEventListener('pointermove',onMove);
   el.removeEventListener('pointerup',onUp);
   el.removeEventListener('pointercancel',onUp);
   eng.dispose();
   engine.current=null;
  };
 },[]);

 if(error)return <p role="alert" className="text-destructive text-sm">{error}</p>;
 return <section className="space-y-3">
  <canvas ref={canvas} width={VIEW_W} height={VIEW_H} className="w-full aspect-video rounded border border-border bg-black touch-none cursor-grab" aria-label="Fraymus Engine V2 PhiWorld arena"/>
  <div className="flex flex-wrap items-center gap-2">
   <Button variant="outline" onClick={()=>engine.current?.restart()}>Restart with new seed</Button>
   <Button variant="outline" onClick={()=>engine.current?.resetView()}>Reset view</Button>
   <span className="text-xs text-muted-foreground">Scroll to zoom, drag to pan.</span>
  </div>
  <FraymusEngineHud stats={stats}/>
 </section>;
}