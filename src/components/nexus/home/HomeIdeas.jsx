import HomeIdeaCard from '@/components/nexus/home/HomeIdeaCard';
export default function HomeIdeas({query}){
 const rows=query.data?.items||[];
 return <section aria-labelledby="ideas-heading" className="space-y-4">
  <h2 id="ideas-heading" className="font-heading text-lg">Ideas for you</h2>
  {query.isLoading?<p role="status" className="text-sm text-muted-foreground">Loading your saved ideas…</p>:query.error?<p role="alert" className="text-sm text-muted-foreground">Ideas could not load. <button className="rounded-sm underline" onClick={()=>query.refetch()}>Retry ideas</button></p>:!rows.length?<p className="text-sm text-muted-foreground">No saved Spark ideas yet.</p>:<div className="grid items-stretch gap-4 md:grid-cols-[1.15fr_1fr] xl:grid-cols-[1.15fr_1fr_1fr]">{rows.map((card,index)=><HomeIdeaCard key={card.id} card={card} featured={index===0}/>)}</div>}
 </section>;
}