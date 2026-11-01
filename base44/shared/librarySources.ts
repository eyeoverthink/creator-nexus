export const sourceTypes = ['SparkCard','NexusSpark','NexusDraft','NexusKnowledge','NexusChatTurn'];
export function sourceAsset(entity, record) {
 const base={source_entity:entity,source_id:record.id,source_updated_at:record.updated_date,kind:'generated',project:'',agent_ids:[]};
 if(entity==='SparkCard')return {...base,title:record.hook_title,project:record.hook_title,agent_ids:['director','writer'],body:[record.one_line_pitch,record.narration||'',`Signature: ${record.signature_twist||''}`,record.why_now?.source_url||'',record.job_event_id?`Runner job: ${record.job_event_id}. A job reference is not a stored video file.`:''].filter(Boolean).join('\n\n')};
 if(entity==='NexusSpark')return {...base,title:record.title,project:record.title,agent_ids:['director'],body:[record.hook,record.brief,...(record.scenes||[]),record.caption,record.disclosure].filter(Boolean).join('\n\n')};
 if(entity==='NexusChatTurn')return {...base,title:record.question?.slice(0,160)||'Agent answer',agent_ids:[record.agent],body:record.answer||''};
 return {...base,title:record.title||'Untitled document',kind:entity==='NexusKnowledge'?'document':'generated',agent_ids:entity==='NexusDraft'?['writer']:[],body:record.body||''};
}
export async function captureAsset(base44,scope,values,existing,note='Saved asset') {
 const data={...values,title:values.title.slice(0,160),body:(values.body||'').slice(0,20000),version:(existing?.version||0)+1};
 const asset=existing?await base44.entities.NexusAsset.update(existing.id,data):await base44.entities.NexusAsset.create({...scope,...data});
 await base44.entities.NexusAssetRevision.create({...scope,asset_id:asset.id,version:asset.version,note,snapshot:{title:asset.title,body:asset.body||'',project:asset.project||'',agent_ids:asset.agent_ids||[],kind:asset.kind,file_uri:asset.file_uri||'',file_name:asset.file_name||'',mime_type:asset.mime_type||'',source_entity:asset.source_entity||'',source_id:asset.source_id||'',source_updated_at:asset.source_updated_at||''}});
 return asset;
}