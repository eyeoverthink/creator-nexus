import ProShell from '@/components/nexus/ProShell';
import HomeHero from '@/components/nexus/home/HomeHero';
import HomeContinue from '@/components/nexus/home/HomeContinue';
import HomeVideos from '@/components/nexus/home/HomeVideos';
import HomeIdeas from '@/components/nexus/home/HomeIdeas';
import LinkedInAutoPublisherPanel from '@/components/nexus/spark/LinkedInAutoPublisherPanel';
import GoogleCalendarSyncPanel from '@/components/nexus/calendar/GoogleCalendarSyncPanel';
import useHomeData from '@/components/nexus/home/useHomeData';
import '@/components/nexus/home/home.css';
export default function Home(){
 const home=useHomeData();
 return <ProShell><main className="nexus-home space-y-8 pb-12">
  <HomeHero/>
  {home.boot.error?<p role="alert" className="text-sm text-muted-foreground">Your workspace could not load. <button onClick={()=>home.boot.refetch()} className="rounded-sm underline">Retry workspace</button></p>:home.boot.isPending?<p role="status" className="text-sm text-muted-foreground">Loading your workspace…</p>:<><LinkedInAutoPublisherPanel workspace={home.boot.data}/><GoogleCalendarSyncPanel workspace={home.boot.data}/><HomeContinue query={home.jobs}/><HomeVideos query={home.videos}/><HomeIdeas query={home.ideas}/></>}
 </main></ProShell>;
}