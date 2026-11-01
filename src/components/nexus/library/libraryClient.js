import {base44} from '@/api/base44Client';
import {maxFileSize} from '@/components/nexus/library/libraryConstants';
export async function libraryCall(workspace,values){
 const {data}=await base44.functions.invoke('nexusLibrary',{workspace_id:workspace.id,...values});
 if(data.error)throw new Error(data.error);
 return data;
}
export async function uploadAssetFile(file){
 if(!file.size||file.size>maxFileSize)throw new Error('Choose a nonempty file up to 50 MB.');
 const {file_uri}=await base44.integrations.Core.UploadPrivateFile({file});
 if(!file_uri)throw new Error('The upload did not return a private file. Please retry.');
 return {file_uri,file_name:file.name,mime_type:file.type||'application/octet-stream',file_size:file.size};
}
export async function exportAsset(asset){
 const url=URL.createObjectURL(new Blob([asset.body||''],{type:'text/plain;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=(asset.title||'Asset').replace(/[\\/:*?"<>|]/g,'_')+'.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}