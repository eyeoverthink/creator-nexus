import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {base44} from '@/api/base44Client';
import useFraymusLiveActivity from '@/components/nexus/monitor/useFraymusLiveActivity';
import HiveRegistryTopology from '@/components/nexus/hive/HiveRegistryTopology';
import FraymusActivityEntries from '@/components/nexus/monitor/FraymusActivityEntries';
import BicameralTwinLab from '@/components/nexus/hive/BicameralTwinLab';
import WebScrapeEvolveLoop from '@/components/nexus/hive/WebScrapeEvolveLoop';
export default function HiveTelemetryMonitor({workspace}){
 const live=useFraymusLiveActivity(),[layout,setLayout]=useState(()=>localStorage.getItem('fraymus.hive.layout')==='spiral'),[review,setReview]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const optimizeLayout=()=>setLayout(value=>{localStorage.setItem('fraymus.hive.layout',value?'circle':'spiral');return !value;});
 const reviewWorkflows=async()=>{setError('');try{await live.refetch({throwOnError:true});setReview(true);}catch(e){setError(e.message);}};
 const expand=async()=>{const name=window.prompt('Name the new specialist profile:');if(!name?.trim())return;const role=window.prompt('What specific work should this specialist do?');if(!role?.trim())return;setBusy(true);setError('');try{const {data}=await base44.functions.invoke('openclawGateway',{action:'agent_spawn_specialist',name:name.trim(),role:role.trim(),initial_mission:role.trim(),run_llm:false,...(workspace?.id?{workspace_id:workspace.id}:{})});if(data.error||data.ok===false)throw new Error(data.error||'Profile creation failed.');await live.refetch({throwOnError:true});}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <section className="p-4 border border-border rounded-lg bg-card space-y-4 text-sm">
  <h3 className="font-heading font-semibold">Hive topology, task distribution & saved activity</h3>
  <div className="flex flex-wrap gap-2"><Button onClick={optimizeLayout} variant="outline">{layout?'Use circular layout':'Optimize node layout: spiral'}</Button><Button onClick={reviewWorkflows} variant="outline" disabled={live.isFetching}>Review workflow bottlenecks</Button><Button onClick={expand} variant="outline" disabled={busy}>{busy?'Saving profile…':'Expand Hive: create specialist'}</Button></div>
  <p className="text-xs text-muted-foreground">Layout changes the diagram only and is retained in this browser. Expansion saves a specialist profile; it does not claim to start a remote process. Hardware energy and throughput remain unreported without measurements.</p>
  {(error||live.error)&&<p role="alert" className="text-destructive">{error||live.error.message}</p>}
  {live.isPending?<p role="status">Loading saved telemetry…</p>:live.data&&<><HiveRegistryTopology agents={live.data.agents} spiral={layout}/><div className="flex flex-wrap gap-4">{live.data.job_counts.map(row=><span key={row.status}><strong>{row.count}</strong> {row.status}</span>)}</div>{review&&<p role="status">Queue review: {live.data.stale_running} claimed/running tasks have not reported in five minutes. Check worker availability and receipts in Agent monitor before treating them as executing. This review does not rewrite their status or manufacture completion.</p>}<FraymusActivityEntries entries={live.data.activity}/></>}
  <BicameralTwinLab workspace={workspace}/><WebScrapeEvolveLoop workspace={workspace} onEvolved={()=>live.refetch()}/>
 </section>;
}