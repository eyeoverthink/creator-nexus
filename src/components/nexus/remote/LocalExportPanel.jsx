import {useState} from 'react';
import {Download,FileJson,Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {remoteError} from '@/components/nexus/remote/useRemoteApi';
import {downloadMaterial} from '@/components/nexus/remote/downloadMaterial';
import {downloadSaveScript} from '@/components/nexus/remote/remoteSaveScript';
export default function LocalExportPanel({api}){
 const [busy,setBusy]=useState(''),[progress,setProgress]=useState(0),[error,setError]=useState(''),[done,setDone]=useState('');
 const types=api.catalog.data?.types||[];
 const run=async t=>{setBusy(t.type);setProgress(0);setError('');setDone('');try{const n=await downloadMaterial(t.type,setProgress);setDone(`Saved ${n.toLocaleString()} ${t.label.toLowerCase()} as a JSON file.`);}catch(e){setError(remoteError(e));}finally{setBusy('');}};
 return <section className="p-4 rounded-lg border border-border bg-card space-y-3">
  <h3 className="text-sm font-semibold flex items-center gap-2"><FileJson size={15} className="text-primary"/>Save your material locally</h3>
  <p className="text-xs text-muted-foreground leading-relaxed">Download any type below as a JSON file now. To copy everything, including audio, video and images, into a folder on your computer, download the local save script and run it with one of your keys.</p>
  {api.catalog.isPending?<p role="status" className="text-xs text-muted-foreground">Counting your material…</p>:api.catalog.error?<p role="alert" className="text-xs text-destructive">{remoteError(api.catalog.error)}</p>:<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{types.map(t=><button key={t.type} type="button" disabled={!!busy||!t.count} onClick={()=>run(t)} className="p-3 rounded border border-border bg-background text-left hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"><strong className="block text-sm text-foreground">{t.label}</strong><span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">{busy===t.type?<><Loader2 size={12} className="animate-spin"/>Downloading {progress.toLocaleString()} of {(t.count||0).toLocaleString()}…</>:<><Download size={12}/>{(t.count||0).toLocaleString()} items · JSON</>}</span></button>)}</div>}
  {error&&<p role="alert" className="text-xs text-destructive">{error}</p>}
  {done&&<p role="status" className="text-xs text-success">{done}</p>}
  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border"><Button size="sm" variant="outline" className="gap-1.5" onClick={()=>downloadSaveScript(api.endpoint)}><Download size={14}/>Download local save script</Button><code className="text-[11px] text-muted-foreground break-all">python creator_nexus_save.py --key YOUR_KEY</code></div>
 </section>;
}