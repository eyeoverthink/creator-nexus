function words(text){return new Set((text.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]));}
export async function checkOriginDraft(base44,user,spark,draft,dna,signature){
 const query={owner_id:user.id,workspace_id:spark.workspace_id,status:{$in:['approved','published','evaluated']},id:{$ne:spark.id}};
 const history=await base44.entities.NexusSpark.filter(query,{sort:'-created_date',limit:20,fields:['draft_id','title']});
 const ids=history.items.map(s=>s.draft_id).filter(Boolean);
 const previous=ids.length?await base44.entities.NexusDraft.filter({owner_id:user.id,workspace_id:spark.workspace_id,id:{$in:ids}},{limit:20,fields:['body','title']}):{items:[]};
 const text=draft.body+'\n'+signature,a=words(draft.body);let highest=0,match='';
 if(a.size>=30)for(const prior of previous.items){const b=words(prior.body);if(b.size<30)continue;let common=0;for(const word of a)if(b.has(word))common++;const score=common/(a.size+b.size-common);if(score>highest){highest=score;match=prior.title;}}
 const banned=(dna?.red_lines||'').split(/[\n,;]+/).map(t=>t.trim()).filter(t=>t.length>=3).filter(t=>text.toLowerCase().includes(t.toLowerCase()));
 const warnings=[];if(highest>=0.85)warnings.push('High vocabulary overlap with “'+match+'”. Change the concept and wording before approving.');if(banned.length)warnings.push('Contains your red-line phrase(s): '+banned.join(', ')+'.');
 return {blocked:highest>=0.85||banned.length>0,similarity_percent:Math.round(highest*100),compared_drafts:previous.items.length,algorithm:'Vocabulary overlap, latest 20 approved drafts. A simple heuristic, not a plagiarism or legal-compliance assessment.',warnings};
}