import ProposalCard from '@/components/nexus/review/ProposalCard';
export default function DraftSuggestions({nexus,blocked}){
 const proposals=nexus.state?.proposals||[];
 if(!proposals.length)return null;
 return <section aria-label="Draft suggestions" className="shrink-0 max-h-[48%] overflow-y-auto border-b border-border p-3 bg-secondary/30"><h2 className="font-heading text-sm mb-2" aria-live="polite">Draft suggestions · {proposals.length}</h2><p className="text-[10px] text-muted-foreground mb-3">Your draft stays unchanged until you accept. Up to 8 proposals can wait for review.</p><div className="space-y-3">{proposals.map(p=><ProposalCard key={p.id} proposal={p} nexus={nexus} blocked={blocked}/>)}</div></section>;
}