export const PDF_LIMITS={bytes:10*1024*1024,pages:250,characters:1000000,extractionBytes:4*1024*1024,chunks:400};
export function pdfError(message,status=422,code='unsupported_pdf'){const error=new Error(message);error.status=status;error.pdfCode=code;return error;}
export async function pdfHash(bytes,algorithm='SHA-256'){return Array.from(new Uint8Array(await crypto.subtle.digest(algorithm,bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
export async function readPrivatePdf(base44,fileUri){
 if(typeof fileUri!=='string'||!fileUri||/^(?:https?:|data:|file:|\/\/)/i.test(fileUri))throw pdfError('PDF intake requires an app-private upload, not a public URL.',400,'private_upload_required');
 const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:fileUri,expires_in:120});
 const response=await fetch(signed_url,{signal:AbortSignal.timeout(30000),redirect:'manual'});if(!response.ok)throw pdfError('The private PDF could not be loaded without redirecting.',502,'file_unavailable');
 if(Number(response.headers.get('content-length'))>PDF_LIMITS.bytes){await response.body?.cancel();throw pdfError('PDF exceeds the 10 MiB evidence limit.',413,'size_limit');}
 const reader=response.body?.getReader();if(!reader)throw pdfError('The PDF has no readable body.');
 const parts=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>PDF_LIMITS.bytes){await reader.cancel();throw pdfError('PDF exceeds the 10 MiB evidence limit.',413,'size_limit');}parts.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 if(bytes.length<8||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')throw pdfError('The file does not have a valid PDF header.',415,'invalid_pdf');
 return bytes;
}