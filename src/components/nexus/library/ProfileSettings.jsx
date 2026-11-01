import ContinuityEditor from '@/components/nexus/library/ContinuityEditor';
import ModelsTab from '@/components/nexus/models/ModelsTab';
import useModelSettings from '@/components/nexus/models/useModelSettings';
export default function ProfileSettings({workspace}){
 const models=useModelSettings(workspace.id);
 return <section className="space-y-10"><ContinuityEditor workspace={workspace} scope="profile" label="Your profile & preferences"/><div className="max-w-3xl border-t border-border pt-8"><h2 className="font-heading text-2xl mb-3">Saved model settings</h2><p className="text-sm text-muted-foreground mb-6">Provider, model and connection preferences follow this workspace across sessions and devices. Proxy tokens stay in the current tab and are never saved.</p><ModelsTab nexus={{models}}/></div></section>;
}