export default function AgentPicker({agents,value,onChange}){
 return <nav aria-label="Agents" className="flex lg:flex-col gap-2 overflow-x-auto">
  {agents.map(a=><button key={a.agent_key} onClick={()=>onChange(a.agent_key)} aria-current={value===a.agent_key?'true':undefined} className={`text-left rounded-lg border px-3 py-2 min-w-[180px] transition-colors ${value===a.agent_key?'border-primary bg-selection':'border-border bg-card hover:bg-hover'}`}>
   <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">{a.department}</span>
   <span className="block font-medium">{a.name}</span>
  </button>)}
  <p className="hidden lg:block text-xs text-muted-foreground px-1 pt-2">More departments can be added to the roster later.</p>
 </nav>;
}