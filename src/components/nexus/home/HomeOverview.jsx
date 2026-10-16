import HomeHero from '@/components/nexus/home/HomeHero';
import HomeJobs from '@/components/nexus/home/HomeJobs';
import HomeIdeaGrid from '@/components/nexus/home/HomeIdeaGrid';
import YourVideos from '@/components/nexus/home/YourVideos';
import useHomeSnapshot from '@/components/nexus/home/useHomeSnapshot';
export default function HomeOverview({nexus}){
 const {cards,jobs}=useHomeSnapshot(nexus.workspace?.id);
 return <div className="studio-home-dashboard"><HomeHero/>{nexus.workspace&&<><HomeJobs cards={cards} jobs={jobs}/><HomeIdeaGrid cards={cards} feed={nexus.state?.feed||[]}/><YourVideos cards={cards} jobs={jobs}/><p className="text-xs text-muted-foreground">Showing creations already loaded in this session. Open Create to see your saved batches and current progress.</p></>}</div>;
}