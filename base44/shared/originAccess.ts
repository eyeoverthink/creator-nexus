export async function owned(base44,entity,id,user,workspaceId){
 if(typeof id!=='string'||!/^[a-f0-9]{24}$/i.test(id))throw new Error('Choose a valid '+entity.replace('Nexus','')+'.');
 const record=await base44.entities[entity].get(id);
 if(!record||record.owner_id!==user.id||(workspaceId&&record.workspace_id!==workspaceId))throw new Error('This item is not in your personal workspace.');
 return record;
}
export async function dnaFor(base44,user,workspace){const page=await base44.entities.CreatorDNA.filter({owner_id:user.id,workspace_id:workspace.id},{sort:'-updated_date',limit:1});return page.items[0]||null;}
export async function experimentFor(base44,user,spark){const page=await base44.entities.NexusExperiment.filter({owner_id:user.id,workspace_id:spark.workspace_id,spark_id:spark.id},{sort:'-created_date',limit:1});return page.items[0]||null;}
export function httpUrl(value){const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||value.length>2000)throw new Error('Use a public HTTPS post link without credentials.');return url.href;}