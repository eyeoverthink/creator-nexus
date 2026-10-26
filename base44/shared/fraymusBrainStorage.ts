import {digestAdaptive} from './fraymusAdaptiveSchema.ts';
import {ADAPTIVE_LIMITS} from './fraymusAdaptiveLimits.ts';
export async function readFraymusBrainReport(base44,record){
 const envelope=JSON.parse(record.body);
 if(envelope.storage!=='private-json/1')return envelope.report;
 if(!record.file_uri||!envelope.sha256)throw new Error('Private brain checkpoint is incomplete.');
 const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:record.file_uri,expires_in:60});
 const response=await fetch(signed_url,{signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Private checkpoint could not be loaded.');
 const reader=response.body.getReader(),parts=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>ADAPTIVE_LIMITS.snapshotBytes){await reader.cancel();throw new Error('Checkpoint exceeds the supported byte size.');}parts.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 const saved=JSON.parse(new TextDecoder().decode(bytes));
 if(await digestAdaptive(saved)!==envelope.sha256)throw new Error('Private checkpoint digest changed.');
 return saved.report;
}
export async function storeFraymusBrainReport(base44,result){
 const envelope={version:1,report:result},body=JSON.stringify(envelope),bytes=new TextEncoder().encode(body);
 if(bytes.length>ADAPTIVE_LIMITS.snapshotBytes)throw new Error('Checkpoint exceeds two MiB; use a smaller graph or memory set.');
 if(body.length<=19000)return {body};
 const file=new File([bytes],`fraymus-brain-${crypto.randomUUID()}.json`,{type:'application/json'});
 const {file_uri}=await base44.integrations.Core.UploadPrivateFile({file});
 return {body:JSON.stringify({version:1,storage:'private-json/1',sha256:await digestAdaptive(envelope),bytes:bytes.length}),file_uri,file_name:file.name,mime_type:'application/json',file_size:bytes.length};
}