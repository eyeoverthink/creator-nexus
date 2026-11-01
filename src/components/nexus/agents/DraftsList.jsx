import ReactMarkdown from 'react-markdown';
export default function DraftsList({drafts}){
 const items=drafts.data||[];
 if(drafts.isPending)return <p role="status" className="text-sm text-muted-foreground">Loading…</p>;
 if(!items.length)return <p className="text-sm text-muted-foreground">No drafts yet.</p>;
 return <ul className="space-y-3">{items.map(d=><li key={d.id}><details className="rounded-lg border border-border bg-card p-4"><summary className="cursor-pointer text-sm font-medium flex justify-between gap-2"><span>{d.title}</span><span className="text-xs text-muted-foreground">{d.kind} · draft · {new Date(d.created_date).toLocaleDateString()}</span></summary>
  <div className="prose prose-invert prose-sm max-w-none mt-3"><ReactMarkdown>{d.body}</ReactMarkdown></div>
  <button className="mt-2 text-xs text-link" onClick={()=>navigator.clipboard.writeText(d.body)}>Copy</button>
 </details></li>)}</ul>;
}