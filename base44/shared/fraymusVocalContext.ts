import {vocalReportSchema,summarizeVocalReport,VOCAL_NOTICE} from './fraymusVocalSchema.ts';
export async function vocalEmotionContext(base44,user,workspaceId){
 const page=await base44.entities.FraymusVocalAnalysis.filter({owner_id:user.id,workspace_id:workspaceId,enabled:true},{sort:'-updated_date',limit:2,fields:['title','report','created_date']});
 return {notice:VOCAL_NOTICE,reports:page.items.flatMap(row=>{const parsed=vocalReportSchema.safeParse(row.report);if(!parsed.success)return [];const r=parsed.data;return [{id:row.id,title:row.title,imported_at:row.created_date,analyzed_at:r.created_at,audio:r.audio,input_kind:r.input_kind,model:r.model,summary:summarizeVocalReport(r),segments:r.segments}];})};
}