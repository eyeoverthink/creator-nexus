import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export const FALLBACK_ENDPOINT='https://creator-nexus.base44.app/functions/remoteApi';
export const remoteCall=async payload=>(await base44.functions.invoke('remoteApi',payload)).data;
export const remoteError=e=>e?.response?.data?.error||e?.message||'Something went wrong.';
export default function useRemoteApi(){
 const cache=useQueryClient(),refresh=()=>cache.invalidateQueries({queryKey:['remote-api']});
 const keys=useQuery({queryKey:['remote-api','keys'],queryFn:()=>remoteCall({action:'keys'}),retry:false});
 const catalog=useQuery({queryKey:['remote-api','catalog'],queryFn:()=>remoteCall({action:'catalog'}),retry:false,staleTime:60000});
 const create=useMutation({mutationFn:label=>remoteCall({action:'create_key',label}),onSuccess:refresh});
 const revoke=useMutation({mutationFn:id=>remoteCall({action:'revoke_key',id}),onSuccess:refresh});
 return {keys,catalog,create,revoke,endpoint:keys.data?.endpoint||catalog.data?.endpoint||FALLBACK_ENDPOINT};
}