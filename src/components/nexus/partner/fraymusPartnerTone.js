const positive=/\b(good|great|love|happy|excited|awesome|thanks|progress|win|beautiful|yes)\b/gi;
const negative=/\b(bad|hate|sad|angry|stuck|broken|failed|frustrated|overwhelmed|no)\b/gi;
const energetic=/[!?]|\b(now|fast|go|build|ship|create|run|urgent)\b/gi;
export function estimateConversationTone(text,previous){
 const pos=(text.match(positive)||[]).length,neg=(text.match(negative)||[]).length,pulse=(text.match(energetic)||[]).length;
 const mood=Math.max(0,Math.min(100,Math.round(previous.mood*0.8+50*0.2+(pos-neg)*6)));
 const energy=Math.max(0,Math.min(100,Math.round(previous.energy*0.75+Math.min(100,35+pulse*9)*0.25)));
 return {mood,energy,at:new Date().toISOString(),basis:{positive_terms:pos,negative_terms:neg,energy_markers:pulse},notice:'Transparent text-tone heuristic; not a claim about human feelings.'};
}