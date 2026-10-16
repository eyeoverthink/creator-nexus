export async function reviewProposal(room,conn,msg){
 const proposals=room.state.proposals||[],p=proposals.find(p=>p.id===msg.id);if(!p)return;
 if(msg.type==='accept_proposal'){
  const matches=()=>p.draft_id===room.state.draft?.id&&p.base_revision===room.state.revision&&p.before_body===room.state.draft.body&&p.before_title===room.state.draft.title;
  if(!matches()){conn.send({type:'error',message:'This suggestion is based on an older draft. Ask the agent to regenerate it; your edits were preserved.'});return;}
  const previous=room.state.draft,revision=room.state.revision;
  room.state.draft={...previous,title:p.title,body:p.body};room.state.revision++;
  try{await room.saveDraft();}catch(error){room.state.draft=previous;room.state.revision=revision;throw error;}
  room.state.proposals=(room.state.proposals||[]).filter(x=>x.id!==p.id);await room.publish();
  if(msg.remember===true){
   await room.client.asServiceRole.entities.NexusExample.upsert([{owner_id:room.owner,workspace_id:room.workspace,draft_id:p.draft_id,proposal_id:p.id,agent:p.agent,task:p.task,before_title:p.before_title,before_body:p.before_body,after_title:p.title,after_body:p.body,summary:p.summary,provider:p.provider,model:p.model}],{key:'proposal_id'});
  }
 }
 room.state.proposals=(room.state.proposals||[]).filter(x=>x.id!==p.id);
 const accepted=msg.type==='accept_proposal';
 room.state.events=[{id:crypto.randomUUID(),agent:p.agent,message:accepted?'Suggestion accepted'+(msg.remember===true?' and saved as a learning example.':'.'):'Suggestion rejected; draft unchanged.',body:'',kind:accepted?'accepted':'rejected',time:Date.now()},...room.state.events].slice(0,30);
 await room.publish();
}
export function proposeEdit(room,msg){
 const r=msg.result,base=msg.baseDraft;
 if(!Number.isInteger(msg.baseRevision)||typeof base?.body!=='string'||typeof base?.title!=='string'||base.body.length>20000||base.title.length>160||typeof r.body!=='string'||r.body.length>20000||typeof r.title!=='string'||r.title.length>160)return false;
 if((room.state.proposals||[]).length>=8)return false;
 const proposal={id:crypto.randomUUID(),draft_id:room.state.draft.id,agent:msg.agent,task:String(msg.task||'Refine the draft').slice(0,2000),before_title:base.title,before_body:base.body,base_revision:msg.baseRevision,title:r.title||'Untitled draft',body:r.body,summary:String(r.summary||'Suggested draft changes').slice(0,500),provider:String(msg.provider||'hosted').slice(0,30),model:String(msg.model||'automatic').slice(0,160),time:Date.now()};
 room.state.proposals=[proposal,...(room.state.proposals||[])];return true;
}