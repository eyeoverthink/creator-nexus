import {Layers3,Home,Clapperboard,FolderOpen,Fingerprint,Upload,Settings2,BookOpen,Users,FlaskConical,PanelLeftClose,PanelLeftOpen,Sparkles,Cpu,Bot,Terminal,Radio,Timer} from 'lucide-react';
import {Link,useLocation} from 'react-router-dom';
import StudioPanelLinks from '@/components/nexus/StudioPanelLinks';
import {Activity} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
export {default as agents} from '@/components/nexus/agentProfiles';
export default function Sidebar({nexus,collapsed=false,onCollapse,originTab,onOriginTab}){
 const {user}=useAuth();
 const location=useLocation(),view=originTab||location.state?.originTab||'sparks';
 const primary=[['Home','/',Home],['Workflows','/workflows',Layers3],['Studio tools','/studio-tools',Sparkles],['Agents','/agents',Users],['Time audit & ideas','/time-audit',Timer],...(user?.role==='admin'?[['Agent monitor','/admin/agent-monitor',Activity]]:[]),['Production Factory','/factory',Clapperboard],['OpenClaw Hub','/openclaw',Bot],['Hermes Fleet','/hermes',Cpu],['Orifice Relay','/orifice-relay',Radio],['Create','/spark',Sparkles],['Library','/library',FolderOpen],['looseScrew Lab','/loose-screw',FlaskConical],['AI Workshop OS','/ai-workshop',Layers3],['Φ-Omega Portal','/ai-workshop?view=opeg',Sparkles],['Connect, API & export','/connect',Terminal],['Brand','/origin',Fingerprint,'dna'],['Publish','/origin',Upload,'runs']];
 const advanced=[['OpenClaw Hub','/openclaw',Bot],['Hermes Fleet','/hermes',Cpu],['Connect, API & export','/connect',Terminal],['Φ-Omega Portal','/ai-workshop?view=opeg',Sparkles],['φ⁷⁵-Ternary Transmuter','/ai-workshop?view=phi75',Cpu],['Origin projects','/origin',Clapperboard,'sparks'],['Knowledge & AI chat','/knowledge',BookOpen],['AI employees','/origin',Users,'employees'],['Proof loop','/origin',FlaskConical,'learn'],['Director Lab','/director-lab',FlaskConical],['Argon RSI Brain','/argon',FlaskConical]];
 const active=([,path,,tab])=>location.pathname===path&&(!tab||view===tab);
 const link=item=>{const [label,path,Icon,tab]=item;return <Link key={label} to={path} state={tab?{originTab:tab}:null} onClick={()=>{if(path==='/origin'&&location.pathname===path)onOriginTab?.(tab);}} aria-label={label} title={label} aria-current={active(item)?'page':undefined} className="nexus-nav-link"><Icon size={20} className="shrink-0"/><span className="nexus-nav-label">{label}</span></Link>;};
 return <aside data-collapsed={collapsed} className="nexus-sidebar border-r border-border p-4 flex flex-col">
  <Link to="/" aria-label="Creator Nexus home" className="flex items-center gap-3 px-2 py-3 mb-3 text-foreground"><Layers3 size={24} className="shrink-0"/><span className="nexus-nav-label font-heading text-base font-semibold">Creator Nexus</span></Link>
  <button onClick={onCollapse} aria-label={collapsed?'Expand navigation':'Collapse navigation'} aria-expanded={!collapsed} className="nexus-nav-link mb-4">{collapsed?<PanelLeftOpen size={20}/>:<PanelLeftClose size={20}/>}<span className="nexus-nav-label">Collapse navigation</span></button>
  <nav aria-label="Main navigation" className="space-y-1">{primary.map(link)}
   <details open={location.pathname==='/argon'||location.pathname==='/director-lab'||location.pathname==='/knowledge'||location.pathname==='/origin'&&['employees','learn','sparks'].includes(view)}>
    <summary className="nexus-nav-link" title="Advanced" aria-label="Advanced"><Settings2 size={20} className="shrink-0"/><span className="nexus-nav-label">Advanced</span></summary>
    <div className="mt-1 space-y-1">{advanced.map(link)}</div>
    {nexus&&<StudioPanelLinks nexus={nexus}/>}
   </details>
  </nav>
  <div className="mt-auto pt-6"><div className="border-t border-border pt-4 flex items-center gap-3 px-2"><span className="rounded-avatar h-8 w-8 bg-secondary grid place-items-center text-xs shrink-0">You</span><span className="nexus-nav-label text-xs text-muted-foreground">Personal workspace</span></div></div>
 </aside>;
}