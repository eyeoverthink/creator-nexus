export default function AudioResult({url,title,note}){
 if(!url)return null;
 return <div className="rounded border border-border bg-card p-3 space-y-2"><p className="text-sm">{title}</p><audio controls src={url} className="w-full"/><div className="flex gap-3 text-xs text-muted-foreground"><a href={url} download target="_blank" rel="noopener noreferrer" className="text-link">Download</a>{note&&<span>{note}</span>}</div></div>;
}