import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import useVideoUrl from '@/components/nexus/library/useVideoUrl';
import {videoDate,videoSize} from '@/components/nexus/library/videoRecords';
export default function WatchPlayer({video,children}){
 const {url,loading,error,retry}=useVideoUrl(video),[failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[url]);
 return <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
  <section aria-label="Video player" className="min-w-0 space-y-3">
   {loading?<p role="status" className="text-muted-foreground">Opening saved video…</p>:url?<div className="flex min-h-64 justify-center overflow-hidden rounded-lg border border-border bg-background"><video key={url} src={url} controls playsInline preload="metadata" className="max-h-[75vh] w-full" aria-label={video.title} onError={()=>setFailed(true)}/></div>:<div className="flex min-h-64 items-center justify-center rounded-lg border border-border bg-background p-6 text-muted-foreground"><p role="status">{video.waiting?'Still being saved to the app':'A secure video link is unavailable.'}</p></div>}
   {failed&&<p role="status" className="text-sm text-muted-foreground">The video link didn't load. Try the Download link.</p>}
   {error&&<div role="alert" className="space-y-2 text-sm"><p className="text-destructive">{error.message}</p><Button variant="outline" onClick={()=>retry()}>Retry video link</Button></div>}
  </section>
  <aside aria-label="Video details" className="min-w-0 space-y-5">
   <h1 className="break-words font-heading text-2xl leading-8">{video.title}</h1>
   {video.description&&<p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{video.description}</p>}
   <dl className="space-y-3 text-sm"><div><dt className="text-muted-foreground">Uploaded</dt><dd><time dateTime={video.uploadedAt}>{videoDate(video.uploadedAt)}</time></dd></div><div><dt className="text-muted-foreground">Size</dt><dd>{videoSize(video.sizeBytes)}</dd></div></dl>
   {url&&<a href={url} download target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-md border border-input px-4 text-sm text-link hover:bg-secondary">Download</a>}
   {children}
  </aside>
 </div>;
}