import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {sourceTypes,sourceAsset,captureAsset} from '../../shared/librarySources.ts';
export default async function(req){
 try{
  if(req.method!=='POST')return Response.json({error:'Use POST.'},{status:405});
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in required.'},{status:401});
  const raw=await req.text();if(raw.length>60000)return Response.json({error:'Request too large.'},{status:413});
  const input=JSON.parse(raw),workspaceId=input.workspace_id;
  const workspace=await base44.entities.NexusWorkspace.filter({id:workspaceId,owner_id:user.id},{limit:1});
  if(!workspace.items.length)return Response.json({error:'Workspace not found.'},{status:404});
  const scope={owner_id:user.id,workspace_id:workspaceId};
  if(['sources','capture'].includes(input.action)){
   if(!sourceTypes.includes(input.entity))throw new Error('Choose an existing content source.');
   const query={...scope};
   if(input.action==='sources'){
    const field=input.entity==='SparkCard'?'hook_title':input.entity==='NexusChatTurn'?'question':'title';
    if(input.search){const term=String(input.search).slice(0,120).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');query[field]={$regex:term,$options:'i'};}
    const page=await base44.entities[input.entity].filter(query,{sort:'-updated_date',limit:12,...(typeof input.cursor==='string'?{cursor:input.cursor}:{})});
    return Response.json({...page,items:page.items.map(r=>({id:r.id,title:r[field]||'Untitled',updated_date:r.updated_date}))});
   }
   const page=await base44.entities[input.entity].filter({...query,id:input.source_id},{limit:1});
   if(!page.items.length)return Response.json({error:'Source not found in this workspace.'},{status:404});
   const record=page.items[0],old=(await base44.entities.NexusAsset.filter({...scope,source_entity:input.entity,source_id:record.id},{limit:1})).items[0];
   if(old&&old.source_updated_at===record.updated_date)return Response.json({asset:old,unchanged:true});
   const values=sourceAsset(input.entity,record);
   if(old){values.project=old.project;values.agent_ids=old.agent_ids;}
   return Response.json({asset:await captureAsset(base44,scope,values,old,old?'Captured updated source':'Imported existing creation')});
  }
  if(input.action!=='save')throw new Error('Unsupported library action.');
  const v=input.asset||{};
  if(typeof v.title!=='string'||!v.title.trim()||v.title.length>160||typeof v.body!=='string'||v.body.length>20000)throw new Error('Use a title up to 160 characters and text up to 20000 characters.');
  if(typeof v.project!=='string'||v.project.length>160||!Array.isArray(v.agent_ids)||v.agent_ids.length>4||v.agent_ids.some(a=>!['researcher','writer','strategist','director'].includes(a)))throw new Error('Check the project and agent assignments.');
  const old=input.asset_id?(await base44.entities.NexusAsset.filter({...scope,id:input.asset_id},{limit:1})).items[0]:null;
  if(input.asset_id&&!old)return Response.json({error:'Asset not found.'},{status:404});
  if(old&&input.version!==old.version)return Response.json({error:'This asset changed elsewhere. Reopen it before saving.'},{status:409});
  const values={title:v.title.trim(),body:v.body,project:v.project.trim(),agent_ids:[...new Set(v.agent_ids)],kind:old?.kind||'document'};
  if(v.file_uri){
   if(typeof v.file_uri!=='string'||v.file_uri.length>2048||/^https?:/i.test(v.file_uri)||typeof v.file_size!=='number'||v.file_size<=0||v.file_size>52428800)throw new Error('Choose a private upload of up to 50 MB.');
   Object.assign(values,{file_uri:v.file_uri,file_name:String(v.file_name||'File').slice(0,240),mime_type:String(v.mime_type||'application/octet-stream').slice(0,120),file_size:v.file_size,kind:'upload'});
  }
  if(!old&&!v.file_uri&&!v.body.trim())throw new Error('Add document text or upload a file.');
  const asset=await captureAsset(base44,scope,values,old,String(input.note||'Saved asset changes').slice(0,300));
  return Response.json({asset});
 }catch(error){return Response.json({error:error.message||'Could not save the asset.'},{status:400});}
}