import {useState} from 'react';
import {Play} from 'lucide-react';
import {Image} from '@/components/ui/image';

const SPARK_IMAGE_POOL=[
 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=80',
 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80',
 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80',
 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80',
 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=80',
 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80',
 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80',
 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80',
 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=900&q=80',
 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=900&q=80'
];

export function resolveSparkCardImage(card){
 const persisted=card?.image_url||card?.why_now?.image_url;
 if(typeof persisted==='string'&&/^https?:\/\//i.test(persisted))return persisted;
 const url=String(card?.why_now?.source_url||'');
 const yt=url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
 if(yt?.[1])return `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`;
 const slot=Math.max(0,(Number(String(card?.card_id||card?.id||'S1').replace(/\D/g,''))||1)-1);
 const seed=`${card?.batch_id||''}:${card?.card_id||card?.id||''}:${card?.hook_title||''}:${(card?.topic_tags||[]).join(',')}`;
 let h=0;
 for(let i=0;i<seed.length;i++)h=(h*31+seed.charCodeAt(i))>>>0;
 return SPARK_IMAGE_POOL[(h+slot)%SPARK_IMAGE_POOL.length];
}

export default function SparkCardImage({card}){
 const [failed,setFailed]=useState(false),src=resolveSparkCardImage(card),tags=(card?.topic_tags||[]).slice(0,3);
 return <div className="relative aspect-video rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center">
  {!failed&&src&&<Image src={src} alt={card?.hook_title||'Spark preview'} loading="lazy" onError={()=>setFailed(true)} className="absolute inset-0 h-full w-full object-cover opacity-85"/>}
  <div className="absolute inset-x-0 bottom-0 bg-background/85 px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px]">
   <div className="flex flex-wrap gap-1 truncate">{tags.map(t=><span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-muted-foreground font-mono">#{t}</span>)}</div>
   <span className="font-mono text-primary shrink-0">{card?.card_id||card?.id}</span>
  </div>
  <span className="relative rounded-avatar bg-popover/90 border border-border p-2.5 text-foreground"><Play size={18} aria-hidden="true"/></span>
 </div>;
}