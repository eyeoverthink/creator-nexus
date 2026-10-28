import {field} from '@/components/nexus/studiotools/toolKit';
export default function PhotoControls({s,set}){
 const num=(k,label,min,max,step=1)=><label className="text-xs text-muted-foreground">{label}<input type="number" min={min} max={max} step={step} value={s[k]} onChange={e=>set({[k]:Number(e.target.value)})} className={field}/></label>;
 const check=(k,label)=><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s[k]} onChange={e=>set({[k]:e.target.checked})}/>{label}</label>;
 return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  {num('width','Width (0 = keep)',0,4096)}{num('height','Height (0 = keep)',0,4096)}
  <label className="text-xs text-muted-foreground">Fit<select value={s.fit} onChange={e=>set({fit:e.target.value})} className={field}><option value="cover">Crop to fill</option><option value="contain">Fit inside</option><option value="stretch">Stretch</option></select></label>
  <label className="text-xs text-muted-foreground">Format<select value={s.format} onChange={e=>set({format:e.target.value})} className={field}><option value="webp">WebP</option><option value="png">PNG</option><option value="jpeg">JPEG</option></select></label>
  {num('brightness','Brightness',-100,100)}{num('contrast','Contrast',-100,100)}{num('quality','Quality',10,100)}
  <div className="space-y-2 pt-4">{check('sharpen','Sharpen')}{check('unsharp','Unsharp mask')}</div>
  {s.unsharp&&<>{num('unsharpAmount','Unsharp amount %',0,300)}{num('unsharpRadius','Radius px',0.5,10,0.1)}{num('unsharpThreshold','Threshold',0,255)}</>}
 </div>;
}