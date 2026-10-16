import {useState} from 'react';
import {Link} from 'react-router-dom';
import ProShell from '@/components/nexus/ProShell';
import {FolderOpen,ArrowLeft,ShieldCheck} from 'lucide-react';
import useWorkspaceAccess from '@/components/nexus/useWorkspaceAccess';
import WorkspaceRequired from '@/components/nexus/WorkspaceRequired';
import AssetBrowser from '@/components/nexus/library/AssetBrowser';
import AgentContinuity from '@/components/nexus/library/AgentContinuity';
import ProfileSettings from '@/components/nexus/library/ProfileSettings';
export default function Library(){
 const [tab,setTab]=useState('assets');
 const workspaceAccess=useWorkspaceAccess(),boot=workspaceAccess.boot;
 return <ProShell>
  <header className="border-b border-border"><div className="max-w-7xl mx-auto p-5 sm:px-8 flex flex-wrap items-center gap-5"><Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex gap-2 items-center"><ArrowLeft size={14}/>Studio</Link><div className="border-l border-border pl-5 flex gap-2 items-center"><FolderOpen className="text-primary" size={22}/><h1 className="font-heading text-xl font-semibold">Library</h1></div><nav aria-label="Workspaces" className="flex flex-wrap gap-5 ml-auto text-xs text-primary"><Link to="/spark">Spark Studio</Link><Link to="/origin">Nexus Origin</Link><Link to="/knowledge">Knowledge & AI chat</Link></nav></div></header>
  <div className="bg-card border-b border-border"><nav aria-label="Library views" className="max-w-7xl mx-auto px-5 sm:px-8 flex gap-6 overflow-x-auto">{[['assets','Assets & favorites'],['agents','Agent continuity'],['profile','Profile & settings']].map(([id,label])=><button key={id} onClick={()=>setTab(id)} aria-current={tab===id?'page':undefined} className={'py-4 text-sm whitespace-nowrap border-b-2 '+(tab===id?'border-primary text-primary':'border-transparent text-muted-foreground hover:text-foreground')}>{label}</button>)}</nav></div>
  <main className="max-w-7xl mx-auto p-5 sm:p-8 pb-16 space-y-7"><p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={14} className="text-primary"/>Personal library · private uploads · persistent context</p>{boot.error?<p role="alert" className="text-destructive">{boot.error.message}</p>:!boot.data?<WorkspaceRequired access={workspaceAccess}/>:tab==='agents'?<AgentContinuity workspace={boot.data}/>:tab==='profile'?<ProfileSettings workspace={boot.data}/>:<AssetBrowser workspace={boot.data}/>}</main>
 </ProShell>;
}