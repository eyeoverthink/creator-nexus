import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
const Entry=()=>base44.entities.TimeAuditEntry;
export function useDayEntries(date){
 const {user}=useAuth();
 return useQuery({queryKey:['audit-day',user?.id,date],enabled:!!user?.id,queryFn:async()=>(await Entry().filter({owner_id:user.id,slot_date:date},{limit:60})).items});
}
export function useSaveEntry(){
 const {user}=useAuth(),qc=useQueryClient();
 const done=()=>{qc.invalidateQueries({queryKey:['audit-day']});qc.invalidateQueries({queryKey:['audit-leaks']});};
 const save=useMutation({mutationFn:({id,...data})=>id?Entry().update(id,data):Entry().create({...data,owner_id:user.id}),onSuccess:done});
 const remove=useMutation({mutationFn:id=>Entry().delete(id),onSuccess:done});
 return {save,remove};
}
export function useLeaks(threshold){
 const {user}=useAuth();
 return useQuery({queryKey:['audit-leaks',user?.id,threshold],enabled:!!user?.id,queryFn:async()=>{
  const q={owner_id:user.id};
  const [all,low,days]=await Promise.all([
   Entry().aggregate({query:q,groupBy:'category',avg:'energy',sum:'dollar_value'}),
   Entry().aggregate({query:{...q,dollar_value:{$lt:threshold}},groupBy:'category'}),
   Entry().aggregate({query:q,countDistinct:'slot_date'}),
  ]);
  const lowBy=Object.fromEntries(low.rows.map(r=>[r.category,r.count]));
  return {days:days.rows[0]?.count_distinct_slot_date||0,rows:all.rows.map(r=>({category:r.category,hours:r.count/2,low:(lowBy[r.category]||0)/2,energy:r.avg_energy||0,value:r.sum_dollar_value||0}))};
 }});
}
export function useTopActivities(category,threshold){
 const {user}=useAuth();
 return useQuery({queryKey:['audit-leaks','acts',user?.id,category,threshold],enabled:!!user?.id&&!!category,queryFn:async()=>(await Entry().aggregate({query:{owner_id:user.id,category,dollar_value:{$lt:threshold}},groupBy:'activity',sort:'-count',limit:5})).rows.map(r=>r.activity)});
}