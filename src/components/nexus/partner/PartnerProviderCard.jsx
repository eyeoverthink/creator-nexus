import {Button} from '@/components/ui/button';
export default function PartnerProviderCard({provider,busy,disabled,onRefresh,onRemove}){
 const count=provider.models.length;
 return <div className="border border-border rounded p-3 text-sm min-w-0">
  <div className="flex flex-wrap justify-between gap-2"><span className="font-medium break-words">{provider.label}</span><span className="text-xs text-muted-foreground">key ••••{provider.api_key.slice(-4)}</span></div>
  <p className="text-xs text-muted-foreground mt-1 break-all">{provider.base_url}</p>
  <p className="text-xs text-muted-foreground mt-1">{count} model{count===1?'':'s'} available</p>
  <div className="flex flex-wrap gap-2 mt-3"><Button size="sm" variant="outline" disabled={disabled} onClick={onRefresh}>{busy?'Checking…':'Refresh models'}</Button><Button size="sm" variant="ghost" onClick={onRemove}>Remove</Button></div>
 </div>;
}