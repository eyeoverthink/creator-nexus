import {useState} from 'react';
import {agents,fieldClass} from '@/components/nexus/library/libraryConstants';
import ContinuityEditor from '@/components/nexus/library/ContinuityEditor';
export default function AgentContinuity({workspace}){
 const [agent,setAgent]=useState('researcher');
 return <section className="space-y-6"><label className="block text-sm max-w-sm">Agent<select value={agent} onChange={e=>setAgent(e.target.value)} className={fieldClass}>{agents.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><ContinuityEditor key={agent} workspace={workspace} scope={agent} label={agents.find(a=>a[0]===agent)[1]+' continuity'}/><aside className="max-w-3xl rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Recent saved chat conversations and up to six most recently updated assigned assets are also supplied during future runs. Media is represented by its description and file metadata, not automatically transcribed or visually analyzed. New outputs can be imported into Assets; they are not silently archived.</aside></section>;
}