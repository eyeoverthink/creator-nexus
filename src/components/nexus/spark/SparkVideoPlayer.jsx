import {useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {waitingForVideo} from '@/components/nexus/spark/jobVideoData';

export default function SparkVideoPlayer({fileUri,videoUrl,title,sizeBytes,uploadedAt,preload='metadata'}){
 const publicUrl=typeof videoUrl==='string'&&videoUrl.startsWith('https://')?videoUrl:null;
 const video=useQuery({queryKey:['spark','video',fileUri||null],enabled:!publicUrl&&!!fileUri,queryFn:async()=>{const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:fileUri,expires_in:3600});return signed_url;},staleTime:45*60*1000,refetchInterval:!publicUrl&&fileUri?45*60*1000:false});
 const url=publicUrl||(typeof video.data==='string'&&video.data.startsWith('https://')?video.data:null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[url]);
 if(!publicUrl&&!fileUri)return <p className="text-muted-foreground">{waitingForVideo}</p>;
 if(!publicUrl&&video.isPending)return <p role="status" className="text-muted-foreground">Opening saved video…</p>;
 if(!publicUrl&&video.error)return <div role="alert"><p className="text-destructive">Could not open video: {video.error.message}</p><button className="text-primary underline" onClick={()=>video.refetch()}>Retry</button></div>;
 if(!url)return <p className="text-muted-foreground">{waitingForVideo}</p>;
 return <div className="space-y-2">
  <div className="flex justify-center overflow-hidden rounded-lg bg-background"><video key={url} controls playsInline preload={preload} className="mx-auto max-h-[70vh] w-auto max-w-full" aria-label={title||'Rendered Spark video'} src={url} onError={()=>setFailed(true)}/></div>
  {failed&&<p role="status" className="text-muted-foreground">The video link didn't load. Try the Download link.</p>}
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
   {typeof sizeBytes==='number'&&<span>{(sizeBytes/(1024*1024)).toFixed(2)} MB</span>}
   {uploadedAt&&<time dateTime={uploadedAt}>Uploaded {new Date(uploadedAt).toLocaleString()}</time>}
   <a className="text-primary underline" href={url} download target="_blank" rel="noopener noreferrer">Download</a>
  </div>
  {fileUri&&!publicUrl&&<p className="text-muted-foreground">Saved video (stored privately)</p>}
 </div>;
}