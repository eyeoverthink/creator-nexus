import {useState} from 'react';
import {CATEGORY,loadAuditSettings,saveAuditSettings} from '@/components/nexus/audit/auditCategories';
import {useLeaks} from '@/components/nexus/audit/useAuditData';
import BiggestLeak from '@/components/nexus/audit/BiggestLeak';
import LeakTable from '@/components/nexus/audit/LeakTable';
const field='mt-1 block w-32 rounded border border-input bg-card p-2 text-sm';
export default function LeakReport(){
 const [s,setS]=useState(loadAuditSettings);
 const upd=k=>e=>{const n={...s,[k]:Math.max(0,Number(e.target.value)||0)};setS(n);saveAuditSettings(n);};
 const threshold=s.hourly/2,leaks=useLeaks(threshold),d=leaks.data,week=Math.min(7,Math.max(1,s.week));
 const rows=(d?.rows||[]).map(r=>({...r,weekly:d.days?r.low/d.days*week:0})).sort((a,b)=>b.weekly-a.weekly);
 const top=rows.find(r=>CATEGORY[r.category]?.agent&&r.low>0);
 return <div className="space-y-5 max-w-4xl">
  <div className="flex flex-wrap gap-4 items-end">
   <label className="text-xs text-muted-foreground">My time is worth ($/hour)<input type="number" min="0" value={s.hourly} onChange={upd('hourly')} className={field}/></label>
   <label className="text-xs text-muted-foreground">Days per week<input type="number" min="1" max="7" value={s.week} onChange={upd('week')} className={field}/></label>
   <p className="text-xs text-muted-foreground pb-2">Low-value = a half hour worth less than ${threshold.toFixed(0)}. Projections are estimates from your log.</p>
  </div>
  {leaks.isPending?<p role="status" className="text-sm text-muted-foreground">Loading…</p>:leaks.error?<p role="alert" className="text-sm text-destructive">{leaks.error.message}</p>:!rows.length?<p className="text-sm text-muted-foreground">Log some half hours first.</p>:<>
   <p className="text-sm">{d.days} day(s) tracked · {rows.reduce((a,r)=>a+r.hours,0)} h logged{d.days<2?' · log 2 full days for a reliable leak':''}</p>
   {top?<BiggestLeak leak={top} days={d.days} threshold={threshold}/>:<p className="text-sm text-muted-foreground">No low-value time yet in areas a starter agent can take over.</p>}
   <LeakTable rows={rows}/>
  </>}
 </div>;
}