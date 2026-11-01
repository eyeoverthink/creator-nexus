import useRemoteApi from '@/components/nexus/remote/useRemoteApi';
import RemoteKeysPanel from '@/components/nexus/remote/RemoteKeysPanel';
import RemoteApiDocs from '@/components/nexus/remote/RemoteApiDocs';
import LocalExportPanel from '@/components/nexus/remote/LocalExportPanel';
export default function RemoteAccessSection(){
 const api=useRemoteApi();
 return <section id="remote-api" aria-labelledby="remote-api-title" className="space-y-3 pt-2">
  <div><h2 id="remote-api-title" className="text-base font-semibold text-foreground">Remote API &amp; local export</h2><p className="text-xs text-muted-foreground mt-1">Call Creator Nexus from your own computer, server or apps with a personal key, and save everything you made here to your own drive.</p></div>
  <RemoteKeysPanel api={api}/>
  <RemoteApiDocs endpoint={api.endpoint}/>
  <LocalExportPanel api={api}/>
 </section>;
}