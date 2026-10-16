import {useState} from 'react';
import Sidebar from '@/components/nexus/Sidebar';
import '@/components/nexus/theme.css';
export default function ProShell({children,originTab,onOriginTab}){
 const [collapsed,setCollapsed]=useState(false);
 return <div className="nexus-pro-shell"><Sidebar collapsed={collapsed} onCollapse={()=>setCollapsed(!collapsed)} originTab={originTab} onOriginTab={onOriginTab}/><div className="nexus-shell-content">{children}</div></div>;
}