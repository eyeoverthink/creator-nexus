// Paints one HyperFrames motion card per frame onto a canvas.
const SANS='Inter, Arial, sans-serif',MONO='"IBM Plex Mono", monospace';
const ease=t=>1-Math.pow(1-Math.min(1,Math.max(0,t)),3);
function wrap(ctx,text,max){const out=[];let line='';for(const w of text.split(' ')){const t=line?`${line} ${w}`:w;if(ctx.measureText(t).width>max&&line){out.push(line);line=w;}else line=t;}if(line)out.push(line);return out;}
function block(ctx,text,x,y,max,size,color,weight=600,font=SANS,align='left'){ctx.font=`${weight} ${size}px ${font}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='top';const lines=wrap(ctx,text,max);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*size*1.25));return y+lines.length*size*1.25;}
function box(ctx,x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);ctx.fill();}
const parts=(t,re)=>t.replace(/[.!?]$/,'').split(re).map(s=>s.trim()).filter(Boolean).slice(0,6);
const PAINT={
 title_card:(c,a,L)=>{const y=block(c.ctx,c.card.text,L.cx,L.y+L.h*0.3,L.w,L.s*0.085,c.st.ink,700,SANS,'center');box(c.ctx,L.cx-L.w*0.2*ease(c.p*2),y+L.s*0.03,L.w*0.4*ease(c.p*2),L.s*0.012,4,a);},
 hero_stat:(c,a,L)=>{const n=(c.card.text.match(/\$?\d[\d,.]*\s*(%|x|×|k|million|billion|percent)?/i)||[''])[0];block(c.ctx,n,L.cx,L.y+L.h*0.18,L.w,L.s*0.2,a,800,SANS,'center');block(c.ctx,c.card.text,L.cx,L.y+L.h*0.55,L.w,L.s*0.045,c.st.ink,500,SANS,'center');},
 keyword_card:(c,a,L)=>{const k=c.card.text.replace(/[^\w\s'-]/g,'').split(' ').filter(w=>w.length>4).sort((x,y)=>y.length-x.length).slice(0,2).join(' ')||c.card.text;block(c.ctx,k.toUpperCase(),L.cx,L.y+L.h*0.25,L.w,L.s*0.1,a,800,SANS,'center');block(c.ctx,c.card.text,L.cx,L.y+L.h*0.6,L.w,L.s*0.042,c.st.muted,500,SANS,'center');},
 bullet_build:(c,a,L)=>{const items=parts(c.card.text,/,|;|\band\b/);let y=L.y+L.h*0.12;items.forEach((t,i)=>{if(c.p<i/(items.length+1))return;box(c.ctx,L.x,y+L.s*0.012,L.s*0.025,L.s*0.025,8,a);y=block(c.ctx,t,L.x+L.s*0.05,y,L.w-L.s*0.05,L.s*0.05,c.st.ink)+L.s*0.03;});},
 spec_table:(c,a,L)=>{const rows=parts(c.card.text,/[,;]/);let y=L.y+L.h*0.12;rows.forEach((r,i)=>{if(c.p<i/(rows.length+1))return;const [k,v]=r.includes(':')?r.split(/:(.+)/):[r,''];block(c.ctx,k,L.x,y,L.w*0.45,L.s*0.042,a,700);block(c.ctx,v||'',L.x+L.w*0.5,y,L.w*0.5,L.s*0.042,c.st.ink,500);y+=L.s*0.1;box(c.ctx,L.x,y-L.s*0.03,L.w,2,0,c.st.muted);});},
 code_snippet:(c,a,L)=>{box(c.ctx,L.x,L.y+L.h*0.1,L.w,L.h*0.7,12,c.st.canvas);const shown=c.card.text.slice(0,Math.ceil(c.card.text.length*ease(c.p*1.6)));block(c.ctx,shown+(Math.floor(c.t*2)%2?'▍':''),L.x+L.s*0.04,L.y+L.h*0.16,L.w-L.s*0.08,L.s*0.04,a,500,MONO);},
 diagram_flow:(c,a,L)=>{const n=parts(c.card.text,/->|→|\bthen\b|\bleads to\b/i);const gap=L.h*0.8/Math.max(1,n.length);n.forEach((t,i)=>{if(c.p<i/(n.length+1))return;const y=L.y+L.h*0.08+i*gap;box(c.ctx,L.x+L.w*0.1,y,L.w*0.8,gap*0.6,14,c.st.canvas);block(c.ctx,t,L.cx,y+gap*0.12,L.w*0.7,L.s*0.04,c.st.ink,600,SANS,'center');if(i<n.length-1)box(c.ctx,L.cx-2,y+gap*0.6,4,gap*0.4,0,a);});},
};
export function drawFrame(ctx,W,H,st,cards,t){
 const i=Math.max(0,cards.findIndex(c=>t<c.end)),card=cards[i===-1?cards.length-1:i],p=(t-card.start)/card.duration_s,a=st.accents[(card.index-1)%4],s=Math.min(W,H);
 ctx.fillStyle=st.canvas;ctx.fillRect(0,0,W,H);
 const m=s*0.07,L={x:m*2,y:H*0.12+m,w:W-m*4,h:H*0.7-m*2,cx:W/2,s};
 box(ctx,m,H*0.12,W-m*2,H*0.7,24,st.surface);box(ctx,m,H*0.12,s*0.015,H*0.7*ease(p*3),8,a);
 ctx.globalAlpha=ease(p*4);ctx.save();ctx.translate(0,(1-ease(p*4))*H*0.02);PAINT[card.card_type]?.({ctx,card,p,t,st},a,L);ctx.restore();ctx.globalAlpha=1;
 const total=cards[cards.length-1].end;box(ctx,m,H*0.9,(W-m*2)*Math.min(1,t/total),s*0.008,4,a);
 ctx.font=`500 ${s*0.03}px ${MONO}`;ctx.fillStyle=st.muted;ctx.textAlign='left';ctx.fillText(`${card.index}/${cards.length} · ${card.card_type.replace('_',' ')}`,m,H*0.93);
}