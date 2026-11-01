export default function YoutubeResults({run}){
 const groups=(run.youtube||[]).filter(y=>y.videos?.length);
 if(!groups.length)return null;
 return <section className="space-y-3"><h4 className="text-xs uppercase tracking-wider text-muted-foreground">YouTube trends (live search results)</h4>
  <div className="grid md:grid-cols-2 gap-3">{groups.map(y=><div key={y.topic} className="rounded-lg border border-border bg-card p-3"><p className="text-sm font-medium mb-2">{y.topic}</p><ul className="space-y-2">{y.videos.map(v=><li key={v.video_id}><a href={v.url} target="_blank" rel="noreferrer" className="text-sm text-link">{v.title}</a><p className="text-xs text-muted-foreground">{[v.channel,v.views,v.published].filter(Boolean).join(' · ')}</p></li>)}</ul></div>)}</div>
 </section>;
}