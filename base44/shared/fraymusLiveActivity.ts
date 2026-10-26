import {buildFull64AgentBusDirectory} from './fraymusV16Protocol.ts';
export async function fraymusLiveSnapshot(base44,user,input={}){
 const scope={owner_id:user.id};
 if(input.workspace_id){if(!/^[a-f0-9]{24}$/i.test(input.workspace_id))return {error:'Invalid workspace.',status:400};const ws=await base44.entities.NexusWorkspace.filter({...scope,id:input.workspace_id},{limit:1});if(!ws.items.length)return {error:'Workspace not found.',status:404};scope.workspace_id=input.workspace_id;}
 const since=new Date(Date.now()-86400000).toISOString(),stale=new Date(Date.now()-300000).toISOString();
 const [directory,events,learning,jobs,eventCount,learningCount]=await Promise.all([
  buildFull64AgentBusDirectory({db:base44,ownerId:user.id}),
  base44.entities.NexusEvent.filter(scope,{sort:'-created_date',limit:20,fields:['agent','kind','message','workspace_id','created_date']}),
  base44.entities.SparkLearningLog.filter(scope,{sort:'-created_date',limit:20,fields:['agent','action','summary','workspace_id','created_date']}),
  base44.entities.NexusDispatchJob.aggregate({query:scope,groupBy:'status'}),
  base44.entities.NexusEvent.count({...scope,created_date:{$gte:since}}),
  base44.entities.SparkLearningLog.count({...scope,created_date:{$gte:since}}),
 ]);
 const staleRunning=await base44.entities.NexusDispatchJob.count({...scope,status:{$in:['running','claimed']},updated_date:{$lt:stale}});
 const activity=[...events.items.map(x=>({...x,source:'NexusEvent',summary:x.message,type:x.kind})),...learning.items.map(x=>({...x,source:'SparkLearningLog',type:x.action}))].sort((a,b)=>b.created_date.localeCompare(a.created_date)).slice(0,30);
 return {ok:true,fetched_at:new Date().toISOString(),scope:scope.workspace_id||'all_owned_workspaces',agents:directory.agents.filter(x=>x.is_ai!==false),registry_complete:directory.registry_complete,registry_warning:directory.registry_warning||null,job_counts:jobs.rows,stale_running:staleRunning,events_24h:eventCount,learning_records_24h:learningCount,last_activity_at:activity[0]?.created_date||null,activity};
}
export async function runFraymusHiveTask(base44,user,input){
 if(input.consent!==true)return {error:'Approve this hosted task; it uses AI credits.',status:403};
 if(typeof input.task!=='string'||!input.task.trim()||input.task.length>1500||typeof input.agent_id!=='string')return {error:'Choose an agent and enter a task up to 1,500 characters.',status:400};
 const registry=await buildFull64AgentBusDirectory({db:base44,ownerId:user.id});
 const profile=registry.agents.find(a=>a.is_ai!==false&&[a.number,a.alias_fx,a.slug].includes(input.agent_id));
 if(!profile)return {error:'Agent profile not found. Refresh the registry.',status:404};
 const workspacePage=await base44.entities.NexusWorkspace.filter({owner_id:user.id,...(input.workspace_id?{id:input.workspace_id}:{})},{sort:'created_date',limit:1});
 const workspace=workspacePage.items[0];if(!workspace)return {error:'Create your workspace first.',status:404};
 const scope={owner_id:user.id,workspace_id:workspace.id};
 const drafts=await base44.entities.NexusDraft.filter(scope,{sort:'-updated_date',limit:1});
 const draft=drafts.items[0]||await base44.entities.NexusDraft.create({...scope,title:'Hive task workspace',body:'',revision:1});
 const role=['researcher','writer','strategist'].includes(input.role)?input.role:'strategist';
 const job=await base44.entities.NexusDispatchJob.create({...scope,job_id:crypto.randomUUID(),directive:input.task,task_type:'hermes_skill_exec',assigned_node:`hosted:${profile.name}`,execution_mode:'immediate_cloud',status:'running',artifact_kind:'json_report',artifact_title:`Hosted task: ${profile.name}`.slice(0,240)});
 try{
  const response=await base44.functions.invoke('nexusAgent',{agent:role,draft_id:draft.id,task:`Use the specialist profile ${profile.name}. Task: ${input.task}`,consent:true,context:{agent_profile:{name:profile.name,skills:profile.skills},execution_boundary:'Hosted workspace agent, not remote process execution. Deliver a result or proposal; do not claim code deployment or external work.'}});
  const result=response.data?.result;if(!result?.body)throw new Error(response.data?.error||'No result produced.');
  const asset=await base44.entities.NexusAsset.create({...scope,title:String(result.title||profile.name).slice(0,160),body:result.body,kind:'generated',project:'Fraymus Hive Results',source_entity:'NexusDispatchJob',source_id:job.id});
  await base44.entities.NexusKnowledge.create({...scope,title:`[Hive ${role}] ${String(result.title||profile.name)}`.slice(0,120),body:`Prior hosted task output, unverified reference, not a capability or weight-training claim. Agent: ${profile.name}. Full result asset: ${asset.id}\n\n${result.body}`.slice(0,12000)});
  await base44.entities.NexusEvent.create({...scope,agent:profile.name,kind:'hive.task_completed',message:`Hosted result saved: ${result.title||profile.name}`,body:JSON.stringify({job_id:job.id,asset_id:asset.id,summary:result.summary,execution:'Hosted generation/proposal; no remote execution claimed.'})});
  await base44.entities.NexusDispatchJob.update(job.id,{status:'completed',completed_at:new Date().toISOString(),result_summary:String(result.summary||'Hosted result saved.').slice(0,8000),artifact_title:asset.title});
  return {ok:true,job_id:job.id,asset_id:asset.id,result,execution:'hosted_workspace_agent'};
 }catch(error){await base44.entities.NexusDispatchJob.update(job.id,{status:'failed',result_summary:String(error.message).slice(0,8000)});await base44.entities.NexusEvent.create({...scope,agent:profile.name,kind:'hive.task_failed',message:`Hosted task failed: ${String(error.message).slice(0,500)}`});return {error:error.message,job_id:job.id,status:502};}
}