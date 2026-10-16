import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Image} from '@/components/ui/image';
import {Button} from '@/components/ui/button';
export default function AssetPreview({asset}){
 const file=useQuery({queryKey:['asset-file',asset.file_uri],enabled:!!asset.file_uri,queryFn:()=>base44.integrations.Core.CreateFileSignedUrl({file_uri:asset.file_uri,expires_in:3600}),staleTime:3000000,refetchInterval:3000000});
 const url=file.data?.signed_url,mime=asset.mime_type||'';
 return <div className="space-y-4">
  {file.isFetching&&asset.file_uri&&<p role="status" className="text-sm text-muted-foreground">Opening private media…</p>}
  {file.error&&<p role="alert" className="text-sm text-destructive">{file.error.message}</p>}
  {url&&<><div className="rounded-lg bg-secondary overflow-hidden">{mime.startsWith('image/')?<Image src={url} alt={asset.title} className="w-full max-h-96 object-contain" fittingType="fit"/>:mime.startsWith('video/')?<video controls preload="metadata" src={url} aria-label={asset.title} className="w-full max-h-96"/>:mime.startsWith('audio/')?<audio controls src={url} aria-label={asset.title} className="w-full"/>:null}</div><Button asChild variant="outline" size="sm"><a href={url} target="_blank" rel="noopener noreferrer">Open / download {asset.file_name||'file'}</a></Button></>}
  {asset.body&&<div className="rounded-lg bg-secondary p-4 text-sm whitespace-pre-wrap leading-relaxed break-words">{asset.body}</div>}
 </div>;
}