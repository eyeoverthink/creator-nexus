import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {useRoster} from '@/components/nexus/agents/useStarterAgents';
import AgentPicker from '@/components/nexus/agents/AgentPicker';
import AgentWorkspace from '@/components/nexus/agents/AgentWorkspace';
const ORDER=['house_manager','content_engine','revenue_agent'];
export default function StarterAgents(){
 const roster=useRoster(),[key,setKey]=useState('house_manager');
 const agents=[...(roster.data?.agents||[])].sort((a,b)=>ORDER.indexOf(a.agent_key)-ORDER.indexOf(b.agent_key));
 const agent=agents.find(a=>a.agent_key===key)||agents[0];
 return <div className="min-h-[100dvh] bg-background text-foreground">
  <header className="border-b border-border bg-card px-4 md:px-8 py-4"><Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft size={14}/>Home</Link><h1 className="font-heading text-2xl font-semibold mt-1">Agents</h1><p className="text-sm text-muted-foreground">Outcome-driven agents with rules, memory and an approval gate. Targets are goals, not guarantees.</p></header>
  <main className="px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-6">
   {roster.isPending?<p role="status" className="text-muted-foreground">Loading agents…</p>:roster.error?<p role="alert" className="text-destructive">{roster.error.message}</p>:<>
    <aside className="lg:w-56 shrink-0"><AgentPicker agents={agents} value={agent?.agent_key} onChange={setKey}/></aside>
    <section className="flex-1 min-w-0">{agent&&<AgentWorkspace key={agent.agent_key} agent={agent} catalog={roster.data.catalog} caps={roster.data.capabilities}/>}</section>
   </>}
  </main>
 </div>;
}