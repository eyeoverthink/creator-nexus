import {useState} from 'react';
import {Button} from '@/components/ui/button';
import AgentAssignment from '@/components/nexus/library/AgentAssignment';
import {fieldClass,acceptedFiles} from '@/components/nexus/library/libraryConstants';
import {libraryCall,uploadAssetFile} from '@/components/nexus/library/libraryClient';
export default function AssetForm({workspace,asset,onSaved}){
 const [form,setForm]=useState({title:asset?.title||'',body:asset?.body||'',project:asset?.project||'',agent_ids:asset?.agent_ids||[]}),[file,setFile]=useState(null),[uploaded,setUploaded]=useState(null),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const set=(key,value)=>setForm(f=>({...f,[key]:value}));
 async function save(e){e.preventDefault();setBusy(true);setError('');try{let media=uploaded;if(file&&!media){media=await uploadAssetFile(file);setUploaded(media);}const data=await libraryCall(workspace,{action:'save',asset_id:asset?.id,version:asset?.version,asset:{...form,...(media||{})},note:note||(!asset?'Added to library':'Updated asset')});onSaved(data.asset);}catch(e){setError(e.response?.data?.error||e.message);}finally{setBusy(false);}}
 return <form onSubmit={save} className="space-y-5"><fieldset disabled={busy} className="space-y-5">
  <label className="block text-sm">Asset title<input required maxLength={160} value={form.title} onChange={e=>set('title',e.target.value)} className={fieldClass}/></label>
  <label className="block text-sm">{asset?.file_uri||file?'Description & context for agents':'Document text / description'}<textarea maxLength={20000} rows={7} value={form.body} onChange={e=>set('body',e.target.value)} className={fieldClass}/></label>
  <label className="block text-sm">{asset?.file_uri?'Replace media (optional)':'Upload media (optional)'}<input type="file" accept={acceptedFiles} onChange={e=>{setFile(e.target.files?.[0]||null);setUploaded(null);}} className="block mt-2 w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:text-foreground file:p-2"/><span className="block text-xs text-muted-foreground mt-2">Up to 50 MB per file, stored privately. Older media remains available in version history.</span></label>
  <label className="block text-sm">Project / collection<input maxLength={160} value={form.project} placeholder="For example, Fisher-Price DJ project" onChange={e=>set('project',e.target.value)} className={fieldClass}/></label>
  <AgentAssignment value={form.agent_ids} onChange={value=>set('agent_ids',value)}/>
  {asset&&<label className="block text-sm">Version note<input maxLength={300} value={note} onChange={e=>setNote(e.target.value)} className={fieldClass}/></label>}
 </fieldset>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={busy}>{busy?(file&&!uploaded?'Uploading & saving…':'Saving…'):asset?'Save new version':'Save to library'}</Button></form>;
}