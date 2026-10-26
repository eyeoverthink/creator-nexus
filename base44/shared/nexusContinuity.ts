import {
  CANONICAL_PIPELINE_SUMMARY_FOR_PROMPTS,
  HEARTMULA_BRIDGE_MANIFEST,
} from './pipelineAndAcademySync.ts';

import {creatorArchiveContext} from './fraymusCreatorArchive.ts';
export async function continuityContext(base44,user,workspaceId,agent,includeAssets=true){
 const scope={owner_id:user.id,workspace_id:workspaceId};
 const [memory,assets,recent,centripetal,creatorArchive]=await Promise.all([
  base44.entities.NexusContinuity.filter({...scope,scope:{$in:['profile',agent]},enabled:{$ne:false}},{limit:2,sort:'-updated_date',fields:['scope','display_name','context','settings']}),
  includeAssets?base44.entities.NexusAsset.filter({...scope,agent_ids:agent},{limit:6,sort:'-updated_date',fields:['title','body','project','file_name','kind']}):Promise.resolve({items:[]}),
  base44.entities.NexusChatTurn.filter({...scope,agent},{limit:3,sort:'-created_date',fields:['question','answer']}),
  base44.entities.NexusOuroborosNode.filter({...scope,node_kind:{$in:['nucleus','orbit']}},{limit:4,sort:'radius',fields:['title','branch_origin','code_hash','generation','fitness','speedup','structural_entropy','radius','theta','continuity','diagnostic_summary']}).catch(()=>({items:[]})),
  creatorArchiveContext(base44,user,workspaceId)
 ]);
 return {
  canonical_pipeline_architecture: CANONICAL_PIPELINE_SUMMARY_FOR_PROMPTS,
  heartmula_bridge: {
   status: HEARTMULA_BRIDGE_MANIFEST.status,
   bridge_endpoint: HEARTMULA_BRIDGE_MANIFEST.bridge_endpoint,
   active_render_job: HEARTMULA_BRIDGE_MANIFEST.active_render_job,
   engines: HEARTMULA_BRIDGE_MANIFEST.engines.map(e=>({id:e.id,name:e.name,hf_repo:e.hf_repo,tag_schema:e.tag_schema}))
  },
  creator_directive_archive:creatorArchive,
  saved_preferences:memory.items,
  centripetal_nucleus_memories:centripetal.items,
  assigned_assets:assets.items.map(a=>({id:a.id,title:a.title,project:a.project,text:(a.body||'').slice(0,2200),file_name:a.file_name||'',notice:'Only this text and file metadata are supplied. Do not claim to have opened attached media.'})),
  recent_conversations:recent.items.map(t=>({question:t.question,answer:(t.answer||'').slice(0,1200)})),
  notice:'Persistent user-authored context, Canonical Creator Nexus 5-Stage Pipeline + HeartMuLa Bridge architecture, and Centripetal Polar Memory (Golden Angle 137.5077 deg). Ensure all suggestions fit the active 5-stage pipeline (1. Sourced Radar -> 2. HeartMuLa/ACE-Step Vocal & Stem Forge -> 3. Anamorphic 16:9 / 9:16 Director Lab Scene Plan -> 4. LooseScrew/Factory HTML/WASM REA Build -> 5. Master Stitcher, Library & LinkedIn).'
 };
}