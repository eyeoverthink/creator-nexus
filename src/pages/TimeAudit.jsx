import {Link} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {Tabs,TabsContent,TabsList,TabsTrigger} from '@/components/ui/tabs';
import AuditDayLog from '@/components/nexus/audit/AuditDayLog';
import LeakReport from '@/components/nexus/audit/LeakReport';
import IdeaFinderPanel from '@/components/nexus/ideas/IdeaFinderPanel';
export default function TimeAudit(){
 return <div className="min-h-[100dvh] bg-background text-foreground">
  <header className="border-b border-border bg-card px-4 md:px-8 py-4"><Link to="/agents" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft size={14}/>Agents</Link><h1 className="font-heading text-2xl font-semibold mt-1">Time audit & idea finder</h1><p className="text-sm text-muted-foreground">Track 2 days, find your 10-hour leak, put an agent on it, then turn your pain into 3 sellable ideas.</p></header>
  <main className="px-4 md:px-8 py-6"><Tabs defaultValue="log">
   <TabsList><TabsTrigger value="log">1 · Log</TabsTrigger><TabsTrigger value="leaks">2 · Leaks</TabsTrigger><TabsTrigger value="ideas">3 · Ideas</TabsTrigger></TabsList>
   <TabsContent value="log" className="pt-4"><AuditDayLog/></TabsContent>
   <TabsContent value="leaks" className="pt-4"><LeakReport/></TabsContent>
   <TabsContent value="ideas" className="pt-4"><IdeaFinderPanel/></TabsContent>
  </Tabs></main>
 </div>;
}