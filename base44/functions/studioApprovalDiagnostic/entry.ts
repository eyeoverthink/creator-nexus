import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {proposeEdit,reviewProposal} from '../../shared/nexusProposals.ts';
export default async function(req){
 try{
  const client=createClientFromRequest(req),user=await client.auth.me();
  if(!user||user.role!=='admin')return Response.json({error:'Admin required'},{status:403});
  const input=await req.json();
  if(input.action==='create'){
   const workspace=await client.entities.NexusWorkspace.create({owner_id:user.id,name:'Temporary isolated studio diagnostic',room_id:crypto.randomUUID(),layout:[],agent_roster_version:1});
   const draft=await client.entities.NexusDraft.create({owner_id:user.id,workspace_id:workspace.id,title:'Temporary diagnostic',body:'Before isolated approval check.',revision:0});
   return Response.json({workspace,draft});
  }
  const workspace=await client.entities.NexusWorkspace.get(input.workspace_id);
  if(workspace.owner_id!==user.id||workspace.name!=='Temporary isolated studio diagnostic')return Response.json({error:'Not a diagnostic workspace'},{status:403});
  const scope={owner_id:user.id,workspace_id:workspace.id};
  if(input.action==='checkFlow'){
   const d=(await client.entities.NexusDraft.filter(scope,{limit:1})).items[0];
   const errors=[];
   const room={owner:user.id,workspace:workspace.id,client,state:{draft:d,revision:0,proposals:[],events:[]},saveDraft:async function(){await client.entities.NexusDraft.update(d.id,{title:this.state.draft.title,body:this.state.draft.body,revision:this.state.revision});},publish:async function(){}};
   proposeEdit(room,{agent:'writer',task:'Temporary isolated persistence check',provider:'hosted',model:'diagnostic-no-model-run',baseRevision:0,baseDraft:{title:d.title,body:d.body},result:{title:'Temporary accepted diagnostic',body:'After isolated approval check.',summary:'Temporary isolated persistence check'}});
   await reviewProposal(room,{send:message=>errors.push(message)},{type:'accept_proposal',id:room.state.proposals[0].id,remember:true});
   if(errors.length)return Response.json({errors},{status:500});
  }
  if(['check','checkFlow'].includes(input.action)){
   const [drafts,examples,observations]=await Promise.all([client.entities.NexusDraft.filter(scope,{limit:1}),client.entities.NexusExample.filter(scope,{limit:1}),client.asServiceRole.entities.NexusRegressionObservation.filter(scope,{limit:1})]);
   return Response.json({draftSaved:drafts.items[0]?.body==='After isolated approval check.',proposalRemembered:examples.items[0]?.after_body==='After isolated approval check.',decisionLogged:observations.items[0]?.y===1});
  }
  if(input.action==='cleanup'){
   await Promise.all([client.entities.NexusExample.deleteMany(scope),client.asServiceRole.entities.NexusRegressionObservation.deleteMany(scope),client.entities.NexusEvent.deleteMany(scope),client.entities.NexusDraft.deleteMany(scope)]);
   await client.entities.NexusWorkspace.delete(workspace.id);return Response.json({cleaned:true});
  }
  return Response.json({error:'Unsupported action'},{status:400});
 }catch(e){return Response.json({error:e.message},{status:500});}
}