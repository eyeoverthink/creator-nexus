import {useState} from 'react';
import useFraymusBrain from '@/components/nexus/brain/useFraymusBrain';
import BrainRunForm from '@/components/nexus/brain/BrainRunForm';
import BrainRunResult from '@/components/nexus/brain/BrainRunResult';
import BrainRunHistory from '@/components/nexus/brain/BrainRunHistory';
import CarbonPromptPanel from '@/components/nexus/brain/CarbonPromptPanel';
import FraymusAdapterStatus from '@/components/nexus/brain/FraymusAdapterStatus';
import FraymusBrainAnalysis from '@/components/nexus/brain/FraymusBrainAnalysis';
import NeedleWorkerPanel from '@/components/nexus/needle/NeedleWorkerPanel';
export default function FraymusBrainWorkbench({workspaceId}){
 const brain=useFraymusBrain(workspaceId),[tab,setTab]=useState('ledger');
 return <section aria-label="Fraymus Brain workbench" className="rounded-lg border border-border bg-card p-4 space-y-4 text-xs"><header className="space-y-2"><h3 className="font-heading text-base">Fraymus Brain · measured weight plane</h3><p className="text-muted-foreground">Supplied weights → bounded representation → independent byte round trip → explicit retention. Weight experiments remain separate from the explicitly paired local Needle3 runtime.</p></header><FraymusBrainAnalysis/><nav aria-label="Brain tools" className="flex flex-wrap gap-3">{[['ledger','Weight ledger'],['train','Vote trainer'],['carbon','Carbon prompt'],['needle','Needle3 worker']].map(([id,label])=><button key={id} onClick={()=>setTab(id)} aria-pressed={tab===id} className={tab===id?'text-primary underline py-2':'text-muted-foreground py-2'}>{label}</button>)}</nav>
 {brain.error&&<p role="alert" className="text-destructive">{brain.error}</p>}{!brain.scope&&brain.busy&&<p role="status">Loading your workspace…</p>}{tab==='needle'?<NeedleWorkerPanel workspaceId={brain.scope||workspaceId}/>:tab==='carbon'?<CarbonPromptPanel/>:brain.scope&&<BrainRunForm key={tab} kind={tab} busy={brain.busy} onRun={brain.run}/>}
 <BrainRunResult result={brain.result} busy={brain.busy} onSave={brain.save}/>{brain.scope&&<BrainRunHistory records={brain.records} hasMore={brain.hasMore} busy={brain.busy} onMore={brain.more} onOpen={brain.open}/>}<FraymusAdapterStatus/></section>;
}