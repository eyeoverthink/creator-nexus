import {useEffect,useState} from 'react';
import {useInfiniteQuery,useQueryClient,useMutation} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Plus,Star} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {assetScope,agents,fieldClass,escapeSearch} from '@/components/nexus/library/libraryConstants';
import AssetCard from '@/components/nexus/library/AssetCard';
import AssetForm from '@/components/nexus/library/AssetForm';
import AssetDialog from '@/components/nexus/library/AssetDialog';
import SourcePicker from '@/components/nexus/library/SourcePicker';
import AssetTypeChips from '@/components/nexus/library/AssetTypeChips';
import readLibraryPage from '@/components/nexus/library/readLibraryPage';
import LibraryVideoCard from '@/components/nexus/library/LibraryVideoCard';
export default function AssetBrowser({workspace}){
 const cache=useQueryClient(),[search,setSearch]=useState(''),[term,setTerm]=useState(''),[favorite,setFavorite]=useState(false),[kind,setKind]=useState(()=>new URLSearchParams(window.location.search).get('kind')==='videos'?'videos':'all'),[agent,setAgent]=useState('all'),[add,setAdd]=useState(false),[importing,setImporting]=useState(false),[selected,setSelected]=useState(null);
 useEffect(()=>{const timer=setTimeout(()=>setTerm(search.trim()),300);return()=>clearTimeout(timer);},[search]);
 const query={...assetScope(workspace),...(favorite?{favorite:true}:{}),...(kind==='all'?{}:{kind}),...(agent==='all'?{}:{agent_ids:agent}),...(term?{$or:['title','body','project'].map(field=>({[field]:{$regex:escapeSearch(term),$options:'i'}}))}:{})};
 const includeVideos=(kind==='all'||kind==='videos')&&!term&&!favorite&&agent==='all';
 const list=useInfiniteQuery({queryKey:['library-assets',workspace.id,query,'video-feed',kind],initialPageParam:undefined,queryFn:({pageParam})=>readLibraryPage({workspace,query,includeVideos,onlyVideos:kind==='videos',cursor:pageParam}),getNextPageParam:p=>p.has_more?p.next_cursor:undefined,refetchInterval:includeVideos?30000:false});
 const refresh=()=>cache.invalidateQueries({queryKey:['library-assets',workspace.id]});
 const star=useMutation({mutationFn:asset=>base44.entities.NexusAsset.update(asset.id,{favorite:!asset.favorite}),onSuccess:refresh});
 async function saved(asset){setAdd(false);if(asset)setSelected(asset);await Promise.all([refresh(),cache.invalidateQueries({queryKey:['asset-history']})]);}
 const rows=list.data?.pages.flatMap(p=>p.items)||[];
 return <section className="space-y-6">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-heading text-2xl">Assets</h2><p className="mt-2 text-sm text-muted-foreground">Assets, favorite references and project versions stay here between sessions.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setImporting(true)}>Import existing creations</Button><Button onClick={()=>setAdd(true)}><Plus size={16}/>Add asset</Button></div></div>
  {kind!=='videos'&&<div className="grid sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-end"><label className="text-xs text-muted-foreground">Search title, text or project<input type="search" maxLength={120} value={search} onChange={e=>setSearch(e.target.value)} className={fieldClass} placeholder="Find a script, idea or project…"/></label><label className="text-xs text-muted-foreground">Assigned agent<select value={agent} onChange={e=>setAgent(e.target.value)} className={fieldClass}><option value="all">All agents</option>{agents.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><Button variant={favorite?'secondary':'outline'} aria-pressed={favorite} className="h-11" onClick={()=>setFavorite(!favorite)}><Star size={16}/>Favorites</Button></div>}
  <AssetTypeChips value={kind} onChange={value=>{setKind(value);if(value==='videos'){setSearch('');setTerm('');setFavorite(false);setAgent('all');}}}/>
   {kind==='all'&&!includeVideos&&<p className="text-xs text-muted-foreground">Search, agent and Favorites filters apply to saved assets. Clear them to include videos.</p>}
  {list.isPending&&<p role="status" className="text-sm text-muted-foreground">Loading your library…</p>}{(list.error||star.error)&&<p role="alert" className="text-sm text-destructive">{(list.error||star.error).message}</p>}
  {!list.isPending&&!list.error&&!rows.length&&<div className="rounded-xl border border-dashed border-border py-16 px-6 text-center"><h3 className="font-heading text-xl">{list.hasNextPage?'More history available':kind==='videos'?'No videos yet':term||favorite||kind!=='all'||agent!=='all'?'No matching assets':'No assets yet'}</h3><p className="text-sm text-muted-foreground mt-3">{list.hasNextPage?'Use Load more to continue browsing.':kind==='videos'?'Finished videos appear here after they are saved to the app.':favorite?'Star any asset to build your favorites list.':'Import existing Spark creations, upload media, or save a document to start your library.'}</p></div>}
  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] items-start gap-4">{rows.map(row=>row.type==='video'?<LibraryVideoCard key={'video:'+row.id} video={row}/>:<AssetCard key={'asset:'+row.id} asset={row.asset} onOpen={setSelected} onFavorite={item=>star.mutate(item)} busy={star.isPending}/>)}</div>
  {list.hasNextPage&&<Button variant="outline" disabled={list.isFetchingNextPage} onClick={()=>list.fetchNextPage()}>{list.isFetchingNextPage?'Loading…':'Load more'}</Button>}
  {add&&<Dialog open onOpenChange={setAdd}><DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Add to your library</DialogTitle><DialogDescription>Save a document or upload private media, then assign it to a project and agents.</DialogDescription></DialogHeader><AssetForm workspace={workspace} onSaved={saved}/></DialogContent></Dialog>}
  {selected&&<AssetDialog key={selected.id+':'+selected.version} workspace={workspace} asset={selected} onClose={()=>setSelected(null)} onSaved={saved}/>}
  {importing&&<SourcePicker workspace={workspace} onClose={()=>setImporting(false)} onSaved={refresh}/>}
 </section>;
}