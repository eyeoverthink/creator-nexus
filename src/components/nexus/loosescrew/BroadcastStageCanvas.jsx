import {useEffect,useState} from 'react';
import {ExternalLink,Maximize2,Save,Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {base44} from '@/api/base44Client';
import {extractYouTubeId,isAudioUrl,isVideoUrl} from '@/components/nexus/loosescrew/looseScrewCatalog';

export default function BroadcastStageCanvas({stageCanvasRef,audioElRef,activeItem,isPlaying,onTogglePlay,scrubber,onSeek,viewMode,onChangeViewMode,codeValue,onChangeCode,appHtmlValue,onChangeAppHtml,reaOutput,onRunRebuild,onSaveEdits,onDeleteItem,onNarrate,onUpvote,onSaveFossil}){
 const [signedUrl,setSignedUrl]=useState(''),[editorTab,setEditorTab]=useState('APP_HTML');
 useEffect(()=>{
  let cancelled=false;
  if(!activeItem.file_uri){setSignedUrl('');return;}
  base44.integrations.Core.CreateFileSignedUrl({file_uri:activeItem.file_uri,expires_in:3600}).then(r=>{if(!cancelled)setSignedUrl(r.signed_url||'');}).catch(()=>{if(!cancelled)setSignedUrl('');});
  return ()=>{cancelled=true;};
 },[activeItem.file_uri]);

 const resolvedMediaUrl=signedUrl||activeItem.media_url||'';
 const ytId=extractYouTubeId(resolvedMediaUrl||activeItem.external_link);
 const hasRealAudio=isAudioUrl(resolvedMediaUrl,activeItem.mime_type);
 const hasRealVideo=isVideoUrl(resolvedMediaUrl,activeItem.mime_type);
 const mins=Math.floor((scrubber/100)*4),secs=String(Math.floor(((scrubber/100)*260)%60)).padStart(2,'0');

 const popOutApp=()=>{
  const win=window.open('','_blank');
  if(!win)return;
  win.document.open();
  win.document.write(appHtmlValue||`<!DOCTYPE html><html><body style="background:#05070a;color:#00f3ff;font-family:monospace;padding:20px"><script>${codeValue}<\/script></body></html>`);
  win.document.close();
 };

 return <section className="rounded-lg border border-border bg-card overflow-hidden">
  <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-background border-b border-border font-mono text-xs">
   <div className="flex flex-wrap items-center gap-1.5">
    {[['STAGE','◈ 60FPS Stage'],['LIVE_APP','⚡ Live Interactive App'],['MEDIA','▶ Real Media / Link'],['IDE','⌘ Code & REA IDE']].map(([id,label])=><button key={id} type="button" onClick={()=>onChangeViewMode(id)} className={`px-2.5 py-1 rounded border text-[11px] ${viewMode===id?'border-primary bg-selection text-primary font-bold':'border-border bg-secondary text-muted-foreground hover:text-foreground'}`}>{label}</button>)}
   </div>
   <div className="flex items-center gap-2">
    {!!appHtmlValue&&<Button size="sm" variant="outline" onClick={popOutApp} className="h-7 font-mono text-[11px] gap-1"><Maximize2 size={12}/>Pop Out Un-Sandboxed Window</Button>}
    {activeItem.external_link&&<a href={activeItem.external_link} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 items-center gap-1 rounded border border-primary/60 bg-selection px-2.5 text-[11px] text-primary hover:bg-hover"><ExternalLink size={11}/>Open Link</a>}
   </div>
  </div>

  <div className="relative w-full h-[440px] bg-background flex items-center justify-center">
   <canvas ref={stageCanvasRef} width={920} height={440} className={`w-full h-full ${viewMode==='STAGE'?'block':'hidden'}`}/>

   {viewMode==='LIVE_APP'&&<div className="w-full h-full bg-background">
    {appHtmlValue?<iframe title={activeItem.title} srcDoc={appHtmlValue} className="w-full h-full border-0"/>:<div className="h-full flex flex-col items-center justify-center gap-2 font-mono text-xs text-muted-foreground p-6 text-center"><p>No custom HTML app attached yet.</p><Button size="sm" variant="outline" onClick={()=>onChangeViewMode('IDE')}>Open Code IDE or use Autonomous Forge above</Button></div>}
   </div>}

   {viewMode==='MEDIA'&&<div className="w-full h-full bg-background flex flex-col items-center justify-center p-4">
    {ytId?<iframe title={activeItem.title} src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded border border-border"/>:hasRealVideo?<video src={resolvedMediaUrl} controls autoPlay className="max-h-full max-w-full rounded"/>:hasRealAudio?<div className="text-center space-y-3 font-mono"><p className="text-sm text-primary">♫ Playing Real Audio Stream: {activeItem.title}</p><p className="text-xs text-muted-foreground">Use the audio deck bar below to scrub or switch to 60FPS Stage to see the live FFT spectrum.</p></div>:resolvedMediaUrl?<iframe title={activeItem.title} src={resolvedMediaUrl} className="w-full h-full border-0 rounded"/>:<p className="font-mono text-xs text-muted-foreground">Attach an MP3/MP4 upload, YouTube URL, or web link via "+ Ingest Media" to play real media here.</p>}
   </div>}

   {viewMode==='IDE'&&<div className="absolute inset-0 bg-background grid grid-cols-1 md:grid-cols-2 border-b border-border">
    <div className="flex flex-col border-r border-border p-3 overflow-hidden">
     <div className="flex flex-wrap items-center justify-between gap-1 font-mono text-xs text-primary pb-2 mb-2 border-b border-border">
      <div className="flex gap-1">
       <button type="button" onClick={()=>setEditorTab('APP_HTML')} className={`px-2 py-0.5 rounded text-[11px] ${editorTab==='APP_HTML'?'bg-primary text-primary-foreground':'bg-secondary text-foreground'}`}>Full App HTML/JS</button>
       <button type="button" onClick={()=>setEditorTab('JS_MODULE')} className={`px-2 py-0.5 rounded text-[11px] ${editorTab==='JS_MODULE'?'bg-primary text-primary-foreground':'bg-secondary text-foreground'}`}>REA Verify JS</button>
      </div>
      <div className="flex gap-1">
       <Button size="sm" variant="outline" onClick={onSaveEdits} className="h-7 font-mono text-[11px] gap-1"><Save size={11}/>Save</Button>
       <Button size="sm" variant="outline" onClick={onRunRebuild} className="h-7 font-mono text-[11px]">▶ Run & Verify</Button>
      </div>
     </div>
     {editorTab==='APP_HTML'?<textarea value={appHtmlValue} onChange={e=>onChangeAppHtml(e.target.value)} spellCheck={false} placeholder="<!DOCTYPE html><html>...Write full un-sandboxed HTML/CSS/JS app here...</html>" className="flex-1 w-full rounded-md border border-border bg-secondary p-2.5 font-mono text-xs leading-relaxed text-foreground resize-none focus-visible:outline-none"/>:<textarea value={codeValue} onChange={e=>onChangeCode(e.target.value)} spellCheck={false} className="flex-1 w-full rounded-md border border-border bg-secondary p-2.5 font-mono text-xs leading-relaxed text-foreground resize-none focus-visible:outline-none"/>}
    </div>
    <div className="flex flex-col p-3 overflow-hidden">
     <div className="flex items-center justify-between font-mono text-xs text-primary pb-2 mb-2 border-b border-border">
      <span>Live App Preview & REA Trace</span>
      <Button size="sm" variant="outline" onClick={()=>onChangeViewMode('LIVE_APP')} className="h-7 font-mono text-[11px]">Full Stage App</Button>
     </div>
     {editorTab==='APP_HTML'&&appHtmlValue?<iframe title="Live IDE Preview" srcDoc={appHtmlValue} className="flex-1 w-full rounded-md border border-border bg-background"/>:<pre className="flex-1 overflow-y-auto rounded-md border border-border bg-secondary p-2.5 font-mono text-xs text-foreground whitespace-pre-wrap">{reaOutput}</pre>}
    </div>
   </div>}
  </div>

  {hasRealAudio&&<div className="px-4 py-2 bg-secondary/70 border-t border-border flex items-center gap-3 font-mono text-xs">
   <span className="text-primary font-bold">REAL AUDIO DECK:</span>
   <audio ref={audioElRef} src={resolvedMediaUrl} crossOrigin="anonymous" controls className="h-8 flex-1"/>
  </div>}

  <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-background border-t border-border font-mono text-xs">
   <Button size="sm" variant="outline" onClick={onTogglePlay} className="font-mono text-xs">{isPlaying?'⏸ PAUSE':'▶ PLAY'}</Button>
   <span className="text-muted-foreground">0{mins}:{secs} / {activeItem.duration||'LIVE'}</span>
   <input type="range" min={0} max={100} value={scrubber} onChange={e=>onSeek(Number(e.target.value))} className="flex-1 accent-primary cursor-pointer"/>
   <Button size="sm" variant="outline" onClick={onNarrate} className="font-mono text-xs">🔊 Avatar Explain</Button>
  </div>

  <div className="p-4 flex flex-wrap items-start justify-between gap-4">
   <div>
    <h2 className="text-lg font-semibold mb-1">{activeItem.title}</h2>
    <div className="flex flex-wrap gap-2 font-mono text-xs text-primary">{(activeItem.tags||[]).map(t=><span key={t}>{t}</span>)}</div>
   </div>
   <div className="flex flex-wrap items-center gap-2">
    <Button size="sm" variant="outline" onClick={onUpvote} className="font-mono text-xs">🔩 Tighten Screw ({activeItem.screws||1})</Button>
    <Button size="sm" variant="outline" onClick={onSaveFossil} className="font-mono text-xs">🧬 Archive Fossil</Button>
    {onDeleteItem&&<Button size="sm" variant="outline" onClick={onDeleteItem} className="font-mono text-xs text-destructive"><Trash2 size={13}/></Button>}
   </div>
  </div>
 </section>;
}