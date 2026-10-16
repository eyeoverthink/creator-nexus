import {useEffect,useState} from 'react';
const initial={provider:'hosted',connection:'local',endpoint:'http://localhost:11434',model:'',useMemory:true};
export default function useModelSettings(workspaceId){
 const [settings,setSettings]=useState(initial),[loaded,setLoaded]=useState(false),[token,setToken]=useState('');
 useEffect(()=>{setLoaded(false);if(!workspaceId)return;try{const value=localStorage.getItem('nexus-model:'+workspaceId);setSettings(value?{...initial,...JSON.parse(value)}:initial);}catch{setSettings(initial);}setLoaded(true);setToken('');},[workspaceId]);
 const update=patch=>setSettings(s=>{const next={...s,...patch};if(workspaceId&&loaded)localStorage.setItem('nexus-model:'+workspaceId,JSON.stringify(next));return next;});
 return {settings,update,token,setToken,loaded};
}