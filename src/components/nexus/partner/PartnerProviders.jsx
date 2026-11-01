import {useState} from 'react';
import {Button} from '@/components/ui/button';
import PartnerProviderCard from '@/components/nexus/partner/PartnerProviderCard';
import PartnerProviderForm from '@/components/nexus/partner/PartnerProviderForm';
import {findProviderModels} from '@/components/nexus/partner/fraymusPartnerCloud';
export default function PartnerProviders({partner}){
 const providers=partner.state.providers,[adding,setAdding]=useState(false),[checking,setChecking]=useState(''),[error,setError]=useState('');
 const add=provider=>{partner.setState(s=>({...s,providers:[...s.providers,provider],profile:!s.profile.providerId&&!s.profile.model?{...s.profile,providerId:provider.id,model:provider.models[0]}:s.profile}));setAdding(false);};
 const refresh=async provider=>{setChecking(provider.id);setError('');try{const models=await findProviderModels(provider);partner.setState(s=>({...s,providers:s.providers.map(x=>x.id===provider.id?{...x,models}:x)}));}catch(e){setError(`${provider.label}: ${e.message}`);}finally{setChecking('');}};
 const remove=provider=>{if(window.confirm(`Remove ${provider.label} and its saved key from this browser?`))partner.setState(s=>({...s,providers:s.providers.filter(x=>x.id!==provider.id),profile:s.profile.providerId===provider.id?{...s.profile,providerId:'',model:''}:s.profile}));};
 return <section className="space-y-3 border-t border-border pt-5">
  <h3 className="font-heading text-base">Model accounts</h3>
  <p className="text-xs text-muted-foreground">Add each Ollama Cloud membership or other AI service with its API key or OAuth access token. Keys are saved only in this browser, are never included in exports, and are sent only to your app's server for each request.</p>
  {providers.map(x=><PartnerProviderCard key={x.id} provider={x} busy={checking===x.id} disabled={!!checking} onRefresh={()=>refresh(x)} onRemove={()=>remove(x)}/>)}
  {error&&<p role="alert" className="text-destructive text-sm">{error}</p>}
  {adding?<PartnerProviderForm count={providers.length} onSave={add} onCancel={()=>setAdding(false)}/>:<Button variant="outline" disabled={providers.length>=20} onClick={()=>setAdding(true)}>Add a model account</Button>}
 </section>;
}