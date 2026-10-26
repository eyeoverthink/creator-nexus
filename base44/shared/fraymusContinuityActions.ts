import {archiveCreatorEntry,RELAY_PEER} from './fraymusCreatorArchive.ts';
import {runContinuityTick} from './fraymusRelayTick.ts';
export async function handleContinuityAction(base44,user,a){
 const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(!user)return json({error:'Sign in required.'},401);if(user.role!=='admin')return json({error:'Admin access required.'},403);
 const supported=['continuity_status','continuity_archive','continuity_tick','continuity_capture_chat','continuity_capture_event'];if(!supported.includes(a.action))return json({error:'Unknown continuity operation.'},400);
 if(a.workspace_id!==undefined&&(typeof a.workspace_id!=='string'||!/^[a-f0-9]{24}$/i.test(a.workspace_id)))return json({error:'Invalid workspace.'},400);
 const workspace=(await base44.entities.NexusWorkspace.filter({owner_id:user.id,...(a.workspace_id?{id:a.workspace_id}:{})},{sort:'created_date',limit:1})).items[0];if(!workspace)return json({error:'An owned workspace is required.'},404);
 const scope={owner_id:user.id,workspace_id:workspace.id};
 if(a.action==='continuity_tick')return json(await runContinuityTick(base44,user,workspace));
 if(a.action==='continuity_archive'){const result=await archiveCreatorEntry(base44,user,workspace,a.entry||{});return json(result,result.status||200);}
 if(a.action==='continuity_capture_chat'||a.action==='continuity_capture_event'){
  if(typeof a.source_id!=='string'||!/^[a-f0-9]{24}$/i.test(a.source_id))return json({error:'Invalid source identifier.'},400);
  const chat=a.action==='continuity_capture_chat',entity=chat?'NexusChatTurn':'NexusEvent',row=(await base44.entities[entity].filter({...scope,id:a.source_id},{limit:1})).items[0];if(!row)return json({skipped:'source_not_in_creator_workspace'});
  if(!chat&&String(row.kind||'').startsWith('continuity.'))return json({skipped:'loop_guard'});
  const entry=chat?{kind:'app_chat',title:`In-app ${row.agent} conversation`,text:`Creator text:\n${row.question}\n\nAgent response (reported, not independent evidence):\n${row.answer}`,source_ref:`NexusChatTurn:${row.id}`}:{kind:'app_event',title:String(row.message||row.kind||'App event').slice(0,160),text:JSON.stringify({agent:row.agent,kind:row.kind,message:row.message,source_id:row.id,created_date:row.created_date,notice:'Event summary only. Raw bodies, uploads and credentials are not copied.'},null,2),source_ref:`NexusEvent:${row.id}`};
  const result=await archiveCreatorEntry(base44,user,workspace,entry);return json(result,result.status||200);
 }
 if(a.cursor!==undefined&&(typeof a.cursor!=='string'||a.cursor.length>2000))return json({error:'Invalid cursor.'},400);
 const [entries,heartbeat,counts]=await Promise.all([base44.entities.FraymusContinuityEntry.filter(scope,{sort:'-created_date',limit:10,...(a.cursor?{cursor:a.cursor}:{})}),base44.entities.FraymusRelayHeartbeat.filter(scope,{sort:'created_date',limit:1}),base44.entities.FraymusContinuityEntry.aggregate({query:scope,groupBy:'status'})]);
 return json({workspace:{id:workspace.id,name:workspace.name},entries,heartbeat:heartbeat.items[0]||null,counts:counts.rows,peer_endpoint:RELAY_PEER,capture_scope:'New in-app chat turns and event summaries; builder messages only when explicitly archived here. No permanent background access to builder chat.',agent_scope:'Retrieved as reference by studio/Origin/Knowledge and Factory prompts. Archiving is not agent execution.'});
}