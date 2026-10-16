import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {scope} from '@/components/nexus/spark/sparkClient';
import useJobStatuses from '@/components/nexus/spark/useJobStatuses';
import SparkVideoCard from '@/components/nexus/spark/SparkVideoCard';
import {Button} from '@/components/ui/button';
export default function KanbanLane({spark,status,label}){
 const list=useInfiniteQuery({queryKey:['spark','kanban',spark.workspace.id,status],initialPageParam:null,queryFn:({pageParam})=>base44.entities.SparkCard.filter({...scope(spark.workspace),status},{sort:'-created_date',limit:20,...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined});
 const cards=list.data?.pages.flatMap(page=>page.items)||[],jobs=useJobStatuses(spark.workspace,cards);
 return <section aria-label={label} className="min-w-0 rounded-xl border border-border bg-secondary/30 p-3 space-y-3"><h3 className="font-heading text-base p-2">{label}</h3>{list.isPending&&<p role="status" className="text-xs text-muted-foreground p-2">Loading projects…</p>}{list.error&&<p role="alert" className="text-xs text-destructive p-2">{list.error.message}</p>}{!list.isPending&&!list.error&&!cards.length&&<p className="text-xs text-muted-foreground p-4 border border-dashed border-border rounded-lg">No projects in this stage.</p>}{cards.map(card=><SparkVideoCard key={card.id} card={card} spark={spark} jobs={jobs} compact/>)}{list.hasNextPage&&<Button variant="outline" size="sm" onClick={()=>list.fetchNextPage()} disabled={list.isFetchingNextPage}>{list.isFetchingNextPage?'Loading…':'Load more projects'}</Button>}</section>;
}