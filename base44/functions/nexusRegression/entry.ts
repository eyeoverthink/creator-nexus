import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {owned} from '../../shared/originAccess.ts';
import {scope} from '../../shared/regressionCatalog.ts';
import {analyzeRegression,adoptRegression,regressionHistory} from '../../shared/regressionService.ts';
import {recordSaved,syncSaved} from '../../shared/regressionLogging.ts';
export default async function(req){
 try{
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in required.'},{status:401});
  const text=await req.text();if(text.length>12000)return Response.json({error:'Regression request is too large.'},{status:400});
  const input=JSON.parse(text);
  if(!input||!['load','analyze','record','sync','adopt','history'].includes(input.action))return Response.json({error:'Unsupported regression action.'},{status:400});
  if(input.cursor!==undefined&&(typeof input.cursor!=='string'||input.cursor.length>4096))throw new Error('Invalid history cursor.');
  const workspace=await owned(base44,'NexusWorkspace',input.workspace_id,user);
  if(input.action==='adopt')return Response.json(await adoptRegression(base44,user,workspace,input));
  const config=scope(input);
  if(input.action==='record'){await recordSaved(base44,user,workspace,input);return Response.json({recorded:true});}
  if(input.action==='sync')return Response.json(await syncSaved(base44,user,workspace,input,config));
  if(input.action==='history')return Response.json(await regressionHistory(base44,user,workspace,input));
  return Response.json(await analyzeRegression(base44,user,workspace,{...input,save_log:input.action==='analyze'}));
 }catch(error){return Response.json({error:error.message},{status:400});}
}