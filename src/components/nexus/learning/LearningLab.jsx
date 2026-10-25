import {useState} from 'react';
import SandboxTab from '@/components/nexus/learning/SandboxTab';
import SkillsTab from '@/components/nexus/learning/SkillsTab';
import LibraryTab from '@/components/nexus/learning/LibraryTab';
import ModelsTab from '@/components/nexus/models/ModelsTab';
import TrainingTab from '@/components/nexus/learning/TrainingTab';
import RegressionPanel from '@/components/nexus/regression/RegressionPanel';
import WebScrapeEvolveLoop from '@/components/nexus/hive/WebScrapeEvolveLoop';
import AcademyPipelineAlignmentPanel from '@/components/nexus/learning/AcademyPipelineAlignmentPanel';
const agents=[
 ['researcher','1. Scout, Sera & Spearhead (spearhead_frontier_scout · 38/38 Skills)'],
 ['writer','2. Scribe & Lyra (sovereign_skill_fleet · 38/38 Skills)'],
 ['strategist','3. Pulse, Orin & Commander (openclaw_commander · 38/38 Skills)'],
 ['director','4. Director & Vesper (creative_production_auteur · 38/38 Skills)'],
 ['witness','5. The Witness & Conductor (witness_conductor · 38/38 Skills)'],
];
export default function LearningLab({nexus}){
 const [tab,setTab]=useState('evolve'),[agent,setAgent]=useState(nexus.agent||'writer');
 if(!nexus.workspace)return <p className="p-5 text-xs text-muted-foreground">Connecting to your learning workspace…</p>;
 return <div className="p-5 space-y-4"><AcademyPipelineAlignmentPanel workspaceId={nexus.workspace?.id}/><header className="space-y-2"><h2 className="font-heading text-lg">Learning Lab &amp; Academy</h2><p className="text-xs text-muted-foreground">Scrape webpages to synthesize code and designs, experiment with learning, give agents reusable skills, and grow their reference library.</p><label className="block text-xs">Agent<select value={agent} onChange={e=>setAgent(e.target.value)} className="block mt-1 w-full rounded-md bg-secondary border border-border p-2">{agents.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label></header><nav aria-label="Learning Lab views" className="flex overflow-x-auto border-b border-border gap-4">{[['evolve','Web Evolve Loop'],['sandbox','Sandbox'],['regression','Regression'],['skills','Skills'],['library','Library'],['models','Models'],['training','Training']].map(([id,label])=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)} className={'text-xs pb-2 whitespace-nowrap border-b-2 '+(tab===id?'border-primary text-primary':'border-transparent text-muted-foreground')}>{label}</button>)}</nav>{tab==='evolve'?<WebScrapeEvolveLoop workspace={nexus.workspace} nexus={nexus}/>:tab==='regression'?<RegressionPanel key={agent} workspace={nexus.workspace} source="sandbox" agent={agent}/>:tab==='sandbox'?<SandboxTab key={agent} workspace={nexus.workspace} agent={agent}/>:tab==='skills'?<SkillsTab key={agent} workspace={nexus.workspace} agent={agent}/>:tab==='models'?<ModelsTab nexus={nexus}/>:tab==='training'?<TrainingTab key={agent} workspace={nexus.workspace} agent={agent}/>:<LibraryTab workspace={nexus.workspace}/>}</div>;
}