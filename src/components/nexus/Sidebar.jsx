import {Layers3,Compass,FileText,Radio,Eye,Braces,BarChart3,Sparkles,ArrowUpRight} from 'lucide-react';
import {initialLayout} from '@/components/nexus/useNexus';
import StudioRail from '@/components/nexus/StudioRail';
import agents from '@/components/nexus/agentProfiles';
export {default as agents} from '@/components/nexus/agentProfiles';
export default function Sidebar({nexus}){
 const reveal=()=>document.querySelector('.nexus-canvas')?.scrollIntoView({block:'start'});
 return <StudioRail page="/">
  <p className="studio-kicker mt-4 mb-2">Creative studio</p>
  {[{id:'workspace',label:'Overview',icon:Layers3},{id:'feed',label:'Content Feed',icon:Compass},{id:'draft',label:'Draft Editor',icon:FileText},{id:'activity',label:'Agent Activity',icon:Radio},{id:'performance',label:'Performance',icon:BarChart3},{id:'preview',label:'Live Preview',icon:Eye},{id:'context',label:'Shared Context',icon:Braces},{id:'learning',label:'Learning Lab',icon:Sparkles}].map(item=><button key={item.id} onClick={()=>{item.id==='workspace'?nexus.changeLayout(initialLayout):nexus.open(item.id);reveal();}} className="studio-nav-item"><item.icon size={16} aria-hidden="true"/>{item.label}</button>)}
  <p className="studio-kicker mt-4 mb-2">Your co-creators</p>
  {agents.map(a=><button key={a.id} onClick={()=>{nexus.setAgent(a.id);nexus.open(a.panelId);reveal();}} className={'studio-nav-item '+(nexus.agent===a.id?'is-active':'')}><span className={'h-8 w-8 shrink-0 grid place-items-center rounded-lg '+a.color}>{a.letter}</span><span>{a.name}<span className="block text-xs text-muted-foreground">{nexus.state?.agents[a.id]==='working'?'Working on your context':a.role}</span></span></button>)}
  <button onClick={()=>{nexus.open('context');reveal();}} className="studio-nav-item text-primary">Explore shared context<ArrowUpRight size={16} aria-hidden="true"/></button>
 </StudioRail>;
}