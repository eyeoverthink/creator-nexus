export default function AgentMetrics({counts,lastRun}){
 const c=counts.data||{};
 const items=[['Runs',c.runs],['Drafts',c.drafts],['Pending approvals',c.pending],['Executed',c.executed],['Blocked',c.blocked],[lastRun?.metric?.label||'Last metric',lastRun?.metric?.value]];
 return <div className="grid grid-cols-3 md:grid-cols-6 gap-2">{items.map(([l,v])=><div key={l} className="rounded-lg border border-border bg-card p-3"><p className="text-[11px] text-muted-foreground truncate" title={l}>{l}</p><p className="text-lg font-semibold tabular-nums truncate">{v??'—'}</p></div>)}</div>;
}