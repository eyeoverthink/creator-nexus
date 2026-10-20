import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
export default function HomeHero(){
 return <section aria-labelledby="home-heading" className="rounded-lg border border-border bg-card p-6 sm:p-8">
  <h1 id="home-heading" className="font-heading text-2xl leading-tight tracking-tight sm:text-3xl">What do you want to make today?</h1>
  <p className="mt-3 text-sm text-muted-foreground">Pick up a project, explore a saved idea, or start something new.</p>
  <div className="mt-6 flex flex-wrap items-center gap-3">
   <Button asChild><Link to="/spark">Start creating</Link></Button>
   <Button variant="secondary" asChild><Link to="/openclaw">OpenClaw Sovereign Hub</Link></Button>
   <Button variant="outline" asChild><Link to="/ai-workshop?view=opeg">Φ-Omega &amp; OPEG V1.0</Link></Button>
   <Link to="/studio" className="inline-flex min-h-8 items-center rounded-md px-2 text-sm text-muted-foreground underline-offset-4 hover:underline">Open studio</Link>
  </div>
 </section>;
}