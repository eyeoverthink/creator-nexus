import {Link} from 'react-router-dom';
export default function HomeIdeaCard({card,featured}){
 return <Link to={'/spark?batch='+encodeURIComponent(card.batch_id)+'&card='+encodeURIComponent(card.id)} className={'home-card flex min-w-0 flex-col rounded-lg border border-border bg-card '+(featured?'p-6':'p-4')} aria-label={'Open idea: '+card.hook_title}>
  {featured&&<span className="mb-3 text-xs font-medium text-muted-foreground">Featured idea</span>}
  <h3 className={'line-clamp-2 break-words font-heading leading-6 '+(featured?'text-lg':'text-base')}>{card.hook_title}</h3>
  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{card.one_line_pitch}</p>
  <span className="mt-auto pt-4 text-xs text-muted-foreground">{card.format}</span>
 </Link>;
}