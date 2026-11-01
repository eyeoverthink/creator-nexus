const STATUS={running:'border-primary',completed:'border-success',failed:'border-destructive',skipped:'border-border opacity-60'};
export default function WorkflowNode({node,entry,selected,step,pending,onSelect,onDragStart,onOut,onIn}){
 return <div style={{left:node.x,top:node.y}} className={`absolute w-52 rounded-lg border-2 bg-card text-xs select-none ${STATUS[step?.status]||(selected?'border-primary':'border-border')}`} onClick={e=>{e.stopPropagation();onSelect();}}>
  {entry?.inputs?.length>0&&<button aria-label="Connect into this node" onClick={e=>{e.stopPropagation();onIn();}} className={`absolute -left-2 top-5 h-4 w-4 rounded-avatar border-2 border-background ${pending?'bg-primary':'bg-muted-foreground'}`}/>}
  <div onPointerDown={onDragStart} className="px-3 py-2 border-b border-border cursor-grab font-medium truncate">{node.config?.label||entry?.label||'Missing capability'}</div>
  <div className="px-3 py-2 text-muted-foreground space-y-1"><p className="truncate">{entry?.group||'Unknown'} · {step?.status||'idle'}</p>{step?.status==='running'&&<p role="status" className="text-link">Working…</p>}{step?.error&&<p className="text-destructive line-clamp-2">{step.error}</p>}</div>
  {entry?.output&&<button aria-label="Connect from this node" onClick={e=>{e.stopPropagation();onOut();}} className="absolute -right-2 top-5 h-4 w-4 rounded-avatar border-2 border-background bg-link"/>}
 </div>;
}