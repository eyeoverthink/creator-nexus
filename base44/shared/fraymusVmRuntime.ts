import {validateFraymusProgram} from './fraymusVmAssembly.ts';
// Deterministic i32 stack machine. No JS, filesystem, network, WASM or host callbacks.
// Deliberate safety differences from upstream: trap underflow/division by zero and bound all resources.
export function runFraymusVm(program,maxSteps=2000) {
 const code=validateFraymusProgram(program);
 if(!Number.isInteger(maxSteps)||maxSteps<1||maxSteps>10000)throw new Error('Step budget must be 1–10000.');
 const stack=[], floats=[], trace=[];let ip=0,steps=0,output='',halted=false;
 const need=n=>{if(stack.length<n)throw new Error(`Fraymus stack underflow at instruction ${ip-1}.`);};
 const pop=()=>{need(1);return stack.pop();};const push=n=>{if(stack.length>=256)throw new Error('Fraymus stack capacity exceeded.');stack.push(n|0);};
 const pair=fn=>{need(2);const a=pop(),b=pop();push(fn(b,a));};
 const unary=fn=>push(fn(pop()));
 const fneed=()=>{if(!floats.length)throw new Error('Fraymus float stack underflow.');};
 while(ip<code.length&&!halted&&steps<maxSteps){
  const at=ip,{op,arg}=code[ip++];steps++;
  switch(op){
   case 0x00:halted=true;break;case 0x01:break;
   case 0x10:output+=String.fromCharCode(pop()&65535);break;
   case 0x20:pop();break;
   case 0x21:{need(2);const a=pop(),b=pop();push(a);push(b);break;}
   case 0x22:need(2);push(stack[stack.length-2]);break;
   case 0x23:{need(3);const a=pop(),b=pop(),c=pop();push(b);push(a);push(c);break;}
   case 0x24:{need(2);const a=pop();pop();push(a);break;}
   case 0x25:{need(2);const a=pop(),b=pop();push(a);push(b);push(a);break;}
   case 0x26:{need(2);const a=stack[stack.length-2],b=stack[stack.length-1];push(a);push(b);break;}
   case 0x27:{need(4);const a=pop(),b=pop(),c=pop(),d=pop();push(b);push(a);push(d);push(c);break;}
   case 0x28:{need(4);const a=stack[stack.length-4],b=stack[stack.length-3];push(a);push(b);break;}
   case 0x29:push(stack.length);break;
   case 0x2a:case 0x2b:{const n=pop();if(n<0||n>=stack.length)throw new Error('Invalid PICK/ROLL index.');const i=stack.length-1-n;push(op===0x2a?stack[i]:stack.splice(i,1)[0]);break;}
   case 0x2c:need(1);push(stack[stack.length-1]);break;
   case 0x2d:need(1);if(stack[stack.length-1]!==0)push(stack[stack.length-1]);break;
   case 0x2e:need(2);pop();pop();break;
   case 0x40:pair((b,a)=>b+a);break;case 0x41:pair((b,a)=>b-a);break;case 0x42:pair(Math.imul);break;
   case 0x43:case 0x44:pair((b,a)=>{if(!a)throw new Error('Fraymus division by zero.');return op===0x43?Math.trunc(b/a):b%a;});break;
   case 0x45:unary(a=>-a);break;case 0x46:unary(Math.abs);break;case 0x47:pair(Math.min);break;case 0x48:pair(Math.max);break;
   case 0x49:pair((b,a)=>b&a);break;case 0x4a:pair((b,a)=>b|a);break;case 0x4b:pair((b,a)=>b^a);break;
   case 0x4c:pair((b,a)=>b<<(a&31));break;case 0x4d:pair((b,a)=>b>>>(a&31));break;case 0x4e:unary(a=>~a);break;
   case 0x4f:unary(a=>a+1);break;case 0x50:unary(a=>a-1);break;
   case 0x60:pair((b,a)=>b===a);break;case 0x61:pair((b,a)=>b!==a);break;case 0x62:pair((b,a)=>b<a);break;case 0x63:pair((b,a)=>b>a);break;case 0x64:pair((b,a)=>b>=a);break;case 0x65:pair((b,a)=>b<=a);break;
   case 0x66:unary(a=>a===0);break;case 0x67:unary(a=>a!==0);break;case 0x68:unary(a=>(a&1)===0);break;case 0x69:unary(a=>(a&1)!==0);break;case 0x6a:unary(a=>!a);break;case 0x6b:unary(a=>!!a);break;case 0x6c:unary(Math.sign);break;
   // Actual source consumes x lo hi (rather than the reversed descriptive ISA comment).
   case 0x6d:case 0x6e:{need(3);const hi=pop(),lo=pop(),x=pop();if(lo>hi)throw new Error('Invalid Fraymus bounds.');push(op===0x6d?x>=lo&&x<=hi:Math.min(hi,Math.max(lo,x)));break;}
   case 0x6f:push(1);break;case 0x70:push(0);break;case 0x80:push(arg);break;
   case 0x81:output+=`${pop()} `;break;
   case 0x90:if(floats.length>=256)throw new Error('Float stack capacity exceeded.');floats.push(pop());break;
   case 0x91:fneed();push(floats.pop());break;
   case 0x92:fneed();if(floats.length>=256)throw new Error('Float stack capacity exceeded.');floats.push(floats[floats.length-1]);break;
   case 0x93:fneed();floats.pop();break;
   case 0xa0:ip=arg;break;case 0xa1:if(pop()===0)ip=arg;break;
  }
  if(output.length>4096)throw new Error('Fraymus output capacity exceeded.');
  if(trace.length<16)trace.push({ip:at,op,top:stack.at(-1)??null,depth:stack.length});
 }
 return {status:halted||ip===code.length?'completed':'step_limit',halted:halted||ip===code.length,ip,steps,top:stack.at(-1)??null,stack,float_stack:floats,output,trace,trace_truncated:steps>trace.length};
}