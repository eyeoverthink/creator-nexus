import {useState} from 'react';
import {Link} from 'react-router-dom';
import ProShell from '@/components/nexus/ProShell';
import {ArrowLeft,BookOpen,MessagesSquare,Settings2} from 'lucide-react';
import useOrigin from '@/components/nexus/origin/useOrigin';
import useModelSettings from '@/components/nexus/models/useModelSettings';
import KnowledgeChat from '@/components/nexus/knowledge/KnowledgeChat';
import LibraryTab from '@/components/nexus/learning/LibraryTab';
import ModelsTab from '@/components/nexus/models/ModelsTab';
import AcademyPipelineAlignmentPanel from '@/components/nexus/learning/AcademyPipelineAlignmentPanel';
import PdfEvidenceIntake from '@/components/nexus/learning/PdfEvidenceIntake';
import WorkspaceRequired from '@/components/nexus/WorkspaceRequired';
import '@/components/nexus/theme.css';
export default function Knowledge(){
 const origin=useOrigin(),models=useModelSettings(origin.workspace?.id),[tab,setTab]=useState('chat');
 const views=[['chat','AI chat',MessagesSquare],['library','Library',BookOpen],['models','Models',Settings2]];
 return <ProShell>
  <header className="border-b border-border"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-5 flex flex-wrap items-center gap-4"><Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft size={14}/>Studio</Link><div className="border-l border-border pl-4 flex items-center gap-2"><BookOpen size={21} className="text-primary"/><h1 className="font-display font-semibold text-xl">Nexus Knowledge &amp; Academy</h1></div><Link to="/connect" className="ml-auto text-xs font-semibold text-success hover:underline">Connect MCP (/api/mcp)</Link><button type="button" onClick={()=>setTab('models')} className="text-xs font-semibold text-primary hover:underline">Sovereign Mesh Models</button><Link to="/openclaw" className="text-xs text-primary">OpenClaw Hub</Link><Link to="/library" className="text-xs text-primary">Asset library</Link><Link to="/argon" className="text-xs text-primary">Argon RSI Brain</Link></div></header>
  <div className="border-b border-border bg-card"><div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-wrap items-center justify-between gap-3"><nav aria-label="Knowledge views" className="flex gap-6">{views.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} aria-current={tab===id?'page':undefined} className={'flex items-center gap-2 py-4 text-sm border-b-2 '+(tab===id?'border-primary text-primary':'border-transparent text-muted-foreground hover:text-foreground')}><Icon size={15}/>{label}</button>)}</nav><div className="flex flex-wrap items-center gap-2 py-2 font-mono text-[11px]"><span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 font-semibold">✓ HeartMuLa Bridge &amp; 5-Stage Pipeline Synced</span><button type="button" onClick={()=>setTab('models')} className="px-2.5 py-1 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90">Models &amp; Adapters</button><Link to="/connect" className="px-2.5 py-1 rounded border border-border bg-background text-foreground hover:bg-accent">Copy MCP Link</Link></div></div></div>
  <main className="max-w-5xl mx-auto p-5 sm:p-8 pb-16 space-y-6"><AcademyPipelineAlignmentPanel workspaceId={origin.workspace?.id}/>{origin.loadError?<p role="alert" className="text-destructive">{origin.loadError.message}</p>:origin.loading?<p role="status" className="text-muted-foreground">Opening your knowledge workspace…</p>:!origin.workspace?<WorkspaceRequired access={origin.workspaceAccess}/>:<>
   <section hidden={tab!=='chat'} aria-label="AI chat"><KnowledgeChat workspace={origin.workspace} models={models}/></section>
   {tab==='library'&&<section aria-label="Knowledge library" className="space-y-5"><div><h2 className="font-heading text-xl mb-2">Your shared knowledge library</h2><p className="text-sm text-muted-foreground">The same references are available to chat and your existing workspace agents. Import PDF evidence or paste text, then search and expand it to read.</p></div><PdfEvidenceIntake workspace={origin.workspace}/><LibraryTab workspace={origin.workspace} showEngine={false}/></section>}
   {tab==='models'&&<section aria-label="Model settings"><p className="text-sm text-muted-foreground mb-5">These are the same model settings used by your studio agents. Chat sends relevant library excerpts and recent conversation to your selected model.</p><ModelsTab nexus={{models}}/></section>}
  </>}</main>
 </ProShell>;
}