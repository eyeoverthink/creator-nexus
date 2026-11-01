import {useState} from 'react';
import OptionChips from '@/components/nexus/studiotools/OptionChips';
import BrowserHyperFrames from '@/components/nexus/studiotools/hyperframes/BrowserHyperFrames';
import {RenderTab} from '@/components/nexus/ToolsPanel';
const ENGINES=[{id:'browser',label:'Render in this browser',note:'Always available · free'},{id:'vps',label:'Render on your VPS',note:'Full HyperFrames + Kokoro · needs your runner on'}];
export default function HyperFramesPanel({workspace,handoff}){
 const [engine,setEngine]=useState('browser');
 return <section className="space-y-4"><OptionChips label="Render engine" options={ENGINES} value={engine} onChange={setEngine}/>
  <div hidden={engine!=='browser'}><BrowserHyperFrames workspace={workspace} handoff={handoff}/></div>
  <div hidden={engine!=='vps'}><RenderTab workspaceId={workspace.id}/></div>
 </section>;
}