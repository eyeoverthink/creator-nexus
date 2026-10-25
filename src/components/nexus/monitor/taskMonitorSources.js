export const taskMonitorSources = [
 {entity:'NexusDispatchJob',label:'Agent dispatch',running:['claimed','running'],waiting:['queued'],fields:['id','workspace_id','status','directive','task_type','artifact_title','claimed_by','assigned_node','updated_date','created_date']},
 {entity:'NexusFactoryProduction',label:'Production factory',running:['planning','in_production'],waiting:['awaiting_worker','review'],fields:['id','workspace_id','status','title','brief','lead_agent','assigned_worker_location','steps','updated_date','created_date']},
 {entity:'NexusOriginRun',label:'Origin agents',running:['running'],waiting:[],fields:['id','workspace_id','status','operation','provider','updated_date','created_date']},
 {entity:'NexusNeedleJob',label:'Needle3 inference',running:['running'],waiting:['queued'],fields:['id','workspace_id','status','worker_id','input_json','started_at','expires_at','updated_date','created_date']},
];
export function monitorDate(value) {
 if(!value)return null;
 const text=String(value),date=new Date(/[zZ]$|[+-]\d\d:\d\d$/.test(text)?text:`${text}Z`);
 return Number.isNaN(date.getTime())?null:date;
}
export function describeMonitorTask(task,source) {
 let prompt='';
 if(task.input_json){try{const input=JSON.parse(task.input_json);if(typeof input.prompt==='string')prompt=input.prompt;}catch{prompt='Task brief could not be decoded.';}}
 const steps=Array.isArray(task.steps)?task.steps:[];
 const done=steps.filter(step=>step?.status==='completed').length;
 const current=steps.find(step=>['running','in_progress','in_production'].includes(step?.status));
 const title=task.artifact_title||task.title||(task.operation?`${task.operation} generation`:task.task_type?.replaceAll('_',' '))||(source.entity==='NexusNeedleJob'?'Local Needle3 request':'Agent task');
 const node=task.claimed_by||task.assigned_node||task.lead_agent||task.assigned_worker_location||(task.worker_id?`Worker ${task.worker_id}`:task.provider)||'Not reported';
 return {title,node,brief:current?.title||task.directive||task.brief||prompt||'No task brief reported.',done,total:steps.length,progress:steps.length?Math.round(done/steps.length*100):null,updated:monitorDate(task.updated_date||task.created_date)};
}