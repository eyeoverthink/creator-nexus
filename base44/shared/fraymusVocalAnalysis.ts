import {vocalReportSchema,summarizeVocalReport,VOCAL_NOTICE} from './fraymusVocalSchema.ts';
import {vocalEmotionContext} from './fraymusVocalContext.ts';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function handleVocalAnalysis(base44,user,a){
 if(!['emotion_import','emotion_list','emotion_toggle','emotion_delete','emotion_context'].includes(a.action))return reply({error:'Unknown vocal emotion operation.'},400);
 if(typeof a.workspace_id!=='string'||!/^[a-f0-9]{24}$/i.test(a.workspace_id))return reply({error:'Select a valid workspace.'},400);
 const page=await base44.entities.NexusWorkspace.filter({owner_id:user.id,id:a.workspace_id},{limit:1});if(!page.items.length)return reply({error:'Workspace access denied.'},403);
 const db=base44.entities.FraymusVocalAnalysis,scope={owner_id:user.id,workspace_id:a.workspace_id};
 if(a.action==='emotion_context')return reply(await vocalEmotionContext(base44,user,a.workspace_id));
 if(a.action==='emotion_list'){
  if(a.cursor!==undefined&&(typeof a.cursor!=='string'||a.cursor.length>2000))return reply({error:'Invalid history cursor.'},400);
  return reply({...await db.filter(scope,{sort:'-created_date',limit:10,...(a.cursor?{cursor:a.cursor}:{}),fields:['title','audio_sha256','report_sha256','report','summary','enabled','created_date']}),notice:VOCAL_NOTICE});
 }
 if(a.action==='emotion_import'){
  const parsed=vocalReportSchema.safeParse(a.report);if(!parsed.success)return reply({error:parsed.error.issues.map(i=>i.message).slice(0,5).join('; ')},400);
  if(a.enabled!==undefined&&typeof a.enabled!=='boolean')return reply({error:'Agent sharing must be an explicit boolean.'},400);
  const report=parsed.data,raw=JSON.stringify(report),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))),b=>b.toString(16).padStart(2,'0')).join('');
  const existing=(await db.filter({...scope,report_sha256:hash},{limit:1})).items[0];if(existing)return reply({record:existing,duplicate:true,notice:VOCAL_NOTICE});
  const record=await db.create({...scope,title:report.audio.name,audio_sha256:report.audio.sha256,report_sha256:hash,report,summary:summarizeVocalReport(report),enabled:a.enabled===true});
  return reply({record,notice:VOCAL_NOTICE});
 }
 if(typeof a.id!=='string'||!/^[a-f0-9]{24}$/i.test(a.id))return reply({error:'Invalid report identifier.'},400);
 const record=(await db.filter({...scope,id:a.id},{limit:1})).items[0];if(!record)return reply({error:'Report not found in this workspace.'},404);
 if(a.action==='emotion_delete'){await db.delete(record.id);return reply({deleted:true});}
 if(typeof a.enabled!=='boolean')return reply({error:'Choose whether agents may use this report.'},400);
 return reply({record:await db.update(record.id,{enabled:a.enabled})});
}