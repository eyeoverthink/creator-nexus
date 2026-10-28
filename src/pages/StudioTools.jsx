import {useState} from 'react';
import Sidebar from '@/components/nexus/Sidebar';
import '@/components/nexus/theme.css';
import {Button} from '@/components/ui/button';
import useWorkspaceAccess from '@/components/nexus/useWorkspaceAccess';
import {studioTools} from '@/components/nexus/studiotools/studioToolsList';
import StudioToolView from '@/components/nexus/studiotools/StudioToolView';
export default function StudioTools(){
 const [collapsed,setCollapsed]=useState(false);
 const initial=new URLSearchParams(window.location.search).get('tool');
 const [tool,setTool]=useState(studioTools.some(t=>t.id===initial)?initial:'photocraft'),[handoff,setHandoff]=useState(null);
 const {boot,workspace,creating,createError,createWorkspace}=useWorkspaceAccess();
 const active=studioTools.find(t=>t.id===tool);
 return <div className="nexus-shell"><Sidebar collapsed={collapsed} onCollapse={()=>setCollapsed(v=>!v)}/>
  <main className="nexus-main p-4 md:p-6 space-y-5 overflow-y-auto">
   <header className="border-b border-border pb-4"><h1 className="text-lg font-semibold">Studio tools</h1><p className="text-xs text-muted-foreground mt-1">PhotoCraft, Hypit, HyperFrames, Voice Studio and REA. Results save privately to your Library.</p></header>
   <nav aria-label="Studio tools" className="flex flex-wrap gap-2">{studioTools.map(({id,label,icon:Icon})=><Button key={id} variant={tool===id?'default':'outline'} onClick={()=>setTool(id)}><Icon/>{label}</Button>)}</nav>
   <p className="text-sm text-muted-foreground">{active.summary}</p>
   {boot.isPending?<p role="status">Loading your workspace…</p>:!workspace?<div className="space-y-2"><p className="text-sm text-muted-foreground">Create your workspace once so results have somewhere to be saved.</p><Button onClick={createWorkspace} disabled={creating}>{creating?'Creating…':'Create my workspace'}</Button>{createError&&<p role="alert" className="text-destructive text-sm">{createError}</p>}</div>
    :<StudioToolView tool={tool} workspace={workspace} handoff={handoff} onSend={(to,text)=>{setHandoff({to,text,at:Date.now()});setTool(to);}}/>}
  </main></div>;
}