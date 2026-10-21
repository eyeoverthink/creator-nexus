import ProShell from '@/components/nexus/ProShell';
import HomeHero from '@/components/nexus/home/HomeHero';
import UnifiedOsMatrix from '@/components/nexus/home/UnifiedOsMatrix';
import HomeContinue from '@/components/nexus/home/HomeContinue';
import HomeVideos from '@/components/nexus/home/HomeVideos';
import HomeIdeas from '@/components/nexus/home/HomeIdeas';
import WorkspaceSentimentPanel from '@/components/nexus/ouroboros/WorkspaceSentimentPanel';
import LinkedInAutoPublisherPanel from '@/components/nexus/spark/LinkedInAutoPublisherPanel';
import GoogleCalendarSyncPanel from '@/components/nexus/calendar/GoogleCalendarSyncPanel';
import FraymusV16TrustVerificationPanel from '@/components/nexus/omega/FraymusV16TrustVerificationPanel';
import useHomeData from '@/components/nexus/home/useHomeData';
import '@/components/nexus/home/home.css';
export default function Home(){
 const home=useHomeData();
 return <ProShell><main className="nexus-home space-y-8 pb-12">
  <HomeHero/>
  <FraymusV16TrustVerificationPanel/>
  <UnifiedOsMatrix workspace={home.boot.data?.workspace || home.boot.data}/>
  {home.boot.error?<p role="alert" className="text-sm text-muted-foreground">Your workspace could not load. <button onClick={()=>home.boot.refetch()} className="rounded-sm underline">Retry workspace</button></p>:home.boot.isPending?<p role="status" className="text-sm text-muted-foreground">Loading your workspace…</p>:<><WorkspaceSentimentPanel workspace={home.boot.data}/><LinkedInAutoPublisherPanel workspace={home.boot.data}/><GoogleCalendarSyncPanel workspace={home.boot.data}/><HomeContinue query={home.jobs}/><HomeVideos query={home.videos}/><HomeIdeas query={home.ideas}/></>}
 </main></ProShell>;
}