import {Link} from 'react-router-dom';
import VideoThumbnail from '@/components/nexus/library/VideoThumbnail';
import JobStatusTag from '@/components/nexus/spark/JobStatusTag';
import {videoPath,videoSize,videoDate} from '@/components/nexus/library/videoRecords';
export default function LibraryVideoCard({video}){
 const status=video.waiting?'Saving':video.videoUrl||video.fileUri?'Ready':'Unavailable';
 return <Link to={videoPath(video)} className="block min-w-0 rounded-lg border border-border bg-card p-3 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring" aria-label={'Watch '+video.title}>
  <VideoThumbnail key={video.eventId} video={video}/>
  <div className="space-y-3 pt-3"><h3 className="line-clamp-2 break-words font-heading text-base leading-6">{video.title}</h3>
   <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{videoSize(video.sizeBytes)}</span><time dateTime={video.uploadedAt}>{videoDate(video.uploadedAt)}</time></div>
   <JobStatusTag status={status}/>{video.waiting&&<p className="text-sm text-muted-foreground">Still being saved to the app</p>}
  </div>
 </Link>;
}