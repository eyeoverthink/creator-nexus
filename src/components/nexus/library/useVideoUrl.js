import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {httpsVideoUrl} from '@/components/nexus/library/videoRecords';
export default function useVideoUrl(video){
 const publicUrl=httpsVideoUrl(video?.videoUrl),fileUri=video?.fileUri;
 const signed=useQuery({queryKey:['spark','video',fileUri||null],enabled:!publicUrl&&!!fileUri,staleTime:45*60*1000,refetchInterval:!publicUrl&&fileUri?45*60*1000:false,queryFn:async()=>{
  const result=await base44.integrations.Core.CreateFileSignedUrl({file_uri:fileUri,expires_in:3600});
  const url=httpsVideoUrl(result.signed_url);if(!url)throw new Error('A secure video link is unavailable.');return url;
 }});
 return {url:publicUrl||httpsVideoUrl(signed.data),loading:!publicUrl&&!!fileUri&&signed.isPending,error:signed.error,retry:signed.refetch};
}