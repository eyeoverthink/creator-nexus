import {useState} from 'react';
import {Button} from '@/components/ui/button';

export default function AvatarHostStudio({avatarCanvasRef,customAvatarSrc,onLoadAvatar,speechText,talking,onSpeak,onQuickPitch,logs=[]}){
 const [input,setInput]=useState('');
 const submit=()=>{if(!input.trim())return;onSpeak(input.trim());setInput('');};
 return <aside className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3.5 h-fit">
  <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Brand Host // Voice & Face</div>
  <div className="relative w-full h-[260px] bg-background rounded-lg border-2 border-primary overflow-hidden flex items-center justify-center">
   <div className="absolute top-2.5 left-2.5 z-10 rounded border border-primary bg-background/90 px-2 py-0.5 font-mono text-[11px] text-primary flex items-center gap-1.5">
    <span className="h-2 w-2 rounded-avatar bg-primary animate-pulse"/>
    <span>{talking?'ON AIR // SPEAKING':'HOST STANDBY'}</span>
   </div>
   <canvas ref={avatarCanvasRef} width={64} height={68} className="w-[220px] h-[240px]" style={{imageRendering:'pixelated'}}/>
   {customAvatarSrc&&<img src={customAvatarSrc} alt="EyeOverthink Brand Avatar" className="absolute inset-0 w-full h-full object-contain" style={{imageRendering:'pixelated'}}/>}
  </div>
  <label className="block text-center font-mono text-xs text-muted-foreground border border-dashed border-border py-2 px-3 rounded-md cursor-pointer hover:border-primary hover:text-foreground">
   Drop or Click to Load Raw Avatar PNG
   <input type="file" accept="image/*" className="hidden" onChange={onLoadAvatar}/>
  </label>
  <div className="rounded bg-background border-l-2 border-primary p-3 font-mono text-xs leading-relaxed text-foreground min-h-[64px]">
   "{speechText}"
  </div>
  <div className="flex gap-1.5">
   <input type="text" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit();}} placeholder="Make your avatar say anything..." className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 font-mono text-xs text-foreground"/>
   <Button size="sm" variant="outline" onClick={submit} className="font-mono text-xs">SPEAK</Button>
  </div>
  <div className="grid grid-cols-3 gap-1.5">
   <Button size="sm" variant="outline" onClick={()=>onQuickPitch('INTRO')} className="font-mono text-[11px]">Brand Intro</Button>
   <Button size="sm" variant="outline" onClick={()=>onQuickPitch('REA')} className="font-mono text-[11px]">REA Protocol</Button>
   <Button size="sm" variant="outline" onClick={()=>onQuickPitch('DROP')} className="font-mono text-[11px]">Beat Drop</Button>
  </div>
  <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground pt-1">Akashic Record // Event Stream</div>
  <div className="max-h-44 overflow-y-auto rounded-md border border-border bg-background p-2.5 font-mono text-[11px] text-muted-foreground space-y-1.5">
   {logs.map((entry,idx)=><div key={idx}><span className="text-primary">[{entry.time}]</span> {entry.msg}</div>)}
  </div>
 </aside>;
}