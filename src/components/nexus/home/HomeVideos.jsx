import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import VideoThumbnail from '@/components/nexus/library/VideoThumbnail';
import {videoPath,videoSize,videoDate} from '@/components/nexus/library/videoRecords';
export default function HomeVideos({query}){
 const rows=query.data||[];
 return <section aria-labelledby="videos-heading" className="min-w-0 space-y-4">
  <div className="flex items-center justify-between gap-4"><h2 id="videos-heading" className="font-heading text-lg">Your videos</h2><Link to="/library?kind=videos" aria-label="See all your videos in Library" className="rounded-sm text-sm text-muted-foreground underline underline-offset-4">See all</Link></div>
  {query.isLoading?<p role="status" className="text-sm text-muted-foreground">Loading your videos…</p>:query.error?<p role="alert" className="text-sm text-muted-foreground">Videos could not load. <button className="rounded-sm underline" onClick={()=>query.refetch()}>Retry videos</button></p>:!rows.length?<div className="flex flex-wrap items-center gap-4"><p className="text-sm text-muted-foreground">Your saved videos will appear here.</p><Button asChild variant="outline"><Link to="/spark">Start creating</Link></Button></div>:<div role="region" aria-label="Your videos, scroll horizontally for more" tabIndex={0} className="flex gap-4 overflow-x-auto rounded-lg p-1 pb-4">{rows.map(video=><Link key={video.eventId} to={videoPath(video)} className="home-card w-64 min-w-0 max-w-full shrink-0 rounded-lg border border-border bg-card p-3" aria-label={'Watch '+video.title}>
   <VideoThumbnail key={video.eventId} video={video}/><h3 className="mt-3 line-clamp-2 break-words font-heading text-sm leading-5">{video.title}</h3>
   <div className="mt-3 space-y-1 text-xs text-muted-foreground"><p>{videoSize(video.sizeBytes)}</p><time dateTime={video.uploadedAt} className="block">{videoDate(video.uploadedAt)}</time></div>
  </Link>)}</div>}
 </section>;
}