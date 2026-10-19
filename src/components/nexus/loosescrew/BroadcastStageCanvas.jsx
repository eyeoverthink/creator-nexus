import {Button} from '@/components/ui/button';

export default function BroadcastStageCanvas({stageCanvasRef,activeItem,isPlaying,onTogglePlay,scrubber,onSeek,showWorkbench,onToggleWorkbench,codeValue,onChangeCode,reaOutput,onRunRebuild,onNarrate,onUpvote,onSaveFossil}){
 const mins=Math.floor((scrubber/100)*4),secs=String(Math.floor(((scrubber/100)*260)%60)).padStart(2,'0');
 return <section className="rounded-lg border border-border bg-card overflow-hidden">
  <div className="relative w-full h-[420px] bg-background flex items-center justify-center">
   <canvas ref={stageCanvasRef} width={920} height={420} className="w-full h-full block"/>
   {showWorkbench&&<div className="absolute inset-0 bg-background/95 grid grid-cols-1 md:grid-cols-2 border-b border-border">
    <div className="flex flex-col border-r border-border p-3 overflow-hidden">
     <div className="flex items-center justify-between font-mono text-xs text-primary pb-2 mb-2 border-b border-border">
      <span>{activeItem.id}_rebuild.js</span>
      <Button size="sm" variant="outline" onClick={onRunRebuild} className="h-7 font-mono text-xs">▶ Run & Verify Rebuild</Button>
     </div>
     <textarea value={codeValue} onChange={e=>onChangeCode(e.target.value)} spellCheck={false} className="flex-1 w-full rounded-md border border-border bg-secondary p-2.5 font-mono text-xs leading-relaxed text-foreground resize-none focus-visible:outline-none"/>
    </div>
    <div className="flex flex-col p-3 overflow-hidden">
     <div className="flex items-center justify-between font-mono text-xs text-primary pb-2 mb-2 border-b border-border">
      <span>REA Evidence Log & Verification Output</span>
      <Button size="sm" variant="outline" onClick={()=>onToggleWorkbench(false)} className="h-7 font-mono text-xs">Close IDE</Button>
     </div>
     <pre className="flex-1 overflow-y-auto rounded-md border border-border bg-secondary p-2.5 font-mono text-xs text-foreground whitespace-pre-wrap">{reaOutput}</pre>
    </div>
   </div>}
  </div>
  <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-background border-t border-border font-mono text-xs">
   <Button size="sm" variant="outline" onClick={onTogglePlay} className="font-mono text-xs">{isPlaying?'⏸ PAUSE':'▶ PLAY'}</Button>
   <span className="text-muted-foreground">0{mins}:{secs} / {activeItem.duration}</span>
   <input type="range" min={0} max={100} value={scrubber} onChange={e=>onSeek(Number(e.target.value))} className="flex-1 accent-primary cursor-pointer"/>
   <Button size="sm" variant={showWorkbench?'default':'outline'} onClick={()=>onToggleWorkbench(!showWorkbench)} className="font-mono text-xs">⌘ Toggle Code/REA IDE</Button>
   <Button size="sm" variant="outline" onClick={onNarrate} className="font-mono text-xs">🔊 Avatar Explain</Button>
  </div>
  <div className="p-4 flex flex-wrap items-start justify-between gap-4">
   <div>
    <h2 className="text-lg font-semibold mb-1">{activeItem.title}</h2>
    <div className="flex flex-wrap gap-2 font-mono text-xs text-primary">{activeItem.tags.map(t=><span key={t}>{t}</span>)}</div>
   </div>
   <div className="flex items-center gap-2">
    <Button size="sm" variant="outline" onClick={onUpvote} className="font-mono text-xs">🔩 Tighten Screw ({activeItem.screws})</Button>
    <Button size="sm" variant="outline" onClick={onSaveFossil} className="font-mono text-xs">🧬 Archive Fossil</Button>
   </div>
  </div>
 </section>;
}