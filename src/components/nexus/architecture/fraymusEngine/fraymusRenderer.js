// Port of fraymus/FraymusRenderer.java: every visual is a line (circles are 32-segment polylines).
// Draw order is preserved because the 10,000-line cap drops whatever is added last (the boundary).
import {OUT,wants} from './logicBrain.js';

const MAX_TRAIL_LENGTH=60;

export class FraymusRenderer{
 constructor(){this.trails=new Map();}

 render(world,batch,t){
  const nodes=world.nodes;
  this.drawGrid(batch);
  this.updateTrails(nodes);
  this.drawTrails(nodes,batch);
  this.drawLinks(nodes,batch);
  for(const n of nodes)this.drawNode(n,batch,t);
  this.drawBoundary(batch);
 }

 drawGrid(batch){
  for(let x=-180;x<=180;x+=20)for(let y=-100;y<=100;y+=20)batch.addLine(x-0.3,y,x+0.3,y,0.08,0.08,0.15);
 }

 updateTrails(nodes){
  for(const n of nodes){
   let trail=this.trails.get(n.name);
   if(!trail){trail=[];this.trails.set(n.name,trail);}
   trail.push(n.x,n.y);
   if(trail.length>MAX_TRAIL_LENGTH*2)trail.splice(0,2);
  }
  const alive=new Set(nodes.map(n=>n.name));
  for(const name of this.trails.keys())if(!alive.has(name))this.trails.delete(name);
 }

 drawTrails(nodes,batch){
  for(const n of nodes){
   const trail=this.trails.get(n.name),len=trail.length/2;
   for(let i=0;i<len-1;i++){
    const a=i/len;
    batch.addLine(trail[i*2],trail[i*2+1],trail[i*2+2],trail[i*2+3],n.r*a*0.8,n.g*a*0.8,n.b*a*0.8);
   }
  }
 }

 drawLinks(nodes,batch){
  for(let i=0;i<nodes.length;i++){
   for(let j=i+1;j<nodes.length;j++){
    const a=nodes[i],b=nodes[j],dist=Math.hypot(a.x-b.x,a.y-b.y);
    if(dist<100){
     const al=1-dist/100;
     batch.addLine(a.x,a.y,b.x,b.y,0.2*al,0.8*al,0.6*al);
    }
   }
  }
 }

 drawNode(n,batch,t){
  const radius=3+n.energy*6;
  const [cr,cg,cb]=n.consciousness.color();
  const breath=n.consciousness.regressive?Math.sin(t*1.5)*0.3+0.7:1;
  batch.addCircle(n.x,n.y,radius,cr*breath,cg*breath,cb*breath);
  const pulse=Math.sin(t*2+n.frequency*0.01)*0.5+0.5;
  for(const [scale,k] of [[1.3,0.3],[1.7,0.15],[2.2,0.07]]){
   const f=k*(0.7+pulse*0.3);
   batch.addCircle(n.x,n.y,radius*scale,cr*f,cg*f,cb*f);
  }
  const [rr,rg,rb]=n.role.color;
  batch.addCircle(n.x,n.y,radius*0.4,rr,rg,rb);
  if(n.spikeFlash)this.drawSpike(n,batch,t,radius);
  this.drawIntent(n,batch,radius);
  batch.addCircle(n.x,n.y+radius+2,0.8,n.r,n.g,n.b);
  const barW=8,barY=n.y-radius-3,barX=n.x-barW*0.5,ew=barW*n.energy;
  batch.addLine(barX,barY,barX+ew,barY,1-n.energy,n.energy,0);
  batch.addLine(barX+ew,barY,barX+barW,barY,0.2,0.2,0.2);
 }

 drawSpike(n,batch,t,radius){
  const sp=Math.sin(t*10)*0.5+0.5,rayLen=radius*3;
  for(let r=0;r<8;r++){
   const a=r*Math.PI/4;
   batch.addLine(n.x,n.y,n.x+Math.cos(a)*rayLen,n.y+Math.sin(a)*rayLen,1,0.6+sp*0.4,0.1+sp*0.2);
  }
  batch.addCircle(n.x,n.y,radius*2.5,1,sp*0.8,sp*0.3);
 }

 // Source quirk kept: the flee arrow uses the same velocity direction as the seek arrow.
 drawIntent(n,batch,radius){
  const out=n.brain.lastOutputs;
  if(!out.length)return;
  const ang=Math.atan2(n.vy,n.vx),len=radius*1.5;
  const ex=n.x+Math.cos(ang)*len,ey=n.y+Math.sin(ang)*len;
  if(wants(out,OUT.SEEK))batch.addLine(n.x,n.y,ex,ey,0,1,0.5);
  if(wants(out,OUT.FLEE))batch.addLine(n.x,n.y,ex,ey,1,0.2,0.2);
  if(wants(out,OUT.REPRODUCE)){
   const s=radius*0.5,px=n.x+radius+2,py=n.y;
   batch.addLine(px-s,py,px+s,py,0.3,1,0.3);
   batch.addLine(px,py-s,px,py+s,0.3,1,0.3);
  }
  if(wants(out,OUT.MUTATE)){
   const s=radius*0.4,mx=n.x-radius-2,my=n.y;
   batch.addLine(mx-s,my-s,mx+s,my+s,1,0.5,0);
   batch.addLine(mx-s,my+s,mx+s,my-s,1,0.5,0);
  }
 }

 drawBoundary(batch){
  const c=[0.15,0.15,0.25];
  batch.addLine(-180,-100,180,-100,...c);
  batch.addLine(180,-100,180,100,...c);
  batch.addLine(180,100,-180,100,...c);
  batch.addLine(-180,100,-180,-100,...c);
 }
}