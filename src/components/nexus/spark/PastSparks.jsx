import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {scope} from '@/components/nexus/spark/sparkClient';
import {Button} from '@/components/ui/button';
export default function PastSparks({spark}){
 const [limit,setLimit]=useState(20);
 const batches=useQuery({queryKey:['spark','batches',spark.workspace.id,limit],queryFn:()=>base44.entities.SparkCard.aggregate({query:scope(spark.workspace),groupBy:'batch_id',max:'created_date',sort:'-max_created_date',limit}),staleTime:30000});
 return <section className="space-y-3"><h2 className="font-heading text-lg">Past sparks</h2><p className="text-xs text-muted-foreground">Read-only batch history. Select a batch to inspect its cards above.</p>{batches.isPending&&<p role="status" className="text-xs">Loading history…</p>}{batches.error&&<p role="alert" className="text-xs text-destructive">{batches.error.message}</p>}{batches.data?.rows.map(batch=><button key={batch.batch_id} onClick={()=>spark.setBatch(batch.batch_id)} className={'block w-full text-left rounded-lg border p-3 text-xs '+(spark.selectedBatch===batch.batch_id?'border-primary text-primary':'border-border bg-card text-muted-foreground')}><span>{new Date(batch.max_created_date).toLocaleString()} · {batch.count} cards</span><span className="block mt-1 break-all">Batch {batch.batch_id}</span></button>)}{batches.data&&!batches.data.rows.length&&<p className="text-xs text-muted-foreground">No saved batches yet.</p>}{batches.data?.truncated&&limit<1000&&<Button variant="outline" size="sm" onClick={()=>setLimit(Math.min(1000,limit+20))}>Show older batches</Button>}</section>;
}