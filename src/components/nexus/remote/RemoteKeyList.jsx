import {Button} from '@/components/ui/button';
import {remoteError} from '@/components/nexus/remote/useRemoteApi';
const when=value=>value?new Date(value.endsWith('Z')?value:value+'Z').toLocaleString():'';
export default function RemoteKeyList({api}){
 const {keys,revoke}=api;
 if(keys.isPending)return <p role="status" className="text-xs text-muted-foreground">Loading your keys…</p>;
 if(keys.error)return <p role="alert" className="text-xs text-destructive">{remoteError(keys.error)}</p>;
 const list=keys.data?.keys||[];
 if(!list.length)return <p className="text-xs text-muted-foreground">No keys yet. Create one to call your endpoint from another computer or app.</p>;
 return <ul className="divide-y divide-border rounded border border-border">
  {list.map(k=><li key={k.id} className="p-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
   <span className="font-medium text-foreground">{k.label}</span>
   <code className="text-muted-foreground">cnx_…{k.key_hint}</code>
   <span className="text-muted-foreground">Created {when(k.created_date)} · {k.last_used_at?`last used ${when(k.last_used_at)}`:'never used'}</span>
   {k.revoked?<span className="ml-auto text-muted-foreground">Revoked</span>:<Button size="sm" variant="outline" className="ml-auto" disabled={revoke.isPending} onClick={()=>{if(window.confirm(`Revoke “${k.label}”? Anything using this key stops working.`))revoke.mutate(k.id);}}>Revoke</Button>}
  </li>)}
 </ul>;
}