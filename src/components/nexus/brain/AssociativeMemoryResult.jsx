export default function AssociativeMemoryResult({result}){
 if(!result)return null;
 return <div className="space-y-3 border-t border-border pt-3" aria-live="polite">
  <p className="font-medium">{result.committed?'Memory saved to Library':result.status==='preview'?'Memory preview':'Recall complete'} · {result.dimensions.toLocaleString()} dimensions · {result.packed_bytes} vector bytes</p>
  <p className="text-muted-foreground">{result.notice}</p>
  {result.status!=='learned'&&<p className="text-muted-foreground">{result.searched_entries??0} entries searched · Similarity threshold {result.minimum_similarity??0.15}</p>}
  {result.search_truncated&&<p className="text-caution">Only the latest 128 entries were searched; older entries remain saved.</p>}
  {result.invalid_entries>0&&<p role="alert" className="text-caution">{result.invalid_entries} incompatible or damaged entries were excluded.</p>}
  {result.status!=='learned'&&!result.matches.length&&<p>No entries met the similarity threshold.</p>}
  {result.matches.map(match=><article key={match.id} className="rounded-md border border-border bg-background p-3 space-y-1"><div className="flex flex-wrap justify-between gap-2"><h4 className="font-medium">{match.label}</h4><span className="font-mono text-muted-foreground">Similarity {match.similarity.toFixed(3)}</span></div><p className="whitespace-pre-wrap break-words">{match.text}</p></article>)}
 </div>;
}