import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {BASE_CATALOG,skillEntry} from './workflowCatalog';
export default function useWorkflowData(workspace){
 const scope=workspace?{owner_id:workspace.owner_id,workspace_id:workspace.id}:null;
 const skills=useQuery({queryKey:['wf-skills',workspace?.id],enabled:!!scope,queryFn:async()=>(await base44.entities.NexusSkill.filter(scope,{sort:'-updated_date',limit:100})).items});
 const workflows=useQuery({queryKey:['wf-list',workspace?.id],enabled:!!scope,queryFn:async()=>(await base44.entities.NexusWorkflow.filter(scope,{sort:'-updated_date',limit:50})).items});
 const catalog=[...BASE_CATALOG,...(skills.data||[]).map(skillEntry)];
 const lookup=type=>catalog.find(c=>c.type===type);
 return {skills,workflows,catalog,lookup};
}