import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {owned,dnaFor} from '../../shared/originAccess.ts';
import {saveDNA,projectAction} from '../../shared/originProjects.ts';
import {experimentAction} from '../../shared/originExperiments.ts';
import {generateOrigin} from '../../shared/originAgent.ts';
export default async function(req){
 try{
  const base44=createClientFromRequest(req),user=await base44.auth.me();if(!user)return Response.json({error:'Sign in required.'},{status:401});
  const input=await req.json(),allowed=['status','save_dna','sparks','script','save_draft','approve','register','publish','results'];
  if(!allowed.includes(input.action))return Response.json({error:'Unsupported Origin action.'},{status:400});
  const workspace=await owned(base44,'NexusWorkspace',input.workspace_id,user);
  if(input.action==='status')return Response.json({dna:await dnaFor(base44,user,workspace),runner:{platform:'Windows',connected:false},paid_runs:'approval_required',live_trends:false});
  if(input.action==='save_dna')return Response.json(await saveDNA(base44,user,workspace,input));
  if(['save_draft','approve'].includes(input.action))return Response.json(await projectAction(base44,user,workspace,input));
  if(['register','publish','results'].includes(input.action))return Response.json(await experimentAction(base44,user,workspace,input));
  if(input.consent!==true)return Response.json({error:'Approve this specific hosted AI run before it can start.'},{status:403});
  const dna=await dnaFor(base44,user,workspace);if(!dna)throw new Error('Save your Creator DNA first.');
  const spark=input.action==='script'?await owned(base44,'NexusSpark',input.spark_id,user,workspace.id):null;
  if(spark?.draft_id)return Response.json({spark,draft:await owned(base44,'NexusDraft',spark.draft_id,user,workspace.id)});
  const active=await base44.entities.NexusOriginRun.count({owner_id:user.id,workspace_id:workspace.id,status:'running',created_date:{$gte:new Date(Date.now()-360000).toISOString()}});
  if(active)return Response.json({error:'An Origin run is already in progress. Wait for it before approving another.'},{status:409});
  const batch_id=crypto.randomUUID(),run=await base44.entities.NexusOriginRun.create({owner_id:user.id,workspace_id:workspace.id,operation:input.action,status:'running',consented_at:new Date().toISOString(),provider:'hosted',batch_id,...(spark?{spark_id:spark.id}:{}),cost_note:'Hosted integration credits may apply. Exact amount unavailable; no media spend authorized.'});
  try{
   const result=await generateOrigin(base44,user,workspace,dna,input.action,spark);let response;
   if(input.action==='sparks'){
    const sparks=await base44.entities.NexusSpark.bulkCreate(result.sparks.map(s=>({...s,owner_id:user.id,workspace_id:workspace.id,batch_id,status:'idea'})));response={sparks,batch_id};
   }else{
    const draft=await base44.entities.NexusDraft.create({owner_id:user.id,workspace_id:workspace.id,title:result.title,body:result.body,revision:0});
    const updated=await base44.entities.NexusSpark.update(spark.id,{draft_id:draft.id,brief:result.brief,caption:result.caption,disclosure:result.disclosure,status:'draft'});response={spark:updated,draft};
   }
   await base44.entities.NexusOriginRun.update(run.id,{status:'succeeded',completed_at:new Date().toISOString()});return Response.json(response);
  }catch(error){await base44.entities.NexusOriginRun.update(run.id,{status:'failed',completed_at:new Date().toISOString(),error_message:String(error.message).slice(0,1000)});throw error;}
 }catch(error){return Response.json({error:error.message},{status:400});}
}