import {useState} from 'react';
import WorkspaceRequired from '@/components/nexus/WorkspaceRequired';
import {Link} from 'react-router-dom';
import {ArrowLeft,Sparkles,Columns3,NotebookPen} from 'lucide-react';
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
 const spark=useSpark(),[tab,setTab]=useState(()=>new URLSearchParams(window.location.search).get('view')||'sparks');
 const ready=!!spark.workspace;
 return <div className="min-h-screen bg-background text-foreground font-body"><SparkApproval spark={spark}/>{spark.review&&<ScriptReview key={spark.review.card.id} spark={spark}/>}<header className="border-b border-border"><div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-wrap gap-4 items-center"><Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft size={14}/>Workspace</Link><div className="flex items-center gap-2 border-l border-border pl-4"><Sparkles size={21} className="text-primary"/><h1 className="font-display font-semibold text-xl">Spark Studio</h1></div><Link to="/library" className="ml-auto text-xs text-primary">Asset library & favorites</Link><Link to="/origin" className="text-xs text-primary">Nexus Origin</Link><span className="text-[11px] text-muted-foreground">Separate data · manual approval</span></div></header><nav aria-label="Spark workspace views" className="border-b border-border bg-card"><div className="max-w-7xl mx-auto px-5 sm:px-8 flex gap-6 overflow-x-auto">{[['sparks','My Sparks',Sparkles],['kanban','Kanban board',Columns3],['logs','Learning logs',NotebookPen]].map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} aria-current={tab===id?'page':undefined} className={'py-4 flex items-center gap-2 whitespace-nowrap text-sm border-b-2 '+(tab===id?'border-primary text-primary':'border-transparent text-muted-foreground hover:text-foreground')}><Icon size={15}/>{label}</button>)}</div></nav><main className="max-w-7xl mx-auto p-5 sm:p-8 space-y-6 pb-16">{spark.error&&<p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-4 text-xs whitespace-pre-wrap">{spark.error}</p>}{spark.notice&&<p role="status" className="text-sm text-caution">{spark.notice}</p>}{spark.boot.error?<p role="alert" className="text-destructive">{spark.boot.error.message}</p>:spark.boot.isPending?<p role="status" className="text-muted-foreground">Opening your Spark workspace…</p>:!ready?<WorkspaceRequired/>:tab==='logs'?<SparkLearningLogs workspace={spark.workspace}/>:tab==='kanban'?<SparkKanban spark={spark}/>:<><TasteInterview spark={spark}/><SparkGenerator spark={spark}/><SparkBatch spark={spark}/><PastSparks spark={spark}/></>}<RunnerTransferSetup/><SparkInstallNotes/></main></div>;
}