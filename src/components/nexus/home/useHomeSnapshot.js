import {useCallback,useSyncExternalStore} from 'react';
import {useQueryClient} from '@tanstack/react-query';
export default function useHomeSnapshot(workspaceId){
 const client=useQueryClient(),cache=client.getQueryCache();
 const subscribe=useCallback(notify=>cache.subscribe(notify),[cache]);
 const snapshot=useCallback(()=>cache.getAll().map(q=>q.queryHash+':'+q.state.dataUpdatedAt).join('|'),[cache]);
 useSyncExternalStore(subscribe,snapshot,snapshot);
 // Presentation only: observe existing cache entries, never fetch or mutate records.
 if(!workspaceId)return {cards:[],jobs:{}};
 const batch=client.getQueryData(['spark','latest',workspaceId]);
 const cards=client.getQueryData(['spark','cards',workspaceId,batch])?.items||[];
 const queries=cache.findAll({queryKey:['spark','jobs',workspaceId]}).slice().sort((a,b)=>a.state.dataUpdatedAt-b.state.dataUpdatedAt);
 const jobs=Object.assign({},...queries.map(q=>q.state.data||{}));
 return {cards,jobs};
}