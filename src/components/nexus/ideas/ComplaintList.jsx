export default function ComplaintList({title,items}){
 return <section><h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</h4>
  <ol className="space-y-2">{items.map(([text,note],i)=><li key={i} className="text-sm"><span className="tabular-nums text-muted-foreground mr-2">{i+1}.</span>{text}<span className="block pl-5 text-xs text-muted-foreground break-words">{note}</span></li>)}</ol>
 </section>;
}