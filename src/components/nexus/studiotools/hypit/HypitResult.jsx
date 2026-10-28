import {Button} from '@/components/ui/button';
const List=({title,items})=>items?.length?<div><h4 className="text-sm font-semibold">{title}</h4><ul className="list-disc pl-5 text-sm space-y-1">{items.map((x,i)=><li key={i}>{x}</li>)}</ul></div>:null;
export default function HypitResult({data,onSend}){
 const a=data.analysis,r=a.recreation||{};
 return <article className="space-y-4 rounded border border-border bg-card p-4">
  <header><h3 className="text-lg">{a.title}</h3><p className="text-sm text-muted-foreground">{a.one_line}{a.format?` · ${a.format}`:''}</p><p className="text-xs text-muted-foreground mt-1">Transcript: {data.transcript_note} · Saved to your Library</p></header>
  <div><h4 className="text-sm font-semibold">Hook{a.hook?.seconds!=null?` (${a.hook.seconds}s)`:''}</h4><p className="text-sm">{a.hook?.what_happens}</p><p className="text-xs text-muted-foreground">{a.hook?.technique}{a.hook?.why_it_works?` · ${a.hook.why_it_works}`:''}</p></div>
  <div><h4 className="text-sm font-semibold">Beats</h4><ol className="space-y-2 text-sm">{(a.beats||[]).map((b,i)=><li key={i} className="border-l-2 border-primary pl-3"><span className="text-xs text-muted-foreground">{b.start_s}s–{b.end_s??'?'}s</span> {b.shot}{b.on_screen_text&&<span className="block text-xs">Text: “{b.on_screen_text}”</span>}{b.voiceover&&<span className="block text-xs">Says: “{b.voiceover}”</span>}<span className="block text-xs text-muted-foreground">{b.purpose}</span></li>)}</ol></div>
  {a.pacing&&<p className="text-sm"><strong>Pacing:</strong> {a.pacing.average_shot_seconds??'?'}s per shot · {a.pacing.cuts_per_minute??'?'} cuts/min. {a.pacing.notes}</p>}
  {a.audio&&<p className="text-sm"><strong>Audio:</strong> {[a.audio.voice,a.audio.music,a.audio.sound_effects].filter(Boolean).join(' · ')}</p>}
  <List title="Why it works" items={a.why_it_works}/><List title="Retention tactics" items={a.retention_tactics}/>
  <div className="rounded border border-primary p-3 space-y-2"><h4 className="text-sm font-semibold">Your version</h4><p className="text-sm">{r.concept}</p><p className="text-sm whitespace-pre-wrap bg-background rounded p-2">{r.narration_script}</p><List title="Shot list" items={r.shot_list}/><List title="Alternative hooks" items={r.alternative_hooks}/>
   <div className="flex flex-wrap gap-2"><Button onClick={()=>onSend('hyperframes',r.narration_script)}>Make it in HyperFrames</Button><Button variant="outline" onClick={()=>onSend('voice',r.narration_script)}>Voice it in Voice Studio</Button></div></div>
  {a.limits&&<p className="text-xs text-muted-foreground">Limits: {a.limits}</p>}
 </article>;
}