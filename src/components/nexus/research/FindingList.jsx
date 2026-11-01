import {useState} from 'react';
import {Bookmark,BookmarkCheck} from 'lucide-react';
import {useToggleSaved} from '@/components/nexus/research/useResearch';
export default function FindingList({run}){
 const toggle=useToggleSaved(),[onlySaved,setOnly]=useState(false);
 const list=(run.findings||[]).map((f,i)=>({...f,i})).filter(f=>!onlySaved||f.saved);
 return <section className="space-y-2">
  <div className="flex items-center justify-between"><h4 className="text-xs uppercase tracking-wider text-muted-foreground">Ranked findings</h4><label className="text-xs flex items-center gap-2"><input type="checkbox" checked={onlySaved} onChange={e=>setOnly(e.target.checked)}/>Saved only</label></div>
  {!list.length?<p className="text-sm text-muted-foreground">No findings.</p>:<ol className="space-y-2">{list.map(f=><li key={f.i} className="rounded-lg border border-border bg-card p-3">
   <div className="flex items-start gap-3"><span className="tabular-nums text-sm text-muted-foreground w-8">{f.score}</span><div className="flex-1 min-w-0">
    <p className="text-sm font-medium">{f.title}</p><p className="text-sm text-muted-foreground mt-1">{f.detail}</p>
    <p className="text-xs mt-2"><span className={f.kind==='retrieved'?(f.verified?'text-success':'text-caution'):'text-link'}>{f.kind==='retrieved'?(f.verified?'Retrieved fact':'Unverified claim'):'AI synthesis'}</span>{f.source_url&&/^https?:/.test(f.source_url)&&<> · <a href={f.source_url} target="_blank" rel="noreferrer" className="text-link break-all">{f.source_url}</a></>}</p>
   </div><button onClick={()=>toggle.mutate({run,index:f.i})} aria-label={f.saved?'Unsave finding':'Save finding'} className="text-muted-foreground hover:text-foreground">{f.saved?<BookmarkCheck size={18} className="text-primary"/>:<Bookmark size={18}/>}</button></div>
  </li>)}</ol>}
 </section>;
}