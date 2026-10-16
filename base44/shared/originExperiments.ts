import {owned,experimentFor,httpUrl} from './originAccess.ts';
import {ruleSchema,resultSchema,parse} from './originSchemas.ts';
import {recordOrigin} from './regressionLogging.ts';
export async function experimentAction(base44,user,workspace,input){
 const spark=await owned(base44,'NexusSpark',input.spark_id,user,workspace.id),experiment=await experimentFor(base44,user,spark);
 if(input.action==='register'){
  if(spark.status!=='approved')throw new Error('Approve the draft and add your signature before registering its test.');
  if(experiment)throw new Error('A test is already registered for this project. Its rule cannot be changed.');
  const values=parse(ruleSchema,input.rule),draft=await owned(base44,'NexusDraft',spark.draft_id,user,workspace.id);
  const record=await base44.entities.NexusExperiment.create({...values,owner_id:user.id,workspace_id:workspace.id,spark_id:spark.id,draft_id:draft.id,draft_revision:draft.revision||0,title:draft.title,registered_at:new Date().toISOString(),status:'registered',outcome:'pending'});return {experiment:record};
 }
 if(!experiment)throw new Error('Register the hypothesis and success rule before publishing.');
 if(input.action==='publish'){
  if(experiment.status!=='registered'||spark.status!=='approved')throw new Error('This project has already been published or is not approved.');
  const post_url=httpUrl(String(input.post_url||'')),now=Date.now();
  const record=await base44.entities.NexusExperiment.update(experiment.id,{post_url,published_at:new Date(now).toISOString(),closes_at:new Date(now+experiment.observation_hours*3600000).toISOString(),status:'observing'});
  await base44.entities.NexusSpark.update(spark.id,{status:'published'});return {experiment:record};
 }
 if(input.action==='results'){
  if(experiment.status!=='observing')throw new Error('Results can only be recorded for a published, unfinished test.');
  const values=parse(resultSchema,input.results);
  if(values.finalize&&Date.now()<Date.parse(experiment.closes_at))throw new Error('The pre-registered observation window is still open. Save interim results instead.');
  const value=experiment.metric==='views'?values.observed_views:values.observed_value;
  const outcome=!values.finalize?'pending':values.observed_views<experiment.minimum_views?'inconclusive':value>=experiment.target?'win':'loss';
  const record=await base44.entities.NexusExperiment.update(experiment.id,{observed_views:values.observed_views,observed_value:value,notes:values.notes,outcome,status:values.finalize?'final':'observing'});
  let regression_warning;
  if(values.finalize){await base44.entities.NexusSpark.update(spark.id,{status:'evaluated'});try{await recordOrigin(base44,user,workspace,record,spark);}catch(error){regression_warning='Results saved, but regression logging failed. Use Sync saved results in the proof loop. '+error.message;}}
  return {experiment:record,...(regression_warning?{regression_warning}:{})};
 }
 throw new Error('Unsupported experiment action.');
}