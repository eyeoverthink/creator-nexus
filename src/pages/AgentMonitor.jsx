import {Link} from 'react-router-dom';
import {useAuth} from '@/lib/AuthContext';
import ProShell from '@/components/nexus/ProShell';
import TaskMonitorBoard from '@/components/nexus/monitor/TaskMonitorBoard';
import PeerConnectionStatus from '@/components/nexus/monitor/PeerConnectionStatus';
import ContinuityJournal from '@/components/nexus/monitor/ContinuityJournal';
import FraymusLiveActivity from '@/components/nexus/monitor/FraymusLiveActivity';
export default function AgentMonitor(){
 const {user,isLoadingAuth}=useAuth();
 return <ProShell><main className="p-5 lg:p-8 max-w-7xl mx-auto space-y-6 pb-12">
  <header className="space-y-2"><p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Administration</p><h1 className="text-2xl font-heading">Agent monitor</h1><p className="text-sm text-muted-foreground">Reported agent focus and task progress, without digging through system logs.</p></header>
  {isLoadingAuth?<p role="status">Checking admin access…</p>:user?.role!=='admin'?<p role="alert">This view requires an admin account. <Link to="/" className="text-primary underline">Return home</Link></p>:<><FraymusLiveActivity/><PeerConnectionStatus/><ContinuityJournal/><TaskMonitorBoard/></>}
 </main></ProShell>;
}