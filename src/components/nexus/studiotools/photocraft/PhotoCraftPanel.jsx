import {useState} from 'react';
import {Button} from '@/components/ui/button';
import OptionChips from '@/components/nexus/studiotools/OptionChips';
import LibraryMediaPicker from '@/components/nexus/studiotools/LibraryMediaPicker';
import PhotoControls from '@/components/nexus/studiotools/photocraft/PhotoControls';
import {BASE,PRESETS,loadImage,applyEdits,exportBlob} from '@/components/nexus/studiotools/photocraft/photoOps';
import {saveBlobToLibrary,toolError} from '@/components/nexus/studiotools/toolKit';
const kb=n=>`${(n/1024).toFixed(0)} KB`;
export default function PhotoCraftPanel({workspace}){
 const [src,setSrc]=useState(null),[preset,setPreset]=useState('cover_ready'),[s,setS]=useState({...BASE,...PRESETS[0].settings});
 const [out,setOut]=useState(null),[busy,setBusy]=useState(''),[error,setError]=useState(''),[saved,setSaved]=useState('');
 const choose=async(source,name)=>{setError('');setOut(null);setSaved('');try{const {bitmap,blob}=await loadImage(source);setSrc({bitmap,name:name.replace(/\.[^.]+$/,''),preview:URL.createObjectURL(blob),size:blob.size});}catch{setError('That file could not be opened as an image.');}};
 const pickPreset=id=>{setPreset(id);setS({...BASE,...PRESETS.find(p=>p.id===id).settings});};
 const apply=async()=>{setBusy('apply');setError('');setSaved('');await new Promise(r=>setTimeout(r,30));try{const c=applyEdits(src.bitmap,s);const blob=await exportBlob(c,s.format,s.quality);setOut({blob,url:URL.createObjectURL(blob),w:c.width,h:c.height});}catch(e){setError(toolError(e));}finally{setBusy('');}};
 const ext=out?.blob.type.split('/')[1]?.replace('jpeg','jpg')||'png';
 const save=async()=>{setBusy('save');setError('');try{await saveBlobToLibrary({workspace,blob:out.blob,fileName:`${src.name}-photocraft.${ext}`,title:`PhotoCraft · ${src.name}`,project:'PhotoCraft'});setSaved('Saved to your Library (stored privately).');}catch(e){setError(toolError(e));}finally{setBusy('');}};
 return <section className="space-y-4">
  <div className="grid md:grid-cols-2 gap-3"><label className="block text-xs text-muted-foreground">Image from your computer<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)choose(f,f.name);e.target.value='';}} className="mt-1 block w-full text-sm"/></label><LibraryMediaPicker kind="image" onPick={p=>choose(p.url,p.name)}/></div>
  <OptionChips label="Preset" value={preset} onChange={pickPreset} options={PRESETS.map(p=>({id:p.id,label:p.label,note:p.desc}))}/>
  <PhotoControls s={s} set={v=>setS(x=>({...x,...v}))}/>
  <div className="flex flex-wrap gap-2"><Button disabled={!src||!!busy} onClick={apply}>{busy==='apply'?'Editing…':'Apply edits'}</Button>{out&&<Button variant="outline" asChild><a href={out.url} download={`${src.name}-photocraft.${ext}`}>Download</a></Button>}{out&&<Button variant="outline" disabled={!!busy} onClick={save}>{busy==='save'?'Saving…':'Save to Library'}</Button>}</div>
  {error&&<p role="alert" className="text-destructive text-sm">{error}</p>}{saved&&<p role="status" className="text-sm text-muted-foreground">{saved}</p>}
  {out&&s.format==='webp'&&out.blob.type!=='image/webp'&&<p className="text-xs text-muted-foreground">This browser can't write WebP, so it saved {out.blob.type} instead.</p>}
  {src&&<div className="grid md:grid-cols-2 gap-4"><figure><img src={src.preview} alt="Original" className="max-h-96 w-full object-contain rounded border border-border bg-card"/><figcaption className="text-xs text-muted-foreground mt-1">Original · {src.bitmap.width}×{src.bitmap.height} · {kb(src.size)}</figcaption></figure>{out&&<figure><img src={out.url} alt="Edited" className="max-h-96 w-full object-contain rounded border border-border bg-card"/><figcaption className="text-xs text-muted-foreground mt-1">Edited · {out.w}×{out.h} · {kb(out.blob.size)}</figcaption></figure>}</div>}
 </section>;
}