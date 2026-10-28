import {base44} from '@/api/base44Client';
// Speaks a reply with the owner's ElevenLabs agent voice and plays it. Replaying the same reply reuses the clip.
const clips=new Map();
export async function speakWithAgentVoice(text,{title,signal}={}){
 const clean=String(text||'').replace(/[#*_`>|~]/g,'').replace(/\s+/g,' ').trim().slice(0,2500);
 if(!clean)throw new Error('There is no reply to read.');
 let url=clips.get(clean);
 if(!url||Date.now()-url.at>50*60*1000){
  try{const {data}=await base44.functions.invoke('elevenLabsVoice',{action:'speak',text:clean,title});url={src:data.signed_url,at:Date.now()};clips.set(clean,url);}
  catch(e){throw new Error(e?.response?.data?.error||e?.message||'ElevenLabs could not speak this reply.');}
 }
 if(signal?.aborted)throw new Error('Voice playback was stopped.');
 const audio=new Audio(url.src);
 await audio.play();
 return {audio,stop:()=>audio.pause()};
}