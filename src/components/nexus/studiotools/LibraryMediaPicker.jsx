import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {field,signedUrl,toolError} from '@/components/nexus/studiotools/toolKit';
export default function LibraryMediaPicker({kind,onPick,disabled}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const items=useQuery({queryKey:['studio-tools','library',kind],queryFn:async()=>{const user=await base44.auth.me();const page=await base44.entities.NexusAsset.filter({owner_id:user.id,mime_type:{$regex:`^${kind}/`}},{sort:'-created_date',limit:40});return page.items.filter(i=>i.file_uri);},staleTime:60000});
 const list=items.data||[];
 const pick=async id=>{const item=list.find(i=>i.id===id);if(!item)return;setBusy(true);setError('');try{onPick({url:await signedUrl(item.file_uri),name:item.file_name||item.title,file_uri:item.file_uri,title:item.title});}catch(e){setError(toolError(e));}finally{setBusy(false);}};
 return <label className="block text-xs text-muted-foreground">Or pick from your Library
  <select className={field} disabled={disabled||busy||items.isPending} value="" onChange={e=>pick(e.target.value)}>
   <option value="">{items.isPending?'Loading…':list.length?`Choose one of ${list.length}…`:`No ${kind} files in your Library yet`}</option>
   {list.map(i=><option key={i.id} value={i.id}>{i.title}</option>)}
  </select>
  {(error||items.error)&&<span role="alert" className="text-destructive">{error||toolError(items.error)}</span>}
 </label>;
}