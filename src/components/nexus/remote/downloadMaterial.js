import {remoteCall} from '@/components/nexus/remote/useRemoteApi';
export function saveBlob(name,blob){
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
// Pages through one material type and saves it to this computer as a JSON file.
export async function downloadMaterial(type,onProgress){
 const items=[];let cursor=null;
 do{const page=await remoteCall({action:'list',type,limit:100,...(cursor?{cursor}:{})});items.push(...page.items);onProgress(items.length);cursor=page.has_more?page.next_cursor:null;}while(cursor);
 const exportedAt=new Date().toISOString();
 saveBlob(`creator-nexus-${type}-${exportedAt.slice(0,10)}.json`,new Blob([JSON.stringify({type,exported_at:exportedAt,count:items.length,items},null,2)],{type:'application/json'}));
 return items.length;
}