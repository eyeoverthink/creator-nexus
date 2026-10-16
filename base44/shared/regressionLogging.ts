import {observation,words} from './regressionCatalog.ts';
import {owned} from './originAccess.ts';
import {saveRoomRecord} from './roomRecords.ts';
const commit='054be5f81488715fbafc8eb427d6847723402268';
export function originObservation(user,workspace,experiment,spark,draft){
 if(experiment.status!=='final'||!['views','likes','comments','clicks'].includes(experiment.metric))throw new Error('Only finalized experiments can train an Origin regression.');
 if(!Number.isFinite(spark.effort_minutes)||!Number.isFinite(experiment.observation_hours)||!Number.isFinite(experiment.observed_value))throw new Error('This experiment is missing numeric measurements.');
 return observation({owner_id:user.id,workspace_id:workspace.id,source:'origin',source_key:`${user.id}:${workspace.id}:origin:${experiment.id}`,record_id:experiment.id,group_key:`origin:${spark.id}`,agent:'director',metric:experiment.metric,label:String(experiment.title||'Experiment').slice(0,200),measured_at:experiment.updated_date||new Date().toISOString(),provenance:'Manually recorded finalized result',x1:spark.effort_minutes,x2:experiment.observation_hours,x3:words(draft.body),y:experiment.observed_value});
}
export function sandboxObservation(user,workspace,run){
 if(run.engine!=='babel-v16-core'||run.commit!==commit||!Number.isInteger(run.rounds)||run.rounds<1||run.rounds>20)throw new Error('Use a saved, pinned Babel v16 run with 1–20 rounds.');
 const x2=run.metrics?.before?.trustON?.held?.word,x3=run.metrics?.before?.trustON?.novel?.word,y=run.metrics?.after?.trustON?.held?.word;
 if(![x2,x3,y].every(x=>Number.isFinite(x)&&x>=0&&x<=1))throw new Error('This run is missing valid baseline and held accuracy measurements.');
 return observation({owner_id:user.id,workspace_id:workspace.id,source:'sandbox',source_key:`${user.id}:${workspace.id}:sandbox:${run.id}`,record_id:run.id,group_key:`sandbox:${run.agent}:${commit}:${run.seed}`,agent:run.agent,metric:'held_accuracy',label:`${run.agent}, seed ${run.seed}, ${run.rounds} rounds`,measured_at:run.created_date,provenance:'Browser-reported Babel v16 symbolic evaluation',x1:run.rounds,x2,x3,y});
}
export async function recordOrigin(base44,user,workspace,experiment,spark){
 const concept=spark||await owned(base44,'NexusSpark',experiment.spark_id,user,workspace.id),draft=await owned(base44,'NexusDraft',experiment.draft_id,user,workspace.id);
 if(draft.revision!==experiment.draft_revision)throw new Error('The script no longer matches the pre-registered revision.');
 return base44.asServiceRole.entities.NexusRegressionObservation.upsert([originObservation(user,workspace,experiment,concept,draft)],{key:'source_key'});
}
export async function recordProposal(room,p,accepted){
 const row=observation({owner_id:room.owner,workspace_id:room.workspace,source:'behavior',source_key:`${room.owner}:${room.workspace}:behavior:${p.id}`,record_id:p.id,group_key:`behavior:${p.draft_id}`,agent:p.agent,metric:'acceptance',label:`${p.agent}: ${accepted?'accepted':'rejected'} proposal`,measured_at:new Date().toISOString(),provenance:'Workspace proposal review decision',x1:words(p.before_body),x2:100*(p.body.length-p.before_body.length)/Math.max(1,p.before_body.length),x3:words(p.task),y:accepted?1:0});
 await saveRoomRecord(room,'NexusRegressionObservation',{source_key:row.source_key},row);
}
export async function recordSaved(base44,user,workspace,input){
 if(input.source==='origin'){const experiment=await owned(base44,'NexusExperiment',input.record_id,user,workspace.id);return recordOrigin(base44,user,workspace,experiment);}
 if(input.source==='sandbox'){const run=await owned(base44,'NexusLearningRun',input.record_id,user,workspace.id);return base44.asServiceRole.entities.NexusRegressionObservation.upsert([sandboxObservation(user,workspace,run)],{key:'source_key'});}
 throw new Error('Behavior measurements are recorded only when a proposal is actually reviewed.');
}
export async function syncSaved(base44,user,workspace,input,config){
 if(input.source==='behavior')throw new Error('Historical proposal decisions were not persisted. New decisions are logged as they happen.');
 const query={owner_id:user.id,workspace_id:workspace.id,...(input.source==='origin'?{status:'final',metric:config.metric}:{engine:'babel-v16-core',commit,...(config.agent==='all'?{}:{agent:config.agent})})};
 const entity=input.source==='origin'?'NexusExperiment':'NexusLearningRun',page=await base44.entities[entity].filter(query,{sort:'created_date',limit:50,...(input.cursor?{cursor:input.cursor}:{})});
 let rows=[],skipped=[];
 if(input.source==='origin'&&page.items.length){
  const [sparks,drafts]=await Promise.all([base44.entities.NexusSpark.filter({owner_id:user.id,workspace_id:workspace.id,id:{$in:page.items.map(e=>e.spark_id)}},{limit:50}),base44.entities.NexusDraft.filter({owner_id:user.id,workspace_id:workspace.id,id:{$in:page.items.map(e=>e.draft_id)}},{limit:50})]);
  const byId=items=>new Map(items.map(x=>[x.id,x])),s=byId(sparks.items),d=byId(drafts.items);
  for(const e of page.items){try{const draft=d.get(e.draft_id),spark=s.get(e.spark_id);if(!draft||!spark||draft.revision!==e.draft_revision)throw new Error('Missing project or changed script revision');rows.push(originObservation(user,workspace,e,spark,draft));}catch(error){skipped.push({id:e.id,reason:error.message});}}
 }else if(input.source==='sandbox')for(const r of page.items){try{rows.push(sandboxObservation(user,workspace,r));}catch(error){skipped.push({id:r.id,reason:error.message});}}
 if(rows.length)await base44.asServiceRole.entities.NexusRegressionObservation.upsert(rows,{key:'source_key'});
 return {synced:rows.length,skipped,has_more:page.has_more,next_cursor:page.next_cursor};
}