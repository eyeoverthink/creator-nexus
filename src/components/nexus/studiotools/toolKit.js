import {base44} from '@/api/base44Client';
export const field='mt-1 w-full rounded border border-input bg-card p-2 text-sm text-foreground';
export const toolError=e=>e?.response?.data?.error||e?.message||'Something went wrong.';
export const invoke=async(name,payload)=>{try{const {data}=await base44.functions.invoke(name,payload);if(data?.error)throw new Error(data.error);return data;}catch(e){throw new Error(toolError(e));}};
export async function signedUrl(file_uri){const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri,expires_in:3600});return signed_url;}
export async function uploadPrivate(blob,name){const {file_uri}=await base44.integrations.Core.UploadPrivateFile({file:new File([blob],name,{type:blob.type||'application/octet-stream'})});return file_uri;}
export async function saveBlobToLibrary({workspace,blob,fileName,title,project,body}){
 const user=await base44.auth.me();
 const file_uri=await uploadPrivate(blob,fileName);
 return base44.entities.NexusAsset.create({owner_id:user.id,workspace_id:workspace.id,title:title.slice(0,160),kind:'generated',file_uri,file_name:fileName,mime_type:blob.type,file_size:blob.size,project,source_entity:project,...(body?{body:body.slice(0,20000)}:{})});
}
export const downloadText=(text,name)=>{const url=URL.createObjectURL(new Blob([text],{type:'text/markdown'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};