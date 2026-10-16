import {Link} from 'react-router-dom';
import {Home,Sparkles,FolderOpen,Palette,Send,Settings2,Layers3,ChevronDown} from 'lucide-react';
import '@/components/nexus/theme.css';
import '@/components/nexus/studio.css';
const main=[['Home','/',null,Home],['Create','/spark','sparks',Sparkles],['Library','/library','assets',FolderOpen],['Brand','/origin','dna',Palette],['Publish','/origin','runs',Send]];
const advanced=[['Origin ideas','/origin','sparks'],['AI employees','/origin','employees'],['PROOF Loop','/origin','learn'],['Kanban board','/spark','kanban'],['Learning logs','/spark','logs'],['Knowledge & AI chat','/knowledge','chat'],['Knowledge library','/knowledge','library'],['Models','/knowledge','models'],['Agent continuity','/library','agents'],['Profile & settings','/library','profile']];
export default function StudioRail({page,view,onSelect,children}){
 const advancedActive=advanced.some(([,path,id])=>page===path&&view===id);
 const item=([label,path,id,Icon])=>{
  const active=page===path&&(!id||view===id);
  const content=<>{Icon&&<Icon size={20} aria-hidden="true"/>}<span>{label}</span></>;
  const props={className:'studio-nav-item'+(active?' is-active':''),'aria-current':active?'page':undefined};
  return page===path&&id&&onSelect?<button key={label} {...props} onClick={()=>onSelect(id)}>{content}</button>:<Link key={label} {...props} to={path} state={id?{studioView:id}:null}>{content}</Link>;
 };
 return <aside className="studio-rail" aria-label="Creative workspace navigation">
  <Link to="/" className="studio-brand" aria-label="Creator Nexus home"><span className="studio-brand-mark"><Layers3 size={24} aria-hidden="true"/></span><span>creator<span className="text-primary">nexus</span></span></Link>
  <p className="studio-rail-caption">Your creative space</p>
  <nav aria-label="Main navigation">{main.map(item)}
   <details className="studio-advanced" open={advancedActive||undefined} data-advanced>
    <summary className="studio-nav-item"><Settings2 size={20} aria-hidden="true"/><span>Advanced</span><ChevronDown size={14} className="ml-auto" aria-hidden="true"/></summary>
    <div className="studio-subnav">{advanced.map(item)}{children}</div>
   </details>
  </nav>
  <div className="studio-rail-footer"><span className="studio-avatar">Me</span><span>Personal workspace<span className="block text-xs text-muted-foreground">Made for your next idea</span></span></div>
 </aside>;
}