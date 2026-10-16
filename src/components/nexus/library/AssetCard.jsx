import {Star,FileText,File,ArrowUpRight} from 'lucide-react';
import {agents} from '@/components/nexus/library/libraryConstants';
export default function AssetCard({asset,onOpen,onFavorite,busy}){
 const Icon=asset.file_uri?File:FileText;
 return <article className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 min-w-0">
  <div className="flex items-center justify-between"><span className="rounded-lg bg-secondary p-2 text-primary"><Icon size={19}/></span><button disabled={busy} onClick={()=>onFavorite(asset)} aria-pressed={!!asset.favorite} aria-label={(asset.favorite?'Remove from':'Add to')+' favorites: '+asset.title} className="p-2 rounded-md hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"><Star size={18} className={asset.favorite?'fill-primary text-primary':'text-muted-foreground'}/></button></div>
  <button onClick={()=>onOpen(asset)} className="text-left space-y-2 group"><h2 className="font-heading text-lg leading-snug group-hover:text-primary break-words">{asset.title}</h2><p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{asset.body||asset.file_name||'Saved asset'}</p></button>
  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground"><span className="bg-secondary rounded px-2 py-1">{asset.kind}</span><span className="py-1">Version {asset.version||1}</span>{asset.project&&<span className="py-1 truncate">{asset.project}</span>}</div>
  {!!asset.agent_ids?.length&&<p className="text-xs text-primary">{asset.agent_ids.map(id=>agents.find(a=>a[0]===id)?.[1]||id).join(' · ')}</p>}
  <div className="mt-auto pt-3 border-t border-border flex justify-between gap-3 items-center"><span className="text-[11px] text-muted-foreground">{new Date(asset.updated_date).toLocaleDateString()}</span><button onClick={()=>onOpen(asset)} className="text-xs text-primary flex items-center gap-1">Open asset<ArrowUpRight size={13}/></button></div>
 </article>;
}