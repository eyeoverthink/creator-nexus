import {useCallback,useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
export default function useApprovedExamples(workspace,agent){
 const [rows,setRows]=useState([]),[count,setCount]=useState(0),[cursor,setCursor]=useState(null),[more,setMore]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const query={owner_id:workspace.owner_id,workspace_id:workspace.id,agent};
 const load=useCallback(async(next)=>{setLoading(true);setError('');try{const [page,total]=await Promise.all([base44.entities.NexusExample.filter({owner_id:workspace.owner_id,workspace_id:workspace.id,agent},{sort:'-created_date',limit:10,...(next?{cursor:next}:{})}),base44.entities.NexusExample.count({owner_id:workspace.owner_id,workspace_id:workspace.id,agent})]);setRows(old=>next?[...old,...page.items]:page.items);setCount(total);setCursor(page.next_cursor);setMore(page.has_more);}catch(e){setError(e.message);}finally{setLoading(false);}},[workspace.id,workspace.owner_id,agent]);
 useEffect(()=>{load();return base44.entities.NexusExample.subscribe(e=>{if(!e.data||e.data.workspace_id===workspace.id)load();});},[load,workspace.id]);
 const remove=async(id)=>{setError('');try{await base44.entities.NexusExample.delete(id);await load();}catch(e){setError(e.message);}};
 return {rows,count,more,loading,error,loadMore:()=>load(cursor),remove,query};
}