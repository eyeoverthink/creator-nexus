// Port of renderer/DebugDraw.java + Line2D.java + renderer/Shader.java + assets/shaders/debugLine2D.glsl.
// Same semantics: max 10,000 lines, 6 floats per vertex (pos3 + colour3), lifetime decremented in beginFrame()
// and removed when < 0 (so lifetime-1 lines are drawn on two consecutive frames), GL_LINES draw with one shader.
// Shader source is the original GLSL with "#version 330 core" changed to "#version 300 es" for WebGL2.
export const MAX_LINES=10000;
const VERTEX_SIZE=6,LINE_FLOATS=VERTEX_SIZE*2,CIRCLE_SEGMENTS=32;

const VERTEX_SRC=`#version 300 es
precision highp float;
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;
out vec3 fColor;
uniform mat4 uView;
uniform mat4 uProjection;
void main()
{
    fColor = aColor;
    gl_Position = uProjection * uView * vec4(aPos, 1.0);
}`;

const FRAGMENT_SRC=`#version 300 es
precision highp float;
in vec3 fColor;
out vec4 color;
void main()
{
    color = vec4(fColor, 1);
}`;

function compile(gl,type,source){
 const shader=gl.createShader(type);
 gl.shaderSource(shader,source);
 gl.compileShader(shader);
 if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(`Shader compilation failed: ${gl.getShaderInfoLog(shader)}`);
 return shader;
}

export class LineBatch{
 constructor(gl){
  this.gl=gl;
  this.verts=new Float32Array(MAX_LINES*LINE_FLOATS);
  this.life=new Int32Array(MAX_LINES);
  this.count=0;
  this.dropped=0;
  const vs=compile(gl,gl.VERTEX_SHADER,VERTEX_SRC),fs=compile(gl,gl.FRAGMENT_SHADER,FRAGMENT_SRC);
  this.program=gl.createProgram();
  gl.attachShader(this.program,vs);
  gl.attachShader(this.program,fs);
  gl.linkProgram(this.program);
  if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(`Shader link failed: ${gl.getProgramInfoLog(this.program)}`);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  this.uProjection=gl.getUniformLocation(this.program,'uProjection');
  this.uView=gl.getUniformLocation(this.program,'uView');
  this.vao=gl.createVertexArray();
  gl.bindVertexArray(this.vao);
  this.vbo=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);
  gl.bufferData(gl.ARRAY_BUFFER,this.verts.byteLength,gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(0,3,gl.FLOAT,false,VERTEX_SIZE*4,0);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(1,3,gl.FLOAT,false,VERTEX_SIZE*4,3*4);
  gl.enableVertexAttribArray(1);
  gl.bindVertexArray(null);
  gl.lineWidth(2);
 }

 beginFrame(){
  this.dropped=0;
  let write=0;
  for(let i=0;i<this.count;i++){
   const life=this.life[i]-1;
   if(life<0)continue;
   this.life[write]=life;
   if(write!==i)this.verts.copyWithin(write*LINE_FLOATS,i*LINE_FLOATS,(i+1)*LINE_FLOATS);
   write++;
  }
  this.count=write;
 }

 addLine(x1,y1,x2,y2,r,g,b,lifetime=1){
  if(this.count>=MAX_LINES){this.dropped++;return;}
  const o=this.count*LINE_FLOATS,v=this.verts;
  v[o]=x1;v[o+1]=y1;v[o+2]=0;v[o+3]=r;v[o+4]=g;v[o+5]=b;
  v[o+6]=x2;v[o+7]=y2;v[o+8]=0;v[o+9]=r;v[o+10]=g;v[o+11]=b;
  this.life[this.count++]=lifetime;
 }

 addCircle(cx,cy,radius,r,g,b,lifetime=1){
  const inc=2*Math.PI/CIRCLE_SEGMENTS;
  for(let i=0;i<CIRCLE_SEGMENTS;i++){
   const a0=inc*i,a1=inc*((i+1)%CIRCLE_SEGMENTS);
   this.addLine(cx+radius*Math.cos(a0),cy+radius*Math.sin(a0),cx+radius*Math.cos(a1),cy+radius*Math.sin(a1),r,g,b,lifetime);
  }
 }

 draw(camera){
  if(this.count<=0)return;
  const gl=this.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);
  gl.bufferSubData(gl.ARRAY_BUFFER,0,this.verts,0,this.count*LINE_FLOATS);
  gl.useProgram(this.program);
  gl.uniformMatrix4fv(this.uProjection,false,camera.projection);
  gl.uniformMatrix4fv(this.uView,false,camera.getView());
  gl.bindVertexArray(this.vao);
  gl.drawArrays(gl.LINES,0,this.count*2);
  gl.bindVertexArray(null);
  gl.useProgram(null);
 }

 dispose(){
  const gl=this.gl;
  gl.deleteBuffer(this.vbo);
  gl.deleteVertexArray(this.vao);
  gl.deleteProgram(this.program);
 }
}