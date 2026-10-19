import ReactMarkdown from 'react-markdown';
import {BarChart3} from 'lucide-react';
import AgentPresence from '@/components/nexus/AgentPresence';
import RegressionPanel from '@/components/nexus/regression/RegressionPanel';
import FraymusStudioTelemetry from '@/components/nexus/FraymusStudioTelemetry';
export default function PerformancePanel({nexus}) {
 const report=nexus.state?.events.find(event=>event.agent==='strategist'&&event.kind==='note');
 return <div><AgentPresence agentId="strategist" nexus={nexus}/><div className="p-5 space-y-5"><p className="eyebrow">PERFORMANCE &amp; FRAYMUS TELEMETRY LENS</p><FraymusStudioTelemetry workspace={nexus.workspace}/><RegressionPanel workspace={nexus.workspace} source="behavior"/>{report?<><p className="text-[9px] text-muted-foreground mb-3">Draft review · {new Date(report.time).toLocaleString()}</p><ReactMarkdown className="nexus-markdown">{report.body||report.message}</ReactMarkdown></>:<div className="text-center py-5"><BarChart3 size={25} className="mx-auto mb-3 text-agent-purple"/><h2 className="font-display text-lg">Make every draft more intentional.</h2><p className="text-xs text-muted-foreground leading-relaxed mt-3">Ask Pulse to review your hook, audience fit, and next experiment. The report will appear here.</p></div>}</div></div>;
}