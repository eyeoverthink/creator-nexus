import {useEffect,useRef} from 'react';
import {MessagesSquare} from 'lucide-react';
import useKnowledgeChat from '@/components/nexus/knowledge/useKnowledgeChat';
import ChatTurn from '@/components/nexus/knowledge/ChatTurn';
import ChatComposer from '@/components/nexus/knowledge/ChatComposer';
import PaidRunApproval from '@/components/nexus/PaidRunApproval';
import {Button} from '@/components/ui/button';
export default function KnowledgeChat({workspace,models}){
 const chat=useKnowledgeChat(workspace,models),bottom=useRef(null);
 const newest=chat.history.records[0]?.id;
 useEffect(()=>{if(newest)bottom.current?.scrollIntoView({block:'nearest'});},[newest]);
 return <div className="space-y-5">
  <PaidRunApproval request={chat.approval} onConfirm={chat.confirm} onCancel={chat.cancel}/>
  <header><h2 className="font-heading text-xl flex items-center gap-2"><MessagesSquare size={20} className="text-primary"/>Ask your knowledge</h2><p className="mt-2 text-sm text-muted-foreground">Talk with Scout, Scribe, or Pulse using your saved references and enabled skills. Each agent keeps its own conversation.</p></header>
  <div aria-label="Conversation" aria-busy={chat.busy} className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
   {chat.history.isPending&&<p role="status" className="text-sm text-muted-foreground">Loading conversation…</p>}
   {chat.history.error&&<p role="alert" className="text-sm text-destructive">{chat.history.error.message}</p>}
   {!chat.history.isPending&&!chat.history.error&&!chat.history.records.length&&!chat.pendingTurn&&<div className="border border-dashed border-border rounded-xl p-8 text-center"><MessagesSquare size={28} className="text-primary mx-auto mb-3"/><p className="font-heading">A conversation with context</p><p className="text-sm text-muted-foreground mt-2">Add research in Library, then ask a question here. Relevant reference excerpts appear beneath sourced answers.</p></div>}
   {chat.history.hasNextPage&&<Button variant="outline" size="sm" disabled={chat.history.isFetchingNextPage} onClick={()=>chat.history.fetchNextPage()}>{chat.history.isFetchingNextPage?'Loading…':'Load older questions'}</Button>}
   {[...chat.history.records].reverse().map(turn=><ChatTurn key={turn.id} turn={turn}/>)}
   {chat.pendingTurn&&<div className="space-y-3"><ChatTurn turn={chat.pendingTurn}/><p className="text-xs text-muted-foreground">{chat.busy?'Saving answer…':'This answer has not been saved yet.'}</p>{!chat.busy&&<Button variant="outline" onClick={chat.savePending}>Save answer</Button>}</div>}
   <div ref={bottom}/>
  </div>
  {chat.error&&<p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm">{chat.error}</p>}
  <ChatComposer chat={chat} models={models}/>
 </div>;
}