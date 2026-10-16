import {CheckCircle2,AlertCircle,Clock,LoaderCircle,FileCheck} from 'lucide-react';
export default function JobStatusTag({status}){
 const icons={Ready:CheckCircle2,Failed:AlertCircle,Rendering:LoaderCircle,'Needs review':FileCheck},Icon=icons[status]||Clock;
 const tone=status==='Ready'?'text-success':status==='Failed'?'text-destructive':'text-muted-foreground';
 return <span role="status" className={'inline-flex min-h-6 items-center gap-1.5 rounded-sm bg-secondary px-2 text-xs font-medium '+tone}><Icon size={14} aria-hidden="true"/>{status}</span>;
}