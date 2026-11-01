import {Link} from 'react-router-dom';
import {Send} from 'lucide-react';
import {Button} from '@/components/ui/button';
export default function IdeaCard({idea}){
 const outcome=`Find 50 people with this pain and draft personalized outreach for "${idea.name}" at $${idea.price_usd}`;
 const context=`Pain: ${idea.pain}\nOffer: ${idea.offer}\nWhere buyers are: ${idea.buyers_where}\nOutreach starting point: ${idea.first_outreach}`.slice(0,1800);
 const row=(label,text)=><p className="text-sm"><span className="text-muted-foreground">{label}:</span> {text}</p>;
 return <article className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
  <h4 className="font-semibold">{idea.name}</h4>
  {row('Pain',idea.pain)}{row('Agent',idea.agent_design)}
  <details><summary className="text-sm cursor-pointer">12-hour build plan ({idea.build_plan?.length||0} steps)</summary><ol className="list-decimal pl-5 text-sm mt-2 space-y-1">{(idea.build_plan||[]).map((s,i)=><li key={i}>{s}</li>)}</ol></details>
  {row('Offer',idea.offer)}{row('Find buyers',idea.buyers_where)}
  <details><summary className="text-sm cursor-pointer">Outreach draft (not sent)</summary><p className="text-sm whitespace-pre-wrap mt-2">{idea.first_outreach}</p></details>
  <p className="text-sm font-medium">Goal ${Number(idea.revenue_goal_usd).toLocaleString()} = ${idea.price_usd} × {idea.buyers} <span className="text-xs text-muted-foreground font-normal">target, not a guarantee</span></p>
  {!!idea.assumptions?.length&&<ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">{idea.assumptions.map((a,i)=><li key={i}>{a}</li>)}</ul>}
  <Button asChild variant="outline" className="mt-auto"><Link to={`/agents?agent=revenue_agent&outcome=${encodeURIComponent(outcome)}&context=${encodeURIComponent(context)}`}><Send/>Find buyers with Revenue Agent</Link></Button>
 </article>;
}