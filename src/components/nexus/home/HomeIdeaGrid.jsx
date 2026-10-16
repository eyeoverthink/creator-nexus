import {Link} from 'react-router-dom';
import {ArrowUpRight,Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
export default function HomeIdeaGrid({cards,feed}){
 const ideas=cards.length?cards:feed;
 return <section className="studio-section" aria-labelledby="home-ideas"><div className="studio-section-heading"><h2 id="home-ideas">A spark of inspiration</h2><Link to="/spark" className="studio-text-link">Explore Create<ArrowUpRight size={16} aria-hidden="true"/></Link></div>
  {ideas.length?<div className="studio-bento">{ideas.map((idea,i)=><article key={idea.id} className={'studio-idea-tile '+(i===0?'is-featured':'')}><div className={'studio-idea-art '+(i%2?'art-grid':'art-orbit')} aria-hidden="true"><Sparkles size={32}/></div><div className="studio-idea-copy"><p className="studio-kicker">{idea.format||idea.tag||'Your idea'}</p><h3>{idea.hook_title||idea.title}</h3><p>{idea.one_line_pitch||idea.body}</p><Link to="/spark" className="studio-text-link">Explore idea<ArrowUpRight size={16} aria-hidden="true"/></Link></div></article>)}</div>:<div className="studio-empty"><Sparkles size={28} className="text-primary" aria-hidden="true"/><p>Your next good idea is waiting in Create.</p><Button asChild variant="outline"><Link to="/spark">Explore ideas</Link></Button></div>}
 </section>;
}