import ReactMarkdown from 'react-markdown';
import agents from '@/components/nexus/agentProfiles';
export default function ChatTurn({turn}) {
  const agent = agents.find(item => item.id === turn.agent);
  return <article className="space-y-4 border-b border-border pb-6">
    <div className="rounded-lg bg-secondary p-4"><p className="text-xs text-muted-foreground mb-2">You</p><p className="whitespace-pre-wrap break-words text-sm">{turn.question}</p></div>
    <div className="px-1"><div className="flex flex-wrap items-center gap-2 mb-3"><span className={'rounded-md px-2 py-1 text-xs font-medium '+(agent?.color || 'text-primary bg-primary/10')}>{agent?.name || 'Assistant'}</span><span className="text-[11px] text-muted-foreground">{turn.provider === 'ollama' ? turn.model || 'Ollama' : 'Hosted AI'}</span></div><div className="nexus-markdown text-sm break-words"><ReactMarkdown>{turn.answer}</ReactMarkdown></div></div>
    {!!turn.sources?.length && <div className="space-y-2"><p className="text-xs text-muted-foreground">Library sources used</p>{turn.sources.map(source => <details key={source.id} className="border border-border rounded-lg p-3 text-xs"><summary className="cursor-pointer text-primary">{source.title}</summary><p className="mt-3 whitespace-pre-wrap text-muted-foreground">{source.excerpt}</p></details>)}</div>}
  </article>;
}