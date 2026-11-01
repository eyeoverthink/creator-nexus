import {useEffect,useRef} from 'react';
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
const PRESETS=['Friday: log every 30 minutes','Saturday: log every 30 minutes','Find your 10-hour leak','Put a starter agent on the leak','Research trends and sources','Run the idea finder and pick one idea','Draft outreach to 10 people with the pain','Sunday: review what you reclaimed'];
const E=()=>base44.entities.WeekendChecklistItem;
export default function useChecklist(){
 const {user}=useAuth(),qc=useQueryClient(),seeded=useRef(false),key=['weekend-checklist',user?.id];
 const items=useQuery({queryKey:key,enabled:!!user?.id,queryFn:async()=>(await E().filter({owner_id:user.id},{sort:'order',limit:100})).items});
 const done=()=>qc.invalidateQueries({queryKey:key});
 useEffect(()=>{if(items.data&&!items.data.length&&!seeded.current){seeded.current=true;E().bulkCreate(PRESETS.map((label,i)=>({owner_id:user.id,label,preset:true,done:false,order:i}))).then(done);}},[items.data]);// eslint-disable-line react-hooks/exhaustive-deps
 const add=useMutation({mutationFn:label=>E().create({owner_id:user.id,label,preset:false,done:false,order:(items.data?.length||0)+100}),onSuccess:done});
 const toggle=useMutation({mutationFn:i=>E().update(i.id,{done:!i.done}),onSuccess:done});
 const remove=useMutation({mutationFn:id=>E().delete(id),onSuccess:done});
 const reset=useMutation({mutationFn:()=>E().updateMany({owner_id:user.id,done:true},{$set:{done:false}}),onSuccess:done});
 return {items,add,toggle,remove,reset};
}