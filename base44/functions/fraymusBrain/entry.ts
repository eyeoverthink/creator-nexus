import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {executeFraymusBrain} from '../../shared/fraymusBrainOperation.ts';
import {handleNeedleWorker} from '../../shared/fraymusNeedleWorker.ts';
import {handleNeedleUser} from '../../shared/fraymusNeedleUser.ts';
import {readInput} from '../../shared/runnerBridge.ts';
import {executeFraymusAssociative} from '../../shared/fraymusAssociativeMemory.ts';
import {digestAdaptive} from '../../shared/fraymusAdaptiveSchema.ts';
import {readFraymusBrainReport} from '../../shared/fraymusBrainStorage.ts';
import {ADAPTIVE_LIMITS} from '../../shared/fraymusAdaptiveLimits.ts';
import {handleVocalAnalysis} from '../../shared/fraymusVocalAnalysis.ts';
// Adaptive graph, HDC replay and affective learning share executeFraymusBrain with agent tools.
export default async function(req){
 try{
  if(req.method!=='POST')return Response.json({error:'Use POST.'},{status:405});
  const base44=createClientFromRequest(req);
  const input=await readInput(req,ADAPTIVE_LIMITS.requestBytes);if(input.error)return input.error;
  const a=input.value;
  if(['needle_worker_hello','needle_worker_poll','needle_worker_report'].includes(a.action))return await handleNeedleWorker(base44,req,a);
  const user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in required.'},{status:401});
  if(typeof a.action==='string'&&a.action.startsWith('needle_'))return await handleNeedleUser(base44,user,a);
   if(typeof a.action==='string'&&a.action.startsWith('emotion_'))return await handleVocalAnalysis(base44,user,a);
  if(['memory_learn','memory_recall','memory_preview'].includes(a.action)){
   const result=await executeFraymusAssociative(base44,user,a.workspace_id,{text:a.text,label:a.label,minimum_similarity:a.minimum_similarity,memory_action:a.action==='memory_recall'?'recall':'learn',commit:a.action==='memory_learn'});
   return Response.json({result,...(result.error?{error:result.error}:{})},{status:result.status_code||200});
  }
  if(!a||!['run','history','read'].includes(a.action))return Response.json({error:'Choose run, history or read.'},{status:400});
  for(const key of ['workspace_id','state_id','cursor'])if(a[key]!==undefined&&(typeof a[key]!=='string'||!a[key]||a[key].length>2000))return Response.json({error:`Invalid ${key}.`},{status:400});
   for(const key of ['workspace_id','state_id'])if(a[key]!==undefined&&!/^[a-f0-9]{24}$/i.test(a[key]))return Response.json({error:`Invalid ${key} record ID.`},{status:400});
  const page=await base44.entities.NexusWorkspace.filter({owner_id:user.id,...(a.workspace_id?{id:a.workspace_id}:{})},{sort:'created_date',limit:1});
  const workspace=page.items[0];if(!workspace)return Response.json({error:'Create or select your own workspace before using Brain tools.'},{status:404});
  const scope={owner_id:user.id,workspace_id:workspace.id,project:'Fraymus Brain',source_entity:'FraymusBrainState'};
  if(a.action==='history'){
   const history=await base44.entities.NexusAsset.filter(scope,{sort:'-created_date',limit:10,...(a.cursor?{cursor:a.cursor}:{}),fields:['title','created_date']});
   return Response.json({...history,workspace_id:workspace.id});
  }
  if(a.action==='read'){
   if(!a.state_id)return Response.json({error:'Provide a saved result ID.'},{status:400});
   const records=await base44.entities.NexusAsset.filter({...scope,id:a.state_id},{limit:1});
   const record=records.items[0];if(!record)return Response.json({error:'Saved result not found in this workspace.'},{status:404});
   const report=await readFraymusBrainReport(base44,record);
        if(report.adaptive_state&&await digestAdaptive(report.adaptive_state)!==report.adaptive_state_sha256)return Response.json({error:'Adaptive state digest changed.'},{status:400});
        return Response.json({result:{...report,state_id:record.id,committed:true}});
  }
  const result=await executeFraymusBrain(base44,user,workspace.id,a.input);
  return Response.json({result,...(result.error?{error:result.error}:{})},{status:result.error?400:200});
 }catch(e){const status=Number(e.status||e.response?.status)||500;return Response.json({error:e.message},{status:[401,403,404,429].includes(status)?status:500});}
}