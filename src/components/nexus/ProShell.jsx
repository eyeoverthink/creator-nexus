import {useState} from 'react';
import Sidebar from '@/components/nexus/Sidebar';
import CrossTabMemoryBar from '@/components/nexus/CrossTabMemoryBar';
import '@/components/nexus/theme.css';
export default function ProShell({children,originTab,onOriginTab}){
 const [collapsed,setCollapsed]=useState(false);
 return <div className="nexus-pro-shell"><Sidebar collapsed={collapsed} onCollapse={()=>setCollapsed(!collapsed)} originTab={originTab} onOriginTab={onOriginTab}/><div className="nexus-shell-content flex flex-col"><CrossTabMemoryBar/><div className="flex-1 min-h-0">{children}</div></div></div>;
}