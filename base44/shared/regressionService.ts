import {scope,sums,version} from './regressionCatalog.ts';
import {fitRegression,predict,guidanceFor} from './regressionMath.ts';
import {owned} from './originAccess.ts';
export async function analyzeRegression(base44,user,workspace,input){
 const config=scope(input),query={owner_id:user.id,workspace_id:workspace.id,...config.query};
 const [aggregate,points,logs]=await Promise.all([
  base44.entities.NexusRegressionObservation.aggregate({query,groupBy:'partition',sum:sums}),
  base44.entities.NexusRegressionObservation.filter(query,{sort:'-measured_at',limit:50,fields:['x1','x2','x3','y','t','label','partition','measured_at']}),
  base44.entities.NexusRegressionRun.filter({owner_id:user.id,workspace_id:workspace.id,source:input.source,agent:config.agent,metric:config.metric},{sort:'-created_date',limit:5})
 ]);
 const fit=fitRegression(aggregate.rows.find(r=>r.partition==='train'),aggregate.rows.find(r=>r.partition==='validation'));
 const result={version,catalog:config.catalog,metric:config.metric,agent:config.agent,fit,points:points.items,more_points:points.has_more,logs:logs.items,more_logs:logs.has_more,log_cursor:logs.next_cursor,guidance:guidanceFor(fit,config.catalog,config.metric)};
 if(fit.status==='ready'){
  const inputs=input.values===undefined?fit.means:input.values;
  if(!Array.isArray(inputs)||inputs.length!==3||inputs.some((v,i)=>!Number.isFinite(v)||v<config.catalog.features[i].min||v>config.catalog.features[i].max))throw new Error('Enter valid values for all three predictors.');
  const horizon=input.horizon===undefined?7:input.horizon;if(!Number.isInteger(horizon)||horizon<1||horizon>90)throw new Error('Forecast horizon must be 1–90 days.');
  const futureT=(Date.now()-Date.UTC(2026,0,1))/86400000+horizon;
  result.prediction={values:inputs,value:predict(fit,inputs),horizon,trend_value:fit.trend?fit.trend.intercept+fit.trend.slope*futureT:null,extrapolated:inputs.some((v,i)=>fit.scales[i]>0&&Math.abs(v-fit.means[i])>2*fit.scales[i]),trend_extrapolated:true};
 }
 if(input.save_log===true){
  const log=await base44.entities.NexusRegressionRun.create({owner_id:user.id,workspace_id:workspace.id,source:input.source,agent:config.agent,metric:config.metric,version,fit,prediction:result.prediction||{},guidance:result.guidance,adopted:false});result.logs=[log,...logs.items];result.more_logs=logs.has_more;
 }
 return result;
}
export async function adoptRegression(base44,user,workspace,input){
 const run=await owned(base44,'NexusRegressionRun',input.run_id,user,workspace.id);
 if(typeof input.enabled!=='boolean')throw new Error('Choose whether to use this guidance.');
 if(input.enabled&&(run.fit?.status!=='ready'||run.fit.flat_target))throw new Error('Collect varied inputs and outcomes before using regression guidance.');
 if(input.enabled){let page;do{page=await base44.entities.NexusRegressionRun.updateMany({owner_id:user.id,workspace_id:workspace.id,source:run.source,agent:run.agent,metric:run.metric,adopted:true},{$set:{adopted:false}});}while(page.has_more);}
 await base44.entities.NexusRegressionRun.update(run.id,{adopted:input.enabled});return {adopted:input.enabled};
}
export async function regressionHistory(base44,user,workspace,input){
 const config=scope(input);return base44.entities.NexusRegressionRun.filter({owner_id:user.id,workspace_id:workspace.id,source:input.source,agent:config.agent,metric:config.metric},{sort:'-created_date',limit:10,...(input.cursor?{cursor:input.cursor}:{})});
}