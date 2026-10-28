import {Button} from '@/components/ui/button';
import {downloadText} from '@/components/nexus/studiotools/toolKit';
const TONE={proven:'text-success',likely:'text-caution',guessed:'text-muted-foreground'};
const Tag=({x})=><span className={`text-xs ${TONE[x.confidence]||''}`}>[{x.confidence}{x.evidence?.length?` · ${x.evidence.join(', ')}`:''}]</span>;
const H=({children})=><h4 className="text-sm font-semibold mt-3">{children}</h4>;
export default function ReaReport({data,target}){
 const r=data.report,s=r.surface_map||{};
 return <article className="rounded border border-border bg-card p-4 space-y-2 text-sm">
  <div className="flex flex-wrap justify-between gap-2"><h3 className="text-lg">REA · {target}</h3><Button variant="outline" onClick={()=>downloadText(data.markdown,'rea-report.md')}>Download report</Button></div>
  <p className="text-xs text-muted-foreground">Saved to your Library</p>
  <p>{r.executive_summary?.what_it_is}</p><p>{r.executive_summary?.how_it_works}</p>{r.executive_summary?.rebuild_effort&&<p className="text-muted-foreground">Effort: {r.executive_summary.rebuild_effort}</p>}
  <H>Surface map</H><p>Stack: {(s.stack||[]).join(', ')||'—'}</p><ul className="list-disc pl-5">{(s.components||[]).map((c,i)=><li key={i}><strong>{c.name}</strong>: {c.role}</li>)}</ul>{s.external_services?.length>0&&<p>Services: {s.external_services.join(', ')}</p>}
  <H>Feature trace</H><ol className="space-y-1">{r.feature_trace.map((h,i)=><li key={i} className="border-l-2 border-primary pl-3">{h.step}. {h.layer&&<strong>{h.layer} </strong>}{h.location&&<code className="text-xs">{h.location} </code>}{h.what_happens} <Tag x={h}/></li>)}</ol>
  <H>Evidence log</H><ul className="list-disc pl-5">{r.evidence_log.map((e,i)=><li key={i}>{e.claim} <Tag x={e}/></li>)}</ul>
  <H>Unknowns</H><ul className="list-disc pl-5">{r.unknowns.map((u,i)=><li key={i}>{u.question}{u.how_to_resolve&&<span className="text-muted-foreground"> → {u.how_to_resolve}</span>}</li>)}</ul>
  <H>Rebuild plan</H><ol className="list-decimal pl-5">{r.rebuild_plan.map((p,i)=><li key={i}><strong>{p.title}</strong>: {p.details}</li>)}</ol>
  <H>Verification</H><ul className="list-disc pl-5">{r.verification.map((v,i)=><li key={i}>{v.test} → {v.expected}</li>)}</ul>
  <details className="mt-3"><summary className="cursor-pointer">Evidence collected ({data.evidence.length})</summary><ul className="space-y-2 mt-2">{data.evidence.map(e=><li key={e.id}><strong>{e.id}</strong> {e.kind} · <span className="break-all">{e.source}</span><pre className="text-xs whitespace-pre-wrap bg-background p-2 rounded mt-1">{e.excerpt}</pre></li>)}</ul></details>
 </article>;
}