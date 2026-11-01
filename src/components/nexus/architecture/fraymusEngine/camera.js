// Port of jade/Camera.java: orthographic projection (400x225 units * zoom) and a lookAt view matrix.
// Matrices are column-major Float32Arrays, as uploaded by Shader.uploadMat4f.
function ortho(o,l,r,b,t,n,f){
 o.fill(0);
 o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);
 o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);o[15]=1;
}

function lookAt(o,ex,ey,ez,cx,cy,cz,ux,uy,uz){
 let fx=cx-ex,fy=cy-ey,fz=cz-ez;
 const fl=Math.hypot(fx,fy,fz);fx/=fl;fy/=fl;fz/=fl;
 let sx=fy*uz-fz*uy,sy=fz*ux-fx*uz,sz=fx*uy-fy*ux;
 const sl=Math.hypot(sx,sy,sz);sx/=sl;sy/=sl;sz/=sl;
 const vx=sy*fz-sz*fy,vy=sz*fx-sx*fz,vz=sx*fy-sy*fx;
 o[0]=sx;o[1]=vx;o[2]=-fx;o[3]=0;
 o[4]=sy;o[5]=vy;o[6]=-fy;o[7]=0;
 o[8]=sz;o[9]=vz;o[10]=-fz;o[11]=0;
 o[12]=-(sx*ex+sy*ey+sz*ez);o[13]=-(vx*ex+vy*ey+vz*ez);o[14]=fx*ex+fy*ey+fz*ez;o[15]=1;
}

export class Camera{
 constructor(x=0,y=0){
  this.position={x,y};
  this.projectionSize={x:400,y:225};
  this.zoom=1;
  this.projection=new Float32Array(16);
  this.view=new Float32Array(16);
  this.adjustProjection();
 }
 adjustProjection(){
  const hw=this.projectionSize.x*this.zoom/2,hh=this.projectionSize.y*this.zoom/2;
  ortho(this.projection,-hw,hw,-hh,hh,0,100);
 }
 getView(){
  const {x,y}=this.position;
  lookAt(this.view,x,y,20,x,y,-1,0,1,0);
  return this.view;
 }
 setZoom(zoom){this.zoom=zoom;this.adjustProjection();}
 addZoom(value){
  this.zoom+=value;
  if(this.zoom<0.1)this.zoom=0.1;
  this.adjustProjection();
 }
}