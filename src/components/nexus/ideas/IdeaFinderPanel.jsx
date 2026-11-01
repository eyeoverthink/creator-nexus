import {useFindIdeas,useIdeaRuns} from '@/components/nexus/ideas/useIdeaFinder';
import IdeaFinderForm from '@/components/nexus/ideas/IdeaFinderForm';
import IdeaRunCard from '@/components/nexus/ideas/IdeaRunCard';
export default function IdeaFinderPanel(){
 const find=useFindIdeas(),runs=useIdeaRuns(),list=runs.data||[];
 return <div className="space-y-8">
  <IdeaFinderForm find={find}/>
  {runs.isPending?<p role="status" className="text-sm text-muted-foreground">Loading…</p>:runs.error?<p role="alert" className="text-sm text-destructive">{runs.error.message}</p>:!list.length?<p className="text-sm text-muted-foreground">No idea runs yet.</p>:
   <div className="space-y-6">{list.map((r,i)=>i===0?<IdeaRunCard key={r.id} run={r}/>:<details key={r.id} className="rounded-lg border border-border p-3"><summary className="cursor-pointer text-sm">{r.niche} · {r.status} · {new Date(r.created_date).toLocaleString()}</summary><div className="pt-4"><IdeaRunCard run={r}/></div></details>)}</div>}
 </div>;
}