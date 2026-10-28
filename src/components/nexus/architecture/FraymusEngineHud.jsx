export default function FraymusEngineHud({stats}){
 if(!stats)return <p role="status" className="text-sm text-muted-foreground">Starting engine…</p>;
 const rows=[
  ['Seed',stats.seed],['World tick',stats.tick],['Population',stats.population],
  ['Births (incl. 5 founders)',stats.births],['Deaths',stats.deaths],['Self-heals',stats.heals],
  ['Colony health',stats.health.toFixed(2)],['Role diversity',stats.diversity.toFixed(2)],
  ['Zoom',stats.zoom.toFixed(2)],['Lines this frame',stats.dropped?`${stats.lines} (+${stats.dropped} dropped)`:stats.lines],
  ['FPS',Math.round(stats.fps)],
 ];
 return <div className="grid gap-3 md:grid-cols-2 text-sm">
  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">{rows.map(([k,v])=><div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}</dl>
  <div aria-label="Engine log" className="font-mono text-xs rounded border border-border p-2 h-36 overflow-auto space-y-0.5">
   {stats.logs.length?stats.logs.map((line,i)=><p key={`${i}-${line}`}>{line}</p>):<p className="text-muted-foreground">No events yet.</p>}
  </div>
 </div>;
}