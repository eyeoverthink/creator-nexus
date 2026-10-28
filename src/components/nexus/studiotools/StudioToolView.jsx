import {Suspense,useEffect,useState} from 'react';
import {studioTools} from '@/components/nexus/studiotools/studioToolsList';
export default function StudioToolView({tool,workspace,handoff,onSend}){
 const [visited,setVisited]=useState([tool]);
 useEffect(()=>{setVisited(v=>v.includes(tool)?v:[...v,tool]);},[tool]);
 return <>{studioTools.filter(t=>visited.includes(t.id)).map(({id,Panel})=><div key={id} hidden={id!==tool}><Suspense fallback={<p role="status">Opening tool…</p>}><Panel workspace={workspace} handoff={handoff?.to===id?handoff:null} onSend={onSend}/></Suspense></div>)}</>;
}