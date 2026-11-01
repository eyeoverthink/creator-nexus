import {Clock,LoaderCircle,CheckCircle2,FileCheck,AlertCircle} from 'lucide-react';
const icons={Queued:Clock,Rendering:LoaderCircle,Ready:CheckCircle2,'Needs review':FileCheck,Failed:AlertCircle};
export default function HomeJobStatus({status}){
 const Icon=icons[status]||Clock;
 return <span className="inline-flex items-center gap-1.5 rounded-sm bg-secondary px-2 py-1 text-xs text-muted-foreground"><Icon size={14} aria-hidden="true"/>{status}</span>;
}