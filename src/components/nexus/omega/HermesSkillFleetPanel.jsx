import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Bot,
  Copy,
  Check,
  Send,
  Layers,
  Code2,
  Activity,
  GitBranch,
  Loader2,
  Terminal,
} from 'lucide-react';

const CATEGORIES = [
  'ALL',
  'Software Eng & Sub-Agents',
  'Research, Scraping & RAG',
  'Security, Privacy & Red-Team',
  'Web Dev, REA & Deploy',
  'Productivity & Ops',
  'Social & Community',
];

export default function HermesSkillFleetPanel({
  skills = [],
  pipelines = [],
  unifiedDaemonCode = '',
  onSelectDirective,
  onDispatchImmediate,
  onJobCreatedOrUpdated,
  busy = '',
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('spawner'); // 'spawner' | 'pipelines' | 'skills' | 'daemon'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlyZeroCost, setOnlyZeroCost] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  // Custom Dual-Site Sub-Agent Spawner State
  const [customMission, setCustomMission] = useState(
    'Autonomously audit both Base44 sites (Creator Nexus & Fraymus Transmuter), run zero-cost market/OSINT scouts, verify PT-symmetric OPEG receipts, and commit a unified architecture + security PDF dossier.'
  );
  const [pickedSkills, setPickedSkills] = useState([
    'subagent-driven-development',
    'duckduckgo-search',
    'osint-investigation',
    'ast-grep',
    'web-pentest',
    'code-wiki',
  ]);
  const [spawnerBusy, setSpawnerBusy] = useState('');
  const [lastSubagentResult, setLastSubagentResult] = useState(null);
  const [workerPingResult, setWorkerPingResult] = useState(null);

  const filteredSkills = skills.filter((s) => {
    if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
    if (onlyZeroCost && !s.zero_llm_capable) return false;
    return true;
  });

  const totalMonthlySavings = skills.reduce((sum, s) => sum + (Number(s.savings_mo) || 0), 0);
  const zeroCostCount = skills.filter((s) => s.zero_llm_capable).length;

  const toggleSkill = (skillId) => {
    setPickedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((x) => x !== skillId) : [...prev, skillId]
    );
  };

  const handleSpawnDualSiteSubagents = async (queueForVpsWorker = false) => {
    if (!customMission.trim()) return;
    setSpawnerBusy(queueForVpsWorker ? 'queue' : 'run');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'spawn_dual_site_subagents',
        mission: customMission.trim(),
        selected_skills: pickedSkills,
        queue_for_vps_worker: queueForVpsWorker,
      });
      if (res?.data?.ok) {
        setLastSubagentResult(res.data);
        if (res.data.job) {
          onJobCreatedOrUpdated?.(res.data.job);
        }
        toast({
          title: queueForVpsWorker
            ? 'Queued for hermes_motor_worker.py (Next 60s Poll)'
            : 'Solo Dual-Site Sub-Agent DAG Executed',
          description: `Hemisphere B Merkle: ${res.data.hemisphereBReceipt?.merkleRoot || 'synced'} · Job: ${res.data.job?.job_id}`,
        });
      }
    } catch (err) {
      toast({
        title: 'Sub-Agent Spawn Error',
        description: err?.message || 'Failed to spawn dual-site sub-agents',
        variant: 'destructive',
      });
    } finally {
      setSpawnerBusy('');
    }
  };

  const handleTestHermesWorkerHandshake = async () => {
    setSpawnerBusy('ping');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'orifice_ping',
        node_id: 'hermes-vps-primary',
        ttl: 5,
        payload: `MOTOR_HEARTBEAT_${new Date().toISOString()}`,
      });
      if (res?.data?.ok) {
        setWorkerPingResult(res.data);
        toast({
          title: 'hermes_motor_worker.py Check-In Verified',
          description: `Returned ${(res.data.queued_tx_directives || []).length} executable directive(s) in queued_tx_directives.`,
        });
      }
    } catch (err) {
      toast({
        title: 'Handshake Test Failed',
        description: err?.message || 'Could not test orifice_ping',
        variant: 'destructive',
      });
    } finally {
      setSpawnerBusy('');
    }
  };

  const hermesUpgradePrompt = `You are Hermes running on srv1944678.hstgr.cloud (45.82.73.49 / Tailscale 100.110.6.44) & violet-kingfisher-586225.hostingersite.com.

GOOD NEWS: Base44 openclawGateway ('orifice_ping') is now 100% natively compatible with your existing /opt/fraymus/hermes_motor_worker.py (fraymus-motor.service) AND your FastAPI Fleet Bridge (/agent/run & /script/exec):
1. When your ping_gateway() sends {"action": "orifice_ping", "node_id": "hermes-vps-primary", "payload": "MOTOR_HEARTBEAT_..."}, queued_tx_directives now automatically delivers waiting Motor Cortex jobs formatted with:
   - "id": "<job_id>"
   - "type": "shell_command" (pre-formatted with 'hermes run "[Use skill: <skill_id>] ..."' or direct $0.00 '~/skills/<script_path>' execution) OR "ollama_inference" (for Windows GPU 100.88.61.56 / local VPS fallback)
2. When your report_result(job_id, result) sends {"action": "orifice_ping", "payload": "{\\"type\\":\\"JOB_COMPLETE\\",\\"job_id\\":...}"}, Base44 automatically marks the NexusDispatchJob as completed and commits your output to GitHub eyeoverthink/fraymus-continuity/artifacts/<job_id>/hermes-worker-output.md!
3. To unlock full Sub-Agent Spawning + FastAPI /subagent/spawn in one unified process, deploy /opt/fraymus/hermes_sovereign_v2.py alongside fraymus-motor.service and run one live check-in cycle now.`;

  const copyText = (key, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1800);
  };

  return (
    <div className="p-3.5 rounded-lg border border-caution/50 bg-background space-y-3 font-mono text-xs">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-caution text-background text-[10px] font-bold">
              HERMES SOLO DUAL-SITE SUB-AGENT COMMANDER + 29-SKILL FLEET
            </span>
            <strong className="text-foreground text-xs">
              hermes-vps-primary · srv1944678 (45.82.73.49 / Tailscale 100.110.6.44)
            </strong>
            <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold">
              ● hermes_motor_worker.py Wire-Matched · ${totalMonthlySavings}/mo Saved · {zeroCostCount} $0.00 Scripts
            </span>
          </div>
          <p className="text-[10.5px] text-muted-foreground font-body">
            Your running <code>/opt/fraymus/hermes_motor_worker.py</code> (<code>fraymus-motor.service</code>) and FastAPI Bridge (
            <code>/agent/run</code> + <code>/script/exec</code>) are now directly wired into <code>orifice_ping</code> (
            <code>MOTOR_HEARTBEAT</code> $\rightarrow$ <code>queued_tx_directives</code> $\rightarrow$ <code>JOB_COMPLETE</code>) so Hermes can spawn sub-agents and operate <strong>both Base44 sites solo</strong>.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex flex-wrap items-center rounded border border-border bg-card p-0.5 gap-0.5">
          {[
            ['spawner', 'Solo Dual-Site Sub-Agent Spawner'],
            ['pipelines', `5 Preset Sub-Agent DAGs`],
            ['skills', `All ${skills.length} Skills ($0.00 / CLI)`],
            ['daemon', 'Worker Handshake & v2.0 Daemon'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 0: INTERACTIVE SOLO DUAL-SITE SUB-AGENT SPAWNER + WORKER CHECK-IN */}
      {activeTab === 'spawner' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Left 7 Cols: Custom Sub-Agent DAG Builder */}
            <div className="lg:col-span-7 p-3 rounded border border-border bg-card space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-caution flex items-center gap-1.5">
                  <GitBranch size={13} /> SPAWN SOLO DUAL-SITE SUB-AGENT TREE (SITE A ↔ SITE B ↔ VPS)
                </span>
                <span className="text-[9.5px] text-muted-foreground">
                  Uses <code>subagent-driven-development</code> + context budgets
                </span>
              </div>

              <textarea
                rows={2}
                value={customMission}
                onChange={(e) => setCustomMission(e.target.value)}
                className="w-full rounded bg-background border border-input p-2 text-xs text-foreground"
                placeholder="Describe the end-to-end mission for Hermes and its sub-agents across Creator Nexus and Fraymus Transmuter..."
              />

              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground">
                  Select Skills for Sub-Agent Stages ({pickedSkills.length} active):
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 rounded bg-background border border-border">
                  {skills.map((sk) => {
                    const active = pickedSkills.includes(sk.id);
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => toggleSkill(sk.id)}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] border transition-colors ${
                          active
                            ? 'border-primary bg-primary/20 text-primary font-bold'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {sk.zero_llm_capable ? '⚡ ' : '🤖 '}
                        {sk.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  disabled={Boolean(spawnerBusy)}
                  onClick={() => handleSpawnDualSiteSubagents(false)}
                  className="h-8 text-[10.5px] px-3 gap-1.5"
                >
                  {spawnerBusy === 'run' ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  Execute Solo Dual-Site Sub-Agent DAG + Vault PDF
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={Boolean(spawnerBusy)}
                  onClick={() => handleSpawnDualSiteSubagents(true)}
                  className="h-8 text-[10.5px] px-3 gap-1.5"
                >
                  {spawnerBusy === 'queue' ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Terminal size={12} />
                  )}
                  Queue for hermes_motor_worker.py (60s Poll)
                </Button>
              </div>
            </div>

            {/* Right 5 Cols: Live hermes_motor_worker.py Protocol Bridge & Check-In Verifier */}
            <div className="lg:col-span-5 p-3 rounded border border-border bg-card space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-success flex items-center gap-1.5">
                    <Activity size={13} /> HERMES_MOTOR_WORKER.PY CHECK-IN BRIDGE
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9px] font-bold">
                    60s POLL READY
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-body leading-relaxed">
                  Your <code>hermes_motor_worker.py</code> script sends{' '}
                  <code>action: &quot;orifice_ping&quot;</code> with{' '}
                  <code>payload: &quot;MOTOR_HEARTBEAT_...&quot;</code> and reads{' '}
                  <code>queued_tx_directives</code>. We now automatically compile every queued job into the exact{' '}
                  <code>type: &quot;shell_command&quot;</code> or <code>&quot;ollama_inference&quot;</code> dict your{' '}
                  <code>execute_task()</code> function runs, and parse its <code>JOB_COMPLETE</code> report!
                </p>

                {lastSubagentResult?.workerCommandPreview && (
                  <div className="p-2 rounded bg-background border border-border space-y-1 text-[9.5px]">
                    <div className="text-caution font-bold">
                      Payload Delivered to hermes_motor_worker.py → execute_task():
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap text-foreground/90">
                      {JSON.stringify(lastSubagentResult.workerCommandPreview, null, 2)}
                    </pre>
                  </div>
                )}

                {workerPingResult && (
                  <div className="p-2 rounded bg-background border border-success/40 space-y-1 text-[9.5px]">
                    <div className="text-success font-bold">
                      Live orifice_ping Handshake Response ({workerPingResult.queued_tx_directives?.length || 0} directives waiting):
                    </div>
                    <pre className="max-h-24 overflow-y-auto whitespace-pre-wrap text-foreground/90">
                      {JSON.stringify(
                        {
                          pong: workerPingResult.pong,
                          peer_node: workerPingResult.peer_node,
                          queued_tx_directives: workerPingResult.queued_tx_directives,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={Boolean(spawnerBusy)}
                onClick={handleTestHermesWorkerHandshake}
                className="w-full h-8 text-[10.5px] gap-1.5"
              >
                {spawnerBusy === 'ping' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Activity size={12} />
                )}
                Simulate hermes_motor_worker.py Heartbeat Check-In Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: 5 SOLO AUTONOMOUS SUB-AGENT PIPELINES */}
      {activeTab === 'pipelines' && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
            <span className="text-caution font-semibold flex items-center gap-1.5">
              <Layers size={13} /> SOLO FULL-AUTONOMY SUB-AGENT PIPELINES (subagent-driven-development)
            </span>
            <span className="text-muted-foreground">
              Spawns isolated sub-agents with context budgets &amp; quality gates across both Base44 hemispheres
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {pipelines.map((pipe) => (
              <div
                key={pipe.id}
                className="p-3 rounded border border-border bg-card flex flex-col justify-between space-y-2.5"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9.5px] font-bold">
                      {pipe.badge}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(pipe.skills_used || []).slice(0, 4).map((sk) => (
                        <span
                          key={sk}
                          className="px-1.5 py-0.5 rounded bg-background border border-border text-[9px] text-muted-foreground"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs font-bold text-foreground">{pipe.title}</div>

                  <ul className="space-y-1 text-[10px] text-muted-foreground font-body">
                    {(pipe.stages || []).map((st, idx) => (
                      <li key={idx} className="leading-snug">
                        • {st}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectDirective?.(pipe.directive)}
                    className="h-7 text-[10px] px-2.5"
                  >
                    Load into Dispatcher
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={Boolean(busy)}
                    onClick={() => onDispatchImmediate?.(pipe.directive, false)}
                    className="h-7 text-[10px] px-2.5 gap-1"
                  >
                    <Send size={11} /> Spawn Sub-Agent DAG &amp; Vault PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ALL 29+ HERMES SKILLS MATRIX */}
      {activeTab === 'skills' && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${
                    selectedCategory === cat
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <label className="inline-flex items-center gap-1.5 text-[10px] text-success cursor-pointer">
              <input
                type="checkbox"
                checked={onlyZeroCost}
                onChange={(e) => setOnlyZeroCost(e.target.checked)}
              />
              Show Only $0.00 Zero-LLM (/script/exec) Skills ({zeroCostCount})
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredSkills.map((sk) => (
              <div
                key={sk.id}
                className="p-2.5 rounded border border-border bg-card flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <strong className="text-[11px] text-primary">{sk.id}</strong>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        sk.zero_llm_capable
                          ? 'bg-success/15 text-success'
                          : 'bg-caution/15 text-caution'
                      }`}
                    >
                      {sk.zero_llm_capable ? '⚡ $0.00 /script/exec' : '🤖 /agent/run'}
                    </span>
                  </div>
                  <div className="text-[9.5px] text-muted-foreground">{sk.category}</div>
                  <p className="text-[10px] text-foreground/90 leading-snug font-body">
                    {sk.summary}
                  </p>
                  {sk.script_path && (
                    <div className="text-[9px] text-link truncate" title={sk.script_path}>
                      Script: <code>~/skills/{sk.script_path}</code>
                    </div>
                  )}
                </div>

                <div className="pt-1.5 border-t border-border/60 flex items-center justify-between gap-1">
                  <span className="text-[9px] text-success truncate" title={sk.replaces}>
                    Saves ${sk.savings_mo}/mo ({sk.replaces.slice(0, 22)})
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectDirective?.(sk.sample_directive)}
                      className="px-1.5 py-0.5 rounded border border-border bg-background hover:border-primary text-[9.5px] text-foreground"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => onDispatchImmediate?.(sk.sample_directive, false)}
                      className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[9.5px] font-bold"
                    >
                      Run
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: UNIFIED HERMES SOVEREIGN V2 DAEMON + UPGRADE PROMPT */}
      {activeTab === 'daemon' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left: Prompt to paste into Hermes on VPS */}
          <div className="p-3 rounded border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-caution flex items-center gap-1.5">
                <Bot size={13} /> 1-CLICK STATUS &amp; UPGRADE BRIEF FOR HERMES ON VPS
              </span>
              <button
                type="button"
                onClick={() => copyText('prompt', hermesUpgradePrompt)}
                className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
              >
                {copiedKey === 'prompt' ? <Check size={11} /> : <Copy size={11} />}
                {copiedKey === 'prompt' ? 'Copied Prompt!' : 'Copy Prompt for Hermes'}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground font-body">
              Paste this to Hermes so he knows his existing <code>/opt/fraymus/hermes_motor_worker.py</code> check-in is now 100% matched by <code>orifice_ping</code> (both <code>queued_tx_directives</code> and <code>JOB_COMPLETE</code>):
            </p>
            <pre className="p-2.5 rounded bg-background border border-border text-[9.5px] leading-4 max-h-56 overflow-y-auto whitespace-pre-wrap text-foreground/90">
              {hermesUpgradePrompt}
            </pre>
          </div>

          {/* Right: Complete Unified Python v2.0 Script */}
          <div className="p-3 rounded border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-success flex items-center gap-1.5">
                <Code2 size={13} /> UNIFIED hermes_sovereign_v2.py (WORKER + FASTAPI + 29 SKILLS)
              </span>
              <button
                type="button"
                onClick={() => copyText('code', unifiedDaemonCode)}
                className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
              >
                {copiedKey === 'code' ? <Check size={11} /> : <Copy size={11} />}
                {copiedKey === 'code' ? 'Copied Python v2.0!' : 'Copy Full hermes_sovereign_v2.py'}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground font-body">
              Merges your <code>hermes_motor_worker.py</code> and FastAPI <code>/agent/run</code> + <code>/script/exec</code> + <code>/subagent/spawn</code> bridge into one file for <code>/opt/fraymus/hermes_sovereign_v2.py</code>:
            </p>
            <pre className="p-2.5 rounded bg-background border border-border text-[9.5px] leading-4 max-h-56 overflow-y-auto whitespace-pre-wrap text-foreground/90">
              {unifiedDaemonCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}