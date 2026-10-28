import {CATEGORY,AGENT_NAMES} from '@/components/nexus/audit/auditCategories';
const HEAD=['Category','Logged h','Low-value h','Projected h/week','Avg energy','$ logged','Agent'];
export default function LeakTable({rows}){
 return <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm">
  <thead className="bg-card text-xs text-muted-foreground"><tr>{HEAD.map(h=><th key={h} scope="col" className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>)}</tr></thead>
  <tbody className="tabular-nums">{rows.map(r=>{const c=CATEGORY[r.category];return <tr key={r.category} className="border-t border-border">
   <td className="px-3 py-2 whitespace-nowrap">{c?.label||r.category}</td><td className="px-3 py-2">{r.hours}</td><td className="px-3 py-2">{r.low}</td>
   <td className={`px-3 py-2 ${r.weekly>=10?'text-destructive font-semibold':''}`}>{r.weekly.toFixed(1)}</td>
   <td className="px-3 py-2">{Number(r.energy).toFixed(1)}</td><td className="px-3 py-2">${Math.round(r.value)}</td>
   <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{c?.agent?AGENT_NAMES[c.agent]:'None yet'}</td>
  </tr>;})}</tbody>
 </table></div>;
}