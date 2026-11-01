import {Link} from 'react-router-dom';
import {Bot} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {CATEGORY,AGENT_NAMES} from '@/components/nexus/audit/auditCategories';
import {useTopActivities} from '@/components/nexus/audit/useAuditData';
export default function BiggestLeak({leak,days,threshold}){
 const c=CATEGORY[leak.category],acts=useTopActivities(leak.category,threshold).data||[];
 const h=leak.weekly.toFixed(1),big=leak.weekly>=10;
 const outcome=`Reclaim the ~${h} h/week I lose to ${c.label.toLowerCase()}`;
 const context=`Time audit: ${leak.low} low-value hours of ${c.label} over ${days} tracked day(s), projected ${h} h/week. Most frequent activities: ${acts.join(', ')||'n/a'}.`;
 return <section className="rounded-lg border border-primary bg-selection p-4 space-y-2">
  <p className="text-xs uppercase tracking-wider text-muted-foreground">Biggest leak</p>
  <h3 className="text-lg font-semibold">{c.label}: {h} h/week projected</h3>
  <p className={`text-sm ${big?'text-success':'text-caution'}`}>{big?'10-hour leak found.':'Below the 10-hour mark so far.'} Average energy {Number(leak.energy).toFixed(1)}.</p>
  {!!acts.length&&<p className="text-sm text-muted-foreground">Top activities: {acts.join(', ')}</p>}
  <Button asChild><Link to={`/agents?agent=${c.agent}&outcome=${encodeURIComponent(outcome)}&context=${encodeURIComponent(context)}`}><Bot/>Put {AGENT_NAMES[c.agent]} on this leak</Link></Button>
 </section>;
}