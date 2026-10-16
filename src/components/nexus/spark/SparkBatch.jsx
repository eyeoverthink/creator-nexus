import useJobStatuses from '@/components/nexus/spark/useJobStatuses';
import SparkVideoCard from '@/components/nexus/spark/SparkVideoCard';
export default function SparkBatch({spark}){
 const cards=spark.cards.data?.items||[],jobs=useJobStatuses(spark.workspace,cards);
 if(spark.latest.isPending||spark.selectedBatch&&spark.cards.isPending)return <p role="status" className="text-sm text-muted-foreground">Loading Spark cards…</p>;
 if(spark.cards.error||spark.latest.error)return <p role="alert" className="text-sm text-destructive">{(spark.cards.error||spark.latest.error).message}</p>;
 if(!cards.length)return <div className="rounded-xl border border-dashed border-border p-8 text-sm text-center text-muted-foreground">Your Spark cards will appear here after your first approved run.</div>;
 return <section className="space-y-4"><h2 className="font-heading text-xl">Your Spark cards</h2><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">{cards.map(card=><SparkVideoCard key={card.id} card={card} spark={spark} jobs={jobs}/>)}</div></section>;
}