import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {executeFraymusBrain} from '../../shared/fraymusBrainOperation.ts';
import {handleNeedleWorker} from '../../shared/fraymusNeedleWorker.ts';
import {handleNeedleUser} from '../../shared/fraymusNeedleUser.ts';
import {readInput} from '../../shared/runnerBridge.ts';
export default async function(req){
 try{
  if(req.method!=='POST')return Response.json({error:'Use POST.'},{status:405});
  const base44=createClientFromRequest(req);
  const input=await readInput(req,48000);if(input.error)return input.error;
  const a=input.value;
  if(['needle_worker_hello','needle_worker_poll','needle_worker_report'].includes(a.action))return await handleNeedleWorker(base44,req,a);
  const user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in required.'},{status:401});
  if(typeof a.action==='string'&&a.action.startsWith('needle_'))return await handleNeedleUser(base44,user,a);
  if(!a||!['run','history','read'].includes(a.action))return Response.json({error:'Choose run, history or read.'},{status:400});
  for(const key of ['workspace_id','state_id','cursor'])if(a[key]!==undefined&&(typeof a[key]!=='string'||!a[key]||a[key].length>2000))return Response.json({error:`Invalid ${key}.`},{status:400});
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
   const saved=JSON.parse(record.body);return Response.json({result:{...saved.report,state_id:record.id,committed:true}});
  }
  const result=await executeFraymusBrain(base44,user,workspace.id,a.input);
  return Response.json({result,...(result.error?{error:result.error}:{})},{status:result.error?400:200});
 }catch(e){const status=Number(e.status||e.response?.status)||500;return Response.json({error:e.message},{status:[401,403,404,429].includes(status)?status:500});}
}