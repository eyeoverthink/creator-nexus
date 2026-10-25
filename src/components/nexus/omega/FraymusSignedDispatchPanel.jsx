import {useId,useState} from 'react';
import {useFraymus} from '@/lib/FraymusContext';
import useWorkspaceAccess from '@/components/nexus/useWorkspaceAccess';
import {Button} from '@/components/ui/button';
import FraymusDispatchKeys from '@/components/nexus/omega/FraymusDispatchKeys';
import FraymusDispatchInbox from '@/components/nexus/omega/FraymusDispatchInbox';
import useFraymusDispatch from '@/components/nexus/omega/useFraymusDispatch';
export default function FraymusSignedDispatchPanel(){
 const {workspace,boot}=useWorkspaceAccess(),{visitor}=useFraymus(),id=useId();
 const [subject,setSubject]=useState(''),[text,setText]=useState('');
 const {data,busy,error,result,trust,revoke,send,more}=useFraymusDispatch(workspace?.id,visitor);
 if(boot.isLoading)return <p role="status">Loading signed dispatch…</p>;
 if(!workspace)return <p className="text-muted-foreground">Open a workspace to use signed dispatch.</p>;
 const trusted=data.trusted_keys.some(k=>k.public_key===visitor?.public);
 return <section className="border border-border rounded-md bg-background p-4 space-y-4 text-sm font-body">
  <div><h3 className="font-heading">Fraymus Signed Dispatch</h3><p className="text-muted-foreground">Pinned sender keys, signed program hashes and five-minute one-use challenges. This workspace accepts artifacts for review only, never execution.</p></div>
  <FraymusDispatchKeys visitor={visitor} keys={data.trusted_keys} busy={busy} onTrust={trust} onRevoke={revoke}/>
  <form className="space-y-2" onSubmit={e=>{e.preventDefault();send(subject,text);}}>
   <label className="block" htmlFor={`${id}-subject`}>Dispatch Subject</label><input id={`${id}-subject`} className="w-full rounded-md border border-input bg-card p-2" value={subject} onChange={e=>setSubject(e.target.value)} maxLength={160} required disabled={busy}/>
   <label className="block" htmlFor={`${id}-payload`}>Artifact Text or HTML, Stored Without Running</label><textarea id={`${id}-payload`} className="w-full rounded-md border border-input bg-card p-2 font-mono" rows={3} maxLength={8192} value={text} onChange={e=>setText(e.target.value)} required disabled={busy}/>
   <Button type="submit" disabled={busy||!trusted||!subject.trim()||!text.trim()}>{busy?'Working…':'Sign and Save for Review'}</Button>
  </form>
  {error&&<p role="alert" className="text-destructive">{error}</p>}
  {result&&<p role="status" className="text-success break-all">Accepted for review. Signature, Merkle leaves, pinned key and one-use challenge verified. Nothing executed. Receipt: {result.receipt_id}</p>}
  <FraymusDispatchInbox items={data.receipts} hasMore={data.has_more} busy={busy} onMore={more}/>
 </section>;
}