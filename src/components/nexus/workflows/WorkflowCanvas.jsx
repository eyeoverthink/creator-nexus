import {useRef,useState} from 'react';
import WorkflowNode from './WorkflowNode';
import {canConnect} from './workflowCatalog';
const W=208;
export default function WorkflowCanvas({nodes,edges,lookup,selectedId,steps,onSelect,onMove,onConnect,onRemoveEdge}){
 const box=useRef(null),[from,setFrom]=useState(null),[hint,setHint]=useState('');
 const drag=(node,e)=>{e.preventDefault();const sx=e.clientX-node.x,sy=e.clientY-node.y;const move=ev=>onMove(node.id,Math.max(0,ev.clientX-sx),Math.max(0,ev.clientY-sy));const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);};
 const connectTo=target=>{if(!from)return setHint('Pick a node’s right-hand port first.');const a=nodes.find(n=>n.id===from);if(!canConnect(lookup(a.type),lookup(target.type)))setHint('Those two nodes are not compatible.');else if(edges.some(e=>e.source===from&&e.target===target.id))setHint('Already connected.');else{onConnect(from,target.id);setHint('');}setFrom(null);};
 const pos=id=>nodes.find(n=>n.id===id);
 return <div className="relative">
  <div ref={box} onClick={()=>{onSelect(null);setFrom(null);}} className="relative h-[560px] overflow-auto rounded-lg border border-border bg-background" style={{backgroundImage:'radial-gradient(hsl(var(--border)) 1px, transparent 1px)',backgroundSize:'20px 20px'}}>
   <div className="relative min-w-[1400px] min-h-[900px]">
    <svg className="absolute inset-0 w-full h-full">{edges.map(e=>{const a=pos(e.source),b=pos(e.target);if(!a||!b)return null;const x1=a.x+W,y1=a.y+26,x2=b.x,y2=b.y+26;return <path key={e.id} d={`M${x1},${y1} C${x1+60},${y1} ${x2-60},${y2} ${x2},${y2}`} stroke="hsl(var(--link))" strokeWidth="2" fill="none" className="cursor-pointer" style={{pointerEvents:'stroke'}} onClick={ev=>{ev.stopPropagation();if(window.confirm('Remove this connection?'))onRemoveEdge(e.id);}}/>;})}</svg>
    {nodes.map(n=><WorkflowNode key={n.id} node={n} entry={lookup(n.type)} selected={selectedId===n.id} step={steps?.find(s=>s.node_id===n.id)} pending={!!from&&from!==n.id} onSelect={()=>onSelect(n.id)} onDragStart={e=>drag(n,e)} onOut={()=>{setFrom(n.id);setHint('Now pick the left-hand port of the receiving node.');}} onIn={()=>connectTo(n)}/>)}
    {!nodes.length&&<p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Add capabilities from the palette to start a workflow.</p>}
   </div>
  </div>
  {hint&&<p role="status" className="mt-2 text-xs text-muted-foreground">{hint}</p>}
 </div>;
}