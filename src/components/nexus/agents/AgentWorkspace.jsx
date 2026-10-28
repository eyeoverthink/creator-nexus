import {Tabs,TabsContent,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {useAgentRecords,useAgentMutations} from '@/components/nexus/agents/useStarterAgents';
import AgentMetrics from '@/components/nexus/agents/AgentMetrics';
import AgentBrief from '@/components/nexus/agents/AgentBrief';
import RunPanel from '@/components/nexus/agents/RunPanel';
import ApprovalsList from '@/components/nexus/agents/ApprovalsList';
import DraftsList from '@/components/nexus/agents/DraftsList';
import MemoryPanel from '@/components/nexus/agents/MemoryPanel';
import HistoryPanel from '@/components/nexus/agents/HistoryPanel';
export default function AgentWorkspace({agent,catalog,caps}){
 const rec=useAgentRecords(agent.agent_key),m=useAgentMutations(agent.agent_key),lastRun=rec.runs.data?.[0];
 const pending=rec.counts.data?.pending;
 return <div className="space-y-5 min-w-0">
  <header><h2 className="text-xl font-semibold">{agent.name}</h2><p className="text-sm text-muted-foreground mt-1">{agent.outcome}</p></header>
  <AgentMetrics counts={rec.counts} lastRun={lastRun}/>
  <Tabs defaultValue="run">
   <TabsList className="flex-wrap h-auto"><TabsTrigger value="run">Run</TabsTrigger><TabsTrigger value="approvals">Approvals{pending?` · ${pending}`:''}</TabsTrigger><TabsTrigger value="drafts">Drafts</TabsTrigger><TabsTrigger value="brief">Brief</TabsTrigger><TabsTrigger value="memory">Memory</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
   <TabsContent value="run" className="pt-4"><RunPanel agent={agent} run={m.run} lastRun={lastRun}/></TabsContent>
   <TabsContent value="approvals" className="pt-4"><ApprovalsList actions={rec.actions} decide={m.decide}/></TabsContent>
   <TabsContent value="drafts" className="pt-4"><DraftsList drafts={rec.drafts}/></TabsContent>
   <TabsContent value="brief" className="pt-4"><AgentBrief agent={agent} catalog={catalog} caps={caps} save={m.save}/></TabsContent>
   <TabsContent value="memory" className="pt-4"><MemoryPanel agent={agent} save={m.save}/></TabsContent>
   <TabsContent value="history" className="pt-4"><HistoryPanel runs={rec.runs} audit={rec.audit}/></TabsContent>
  </Tabs>
 </div>;
}