import {Progress} from '@/components/ui/progress';
import {voiceError} from '@/components/nexus/voice/useElevenLabs';
export default function ElevenLabsQuota({status}){
 if(status.isPending)return <p role="status" className="text-xs text-muted-foreground">Checking your ElevenLabs plan…</p>;
 if(status.error)return <p role="alert" className="text-sm text-destructive">{voiceError(status.error)}</p>;
 const s=status.data,used=s.characters_limit?Math.min(100,Math.round(s.characters_used/s.characters_limit*100)):0;
 return <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-xs">
  <div className="flex flex-wrap justify-between gap-2"><span className="capitalize font-medium">{s.tier} plan</span><span className="text-muted-foreground">{s.characters_left.toLocaleString()} of {s.characters_limit.toLocaleString()} characters left{s.resets_at?` · resets ${new Date(s.resets_at).toLocaleDateString()}`:''}</span></div>
  <Progress value={used} aria-label="ElevenLabs characters used"/>
  {s.characters_left<200&&<p className="text-caution">Your ElevenLabs plan is almost out of characters. Short clips still work; longer ones are refused until the reset or an upgrade on ElevenLabs.</p>}
 </div>;
}