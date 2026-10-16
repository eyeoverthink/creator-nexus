import {useState} from 'react';
import WorkspaceRequired from '@/components/nexus/WorkspaceRequired';
import {Link,useLocation} from 'react-router-dom';
import StudioRail from '@/components/nexus/StudioRail';
import {ArrowLeft,Sparkles} from 'lucide-react';
import useSpark from '@/components/nexus/spark/useSpark';
import TasteInterview from '@/components/nexus/spark/TasteInterview';
import SparkGenerator from '@/components/nexus/spark/SparkGenerator';
import SparkBatch from '@/components/nexus/spark/SparkBatch';
import PastSparks from '@/components/nexus/spark/PastSparks';
import SparkKanban from '@/components/nexus/spark/SparkKanban';
import SparkLearningLogs from '@/components/nexus/spark/SparkLearningLogs';
import SparkApproval from '@/components/nexus/spark/SparkApproval';
import ScriptReview from '@/components/nexus/spark/ScriptReview';
import SparkInstallNotes from '@/components/nexus/spark/SparkInstallNotes';
import RunnerTransferSetup from '@/components/nexus/spark/RunnerTransferSetup';
import '@/components/nexus/theme.css';
export default function Spark(){
 const location=useLocation(),spark=useSpark(),[tab,setTab]=useState(()=>new URLSearchParams(window.location.search).get('view')||location.state?.studioView||'sparks');
 const ready=!!spark.workspace;
 return <div className="studio-shell font-body" data-advanced={tab==='logs'?'':undefined}><StudioRail page="/spark" view={tab} onSelect={setTab}/><SparkApproval spark={spark}/>{spark.review&&<ScriptReview key={spark.review.card.id} spark={spark}/>}<header className="border-b border-border"><div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-wrap gap-4 items-center"><Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft size={14}/>Workspace</Link><div className="flex items-center gap-2 border-l border-border pl-4"><Sparkles size={21} className="text-primary"/><h1 className="font-display font-semibold text-xl">Create</h1></div><Link to="/library" className="ml-auto text-xs text-primary">Asset library & favorites</Link><Link to="/origin" className="text-xs text-primary">Nexus Origin</Link><span className="text-[11px] text-muted-foreground">Separate data · manual approval</span></div></header><main className="max-w-7xl mx-auto p-5 sm:p-8 space-y-6 pb-16">{spark.error&&<p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-4 text-xs whitespace-pre-wrap">{spark.error}</p>}{spark.notice&&<p role="status" className="text-sm text-caution">{spark.notice}</p>}{spark.boot.error?<p role="alert" className="text-destructive">{spark.boot.error.message}</p>:spark.boot.isPending?<p role="status" className="text-muted-foreground">Opening your Spark workspace…</p>:!ready?<WorkspaceRequired/>:tab==='logs'?<SparkLearningLogs workspace={spark.workspace}/>:tab==='kanban'?<SparkKanban spark={spark}/>:<><div id="spark-creator-tools" className="space-y-6"><TasteInterview spark={spark}/><SparkGenerator spark={spark}/></div><SparkBatch spark={spark}/><details className="studio-advanced-panel" data-advanced><summary>Advanced · batch history</summary><PastSparks spark={spark}/></details></>}<details id="advanced-tools" className="studio-advanced-panel" data-advanced><summary>Advanced tools & setup</summary><div className="space-y-4"><RunnerTransferSetup/><SparkInstallNotes/></div></details></main></div>;
}