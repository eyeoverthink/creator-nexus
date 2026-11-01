import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
export default function PeerConnectionStatus(){
 const query=useQuery({queryKey:['agent-monitor','peer-connection'],queryFn:async()=>{const response=await base44.functions.invoke('orificeBridge',{action:'agent_monitor_connection'});return response.data;},staleTime:60000,retry:false,refetchOnWindowFocus:false});
 const data=query.data;
 return <section aria-label="App-to-app connection" className="rounded-lg border border-border bg-card p-4 space-y-2">
  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-heading">Creator Nexus → Fraymus Eternal</h2><Button variant="outline" size="sm" disabled={query.isFetching} onClick={()=>query.refetch()}>{query.isFetching?'Checking…':'Check connection'}</Button></div>
  {query.isPending&&<p role="status" className="text-sm text-muted-foreground">Checking the existing peer endpoint…</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Connection check failed. Any result below is from the previous check.</p>}
  {data&&<><p className={data.protocol_confirmed?'text-sm text-success':'text-sm text-caution'}>{data.protocol_confirmed?'Peer protocol reachable':data.reachable?'HTTP response received; protocol unconfirmed':'Peer connection unconfirmed'}{data.http_status?` · HTTP ${data.http_status}`:''}{Number.isFinite(data.round_trip_ms)?` · ${data.round_trip_ms} ms`:''}</p><p className="text-xs text-muted-foreground">{data.note}</p><p className="text-xs text-muted-foreground">Checked <time dateTime={data.checked_at}>{new Date(data.checked_at).toLocaleString()}</time>. Check again for a current result.</p></>}
 </section>;
}