import {useState} from 'react';
import SandboxTab from '@/components/nexus/learning/SandboxTab';
import SkillsTab from '@/components/nexus/learning/SkillsTab';
import LibraryTab from '@/components/nexus/learning/LibraryTab';
import ModelsTab from '@/components/nexus/models/ModelsTab';
import TrainingTab from '@/components/nexus/learning/TrainingTab';
const agents=[['researcher','Scout'],['writer','Scribe'],['strategist','Pulse']];
export default function LearningLab({nexus}){
 const [tab,setTab]=useState('sandbox'),[agent,setAgent]=useState(nexus.agent||'writer');
 if(!nexus.workspace)return <p className="p-5 text-xs text-muted-foreground">Connecting to your learning workspace…</p>;
 return <div className="p-5 space-y-4"><header className="space-y-2"><h2 className="font-heading text-lg">Learning Lab</h2><p className="text-xs text-muted-foreground">Experiment with actual learning, give agents reusable skills, and grow their reference library.</p><label className="block text-xs">Agent<select value={agent} onChange={e=>setAgent(e.target.value)} className="block mt-1 w-full rounded-md bg-secondary border border-border p-2">{agents.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label></header><nav aria-label="Learning Lab views" className="flex overflow-x-auto border-b border-border gap-4">{[['sandbox','Sandbox'],['skills','Skills'],['library','Library'],['models','Models'],['training','Training']].map(([id,label])=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)} className={'text-xs pb-2 border-b-2 '+(tab===id?'border-primary text-primary':'border-transparent text-muted-foreground')}>{label}</button>)}</nav>{tab==='sandbox'?<SandboxTab key={agent} workspace={nexus.workspace} agent={agent}/>:tab==='skills'?<SkillsTab key={agent} workspace={nexus.workspace} agent={agent}/>:tab==='models'?<ModelsTab nexus={nexus}/>:tab==='training'?<TrainingTab key={agent} workspace={nexus.workspace} agent={agent}/>:<LibraryTab workspace={nexus.workspace}/>}</div>;
}