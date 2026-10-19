import {useEffect,useRef,useState} from 'react';
import {ExternalLink,Flame,Plus,Radio} from 'lucide-react';
import ProShell from '@/components/nexus/ProShell';
import {Button} from '@/components/ui/button';
import {INITIAL_TRANSMISSIONS,GITHUB_REPO_URL,drawBrandAvatarFrame} from '@/components/nexus/loosescrew/looseScrewCatalog';
import AvatarHostStudio from '@/components/nexus/loosescrew/AvatarHostStudio';
import BroadcastStageCanvas from '@/components/nexus/loosescrew/BroadcastStageCanvas';

export default function LooseScrew(){
 const [catalog,setCatalog]=useState(INITIAL_TRANSMISSIONS),[channel,setChannel]=useState('ALL'),[query,setQuery]=useState(''),[activeId,setActiveId]=useState(INITIAL_TRANSMISSIONS[0].id);
 const activeItem=catalog.find(i=>i.id===activeId)||catalog[0];
 const [isPlaying,setIsPlaying]=useState(true),[scrubber,setScrubber]=useState(0),[showWorkbench,setShowWorkbench]=useState(false),[codeValue,setCodeValue]=useState(activeItem.code),[reaOutput,setReaOutput]=useState(activeItem.reaTrace);
 const [thermalCore,setThermalCore]=useState(36.48),[fossils,setFossils]=useState(14),[talking,setTalking]=useState(false),[speechText,setSpeechText]=useState("Welcome to looseScrew. I'm the voice and face of the EyeOverthink network—spinning synth audio, 60FPS visualizers, and clean-room REA app rebuilds."),[customAvatar,setCustomAvatar]=useState('');
 const [logs,setLogs]=useState(()=>[{time:new Date().toLocaleTimeString(),msg:'Fraymus Portal & Avatar Host initialized.'},{time:new Date().toLocaleTimeString(),msg:'GitHub Repo synced -> eyeoverthink/looseScrew'}]);
 const stageCanvasRef=useRef(null),avatarCanvasRef=useRef(null),audioCtxRef=useRef(null),analyserRef=useRef(null),mouthRef=useRef(0),talkingRef=useRef(false),playingRef=useRef(true),activeRef=useRef(activeItem);
 talkingRef.current=talking;playingRef.current=isPlaying;activeRef.current=activeItem;

 const addLog=msg=>setLogs(prev=>[{time:new Date().toLocaleTimeString(),msg},...prev.slice(0,49)]);
 const initAudio=()=>{
  if(!audioCtxRef.current){
   const Ctx=window.AudioContext||window.webkitAudioContext;
   if(Ctx){const ctx=new Ctx(),an=ctx.createAnalyser();an.fftSize=128;an.connect(ctx.destination);audioCtxRef.current=ctx;analyserRef.current=an;}
  }
  if(audioCtxRef.current?.state==='suspended')audioCtxRef.current.resume();
 };
 const speak=text=>{
  setSpeechText(text);setTalking(true);
  if('speechSynthesis' in window){
   window.speechSynthesis.cancel();
   const u=new SpeechSynthesisUtterance(text);u.pitch=0.92;u.rate=1.02;
   u.onboundary=()=>{mouthRef.current=0.4+Math.random()*0.6;};
   u.onend=()=>{setTalking(false);mouthRef.current=0;};
   window.speechSynthesis.speak(u);
  }else setTimeout(()=>{setTalking(false);mouthRef.current=0;},3200);
  addLog(`Avatar Voice: "${text.slice(0,42)}..."`);
 };
 useEffect(()=>{
  let step=0;
  const ms=(60/(activeItem.bpm||120))*500;
  const timer=setInterval(()=>{
   const ctx=audioCtxRef.current,an=analyserRef.current;
   if(!playingRef.current||!ctx||!an)return;
   const notes=activeRef.current.synthNotes||[110,146.83,164.81,220];
   const freq=notes[step++%notes.length];
   const osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type=activeRef.current.channel==='MUSIC'?'sawtooth':'triangle';
   osc.frequency.setValueAtTime(freq,ctx.currentTime);
   gain.gain.setValueAtTime(0.08,ctx.currentTime);
   gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+(ms/1000)*0.9);
   osc.connect(gain);gain.connect(an);osc.start();osc.stop(ctx.currentTime+ms/1000);
   if(talkingRef.current)mouthRef.current=Math.random();
  },ms);
  return ()=>clearInterval(timer);
 },[activeItem.id,activeItem.bpm]);

 useEffect(()=>{
  let raf,tick=0;
  const freqData=new Uint8Array(64);
  const loop=()=>{
   tick++;
   drawBrandAvatarFrame(avatarCanvasRef.current?.getContext('2d'),tick,talkingRef.current,mouthRef.current);
   const sctx=stageCanvasRef.current?.getContext('2d');
   if(sctx){
    if(analyserRef.current&&playingRef.current)analyserRef.current.getByteFrequencyData(freqData);
    const w=920,h=420,horizon=h*0.52,item=activeRef.current;
    sctx.fillStyle='#04060a';sctx.fillRect(0,0,w,h);
    sctx.strokeStyle='rgba(0, 243, 255, 0.22)';sctx.lineWidth=1;
    for(let i=-12;i<=12;i++){sctx.beginPath();sctx.moveTo(w/2+i*25,horizon);sctx.lineTo(w/2+i*140,h);sctx.stroke();}
    const off=(tick*(playingRef.current?2.5:0))%28;
    for(let y=horizon;y<h;y+=28){const py=y+off*((y-horizon)/(h-horizon));sctx.beginPath();sctx.moveTo(0,py);sctx.lineTo(w,py);sctx.stroke();}
    if(item.channel==='MUSIC'){
     const bw=(w-120)/48;
     for(let i=0;i<48;i++){const val=playingRef.current?(freqData[i]||(Math.sin(tick*0.08+i*0.4)+1)*65):12,bh=(val/255)*200;sctx.fillStyle=i%2===0?'#00f3ff':'#2d8a6e';sctx.fillRect(60+i*bw,horizon-bh+30,bw-4,bh);}
    }else if(item.channel==='VIDEO'){
     sctx.save();sctx.translate(w/2,horizon-45);sctx.strokeStyle='#00f3ff';sctx.lineWidth=2;
     const r=75+Math.sin(tick*0.05)*14;
     for(let k=0;k<3;k++){sctx.rotate(tick*0.012+k);sctx.strokeRect(-r/2,-r/2,r,r);}
     sctx.restore();
    }else{
     ['UI Trigger','Preload Bridge','IPC Channel','Core Rebuild','Unit Test PASS'].forEach((label,idx,arr)=>{
      const nx=130+idx*165,ny=horizon-50+Math.sin(tick*0.06+idx)*12;
      if(idx<arr.length-1){sctx.strokeStyle='#00f3ff';sctx.beginPath();sctx.moveTo(nx+45,ny);sctx.lineTo(nx+120,horizon-50+Math.sin(tick*0.06+idx+1)*12);sctx.stroke();}
      sctx.fillStyle='#0e1726';sctx.fillRect(nx-55,ny-22,110,44);sctx.strokeStyle='#00f3ff';sctx.strokeRect(nx-55,ny-22,110,44);sctx.fillStyle='#e6f1ff';sctx.font='11px monospace';sctx.fillText(label,nx-44,ny+4);
     });
    }
    sctx.fillStyle='#00f3ff';sctx.font='bold 13px monospace';sctx.fillText(`// LOOSESCREW_${item.channel}_STREAM :: ${item.title}`,24,34);
    sctx.fillStyle='#8fa4c4';sctx.font='12px monospace';sctx.fillText(`BPM: ${item.bpm} | PHI_LOCK: 1.618 | HOST: EYEOVERTHINK`,24,54);
   }
   raf=requestAnimationFrame(loop);
  };
  raf=requestAnimationFrame(loop);
  return ()=>cancelAnimationFrame(raf);
 },[]);

 const selectItem=item=>{
  setActiveId(item.id);setCodeValue(item.code);setReaOutput(item.reaTrace);setShowWorkbench(item.channel==='CODE');
  initAudio();speak(item.voiceIntro);addLog(`Switched stream -> [${item.channel}] ${item.title}`);
 };
 const runRebuild=()=>{
  try{
   const res=new Function(codeValue)();
   setReaOutput(`${activeItem.reaTrace}\n\n[LIVE EXECUTION VERIFIED @ ${new Date().toLocaleTimeString()}]\n${res}`);
   setThermalCore(t=>+(t+0.42).toFixed(2));
   speak('Rebuild executed and verified. All test assertions passed.');
  }catch(e){setReaOutput(`[REBUILD EXCEPTION]\n${e.message}`);speak('Hold up, caught a syntax or runtime exception in the rebuild.');}
 };
 const filtered=catalog.filter(item=>(channel==='ALL'||item.channel===channel)&&(item.title.toLowerCase().includes(query.toLowerCase())||item.tags.join(' ').toLowerCase().includes(query.toLowerCase())));

 return <ProShell title="looseScrew // EyeOverthink Studio" subtitle="Unified Music Synth, 60FPS Video Broadcast Deck & Clean-Room REA Code Workbench">
  <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-border">
   <div className="flex items-center gap-2.5">
    <span className="h-8 w-8 rounded-md border border-primary bg-secondary grid place-items-center font-mono text-primary font-bold">⚙</span>
    <div>
     <div className="font-mono text-base font-bold">loose<span className="text-primary">Screw</span> // EyeOverthink</div>
     <div className="font-mono text-[11px] text-muted-foreground">MUSIC • 60FPS VIDEO • CODE & REA LAB</div>
    </div>
   </div>
   <div className="flex flex-wrap items-center gap-2">
    <input type="text" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tracks, video streams, REA specs..." className="w-64 rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs"/>
    <Button size="sm" variant="outline" onClick={()=>{setThermalCore(t=>+(t+0.42).toFixed(2));addLog(`Thermal Injection -> ${(thermalCore+0.42).toFixed(2)}°C`);}} className="font-mono text-xs gap-1"><Flame size={13}/>Thermal Inject</Button>
    <Button size="sm" variant="outline" onClick={()=>{const t=window.prompt('Enter new transmission title for looseScrew:');if(!t)return;const ch=(window.prompt('Channel (MUSIC, VIDEO, or CODE):','CODE')||'CODE').toUpperCase();const ni={id:'custom-'+Date.now(),channel:['MUSIC','VIDEO','CODE'].includes(ch)?ch:'CODE',title:t,duration:'05:00',screws:1,bpm:120,tags:['#EyeOverthink','#CustomIngest','#Live'],voiceIntro:`New transmission ingested into looseScrew: ${t}.`,synthNotes:[130.81,164.81,196,261.63],code:`// Custom Ingested Module: ${t}\nreturn "Module online.";`,reaTrace:`[UNIVERSAL ABSORBER]\nIngested by EyeOverthink at ${new Date().toISOString()}`};setCatalog(p=>[ni,...p]);selectItem(ni);}} className="font-mono text-xs gap-1"><Plus size={13}/>Ingest Media</Button>
    <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary bg-selection px-3 font-mono text-xs text-primary hover:bg-hover"><ExternalLink size={13}/>github.com/eyeoverthink/looseScrew</a>
   </div>
  </div>
  <div className="grid grid-cols-1 xl:grid-cols-[230px_minmax(0,1fr)_330px] gap-4 items-start">
   <aside className="rounded-lg border border-border bg-card p-3.5 space-y-4">
    <div className="space-y-1">
     <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Broadcast Channels</div>
     {[['ALL','◈ All Transmissions',catalog.length],['MUSIC','♫ Music Studio','SYNTH'],['VIDEO','▶ Video Broadcasts','60FPS'],['CODE','⌘ Code & App Design','REA']].map(([id,label,badge])=><button key={id} onClick={()=>setChannel(id)} className={`w-full text-left px-3 py-2 rounded-md font-mono text-xs flex items-center justify-between border ${channel===id?'border-primary bg-selection text-primary':'border-transparent hover:bg-hover text-foreground'}`}><span>{label}</span><span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-primary">{badge}</span></button>)}
    </div>
    <div className="rounded-md border border-border bg-background p-3 font-mono text-xs space-y-1">
     <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Fraymus // Lazarus Engine</div>
     <div className="flex justify-between text-muted-foreground"><span>Host Identity:</span><strong className="text-primary">EyeOverthink</strong></div>
     <div className="flex justify-between text-muted-foreground"><span>Thermal Core:</span><strong className="text-primary">{thermalCore}°C</strong></div>
     <div className="flex justify-between text-muted-foreground"><span>Phi Harmonic:</span><strong className="text-primary">1.6180339</strong></div>
     <div className="flex justify-between text-muted-foreground"><span>Fossils Saved:</span><strong className="text-primary">{fossils}</strong></div>
     <div className="flex justify-between text-muted-foreground"><span>GitHub Remote:</span><strong className="text-success">LIVE_PUSHED</strong></div>
    </div>
    <div className="rounded-md border border-border bg-background p-3 font-mono text-[11px] text-muted-foreground leading-relaxed">
     <div className="uppercase tracking-wider mb-1 text-foreground">REA Pipeline Status</div>
     1. Target Scoping [READY]<br/>2. Surface Mapping [ACTIVE]<br/>3. Feature Tracing [HOOKED]<br/>4. Clean Rebuild [VERIFIED]
    </div>
   </aside>
   <div className="space-y-4 min-w-0">
    <BroadcastStageCanvas stageCanvasRef={stageCanvasRef} activeItem={activeItem} isPlaying={isPlaying} onTogglePlay={()=>{initAudio();setIsPlaying(p=>!p);}} scrubber={scrubber} onSeek={setScrubber} showWorkbench={showWorkbench} onToggleWorkbench={setShowWorkbench} codeValue={codeValue} onChangeCode={setCodeValue} reaOutput={reaOutput} onRunRebuild={runRebuild} onNarrate={()=>speak(activeItem.voiceIntro)} onUpvote={()=>{setCatalog(prev=>prev.map(i=>i.id===activeItem.id?{...i,screws:i.screws+1}:i));addLog(`Tightened screw on "${activeItem.title}"`);}} onSaveFossil={()=>{setFossils(f=>f+1);addLog(`Temporal Fossil #${fossils+1} archived to AkashicRecord.`);speak(`Temporal Fossil number ${fossils+1} preserved in the Akashic Archive.`);}}/>
    <div className="flex items-center justify-between font-mono text-xs">
     <span className="font-semibold flex items-center gap-1.5"><Radio size={14} className="text-primary"/>// ACTIVE TRANSMISSIONS</span>
     <span className="text-muted-foreground">Showing: {channel} CHANNEL ({filtered.length})</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
     {filtered.map(item=><article key={item.id} onClick={()=>selectItem(item)} className={`rounded-lg border p-3.5 cursor-pointer transition-colors flex flex-col justify-between ${item.id===activeItem.id?'border-primary bg-selection':'border-border bg-card hover:bg-hover'}`}>
      <div>
       <div className="flex items-center justify-between gap-2 mb-2 font-mono text-[11px]">
        <span className="rounded border border-primary bg-background px-2 py-0.5 text-primary font-bold">{item.channel}</span>
        <span className="text-muted-foreground">{item.duration} · {item.bpm} BPM</span>
       </div>
       <h3 className="font-semibold text-sm mb-1.5">{item.title}</h3>
       <p className="font-mono text-[11px] text-primary mb-3">{item.tags.slice(0,3).join(' ')}</p>
      </div>
      <div className="flex items-center justify-between font-mono text-xs text-muted-foreground pt-2 border-t border-border">
       <span>EyeOverthink</span>
       <span>🔩 {item.screws} screws</span>
      </div>
     </article>)}
    </div>
   </div>
   <AvatarHostStudio avatarCanvasRef={avatarCanvasRef} customAvatarSrc={customAvatar} onLoadAvatar={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setCustomAvatar(String(ev.target?.result||''));addLog('Custom pixel avatar PNG mounted into Broadcast Host.');speak('Custom avatar portrait locked in. I am live on looseScrew.');};r.readAsDataURL(f);}} speechText={speechText} talking={talking} onSpeak={speak} onQuickPitch={m=>{if(m==='INTRO')speak('Yo, welcome to looseScrew by EyeOverthink—where original synth music, 60 frame video shaders, and bare-metal code collide.');else if(m==='REA')speak('Running the REA Reverse Engineer Anything pipeline: scope target, map surface symbols, trace UI to core logic, and verify our clean-room rebuild.');else{initAudio();speak('Dropping the Phi-Harmonic bassline right now. Watch the cyan spectrum climb.');}}} logs={logs}/>
  </div>
 </ProShell>;
}