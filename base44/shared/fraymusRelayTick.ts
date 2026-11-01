import {deliverContinuityEntry} from './fraymusRelayDelivery.ts';
export async function runContinuityTick(base44,user,workspace){
 const scope={owner_id:user.id,workspace_id:workspace.id},db=base44.entities.FraymusRelayHeartbeat;
 let state=(await db.filter(scope,{sort:'created_date',limit:1})).items[0];if(!state)state=await db.create({...scope,running_until:'1970-01-01T00:00:00.000Z',tick_count:0});
 const now=new Date().toISOString(),lease=crypto.randomUUID();
 await db.updateMany({...scope,id:state.id,running_until:{$lte:now}},{$set:{running_until:new Date(Date.now()+120000).toISOString(),lease_id:lease,last_started_at:now}});
 const claimed=(await db.filter({...scope,id:state.id},{limit:1})).items[0];if(claimed?.lease_id!==lease)return {skipped:'heartbeat_already_running'};
 try{
  const page=await base44.entities.FraymusContinuityEntry.filter({...scope,$or:[{status:{$in:['queued','waiting']},next_attempt_at:{$lte:now}},{status:'sending',lease_until:{$lte:now}}]},{sort:'next_attempt_at',limit:2});
  const results=[];for(const row of page.items)results.push(await deliverContinuityEntry(base44,scope,row));
  const result={checked_at:now,attempted:results.length,results,no_ai_calls:true};
  await db.update(state.id,{last_completed_at:new Date().toISOString(),running_until:now,tick_count:(claimed.tick_count||0)+1,last_result:result,last_error:''});return result;
 }catch(e){await db.update(state.id,{running_until:now,last_error:String(e.message||'Heartbeat failed.').slice(0,300)});throw e;}
}