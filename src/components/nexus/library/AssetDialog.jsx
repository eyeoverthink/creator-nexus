import {useState} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import AssetForm from '@/components/nexus/library/AssetForm';
import AssetPreview from '@/components/nexus/library/AssetPreview';
import AssetHistory from '@/components/nexus/library/AssetHistory';
import {libraryCall,exportAsset} from '@/components/nexus/library/libraryClient';
export default function AssetDialog({workspace,asset,onClose,onSaved}){
 const [tab,setTab]=useState('preview'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function refresh(){setBusy(true);setError('');try{const data=await libraryCall(workspace,{action:'capture',entity:asset.source_entity,source_id:asset.source_id});onSaved(data.asset);}catch(e){setError(e.response?.data?.error||e.message);}finally{setBusy(false);}}
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle className="font-heading text-xl break-words">{asset.title}</DialogTitle><DialogDescription>Version {asset.version||1} · {asset.project||'No project assigned'} · saved in your workspace</DialogDescription></DialogHeader><nav aria-label="Asset details" className="flex gap-2 border-b border-border pb-3">{['preview','edit','history'].map(id=><Button key={id} variant={tab===id?'secondary':'ghost'} size="sm" aria-pressed={tab===id} onClick={()=>setTab(id)}>{id==='edit'?'Edit & assign':id==='history'?'Version history':'Preview'}</Button>)}</nav>
  {tab==='preview'&&<div className="space-y-4"><AssetPreview asset={asset}/><div className="flex flex-wrap gap-3">{asset.body&&<Button variant="outline" size="sm" onClick={()=>exportAsset(asset)}>Download text</Button>}{asset.source_id&&<Button variant="outline" size="sm" disabled={busy} onClick={refresh}>{busy?'Checking source…':'Capture latest source'}</Button>}</div>{asset.source_id&&<p className="text-xs text-muted-foreground">Imported text is a saved snapshot. Capturing the latest source replaces the text only if the source has changed, while retaining previous versions and your assignments.</p>}{error&&<p role="alert" className="text-destructive text-sm">{error}</p>}</div>}
  {tab==='edit'&&<AssetForm workspace={workspace} asset={asset} onSaved={onSaved}/>}
  {tab==='history'&&<AssetHistory workspace={workspace} asset={asset}/>}
 </DialogContent></Dialog>;
}