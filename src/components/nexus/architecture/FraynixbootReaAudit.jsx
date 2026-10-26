import FraymusEngineViewport from '@/components/nexus/architecture/FraymusEngineViewport';
import {FRAYNIXBOOT,SOURCE_MAP,VERIFIED,NOT_VERIFIED,FINDINGS,DEVIATIONS,NEXT} from '@/components/nexus/architecture/fraynixbootAuditData';

const List=({title,items,tone=''})=><div className="space-y-2"><h3 className="font-semibold">{title}</h3><ul className={`list-disc pl-5 space-y-1 text-sm ${tone}`}>{items.map(i=><li key={i}>{i}</li>)}</ul></div>;

export default function FraynixbootReaAudit(){
 return <div className="space-y-6">
  <div className="rounded border border-border p-4 space-y-2 text-sm">
   <h2 className="text-lg">REA audit: {FRAYNIXBOOT.repo}, Fraymus Engine V2</h2>
   <p className="font-mono text-xs text-muted-foreground break-all">Pinned commit {FRAYNIXBOOT.sha} · {FRAYNIXBOOT.summary}</p>
   <p>{FRAYNIXBOOT.stack}</p>
  </div>
  <div className="space-y-2"><h3 className="font-semibold">Integrated: the LWJGL/OpenGL engine loop running in WebGL2</h3><p className="text-sm text-muted-foreground">The founders, the 8 laws, the brains and the renderer run here exactly as the Java source defines them. Desktop-only parts are listed below.</p><FraymusEngineViewport/></div>
  <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="p-2">Source</th><th className="p-2">Mechanism</th><th className="p-2">Status</th></tr></thead><tbody>{SOURCE_MAP.map(r=><tr key={r[0]} className="border-t border-border align-top"><td className="p-2 font-mono text-xs">{r[0]}</td><td className="p-2">{r[1]}</td><td className="p-2">{r[2]}</td></tr>)}</tbody></table></div>
  <List title="Findings in the Java source" items={FINDINGS}/>
  <div className="grid gap-6 md:grid-cols-2"><List title="Verified here" items={VERIFIED}/><List title="Not verified" items={NOT_VERIFIED} tone="text-caution"/></div>
  <div className="grid gap-6 md:grid-cols-2"><List title="Where the port differs" items={DEVIATIONS}/><List title="Next integration candidates" items={NEXT}/></div>
 </div>;
}