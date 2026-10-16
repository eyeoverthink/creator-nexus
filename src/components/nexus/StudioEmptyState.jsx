import {Layers3,LoaderCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';

export default function StudioEmptyState({phase,creating,error,onCreate,onRetry}){
 const loading=phase==='loading';
 return <section aria-labelledby="empty-studio-heading" aria-busy={loading||creating} className="h-full flex flex-col items-center justify-center gap-4 text-center px-4">
  {loading&&<LoaderCircle size={24} className="text-muted-foreground animate-spin" aria-hidden="true"/>}
  <div aria-live="polite">
   <h2 id="empty-studio-heading" className="font-heading text-lg">{loading?'Opening studio…':phase==='error'?'Studio could not be opened':phase==='draft_missing'?'No draft in this workspace':'No workspace yet'}</h2>
   {!loading&&phase!=='error'&&<p className="text-sm text-muted-foreground mt-2">{phase==='draft_missing'?'Create a draft to open the studio.':'Create a workspace to begin.'}</p>}
  </div>
  {error&&<p role="alert" className="text-sm text-destructive max-w-md">{error}</p>}
  {(phase==='empty'||phase==='draft_missing')&&<Button className="h-10" onClick={onCreate} disabled={creating}>{creating&&<LoaderCircle className="animate-spin" aria-hidden="true"/>}{creating?'Creating…':phase==='draft_missing'?'Create draft':'Create workspace'}</Button>}
  {phase==='error'&&<Button variant="outline" onClick={onRetry}>Retry loading studio</Button>}
 </section>;
}