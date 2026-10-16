import {Clock,Clapperboard,CheckCircle2,ClipboardCheck,AlertCircle} from 'lucide-react';
const states={queued:['Queued',Clock,'text-muted-foreground'],rendering:['Rendering',Clapperboard,'text-caution'],ready:['Ready',CheckCircle2,'text-success'],review:['Needs review',ClipboardCheck,'text-primary'],failed:['Failed',AlertCircle,'text-destructive']};
export default function StatusPill({status}){
 const [label,Icon,color]=states[status]||states.review;
 return <span className={'studio-status '+color}><Icon size={16} aria-hidden="true"/>{label}</span>;
}