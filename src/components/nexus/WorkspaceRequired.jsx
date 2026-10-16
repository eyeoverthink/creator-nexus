import {Link} from 'react-router-dom';
import {Layers3} from 'lucide-react';
import {Button} from '@/components/ui/button';
export default function WorkspaceRequired(){
 return <section className="studio-empty" aria-label="Workspace needed"><Layers3 size={32} className="text-primary" aria-hidden="true"/><p className="text-muted-foreground">Your creative space starts with a workspace in Home.</p><Button asChild><Link to="/">Open studio</Link></Button></section>;
}