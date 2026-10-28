import {useEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import OptionChips from '@/components/nexus/studiotools/OptionChips';
import {STYLES,CARD_TYPES,buildCards,timeline} from '@/components/nexus/studiotools/hyperframes/cards';
import {drawFrame} from '@/components/nexus/studiotools/hyperframes/drawCard';
import {renderVideo} from '@/components/nexus/studiotools/hyperframes/renderVideo';
import {field,invoke,saveBlobToLibrary,toolError} from '@/components/nexus/studiotools/toolKit';
const FORMATS=[{id:'portrait',label:'9:16 Short',note:'720×1280'},{id:'landscape',label:'16:9 Wide',note:'1280×720'}];
export default function BrowserHyperFrames({workspace,handoff}){
 const canvas=useRef(null),abort=useRef(null);
 const [text,setText]=useState(''),[style,setStyle]=useState('midnight'),[format,setFormat]=useState('portrait'),[voice,setVoice]=useState('none'),[types,setTypes]=useState({});
 const [status,setStatus]=useState(''),[progress,setProgress]=useState(0),[error,setError]=useState(''),[video,setVideo]=useState(null),[saved,setSaved]=useState('');
 useEffect(()=>{if(handoff?.text)setText(handoff.text.slice(0,1500));},[handoff?.at]);
 const cards=useMemo(()=>buildCards(text).map(c=>({...c,card_type:types[c.index]||c.card_type})),[text,types]);
 const [W,H]=format==='portrait'?[720,1280]:[1280,720];
 useEffect(()=>{if(canvas.current&&cards.length&&!status)drawFrame(canvas.current.getContext('2d'),W,H,STYLES[style],timeline(cards),0.8);},[cards,style,W,H,status]);
 const render=async()=>{
  const audioCtx=voice==='none'?null:new AudioContext();abort.current=new AbortController();setError('');setSaved('');setVideo(null);
  try{
   let buffer=null;
   if(audioCtx){setStatus('Generating narration…');const r=await invoke('voiceStudio',{action:'speak',text,voice,workspace_id:workspace.id,title:`HyperFrames narration · ${text.slice(0,50)}`});buffer=await audioCtx.decodeAudioData(await (await fetch(r.signed_url)).arrayBuffer());}
   setStatus('Rendering… keep this tab open');
   const out=await renderVideo({canvas:canvas.current,cards:timeline(cards,buffer?.duration),style:STYLES[style],audioCtx,audioBuffer:buffer,onProgress:setProgress,signal:abort.current.signal});
   setVideo({...out,url:URL.createObjectURL(out.blob)});
  }catch(e){setError(toolError(e));}finally{setStatus('');setProgress(0);audioCtx?.close();}
 };
 const save=async()=>{try{await saveBlobToLibrary({workspace,blob:video.blob,fileName:`hyperframes-${style}-${Date.now()}.${video.ext}`,title:`HyperFrames · ${text.slice(0,60)}`,project:'HyperFrames',body:text});setSaved('Saved to your Library (stored privately).');}catch(e){setError(toolError(e));}};
 return <div className="space-y-4">
  <label className="block text-xs text-muted-foreground">Script (each sentence becomes a motion card)<textarea rows={5} maxLength={1500} value={text} onChange={e=>{setText(e.target.value);setTypes({});}} className={field} disabled={!!status}/></label>
  <div className="flex flex-wrap gap-4"><OptionChips label="Style" value={style} onChange={setStyle} options={Object.keys(STYLES).map(id=>({id,label:id[0].toUpperCase()+id.slice(1)}))}/><OptionChips label="Format" value={format} onChange={setFormat} options={FORMATS}/>
   <label className="text-xs text-muted-foreground">Narration<select value={voice} onChange={e=>setVoice(e.target.value)} className={field}><option value="none">No voice (silent)</option>{['river','honey','sunny','storm','spark'].map(v=><option key={v} value={v}>Built-in voice: {v} (uses credits)</option>)}</select></label></div>
  {cards.length>0&&<ol className="grid sm:grid-cols-2 gap-2">{cards.map(c=><li key={c.index} className="rounded border border-border bg-card p-2 text-xs space-y-1"><select aria-label={`Card ${c.index} type`} value={c.card_type} disabled={!!status} onChange={e=>setTypes(t=>({...t,[c.index]:e.target.value}))} className="rounded border border-input bg-background p-1">{CARD_TYPES.map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}</select><p>{c.text}</p></li>)}</ol>}
  <div className="flex flex-wrap items-center gap-2"><Button disabled={!cards.length||!!status} onClick={render}>Render video</Button>{status&&<Button variant="outline" onClick={()=>abort.current?.abort()}>Cancel</Button>}{status&&<span role="status" className="text-sm text-muted-foreground">{status} {progress?`${Math.round(progress*100)}%`:''}</span>}</div>
  {error&&<p role="alert" className="text-destructive text-sm">{error}</p>}
  <div className="grid lg:grid-cols-2 gap-4"><canvas ref={canvas} width={W} height={H} className="w-full max-h-[520px] object-contain rounded border border-border bg-card"/>{video&&<div className="space-y-2"><video controls src={video.url} className="w-full max-h-[520px] rounded border border-border"/><div className="flex gap-2"><Button variant="outline" asChild><a href={video.url} download={`hyperframes.${video.ext}`}>Download {video.ext.toUpperCase()}</a></Button><Button variant="outline" onClick={save}>Save to Library</Button></div>{saved&&<p role="status" className="text-sm text-muted-foreground">{saved}</p>}</div>}</div>
 </div>;
}