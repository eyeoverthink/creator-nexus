import {useState} from 'react';
import {Check,Copy,Server} from 'lucide-react';
import {Button} from '@/components/ui/button';
const head=endpoint=>`curl -X POST "${endpoint}" -H "X-Nexus-Key: $NEXUS_KEY"`;
const examples=endpoint=>[
 ['See what you have (types and counts)',`${head(endpoint)} -H "Content-Type: application/json" -d '{"action":"catalog"}'`],
 ['List one type, with download links (repeat with "cursor": next_cursor until has_more is false)',`${head(endpoint)} -H "Content-Type: application/json" -d '{"action":"list","type":"library","limit":50,"include_files":true}'`],
 ['Get one item with its download links',`${head(endpoint)} -H "Content-Type: application/json" -d '{"action":"get","type":"media","id":"ITEM_ID"}'`],
 ['Save a document to your Library',`${head(endpoint)} -H "Content-Type: application/json" -d '{"action":"save","title":"Notes from my PC","body":"Your text here"}'`],
 ['Upload a file to your Library (max 10 MB, stored privately)',`${head(endpoint)} -F action=upload -F title="Studio render" -F file=@render.mp4`],
 ['Generate ElevenLabs voice (app owner only, uses your characters)',`${head(endpoint)} -H "Content-Type: application/json" -d '{"action":"speak","text":"Hello from Creator Nexus"}'`],
];
export default function RemoteApiDocs({endpoint}){
 const [copied,setCopied]=useState(false);
 const copy=()=>{navigator.clipboard?.writeText(endpoint);setCopied(true);setTimeout(()=>setCopied(false),1800);};
 return <section className="p-4 rounded-lg border border-border bg-card space-y-3">
  <h3 className="text-sm font-semibold flex items-center gap-2"><Server size={15} className="text-primary"/>Your endpoint</h3>
  <div className="flex flex-wrap items-center gap-2"><input readOnly value={endpoint} aria-label="Remote API endpoint" className="flex-1 min-w-[260px] h-9 rounded bg-background border border-input px-3 font-mono text-xs"/><Button size="sm" onClick={copy} className="h-9 gap-1.5">{copied?<Check size={14}/>:<Copy size={14}/>}{copied?'Copied':'Copy endpoint'}</Button></div>
  <p className="text-xs text-muted-foreground leading-relaxed">Every call is a POST with your key in the <code>X-Nexus-Key</code> header and an <code>action</code>. Types: library, media, drafts, productions, loosescrew, knowledge, sparks, spark_cards, chats, models, workflows. Download links last one hour. On Windows PowerShell, type <code>curl.exe</code> instead of <code>curl</code>.</p>
  <div className="space-y-2.5">{examples(endpoint).map(([label,code])=><div key={label} className="space-y-1"><p className="text-xs font-medium text-foreground">{label}</p><pre className="p-2.5 rounded bg-background border border-border font-mono text-[11px] text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">{code}</pre></div>)}</div>
 </section>;
}