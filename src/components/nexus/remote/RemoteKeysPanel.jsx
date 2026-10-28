import {useState} from 'react';
import {Check,Copy,KeyRound,Loader2,Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import RemoteKeyList from '@/components/nexus/remote/RemoteKeyList';
import {remoteError} from '@/components/nexus/remote/useRemoteApi';
export default function RemoteKeysPanel({api}){
 const [label,setLabel]=useState(''),[copied,setCopied]=useState(false),created=api.create.data;
 const submit=e=>{e.preventDefault();api.create.mutate(label.trim()||'Remote key',{onSuccess:()=>setLabel('')});};
 const copy=()=>{navigator.clipboard?.writeText(created.key);setCopied(true);setTimeout(()=>setCopied(false),1800);};
 return <section className="p-4 rounded-lg border border-border bg-card space-y-3">
  <h3 className="text-sm font-semibold flex items-center gap-2"><KeyRound size={15} className="text-primary"/>Your remote keys</h3>
  <p className="text-xs text-muted-foreground leading-relaxed">A key lets a script, server or another app call your endpoint as you: read and export your material, save documents and files to your Library, and (for the app owner) generate ElevenLabs voice. It can never manage keys. Each key is shown once; only its fingerprint is stored.</p>
  <form onSubmit={submit} className="flex flex-wrap gap-2">
   <label className="sr-only" htmlFor="remote-key-label">Key name</label>
   <input id="remote-key-label" value={label} onChange={e=>setLabel(e.target.value)} maxLength={80} placeholder="Key name, e.g. My Windows PC" className="flex-1 min-w-[220px] h-9 rounded bg-background border border-input px-3 text-xs"/>
   <Button type="submit" size="sm" className="h-9 gap-1.5" disabled={api.create.isPending}>{api.create.isPending?<Loader2 size={14} className="animate-spin"/>:<Plus size={14}/>}Create key</Button>
  </form>
  {api.create.error&&<p role="alert" className="text-xs text-destructive">{remoteError(api.create.error)}</p>}
  {api.revoke.error&&<p role="alert" className="text-xs text-destructive">{remoteError(api.revoke.error)}</p>}
  {created&&<div className="p-3 rounded border border-caution bg-background space-y-2">
   <p className="text-xs font-semibold text-caution">Copy “{created.label}” now. It won’t be shown again.</p>
   <div className="flex flex-wrap items-center gap-2"><code className="flex-1 min-w-[260px] break-all text-xs p-2 rounded bg-secondary text-foreground">{created.key}</code><Button size="sm" variant="outline" onClick={copy} className="gap-1.5">{copied?<Check size={14}/>:<Copy size={14}/>}{copied?'Copied':'Copy key'}</Button></div>
  </div>}
  <RemoteKeyList api={api}/>
 </section>;
}