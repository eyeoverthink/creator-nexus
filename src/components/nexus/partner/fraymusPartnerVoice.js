export function partnerVoiceUrl(value){const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('Use an HTTP(S) voice bridge address without credentials or query parameters.');if(location.protocol==='https:'&&url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw new Error('Use loopback on this computer or an HTTPS voice bridge.');return url.toString().replace(/\/$/,'');}
import {speakWithAgentVoice} from '@/components/nexus/voice/speakWithAgentVoice';
export async function speakPartner(text,profile,signal){
 const bounded=text.slice(0,3000);if(!bounded.trim())throw new Error('There is no reply to read.');
 if(profile.voice==='elevenlabs')return speakWithAgentVoice(bounded,{title:`${profile.name} reply`,signal});
 if(profile.voice==='browser'){if(!window.speechSynthesis)throw new Error('Speech synthesis is unavailable in this browser.');speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(bounded);const local=speechSynthesis.getVoices().find(voice=>voice.localService);if(!local)throw new Error('No on-device browser voice is available yet. Try again after voices load, or configure your local voice bridge.');utterance.voice=local;speechSynthesis.speak(utterance);return {stop:()=>speechSynthesis.cancel()};}
 const response=await fetch(partnerVoiceUrl(profile.voiceEndpoint)+'/speak',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:bounded,voice:'myvoice'}),signal});
 if(!response.ok)throw new Error(`Voice bridge returned ${response.status}.`);
 if(!/audio\//i.test(response.headers.get('content-type')||''))throw new Error('Voice bridge did not return audio; check its stored voice setup.');
 const blob=await response.blob();if(blob.size>20*1024*1024)throw new Error('Voice output is too large.');
 const url=URL.createObjectURL(blob),audio=new Audio(url);const stop=()=>{audio.pause();URL.revokeObjectURL(url);};audio.onended=stop;audio.onerror=stop;try{await audio.play();}catch(error){stop();throw error;}return {stop};
}