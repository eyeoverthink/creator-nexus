import {dnaFor,owned,experimentFor} from './originAccess.ts';
import {dnaSchema,draftSchema,parse} from './originSchemas.ts';
import {checkOriginDraft} from './originGuard.ts';
export async function saveDNA(base44,user,workspace,input){
 const values=parse(dnaSchema,input.dna),old=await dnaFor(base44,user,workspace);
 const dna=old?await base44.entities.CreatorDNA.update(old.id,values):await base44.entities.CreatorDNA.create({...values,owner_id:user.id,workspace_id:workspace.id});return {dna};
}
export async function projectAction(base44,user,workspace,input){
 const spark=await owned(base44,'NexusSpark',input.spark_id,user,workspace.id),draft=await owned(base44,'NexusDraft',spark.draft_id,user,workspace.id);
 const experiment=await experimentFor(base44,user,spark);
 if(input.action==='save_draft'){
  if(experiment||['published','evaluated'].includes(spark.status))throw new Error('This project is frozen by its registered experiment. Make a new Spark for a new version.');
  const values=parse(draftSchema,input.draft);
  if(values.revision!==(draft.revision||0))throw new Error('Another edit was saved first. Reload this project before editing again.');
  const updated=await base44.entities.NexusDraft.update(draft.id,{title:values.title,body:values.body,revision:(draft.revision||0)+1});
  const updatedSpark=await base44.entities.NexusSpark.update(spark.id,{status:'draft',signature:String(input.signature||'').slice(0,2000),approved_at:'',guard_result:{}});return {spark:updatedSpark,draft:updated};
 }
 if(input.action==='approve'){
  if(experiment||spark.status!=='draft')throw new Error('Only an editable draft can be approved.');
  const signature=String(input.signature||'').trim();
  if(signature.length<12||signature.length>2000||input.confirm_rights!==true)throw new Error('Add your personal signature contribution and confirm the rights and disclosure review.');
  if(input.revision!==(draft.revision||0))throw new Error('The draft changed. Reload it before approval.');
  const dna=await dnaFor(base44,user,workspace),guard=await checkOriginDraft(base44,user,spark,draft,dna,signature);
  if(guard.blocked)return {approved:false,guard};
  const latest=await owned(base44,'NexusDraft',draft.id,user,workspace.id);if(latest.revision!==draft.revision||latest.body!==draft.body||latest.title!==draft.title)throw new Error('The draft changed during review. Reload it and approve the latest version.');
  const approved=await base44.entities.NexusSpark.update(spark.id,{status:'approved',signature,approved_at:new Date().toISOString(),guard_result:guard});return {approved:true,spark:approved,guard};
 }
 throw new Error('Unsupported project action.');
}