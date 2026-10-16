import {useInfiniteQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {readVideoPage} from '@/components/nexus/library/videoReads';
import LibraryVideoCard from '@/components/nexus/library/LibraryVideoCard';
export default function RelatedVideos({scope,video}){
 const list=useInfiniteQuery({queryKey:['library-related-videos',scope.workspace_id,video.eventId],initialPageParam:undefined,queryFn:({pageParam})=>readVideoPage(scope,pageParam,{readyOnly:true,excludeEventId:video.eventId,limit:6}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined});
 const rows=list.data?.pages.flatMap(page=>page.items)||[];
 return <section aria-labelledby="related-videos-heading" className="space-y-4">
  <h2 id="related-videos-heading" className="font-heading text-lg">Related</h2>
  {list.isPending&&<p role="status" className="text-sm text-muted-foreground">Loading related videos…</p>}
  {list.error&&<p role="alert" className="text-sm text-destructive">{list.error.message}</p>}
  {!list.isPending&&!list.error&&!rows.length&&<p className="text-sm text-muted-foreground">{list.hasNextPage?'More video history is available below.':'No other videos yet.'}</p>}
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">{rows.map(item=><LibraryVideoCard key={item.id} video={item}/>)}</div>
  {list.hasNextPage&&<Button variant="outline" disabled={list.isFetchingNextPage} onClick={()=>list.fetchNextPage()}>{list.isFetchingNextPage?'Loading…':'More related videos'}</Button>}
 </section>;
}