const encoder=new TextEncoder();
const digest=async bytes=>new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export async function decodeFraymusFrame(frame){
 if(frame.length<40||frame.length%4||new TextDecoder().decode(frame.slice(0,4))!=='FRG1')throw new Error('Invalid FRG1 header.');
 const length=new DataView(frame.buffer,frame.byteOffset,frame.byteLength).getUint32(4,false);
 if(length>16384||frame.length!==40+4*Math.ceil(length/4))throw new Error('Invalid payload length.');
 const payload=frame.slice(40,40+length),actual=await digest(payload);
 if(actual.some((b,i)=>b!==frame[8+i]))throw new Error('Payload digest mismatch.');
 if(frame.slice(40+length).some(b=>b!==0))throw new Error('Noncanonical padding.');
 return {text:new TextDecoder('utf-8',{fatal:true}).decode(payload),sha256:hex(actual)};
}
export async function measureFraymusFrame(text){
 const payload=encoder.encode(text);if(!payload.length||payload.length>16384)throw new Error('Enter 1–16,384 UTF-8 bytes.');
 const hash=await digest(payload),frame=new Uint8Array(40+4*Math.ceil(payload.length/4));
 frame.set(encoder.encode('FRG1'));new DataView(frame.buffer).setUint32(4,payload.length,false);frame.set(hash,8);frame.set(payload,40);
 const restored=await decodeFraymusFrame(frame),damaged=frame.slice();damaged[40]^=1;
 let corruptionRejected=false;try{await decodeFraymusFrame(damaged);}catch{corruptionRejected=true;}
 let gzipBytes=null;if(typeof CompressionStream!=='undefined'){const stream=new Blob([payload]).stream().pipeThrough(new CompressionStream('gzip'));gzipBytes=(await new Response(stream).arrayBuffer()).byteLength;}
 return {frame,report:{protocol:'fraymus.rgba-frame/1',measured_at:new Date().toISOString(),input_bytes:payload.length,frame_bytes:frame.length,tuples:frame.length/4,overhead_bytes:frame.length-payload.length,gzip_bytes:gzipBytes,sha256:hex(hash),restored_sha256:restored.sha256,exact_text:restored.text===text,corruption_rejected:corruptionRejected,first_payload_tuples:Array.from({length:Math.min(8,Math.ceil(payload.length/4))},(_,i)=>Array.from(frame.slice(40+i*4,44+i*4))),boundary:'Raw byte mapping, not optical transport, encryption, semantic embedding or a model tokenizer.'}};
}