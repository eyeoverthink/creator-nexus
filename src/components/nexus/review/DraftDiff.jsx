import {useMemo} from 'react';
import diffLines from '@/components/nexus/review/diffLines';
export default function DraftDiff({before,after}){
 const parts=useMemo(()=>diffLines(before,after),[before,after]);
 return <div className="text-[11px] leading-relaxed whitespace-pre-wrap break-words font-mono">{parts.map((part,i)=>part.kind==='removed'?<del key={i} className="block bg-destructive/10 text-destructive no-underline border-l-2 border-destructive px-2"><span className="sr-only">Removed: </span>{part.text||' '}</del>:part.kind==='added'?<ins key={i} className="block bg-primary/10 text-primary no-underline border-l-2 border-primary px-2"><span className="sr-only">Added: </span>{part.text||' '}</ins>:<span key={i} className="block px-2 text-muted-foreground">{part.text}</span>)}</div>;
}