const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),v=>v.toString(16).padStart(2,'0')).join('');
export default async function verifyNeedleReceipt(job){
 if(!job.result_json||!job.receipt_sha256)return false;
 const input=await hash(job.input_json);if(input!==job.input_sha256)return false;
 const output=await hash(job.result_json);
 // Fixed lexical key order matches the server's canonical receipt representation.
 const bound=JSON.stringify({input_sha256:input,job_id:job.id,lease_id:job.lease_id,nonce:job.nonce,output_sha256:output,worker_id:job.worker_id});
 return await hash(bound)===job.receipt_sha256;
}