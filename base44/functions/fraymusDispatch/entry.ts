import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {runFraymusSignedDispatch} from '../../shared/fraymusSignedDispatch.ts';
export default async function(req){
 try{
  const base44=createClientFromRequest(req);let user;
  try{user=await base44.auth.me();}catch(error){if(error.status===401||error.response?.status===401)return Response.json({error:'Sign in required.'},{status:401});throw error;}
  if(!user)return Response.json({error:'Sign in required.'},{status:401});
  const body=await req.json().catch(()=>null);
  if(!body||typeof body.workspace_id!=='string'||body.workspace_id.length>120||!body.workspace_id||JSON.stringify(body).length>24000)return Response.json({error:'Provide a workspace and a bounded dispatch request.'},{status:400});
  const {workspace_id,...input}=body;
  const result=await runFraymusSignedDispatch(base44,user,workspace_id,input);
  return Response.json(result);
 }catch(error){return Response.json({error:error.name==='ZodError'?'Invalid dispatch fields. Check key, signature and envelope format.':error.message},{status:error.status|| (error.name==='ZodError'?400:500)});}
}