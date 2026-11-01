const once=(el,ev,ms=15000)=>new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('The video took too long to respond.')),ms);el.addEventListener(ev,()=>{clearTimeout(t);res();},{once:true});});
// Samples evenly spaced still frames from a video in the browser.
export async function extractFrames(src,count=8,width=512){
 const video=document.createElement('video');video.muted=true;video.playsInline=true;video.crossOrigin='anonymous';video.preload='auto';
 const url=typeof src==='string'?src:URL.createObjectURL(src);video.src=url;
 await Promise.race([once(video,'loadedmetadata'),new Promise((_,rej)=>{video.onerror=()=>rej(new Error('This video could not be opened in the browser.'));})]);
 if(!isFinite(video.duration)){video.currentTime=1e7;await once(video,'seeked');}
 const duration=video.duration;if(!duration||!isFinite(duration))throw new Error('Could not read the video length.');
 const h=Math.round(width*video.videoHeight/video.videoWidth)||288,c=document.createElement('canvas');c.width=width;c.height=h;const ctx=c.getContext('2d');
 const frames=[];
 for(let i=0;i<count;i++){const t=+Math.min(duration-0.05,(i+0.5)*duration/count).toFixed(2);const seeked=once(video,'seeked');video.currentTime=t;await seeked;ctx.drawImage(video,0,0,width,h);const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.8));frames.push({t,blob,preview:URL.createObjectURL(blob)});}
 if(typeof src!=='string')URL.revokeObjectURL(url);
 return {duration,frames};
}