// Real pixel editing on a canvas. Nothing leaves the browser until you save.
export const BASE={width:0,height:0,fit:'cover',brightness:0,contrast:0,unsharp:false,unsharpAmount:80,unsharpRadius:1.2,unsharpThreshold:2,sharpen:false,format:'png',quality:90};
export const PRESETS=[
 {id:'cover_ready',label:'Cover-ready',desc:'1024×1024 crop, unsharp mask, WebP',settings:{width:1024,height:1024,fit:'cover',unsharp:true,unsharpAmount:80,unsharpRadius:1.2,format:'webp',quality:90}},
 {id:'banner_ready',label:'Banner-ready',desc:'1344×768 crop, contrast boost, sharpen, WebP',settings:{width:1344,height:768,fit:'cover',brightness:5,contrast:20,sharpen:true,format:'webp',quality:90}},
 {id:'sharpen',label:'Sharpen only',desc:'Same size, strong unsharp mask, PNG',settings:{unsharp:true,unsharpAmount:100,unsharpRadius:1.5,format:'png'}},
 {id:'webp',label:'Convert to WebP',desc:'Same size, WebP at quality 85',settings:{format:'webp',quality:85}},
];
export async function loadImage(src){
 const blob=typeof src==='string'?await (await fetch(src)).blob():src;
 const bitmap=await window.createImageBitmap(blob,{imageOrientation:'from-image'});
 return {bitmap,blob};
}
function resized(bitmap,{width,height,fit}){
 const sw=bitmap.width,sh=bitmap.height,W=Math.min(4096,Math.round(width||sw)),H=Math.min(4096,Math.round(height||sh));
 const c=document.createElement('canvas');c.width=W;c.height=H;
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingQuality='high';
 let sx=0,sy=0,cw=sw,ch=sh,dx=0,dy=0,dw=W,dh=H;
 if(fit==='cover'){const k=Math.max(W/sw,H/sh);cw=W/k;ch=H/k;sx=(sw-cw)/2;sy=(sh-ch)/2;}
 if(fit==='contain'){const k=Math.min(W/sw,H/sh);dw=sw*k;dh=sh*k;dx=(W-dw)/2;dy=(H-dh)/2;}
 ctx.drawImage(bitmap,sx,sy,cw,ch,dx,dy,dw,dh);return c;
}
function brightnessContrast(d,b,c){const bb=b*2.55,cc=c*2.55,f=(259*(cc+255))/(255*(259-cc));for(let i=0;i<d.length;i+=4)for(let k=0;k<3;k++)d[i+k]=f*(d[i+k]+bb-128)+128;}
function blurPass(src,dst,w,h,r,horizontal){
 const len=horizontal?w:h,lines=horizontal?h:w;
 for(let l=0;l<lines;l++)for(let ch=0;ch<3;ch++){
  const at=p=>((horizontal?l*w+p:p*w+l)*4)+ch;let sum=0;
  for(let p=-r;p<=r;p++)sum+=src[at(Math.min(len-1,Math.max(0,p)))];
  for(let p=0;p<len;p++){dst[at(p)]=sum/(2*r+1);sum+=src[at(Math.min(len-1,p+r+1))]-src[at(Math.max(0,p-r))];}
 }
}
function unsharp(img,amount,radius,threshold){
 const {width:w,height:h,data:d}=img,r=Math.max(1,Math.round(radius));
 let a=Float32Array.from(d),b=new Float32Array(d.length);
 for(let i=0;i<3;i++){blurPass(a,b,w,h,r,true);blurPass(b,a,w,h,r,false);}
 for(let i=0;i<d.length;i++){if(i%4===3)continue;const diff=d[i]-a[i];if(Math.abs(diff)>=threshold)d[i]=d[i]+diff*amount/100;}
}
function sharpen(img){
 const {width:w,height:h,data:s}=img,o=new Uint8ClampedArray(s);
 const px=(x,y,k)=>s[((Math.min(h-1,Math.max(0,y))*w)+Math.min(w-1,Math.max(0,x)))*4+k];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let k=0;k<3;k++)o[(y*w+x)*4+k]=5*px(x,y,k)-px(x-1,y,k)-px(x+1,y,k)-px(x,y-1,k)-px(x,y+1,k);
 s.set(o);
}
export function applyEdits(bitmap,s){
 const c=resized(bitmap,s),ctx=c.getContext('2d',{willReadFrequently:true});
 if(s.brightness||s.contrast||s.unsharp||s.sharpen){
  const img=ctx.getImageData(0,0,c.width,c.height);
  if(s.brightness||s.contrast)brightnessContrast(img.data,s.brightness,s.contrast);
  if(s.unsharp)unsharp(img,s.unsharpAmount,s.unsharpRadius,s.unsharpThreshold);
  if(s.sharpen)sharpen(img);
  ctx.putImageData(img,0,0);
 }
 return c;
}
export function exportBlob(canvas,format,quality){
 const type=format==='jpeg'?'image/jpeg':format==='webp'?'image/webp':'image/png';
 return new Promise((res,rej)=>canvas.toBlob(b=>b?res(b):rej(new Error('This browser could not export that format.')),type,quality/100));
}