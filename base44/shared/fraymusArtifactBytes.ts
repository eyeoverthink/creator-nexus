export const ARTIFACT_MAX_BYTES=262144;
export async function artifactDigest(bytes,algorithm='SHA-256'){return Array.from(new Uint8Array(await crypto.subtle.digest(algorithm,bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
export async function readArtifactBytes(response,max=ARTIFACT_MAX_BYTES){
 if(!response.ok)throw new Error(`Artifact request returned HTTP ${response.status}.`);
 const reader=response.body?.getReader();if(!reader)throw new Error('Artifact body missing.');const parts=[];let size=0;
 while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>max){await reader.cancel();throw new Error('Artifact exceeds the supported byte limit.');}parts.push(p.value);}
 const result=new Uint8Array(size);let offset=0;for(const p of parts){result.set(p,offset);offset+=p.length;}return result;
}
export function artifactBase64(bytes){let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);}
export function artifactDecodeBase64(text){if(text.length%4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text))throw new Error('Noncanonical standard Base64.');const bytes=Uint8Array.from(atob(text),c=>c.charCodeAt(0));if(artifactBase64(bytes)!==text)throw new Error('Base64 padding bits are noncanonical.');return bytes;}
export function artifactHex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
export function artifactDecodeHex(hex){if(hex.length%2||!/^[a-f0-9]*$/i.test(hex))throw new Error('Hex must contain exactly two hex digits per byte; no ambiguity or whitespace.');return Uint8Array.from(hex.match(/../g)||[],b=>parseInt(b,16));}
export async function describeArtifactBytes(bytes){
 const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes),crlf=(text.match(/\r\n/g)||[]).length,lf=(text.match(/(?<!\r)\n/g)||[]).length,cr=(text.match(/\r(?!\n)/g)||[]).length;
 const restored=artifactDecodeBase64(artifactBase64(bytes)),sha256=await artifactDigest(bytes),restoredHash=await artifactDigest(restored);
 return {representation:'RAW_BYTES',byte_length:bytes.length,sha256,sha512:await artifactDigest(bytes,'SHA-512'),encoding:bytes[0]===239&&bytes[1]===187&&bytes[2]===191?'UTF-8 BOM':'UTF-8',line_endings:{CRLF:crlf,LF:lf,CR:cr},final_newline:/[\r\n]$/.test(text),base64_round_trip:{variant:'standard padded unwrapped',restored_bytes:restored.length,restored_sha256:restoredHash,passed:bytes.length===restored.length&&sha256===restoredHash},text};
}
export function stableArtifactJson(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(stableArtifactJson).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stableArtifactJson(value[k])).join(',')+'}';}