import {Download} from 'lucide-react';
import {Button} from '@/components/ui/button';
export default function ElevenLabsResult({result}){
 return <div className="rounded-lg border border-success/40 bg-card p-3 space-y-2">
  <p className="text-sm font-medium break-words">{result.title}</p>
  <audio controls src={result.signed_url} aria-label={result.title} className="w-full"/>
  <div className="flex flex-wrap items-center gap-3 text-xs">
   <Button asChild size="sm" variant="outline"><a href={result.signed_url} download={result.file_name} target="_blank" rel="noopener noreferrer"><Download/>Download MP3</a></Button>
   <span className="text-muted-foreground">Saved privately to your Library · {result.characters} characters used</span>
  </div>
 </div>;
}