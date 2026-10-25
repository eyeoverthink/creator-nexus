import {useEffect,useState} from 'react';
import {taskMonitorSources} from '@/components/nexus/monitor/taskMonitorSources';
import TaskMonitorSection from '@/components/nexus/monitor/TaskMonitorSection';
export default function TaskMonitorBoard(){
 const [filter,setFilter]=useState('running'),[now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return ()=>clearInterval(timer);},[]);
 return <section className="space-y-4" aria-label="Current agent focus">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h2 className="font-heading text-lg">Current focus</h2>
   <label className="text-sm flex items-center gap-2">Task status<select value={filter} onChange={event=>setFilter(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2"><option value="all">All active</option><option value="running">Running</option><option value="waiting">Waiting</option></select></label>
  </div>
  <p className="text-sm text-muted-foreground">Updates arrive from saved task reports. Percentages count completed production steps, not elapsed time; unreported progress stays unknown. Only tasks available to this account are shown.</p>
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{taskMonitorSources.map(source=><TaskMonitorSection key={source.entity} source={source} filter={filter} now={now}/>)}</div>
 </section>;
}