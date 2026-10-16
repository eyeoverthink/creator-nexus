import {Link} from 'react-router-dom';
import {Film} from 'lucide-react';
import {Button} from '@/components/ui/button';
import SparkVideoPlayer from '@/components/nexus/spark/SparkVideoPlayer';
import StatusPill from '@/components/nexus/spark/StatusPill';
export default function YourVideos({cards,jobs}){
 const videos=Object.entries(jobs).filter(([,job])=>job.kind==='job.done'&&(job.file_uri||job.video_url));
 return <section className="studio-section" aria-labelledby="videos-title"><div className="studio-section-heading"><h2 id="videos-title">Your videos</h2></div>
  {videos.length?<div className="studio-video-grid">{videos.map(([id,job])=>{const title=cards.find(card=>card.job_event_id===id)?.hook_title||'Your finished creation';return <article key={id} className="studio-video-tile"><SparkVideoPlayer fileUri={job.file_uri} videoUrl={job.video_url} title={title} sizeBytes={job.size_bytes??job.file_size_bytes} uploadedAt={job.uploaded_at}/><h3>{title}</h3><StatusPill status="ready"/></article>;})}</div>:<div className="studio-empty"><Film size={28} className="text-primary" aria-hidden="true"/><p>Your finished videos will feel right at home here.</p><Button asChild variant="outline"><Link to="/spark">Explore Create</Link></Button></div>}
 </section>;
}