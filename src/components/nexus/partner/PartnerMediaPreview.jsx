import {useEffect,useState} from 'react';
import {Image} from '@/components/ui/image';
export default function PartnerMediaPreview({item}){
 const [url,setUrl]=useState('');
 useEffect(()=>{if(!item.blob)return;const value=URL.createObjectURL(item.blob);setUrl(value);return()=>URL.revokeObjectURL(value);},[item.blob]);
 if(!url)return null;
 if(item.type==='image'&&['image/png','image/jpeg','image/webp','image/gif'].includes(item.mime))return <Image src={url} alt={item.title} fittingType="fit" className="w-full h-64 rounded border border-border"/>;
 if(item.type==='audio')return <audio controls src={url} className="w-full" aria-label={item.title}/>;
 if(item.type==='video')return <video controls src={url} className="w-full max-h-72 rounded" aria-label={item.title}/>;
 return null;
}