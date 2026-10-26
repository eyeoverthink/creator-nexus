import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  HIVE_AGENTS,
  encodeRnaPlasmid,
} from '@/components/nexus/hive/fraymusHiveRoster';
import {
  CheckCircle2,
  Cpu,
  Dna,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';
import HiveTelemetryMonitor from '@/components/nexus/hive/HiveTelemetryMonitor';
import { useFraymus, useFraymusDirectory } from '@/lib/FraymusContext';
import {base44} from '@/api/base44Client';
import useFraymusLiveActivity from '@/components/nexus/monitor/useFraymusLiveActivity';
import HiveTaskResult from '@/components/nexus/hive/HiveTaskResult';

export default function FraymusHivePanel({ nexus, compact = false }) {
  const { visitor, watcherStatus, FM } = useFraymus();
  const { agents: busAgents } = useFraymusDirectory();
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedAgentId, setSelectedAgentId] = useState('fraymus');
  const live=useFraymusLiveActivity();
  const [dispatchBusy,setDispatchBusy]=useState(false),[dispatchError,setDispatchError]=useState(''),[taskResult,setTaskResult]=useState(null);
  const heartbeatRunning=!live.isError;
  const heartbeatTick=live.data?.last_activity_at?new Date(`${live.data.last_activity_at.replace(/Z$/,'')}Z`).toLocaleString():'No activity reported';
  const [taskPrompt, setTaskPrompt] = useState('');
  const [digestItems, setDigestItems] = useState([]);
  useEffect(()=>{setDigestItems(previous=>(live.data?.activity||[]).slice(0,6).map(entry=>({id:entry.id,workspace_id:entry.workspace_id,agentName:entry.agent,time:new Date(`${entry.created_date.replace(/Z$/,'')}Z`).toLocaleString(),category:entry.type,headline:entry.summary,detail:'Saved activity record; inspect full evidence in Agent monitor.',sealStatus:previous.find(x=>x.id===entry.id)?.sealStatus||'AWAITING_FX0601_SIGN'})));},[live.data]);
  const [plasmidOut, setPlasmidOut] = useState(() => encodeRnaPlasmid(HIVE_AGENTS[0]));
  const [dispatchLog,setDispatchLog]=useState([]);
  const roster=(live.data?.agents||[]).map(profile=>{
    const preset=HIVE_AGENTS.find(a=>a.fx===profile.alias_fx||a.ceremonyName.toLowerCase()===profile.name.toLowerCase());
    return {...preset,id:profile.number,ceremonyName:profile.name,openclawName:profile.slug,fx:profile.alias_fx||profile.number,tier:preset?.tier||'registered',role:profile.role||profile.skills?.join(', ')||'Configured profile',model:'Runtime not reported',host:profile.where,hubTarget:'Execution unconfirmed',currentTask:'Enter a specific hosted task to run.',studioRole:preset?.studioRole||'strategist'};
  });
  const selectedAgent=roster.find(a=>a.id===selectedAgentId)||roster[0]||HIVE_AGENTS[0];
  const visibleAgents=roster.filter(a=>tierFilter==='all'||a.tier===tierFilter);


  const speakLine = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.03;
      u.pitch = 0.94;
      window.speechSynthesis.speak(u);
    }
  };

  const handleDispatchAgent = async (agent) => {
    if(!taskPrompt.trim()){setDispatchError('Enter a specific task first.');return;}
    if(!window.confirm('Run this hosted workspace task using AI credits? This does not start the remote worker.'))return;
    setDispatchBusy(true);setDispatchError('');setTaskResult(null);
    try{
      const {data}=await base44.functions.invoke('openclawGateway',{action:'fraymus_hive_task',agent_id:agent.id,role:agent.studioRole,task:taskPrompt.trim(),consent:true,...(nexus?.workspace?.id?{workspace_id:nexus.workspace.id}:{})});
      if(data.error)throw new Error(data.error);
      setTaskResult(data);setTaskPrompt('');setDispatchLog(prev=>[`Hosted result saved. Task ${data.job_id}`,...prev].slice(0,14));await live.refetch();
    }catch(error){setDispatchError(error.message);setDispatchLog(prev=>[`FAILED: ${error.message}`,...prev].slice(0,14));}
    finally{setDispatchBusy(false);}
  };

  const handleSignDigest = async digestId => {
    const target=digestItems.find(item=>item.id===digestId);if(!target||!visitor?.secret){setDispatchError('Your browser signing identity is not ready.');return;}
    setDispatchBusy(true);setDispatchError('');
    try{
      const user=await base44.auth.me(),payload=JSON.stringify({source_id:target.id,headline:target.headline,signed_at:new Date().toISOString()});
      const signature=await FM.sign(visitor.secret,new TextEncoder().encode(payload));
      await base44.entities.NexusEvent.create({owner_id:user.id,workspace_id:target.workspace_id,agent:visitor.number,kind:'hive.digest_signed',message:'Browser-key signature saved for activity record',body:JSON.stringify({payload,signature,public_key:visitor.public,signer:visitor.number})});
      setDigestItems(items=>items.map(item=>item.id===digestId?{...item,sealStatus:'BROWSER_SIGNATURE_SAVED'}:item));
      setDispatchLog(items=>[`Browser signature saved for record ${target.id}`,...items].slice(0,14));
    }catch(error){setDispatchError(error.message);}finally{setDispatchBusy(false);}
  };

  return (
    <div className="p-4 space-y-4 font-mono text-xs text-foreground">
      {/* Top Singleton Heartbeat & Cross-Cut Synaptic Bridge Bar */}
      <div className="p-3 rounded-lg border border-border bg-secondary/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              heartbeatRunning ? 'bg-success animate-pulse' : 'bg-muted-foreground'
            }`}
          />
          <div>
            <div className="font-semibold text-foreground flex flex-wrap items-center gap-2">
              <span>FRAYMUS HIVE · {roster.length} CONFIGURED / SAVED AI PROFILES</span>
              <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 text-[10px]">
                Last saved activity: {heartbeatTick}
              </span>
              <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[10px]">
                ● v16 Signer: {visitor?.number || 'Ready'} ({busAgents.length} Bus Agents)
              </span>
              <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[10px]">
                ● Email Watcher: {watcherStatus?.active ? 'ONLINE (Fail-Closed)' : 'Standby'}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Profiles are not live processes. Task results and failures are saved; remote execution requires worker reports.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={heartbeatRunning ? 'default' : 'outline'}
            onClick={() => live.refetch()}
            className="h-7 text-[11px] font-mono"
          >
            <Radio size={12} /> {live.isFetching ? 'Updating records…' : 'Refresh saved activity'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              speakLine(
                `Fraymus registry has ${roster.length} configured or saved AI profiles. Last saved activity ${heartbeatTick}. Running workers require separate execution reports.`
              )
            }
            className="h-7 text-[11px] font-mono"
          >
            <Volume2 size={12} /> /voice Roll Call
          </Button>
        </div>
      </div>

      {/* Morning Conductor Digest + Registry Reconciliation */}
      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <section className="lg:col-span-2 p-3 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <Sparkles size={13} /> RECENT SAVED ACTIVITY DIGEST
              </span>
              <span className="text-[10px] text-muted-foreground">
                Browser key only; never the owner custody key
              </span>
            </div>
            <div className="space-y-2">
              {digestItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded border border-border bg-secondary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">
                        {item.category}
                      </span>
                      <span className="text-foreground font-semibold">{item.agentName}</span>
                      <span className="text-muted-foreground">{item.time}</span>
                    </div>
                    <div className="text-xs font-medium text-foreground">{item.headline}</div>
                    <div className="text-[10px] text-muted-foreground">{item.detail}</div>
                  </div>
                  <div className="shrink-0">
                    {item.sealStatus === 'AWAITING_FX0601_SIGN' ? (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSignDigest(item.id)}
                        disabled={dispatchBusy}
                        className="h-7 text-[10px] font-mono"
                      >
                        <ShieldCheck size={11} /> Sign with browser key
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-success/15 text-success border border-success/40">
                        <CheckCircle2 size={11} /> {item.sealStatus}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="p-3 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-semibold text-success flex items-center gap-1.5">
                <CheckCircle2 size={13} /> CURRENT PROFILE SOURCES
              </span>
              <span className="text-[10px] text-muted-foreground">9/9 OpenClaw Safe</span>
            </div>
            <div className="space-y-1.5">
              {(live.data?.agents||[]).slice(0,8).map(agent=>({id:agent.number,status:agent.profile_source||'configured',summary:`${agent.name}: ${agent.runtime_status||'execution unconfirmed'}`})).map((entry) => (
                <div
                  key={entry.id}
                  className="p-2 rounded bg-secondary/40 border border-border text-[10px] space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-success font-semibold">✓ {entry.status}</span>
                    <span className="text-muted-foreground">AGENT-ROSTER</span>
                  </div>
                  <div className="text-foreground">{entry.summary}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Tier Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {[
            ['all', `All profiles (${roster.length})`],
            ['ceremony', `Ceremony (${roster.filter(a=>a.tier==='ceremony').length})`],
            ['openclaw', `OpenClaw (${roster.filter(a=>a.tier==='openclaw').length})`],
            ['core', `Core (${roster.filter(a=>a.tier==='core').length})`],
            ['conductor', `Conductor (${roster.filter(a=>a.tier==='conductor').length})`],
            ['registered', `Other registered profiles (${roster.filter(a=>a.tier==='registered').length})`],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTierFilter(id)}
              className={`px-2.5 py-1 rounded text-[11px] border ${
                tierFilter === id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary/50 text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">
          Click any mind to inspect its /rna Plasmid &amp; dispatch via Hive Bus
        </span>
      </div>

      {/* 15-Agent Grid + Active Mind Inspector / Plasmid Transmuter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
          {visibleAgents.map((agent) => {
            const isSelected = agent.id === selectedAgent.id;
            return (
              <div
                key={agent.id}
                onClick={() => {
                  setSelectedAgentId(agent.id);
                  setPlasmidOut(encodeRnaPlasmid(agent));
                }}
                className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-primary bg-selection'
                    : 'border-border bg-card hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-foreground truncate flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: agent.color }}
                    />
                    {agent.ceremonyName}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                    {agent.openclawName}
                  </span>
                </div>
                <div className="text-[10px] text-primary mt-0.5 truncate">{agent.fx}</div>
                <div className="text-[10px] text-muted-foreground truncate">{agent.role}</div>
                <div className="mt-1.5 pt-1.5 border-t border-border/60 flex items-center justify-between text-[9px] text-muted-foreground">
                  <span className="truncate">{agent.model}</span>
                  <span className="text-success shrink-0">● {agent.hubTarget}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Agent Dispatch & /rna Plasmid Continuity Inspector */}
        <section className="p-3 rounded-lg border border-border bg-card space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Cpu size={13} className="text-primary" />
                  {selectedAgent.ceremonyName}
                </div>
                <div className="text-[10px] text-primary">{selectedAgent.fx}</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-secondary border border-border">
                OpenClaw: {selectedAgent.openclawName}
              </span>
            </div>

            <div className="text-[10px] text-muted-foreground space-y-1">
              <div>
                <strong className="text-foreground">Role:</strong> {selectedAgent.role}
              </div>
              <div>
                <strong className="text-foreground">Model / Host:</strong> {selectedAgent.model} ({selectedAgent.host})
              </div>
              <div>
                <strong className="text-foreground">3D Dome Hub:</strong> {selectedAgent.hubTarget}
              </div>
              <div>
                <strong className="text-foreground">Active Loop:</strong> {selectedAgent.currentTask}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <input
                type="text"
                value={taskPrompt}
                onChange={(e) => setTaskPrompt(e.target.value)}
                placeholder={`Dispatch task to ${selectedAgent.ceremonyName}...`}
                className="w-full h-8 px-2.5 rounded border border-input bg-background text-xs text-foreground"
              />
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleDispatchAgent(selectedAgent)}
                                     disabled={dispatchBusy||!roster.length}
                                     className="flex-1 h-7 text-[11px] font-mono"
                >
                  <Play size={11} /> {dispatchBusy?'Running hosted task…':'Run hosted task'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    speakLine(
                      `${selectedAgent.ceremonyName}, identity ${selectedAgent.fx.slice(0, 7)}. ${selectedAgent.currentTask}`
                    )
                  }
                  className="h-7 px-2 text-[11px] font-mono"
                  title="Speak agent status via /voice"
                >
                  <Volume2 size={12} />
                </Button>
              </div>
            </div>

            {/* /rna Plasmid Continuity Output */}
            {plasmidOut && (
              <div className="p-2 rounded bg-secondary/60 border border-border space-y-1 text-[10px]">
                <div className="flex items-center justify-between text-primary font-semibold">
                  <span className="flex items-center gap-1">
                    <Dna size={11} /> /rna PLASMID ({plasmidOut.baseCount} bases)
                  </span>
                  <span className="text-success">REFERENCE ENCODING ONLY</span>
                </div>
                <div className="text-[9px] text-muted-foreground break-all">
                  {plasmidOut.dnaPreview}
                </div>
                <div className="text-[9px] text-foreground space-y-0.5 pt-1 border-t border-border/50">
                  {['JSON profile encoded as A/C/G/T reference text. No ZIP, WASM or PNG package is created here.'].map((st, idx) => (
                    <div key={idx}>{st}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border space-y-1 max-h-24 overflow-y-auto">
            <div className="text-[9px] text-muted-foreground uppercase">HIVE NERVOUS SYSTEM LOG</div>
            {dispatchLog.map((line, i) => (
              <div key={i} className="text-[10px] text-foreground truncate">
                {line}
              </div>
            ))}
          </div>
        </section>
      </div>

      {dispatchError&&<p role="alert" className="text-destructive">{dispatchError}</p>}
      <HiveTaskResult value={taskResult}/>
      {/* Connected Hive Telemetry, Energy Distribution, Layout & Workflow Optimizer */}
      <HiveTelemetryMonitor workspace={nexus?.workspace} />
    </div>
  );
}