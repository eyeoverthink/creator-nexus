import {drawFrame} from '@/components/nexus/studiotools/hyperframes/drawCard';
const TYPES=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
// Records the animated cards (plus optional narration) into a real video file in the browser.
export async function renderVideo({canvas,cards,style,audioCtx,audioBuffer,onProgress,signal}){
 const mime=window.MediaRecorder&&TYPES.find(t=>MediaRecorder.isTypeSupported(t));
 if(!mime)throw new Error('This browser cannot record video. Use Chrome, Edge or Safari.');
 await document.fonts?.ready;
 const ctx=canvas.getContext('2d'),stream=canvas.captureStream(30);let source=null;
 if(audioCtx&&audioBuffer){await audioCtx.resume();const dest=audioCtx.createMediaStreamDestination();source=audioCtx.createBufferSource();source.buffer=audioBuffer;source.connect(dest);dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));}
 const total=cards[cards.length-1].end+0.6,chunks=[];
 const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4000000});
 rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
 const stopped=new Promise(r=>{rec.onstop=r;});
 rec.start(500);source?.start();const t0=performance.now();
 await new Promise(done=>{const tick=()=>{const t=(performance.now()-t0)/1000;if(signal?.aborted||t>=total){done();return;}drawFrame(ctx,canvas.width,canvas.height,style,cards,t);onProgress?.(t/total);requestAnimationFrame(tick);};tick();});
 rec.stop();try{source?.stop();}catch{}await stopped;stream.getTracks().forEach(t=>t.stop());
 if(signal?.aborted)throw new Error('Render cancelled.');
 const type=mime.split(';')[0];
 return {blob:new Blob(chunks,{type}),ext:type==='video/mp4'?'mp4':'webm'};
}