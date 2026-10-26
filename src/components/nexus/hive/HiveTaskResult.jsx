import ReactMarkdown from 'react-markdown';
import {Link} from 'react-router-dom';
export default function HiveTaskResult({value}){
 if(!value)return null;
 return <section className="border border-border bg-card rounded-lg p-4 space-y-3"><h3 className="font-heading">{value.result.title}</h3><p className="text-xs text-muted-foreground">Hosted workspace result saved. This is a result/proposal, not proof of remote execution or model training.</p><div className="whitespace-pre-wrap break-words"><ReactMarkdown>{value.result.body}</ReactMarkdown></div><Link to="/library" className="text-primary underline">Open saved results in Library</Link></section>;
}