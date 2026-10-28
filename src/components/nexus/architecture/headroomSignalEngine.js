// Browser port of headroom-node-python/HeadroomNode.py render_loop
// Source: eyeoverthink/vaughn-headroom @ 2716e72dbda853dc293c336d1c5cfbc4a506da30
export const W=1024,H=768,THOUGHT_W=400,THOUGHT_H=300;
export const createSignalState=()=>({text:'',thought:null,glitch:0,neural:0.5,speaking:false});

// Mirrors text_listener(): {"speak"},{"thought_img"},{"glitch"},{"neural"}
export function applyCommand(state,data){
 if('speak' in data){state.text=String(data.speak);state.glitch=0.8;}
 if('glitch' in data)state.glitch=Number(data.glitch)||0;
 if('neural' in data)state.neural=Number(data.neural)||0;
}

function horizontalGlitch(img,intensity){
 const d=img.data,row=W*4,n=Math.floor(intensity*20);
 for(let i=0;i<n;i++){
  const y=Math.floor(Math.random()*H),shift=Math.floor(Math.random()*60)-30,o=y*row;
  const copy=d.slice(o,o+row);
  for(let x=0;x<W;x++){const s=((x-shift)%W+W)%W;for(let c=0;c<4;c++)d[o+x*4+c]=copy[s*4+c];}
 }
}
function chromatic(img,offset){
 const d=img.data,src=d.slice();
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;
  d[i]=src[(y*W+((x-offset)%W+W)%W)*4];
  d[i+2]=src[(y*W+(x+offset)%W)*4+2];}
}
function noise(img,intensity){const d=img.data,m=Math.floor(intensity*255);if(!m)return;for(let i=0;i<d.length;i+=4){d[i]=Math.min(255,d[i]+Math.random()*m);d[i+1]=Math.min(255,d[i+1]+Math.random()*m);d[i+2]=Math.min(255,d[i+2]+Math.random()*m);}}
function scanlines(img,intensity){const d=img.data;for(let y=0;y<H;y+=2){const o=y*W*4;for(let x=0;x<W*4;x+=4){d[o+x]*=1-intensity;d[o+x+1]*=1-intensity;d[o+x+2]*=1-intensity;}}}

let vignette=null;
function applyVignette(img){
 if(!vignette){vignette=new Float32Array(W*H);const gx=x=>Math.exp(-((x-W/2)**2)/(2*(W/2)**2)),gy=y=>Math.exp(-((y-H/2)**2)/(2*(H/2)**2));for(let y=0;y<H;y++)for(let x=0;x<W;x++)vignette[y*W+x]=gx(x)*gy(y);}
 const d=img.data;for(let p=0;p<W*H;p++){const k=vignette[p],i=p*4;d[i]*=k;d[i+1]*=k;d[i+2]*=k;}
}

export function renderFrame(ctx,s,t){
 ctx.fillStyle='rgb(0,20,0)';ctx.fillRect(0,0,W,H);ctx.lineWidth=1;
 for(let y=0;y<H;y+=30){const off=Math.sin(t*2+y*0.05)*10;ctx.strokeStyle=`rgb(0,${Math.floor(Math.abs(Math.sin(t+y*0.01))*100)},0)`;ctx.beginPath();ctx.moveTo(0,y+off);ctx.lineTo(W,y+off);ctx.stroke();}
 ctx.strokeStyle='rgb(0,50,0)';
 for(let x=0;x<W;x+=40){const off=Math.cos(t*1.5+x*0.03)*5;ctx.beginPath();ctx.moveTo(x+off,0);ctx.lineTo(x+off,H);ctx.stroke();}
 if(s.thought){const xo=50+Math.sin(t*0.5)*20,yo=50;ctx.strokeStyle='rgb(200,255,0)';ctx.lineWidth=2;ctx.strokeRect(xo-5,yo-5,THOUGHT_W+10,THOUGHT_H+10);ctx.drawImage(s.thought,xo,yo,THOUGHT_W,THOUGHT_H);ctx.fillStyle='rgb(200,255,0)';ctx.font='14px monospace';ctx.fillText('THOUGHT STREAM',xo,yo-10);}
 const hy=H-250;ctx.fillStyle='rgb(0,255,0)';ctx.font='bold 34px monospace';ctx.fillText('>>> FRAYMUS SIGNAL <<<',50,hy);
 ctx.fillStyle='rgb(0,180,0)';ctx.font='17px monospace';ctx.fillText(`NEURAL: ${s.neural.toFixed(2)} | ${s.speaking?'SPEAKING':'IDLE'}`,50,hy+40);
 ctx.fillStyle='rgb(0,255,0)';ctx.font='bold 20px monospace';let ty=hy+90,line='';
 for(const w of s.text.split(/\s+/).filter(Boolean)){const test=line+w+' ';if(test.length>60){ctx.fillText(line,50,ty);ty+=35;line=w+' ';}else line=test;}
 if(line)ctx.fillText(line,50,ty);
 const img=ctx.getImageData(0,0,W,H);
 if(s.speaking||s.glitch>0.1){
  if(Math.random()<s.glitch*0.5)horizontalGlitch(img,s.glitch);
  if(Math.random()<s.glitch*0.3)chromatic(img,Math.floor(s.glitch*10));
  if(Math.random()<s.glitch*0.4)noise(img,s.glitch*0.2);
 }
 s.glitch*=0.92;
 scanlines(img,0.15);applyVignette(img);ctx.putImageData(img,0,0);
}