import {useRunResearch,useResearchRuns} from '@/components/nexus/research/useResearch';
import ResearchForm from '@/components/nexus/research/ResearchForm';
import MotivationTargets from '@/components/nexus/research/MotivationTargets';
import FindingList from '@/components/nexus/research/FindingList';
import YoutubeResults from '@/components/nexus/research/YoutubeResults';
import SourceStatus from '@/components/nexus/research/SourceStatus';
const Run=({run})=><div className="space-y-4">{run.error&&<p className="text-sm text-destructive">{run.error}</p>}<SourceStatus run={run}/><FindingList run={run}/><YoutubeResults run={run}/></div>;
export default function ResearchPanel(){
 const run=useRunResearch(),runs=useResearchRuns(),list=runs.data||[];
 return <div className="space-y-8">
  <div className="grid xl:grid-cols-[1fr_380px] gap-6 items-start"><ResearchForm run={run}/><MotivationTargets/></div>
  {runs.isPending?<p role="status" className="text-sm text-muted-foreground">Loading…</p>:!list.length?<p className="text-sm text-muted-foreground">No research runs yet.</p>:
   <div className="space-y-4">{list.map((r,i)=><details key={r.id} open={i===0} className="rounded-lg border border-border p-3"><summary className="cursor-pointer text-sm">{r.query} · {r.status} · {new Date(r.created_date).toLocaleString()}</summary><div className="pt-4"><Run run={r}/></div></details>)}</div>}
 </div>;
}