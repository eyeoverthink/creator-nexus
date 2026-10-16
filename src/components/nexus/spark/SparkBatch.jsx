import useJobStatuses from '@/components/nexus/spark/useJobStatuses';
import SparkVideoCard from '@/components/nexus/spark/SparkVideoCard';
import YourVideos from '@/components/nexus/home/YourVideos';
import {Button} from '@/components/ui/button';
export default function SparkBatch({spark}){
 const cards=spark.cards.data?.items||[],jobs=useJobStatuses(spark.workspace,cards);
 if(spark.latest.isPending||spark.selectedBatch&&spark.cards.isPending)return <p role="status" className="text-sm text-muted-foreground">Loading Spark cards…</p>;
 if(spark.cards.error||spark.latest.error)return <p role="alert" className="text-sm text-destructive">{(spark.cards.error||spark.latest.error).message}</p>;
 if(!cards.length)return <div className="studio-empty"><p>A little curiosity is all it takes to start your first Spark.</p><Button variant="outline" onClick={()=>document.getElementById('spark-creator-tools')?.querySelector('textarea,button:not(:disabled)')?.focus()}>Open creator tools</Button></div>;
 return <><section className="space-y-6"><h2 className="font-heading text-2xl">Your Spark ideas</h2><div className="studio-bento spark-card-grid">{cards.map(card=><SparkVideoCard key={card.id} card={card} spark={spark} jobs={jobs}/>)}</div></section><YourVideos cards={cards} jobs={jobs.data||{}}/></>;
}