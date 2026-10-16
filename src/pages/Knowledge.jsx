import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft,BookOpen,MessagesSquare,Settings2} from 'lucide-react';
import useOrigin from '@/components/nexus/origin/useOrigin';
import useModelSettings from '@/components/nexus/models/useModelSettings';
import KnowledgeChat from '@/components/nexus/knowledge/KnowledgeChat';
import LibraryTab from '@/components/nexus/learning/LibraryTab';
import ModelsTab from '@/components/nexus/models/ModelsTab';
import WorkspaceRequired from '@/components/nexus/WorkspaceRequired';
import '@/components/nexus/theme.css';
export default function Knowledge(){
 const origin=useOrigin(),models=useModelSettings(origin.workspace?.id),[tab,setTab]=useState('chat');
 const views=[['chat','AI chat',MessagesSquare],['library','Library',BookOpen],['models','Models',Settings2]];
 return <div className="min-h-screen bg-background text-foreground font-body">
  <header className="border-b border-border"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-5 flex flex-wrap items-center gap-4"><Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft size={14}/>Studio</Link><div className="border-l border-border pl-4 flex items-center gap-2"><BookOpen size={21} className="text-primary"/><h1 className="font-display font-semibold text-xl">Nexus Knowledge</h1></div><Link to="/library" className="ml-auto text-xs text-primary">Asset library & favorites</Link><Link to="/spark" className="text-xs text-primary">Spark Studio & board</Link><Link to="/origin" className="text-xs text-primary">Nexus Origin</Link></div></header>
  <div className="border-b border-border bg-card"><nav aria-label="Knowledge views" className="max-w-5xl mx-auto px-5 sm:px-8 flex gap-6">{views.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} aria-current={tab===id?'page':undefined} className={'flex items-center gap-2 py-4 text-sm border-b-2 '+(tab===id?'border-primary text-primary':'border-transparent text-muted-foreground hover:text-foreground')}><Icon size={15}/>{label}</button>)}</nav></div>
  <main className="max-w-5xl mx-auto p-5 sm:p-8 pb-16">{origin.loadError?<p role="alert" className="text-destructive">{origin.loadError.message}</p>:origin.loading?<p role="status" className="text-muted-foreground">Opening your knowledge workspace…</p>:!origin.workspace?<WorkspaceRequired access={origin.workspaceAccess}/>:<>
   <section hidden={tab!=='chat'} aria-label="AI chat"><KnowledgeChat workspace={origin.workspace} models={models}/></section>
   {tab==='library'&&<section aria-label="Knowledge library"><h2 className="font-heading text-xl mb-2">Your shared knowledge library</h2><p className="text-sm text-muted-foreground mb-5">The same references are available to chat and your existing workspace agents. Paste text to add a source, search its contents, or expand it to read.</p><LibraryTab workspace={origin.workspace} showEngine={false}/></section>}
   {tab==='models'&&<section aria-label="Model settings"><p className="text-sm text-muted-foreground mb-5">These are the same model settings used by your studio agents. Chat sends relevant library excerpts and recent conversation to your selected model.</p><ModelsTab nexus={{models}}/></section>}
  </>}</main>
 </div>;
}