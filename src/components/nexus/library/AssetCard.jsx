import {Star,FileText,File,ArrowUpRight,MoreHorizontal} from 'lucide-react';
import {agents} from '@/components/nexus/library/libraryConstants';
export default function AssetCard({asset,onOpen,onFavorite,busy}){
 const Icon=asset.file_uri?File:FileText;
 return <article className="studio-asset-card rounded-xl border border-border bg-card p-5 flex flex-col gap-4 min-w-0">
  <div className="studio-card-visual" aria-hidden="true"><Icon size={48}/></div>
  <div className="flex justify-between items-start gap-3"><h2 className="font-heading text-xl break-words">{asset.title}</h2><details className="studio-card-menu"><summary aria-label={'More actions for '+asset.title}><MoreHorizontal size={20} aria-hidden="true"/></summary><button disabled={busy} onClick={()=>onFavorite(asset)} aria-pressed={!!asset.favorite} aria-label={(asset.favorite?'Remove from':'Add to')+' favorites: '+asset.title} className="flex gap-2 items-center text-sm py-3"><Star size={18} className={asset.favorite?'fill-primary text-primary':'text-muted-foreground'}/>{asset.favorite?'Remove favorite':'Add favorite'}</button></details></div>
  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{asset.body||asset.file_name||'Saved asset'}</p>
  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="bg-secondary rounded-full px-3 py-2">{asset.kind}</span><span className="py-2">Version {asset.version||1}</span>{asset.project&&<span className="py-2 truncate">{asset.project}</span>}</div>
  {!!asset.agent_ids?.length&&<p className="text-sm text-primary">{asset.agent_ids.map(id=>agents.find(a=>a[0]===id)?.[1]||id).join(' · ')}</p>}
  <div className="mt-auto pt-4 border-t border-border flex justify-between gap-3 items-center"><span className="text-xs text-muted-foreground">{new Date(asset.updated_date).toLocaleDateString()}</span><button onClick={()=>onOpen(asset)} className="studio-text-link">Open asset<ArrowUpRight size={16} aria-hidden="true"/></button></div>
 </article>;
}