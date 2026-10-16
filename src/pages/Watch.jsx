import {useEffect} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {ArrowLeft} from 'lucide-react';
import {base44} from '@/api/base44Client';
import ProShell from '@/components/nexus/ProShell';
import {findVideo} from '@/components/nexus/library/videoReads';
import WatchPlayer from '@/components/nexus/library/WatchPlayer';
import RelatedVideos from '@/components/nexus/library/RelatedVideos';
export default function Watch(){
 const {jobId}=useParams();
 const current=useQuery({queryKey:['library-watch',jobId],queryFn:async()=>{if(!jobId||jobId.length>140)return null;const user=await base44.auth.me();return findVideo(user.id,jobId);},refetchInterval:query=>query.state.data?.video.waiting?15000:false});
 useEffect(()=>{document.getElementById('watch-title-region')?.focus();},[jobId]);
 return <ProShell>
  <header className="border-b border-border"><div className="flex items-center gap-4 px-6"><Link to="/library" className="inline-flex min-h-10 items-center gap-2 text-sm text-link"><ArrowLeft size={16} aria-hidden="true"/>Library</Link><span className="text-sm text-muted-foreground">Watch</span></div></header>
  <main id="watch-title-region" tabIndex={-1} aria-label="Watch video" className="space-y-6">
   {current.isPending?<p role="status" className="text-muted-foreground">Loading video…</p>:current.error?<p role="alert" className="text-destructive">{current.error.message}</p>:!current.data?<div className="space-y-3"><h1 className="font-heading text-2xl">Video not found</h1><p className="text-muted-foreground">This video is unavailable or isn't in your library.</p></div>:<>
    <WatchPlayer key={current.data.video.eventId} video={current.data.video}><RelatedVideos key={jobId} scope={current.data.scope} video={current.data.video}/></WatchPlayer>
   </>}
  </main>
 </ProShell>;
}