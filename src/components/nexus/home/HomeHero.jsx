import {Link} from 'react-router-dom';
import {ArrowUpRight,Sparkles,Play,PenLine} from 'lucide-react';
import {Button} from '@/components/ui/button';
export default function HomeHero(){
 return <section className="studio-hero" aria-labelledby="home-title">
  <div className="studio-hero-copy"><p className="studio-kicker">A little inspiration. A lot of possibility.</p><h1 id="home-title">What do you want to make today?</h1><p>Find your next idea, shape your story, and make something that feels like you.</p><Button asChild size="lg"><Link to="/spark">Start creating<ArrowUpRight size={20} aria-hidden="true"/></Link></Button></div>
  <div className="studio-hero-art" aria-hidden="true"><div className="studio-art-card studio-art-back"><PenLine size={32}/><span>Your next big idea</span></div><div className="studio-art-card studio-art-front"><div className="studio-art-orb"><Play size={32}/></div><span>From spark to story</span><Sparkles size={22}/></div></div>
 </section>;
}