import {Compass,FileText,Radio,Eye,Braces,BarChart3,BookOpen,PanelsTopLeft} from 'lucide-react';
import {initialLayout} from '@/components/nexus/useNexus';
import agents from '@/components/nexus/agentProfiles';
export default function StudioPanelLinks({nexus}){
 return <div className="nexus-nav-detail mt-4 border-t border-border pt-4">
  <p className="eyebrow mb-2 px-3">Studio panels</p>
  {[['workspace','Overview',PanelsTopLeft],['feed','Content Feed',Compass],['draft','Draft Editor',FileText],['activity','Agent Activity',Radio],['performance','Performance',BarChart3],['preview','Live Preview',Eye],['context','Shared Context',Braces],['learning','Learning Lab',BookOpen]].map(([id,label,Icon])=><button key={id} disabled={!nexus.workspace||!nexus.state?.draft} className="nexus-nav-link disabled:opacity-40" onClick={()=>id==='workspace'?nexus.changeLayout(initialLayout):nexus.open(id)}><Icon size={16}/>{label}</button>)}
  <p className="eyebrow mt-6 mb-2 px-3">Agents</p>
  {agents.map(agent=><button key={agent.id} disabled={!nexus.state?.draft} onClick={()=>{nexus.setAgent(agent.id);nexus.open(agent.panelId);}} className="nexus-nav-link disabled:opacity-40"><span className="rounded-avatar h-7 w-7 shrink-0 bg-secondary grid place-items-center text-xs">{agent.letter}</span><span><span className="block text-foreground">{agent.name}</span><span className="text-xs">{nexus.state?.agents[agent.id]==='working'?'Working':agent.role}</span></span></button>)}
  <button disabled={!nexus.state?.draft} onClick={()=>nexus.open('context')} className="nexus-nav-link mt-4 disabled:opacity-40"><Braces size={16}/>Shared context</button>
 </div>;
}