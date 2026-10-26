// Port of jade/Window.loop(): input -> camera -> DebugDraw.beginFrame -> fixed 60 Hz physics accumulator ->
// clear -> FraymusRenderer.render -> DebugDraw.draw. Rendered straight to the canvas (no ImGui / offscreen FBO).
import {Camera} from './camera.js';
import {LineBatch} from './lineBatch.js';
import {FraymusRenderer} from './fraymusRenderer.js';
import {createFraymusWorld} from './phiWorld.js';

export const VIEW_W=1280;
export const VIEW_H=720;
const PHYSICS_DT=1/60;
// Browser deviation: the Java loop has no cap, but rAF pauses in background tabs and would otherwise
// trigger a huge catch-up burst on return.
const MAX_FRAME_DT=0.25;

export class FraymusEngine{
 constructor(canvas,{now=()=>performance.now()/1000}={}){
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:false});
  if(!gl)throw new Error('WebGL2 is not available in this browser.');
  this.gl=gl;this.now=now;
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  this.camera=new Camera(0,0);
  this.batch=new LineBatch(gl);
  this.input={scrollY:0,dragging:false,dx:0,dy:0};
  this.fps=0;this.raf=0;this.running=false;
  this.restart();
 }

 restart(seed=Math.floor(Math.random()*0x7fffffff)){
  this.seed=seed;
  this.world=createFraymusWorld(seed);
  this.renderer=new FraymusRenderer();
  this.acc=0;
 }

 resetView(){
  this.camera.position.x=0;this.camera.position.y=0;
  this.camera.setZoom(1);
 }

 start(){
  this.running=true;
  let begin=this.now(),dt=0;
  const frame=()=>{
   if(!this.running)return;
   this.raf=requestAnimationFrame(frame);
   const t=this.now();
   this.update(dt,t);
   this.draw(t);
   const end=this.now();
   dt=end-begin;begin=end;
   if(dt>0)this.fps+=(1/dt-this.fps)*0.1;
  };
  this.raf=requestAnimationFrame(frame);
 }

 update(dt,t){
  const inp=this.input,cam=this.camera;
  if(inp.scrollY!==0)cam.addZoom(-inp.scrollY*0.1);
  if(inp.dragging&&(inp.dx||inp.dy)){
   const unitsPerPixel=cam.projectionSize.x*cam.zoom/VIEW_W;
   cam.position.x-=inp.dx*unitsPerPixel;
   cam.position.y+=inp.dy*unitsPerPixel;
  }
  this.batch.beginFrame();
  this.acc+=Math.min(dt,MAX_FRAME_DT);
  while(this.acc>=PHYSICS_DT){this.world.step(PHYSICS_DT,t);this.acc-=PHYSICS_DT;}
  inp.scrollY=0;inp.dx=0;inp.dy=0;
 }

 draw(t){
  const gl=this.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.clearColor(0.05,0.05,0.1,1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.viewport(0,0,VIEW_W,VIEW_H);
  this.renderer.render(this.world,this.batch,t);
  this.batch.draw(this.camera);
 }

 snapshot(){
  const w=this.world;
  return {
   seed:this.seed,tick:w.worldTick,population:w.nodes.length,births:w.totalBirths,deaths:w.totalDeaths,
   heals:w.healer.totalHeals,health:w.coach.health,diversity:w.coach.diversity,resonance:w.coach.resonance,
   zoom:this.camera.zoom,lines:this.batch.count,dropped:this.batch.dropped,fps:this.fps,logs:w.logs.slice(-8),
  };
 }

 dispose(){
  this.running=false;
  cancelAnimationFrame(this.raf);
  this.batch.dispose();
 }
}