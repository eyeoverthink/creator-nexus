import {Link} from 'react-router-dom';
import useOriginRecords from '@/components/nexus/origin/useOriginRecords';
import useJobStatuses from '@/components/nexus/spark/useJobStatuses';
import SparkVideoCard from '@/components/nexus/spark/SparkVideoCard';
import {Button} from '@/components/ui/button';

export default function OriginVideoSparks({workspace,jobsOnly=false}){
 const list=useOriginRecords('SparkCard',{owner_id:workspace.owner_id,workspace_id:workspace.id,...(jobsOnly?{job_event_id:{$exists:true,$ne:''}}:{})});
 const jobs=useJobStatuses(workspace,list.rows);
 return <section className="space-y-4">
  <header className="flex flex-wrap justify-between items-start gap-3">
   <div><h2 className="font-heading text-2xl">{jobsOnly?'Approved video jobs':'Spark Studio creations'}</h2><p className="text-sm text-muted-foreground mt-2">Your saved video ideas, narration and live runner results, in the same workspace.</p></div>
   <Link to="/spark" className="text-sm text-primary underline">Open Spark Studio to create or review</Link>
  </header>
  {list.isPending&&<p role="status" className="text-sm text-muted-foreground">Loading your creations…</p>}
  {list.error&&<p role="alert" className="text-sm text-destructive">{list.error.message}</p>}
  {!list.isPending&&!list.error&&!list.rows.length&&<p className="text-sm text-muted-foreground">{jobsOnly?'No video jobs have been approved yet.':'No Spark Studio creations saved yet.'}</p>}
  <div className="nexus-asset-grid items-start">{list.rows.map(card=><SparkVideoCard key={card.id} card={card} jobs={jobs} readOnly/>)}</div>
  {list.hasNextPage&&<Button variant="outline" disabled={list.isFetchingNextPage} onClick={()=>list.fetchNextPage()}>Load more creations</Button>}
 </section>;
}