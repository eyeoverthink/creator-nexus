import {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import AssociativeMemoryResult from '@/components/nexus/brain/AssociativeMemoryResult';
export default function AssociativeMemoryPanel({workspaceId}){
 const cache=useQueryClient();
 const [text,setText]=useState(''),[label,setLabel]=useState(''),[threshold,setThreshold]=useState('0.15');
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[result,setResult]=useState(null);
 async function run(action){
  setBusy(action);setError('');setResult(null);
  try{
   if(!text.trim())throw new Error('Enter text to remember or recall.');
   if(action==='memory_learn'&&!label.trim())throw new Error('Give this memory an explicit label.');
   const response=await base44.functions.invoke('fraymusBrain',{action,workspace_id:workspaceId,text,label,minimum_similarity:Number(threshold)});
   if(response.data.error)throw new Error(response.data.error);
   setResult(response.data.result);
   if(response.data.result.committed)await cache.invalidateQueries({queryKey:['library-assets',workspaceId]});
  }catch(reason){setError(reason.response?.data?.error||reason.message||'Memory operation failed.');}finally{setBusy('');}
 }
 return <section aria-label="Vector associative memory" className="space-y-3">
  <h4 className="font-heading text-base">Fraymus vector associative memory</h4>
  <p className="text-muted-foreground">Save explicitly labeled memories, then recall related wording with 4,096-dimensional word/bigram hypervectors. This does not train a model or provide semantic understanding. Existing prototype memory is unchanged.</p>
  <form className="space-y-3" onSubmit={event=>{event.preventDefault();run('memory_recall');}}>
   <label className="block space-y-1"><span>Memory text or recall query (up to 128 words)</span><textarea required maxLength={2000} rows={4} value={text} onChange={event=>setText(event.target.value)} className="w-full rounded-md border border-input bg-background p-3"/></label>
   <div className="grid sm:grid-cols-2 gap-3"><label className="block space-y-1"><span>Label (required when saving)</span><input maxLength={60} value={label} onChange={event=>setLabel(event.target.value)} className="w-full rounded-md border border-input bg-background p-2"/></label><label className="block space-y-1"><span>Minimum similarity (−1 to 1)</span><input required type="number" min="-1" max="1" step="0.01" value={threshold} onChange={event=>setThreshold(event.target.value)} className="w-full rounded-md border border-input bg-background p-2"/></label></div>
   <div className="flex flex-wrap gap-2"><Button type="submit" disabled={!!busy||!workspaceId}>{busy==='memory_recall'?'Recalling…':'Recall memories'}</Button><Button type="button" variant="outline" disabled={!!busy||!workspaceId} onClick={()=>run('memory_learn')}>{busy==='memory_learn'?'Saving…':'Save labeled memory'}</Button></div>
  </form>
  {!workspaceId&&<p role="status">Select or load your workspace to use memory.</p>}
  {error&&<p role="alert" className="text-destructive">{error}</p>}
  <AssociativeMemoryResult result={result}/>
  <p className="text-muted-foreground">Each saved entry is independent, so concurrent saves do not overwrite a shared prototype. Recall searches the latest 128 entries in your workspace.</p>
  <Link to="/library" className="text-primary underline inline-block">Open saved memories and the public-source REA report in Library</Link>
 </section>;
}