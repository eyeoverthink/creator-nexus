import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Zap,
  Shield,
  Terminal,
  Copy,
  Check,
  Send,
  Layers,
  DollarSign,
  Code2,
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
  busy = '',
}) {
  const [activeTab, setActiveTab] = useState('pipelines'); // 'pipelines' | 'skills' | 'daemon'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlyZeroCost, setOnlyZeroCost] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  const filteredSkills = skills.filter((s) => {
    if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
    if (onlyZeroCost && !s.zero_llm_capable) return false;
    return true;
  });

  const totalMonthlySavings = skills.reduce((sum, s) => sum + (Number(s.savings_mo) || 0), 0);
  const zeroCostCount = skills.filter((s) => s.zero_llm_capable).length;

  const hermesUpgradePrompt = `You are Hermes running on srv1944678.hstgr.cloud (45.82.73.49 / Tailscale 100.110.6.44) & violet-kingfisher-586225.hostingersite.com.

Upgrade our /opt/fraymus/hermes_motor_worker.py and FastAPI Fleet Bridge to v2.0 so you operate with FULL SOLO AUTONOMY across both Base44 sites (https://nexus-create-sync.base44.app and https://fraymus-transmuter.base44.app) using your 29 local skills and subagent-driven-development:

1. In your polling loop against https://nexus-create-sync.base44.app/functions/openclawGateway, add:
   - {"action":"claim_dispatch_job","protocol":"ORIFICE-TXRX-V1.0","worker_node":"hermes-vps-primary (100.110.6.44)"}
   - When a job is claimed:
     a) If task_type == "hermes_subagent_pipeline": invoke 'hermes run "[Use skill: subagent-driven-development] ..."' with strict context budgets (context-budget-discipline.md) and quality gates (gates-taxonomy.md), then relay a DNA/Merkle receipt to https://fraymus-transmuter.base44.app/functions/fraymusComms.
     b) If task_type == "hermes_skill_exec" and "/script/exec" is specified: execute the direct Python/Bash/Node script inside ~/skills/ for $0.00 LLM cost.
     c) If task_type == "hermes_skill_exec" and "/agent/run" is specified: execute 'hermes run "[Use skill: <skill_id>] <directive>"'.
     d) If task_type in ("lora_training", "ollama_inference"): check http://100.88.61.56:11434/api/tags over Tailscale first; route to Windows GPU if awake, else fallback to http://localhost:11434.
   - Report the output via {"action":"complete_dispatch_job","protocol":"ORIFICE-TXRX-V1.0","job_id":job["job_id"],"worker_node":"hermes-vps-primary (100.110.6.44)","result_summary":output} so it is permanently archived in Base44 NexusAsset and GitHub eyeoverthink/fraymus-continuity/artifacts/<job_id>/.
2. Use your '1password' skill ('op run --') for scoped secret injection so skills-guard-v10 DANGEROUS/CAUTION flags stay isolated.
3. Restart fraymus-motor.service and run one live claim_dispatch_job cycle now.`;

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
              HERMES 29-SKILL FLEET + SUB-AGENT META-ORCHESTRATOR
            </span>
            <strong className="text-foreground text-xs">
              violet-kingfisher-586225 · srv1944678 (45.82.73.49 / Tailscale 100.110.6.44)
            </strong>
            <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold">
              ● Replaces ${totalMonthlySavings}/mo in SaaS · {zeroCostCount} Zero-LLM ($0.00) Scripts
            </span>
          </div>
          <p className="text-[10.5px] text-muted-foreground font-body">
            Hermes can spawn isolated sub-agents via <code>subagent-driven-development</code>, run{' '}
            <strong>$0.00 Zero-LLM-Cost</strong> direct scripts (<code>/script/exec</code>), and autonomously drive{' '}
            <strong>both Base44 sites</strong> (<code>Creator Nexus</code> ↔ <code>Fraymus Transmuter</code>) solo.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex items-center rounded border border-border bg-card p-0.5">
          {[
            ['pipelines', `Sub-Agent DAGs (${pipelines.length})`],
            ['skills', `All ${skills.length} Hermes Skills`],
            ['daemon', 'hermes_sovereign_v2.py + Upgrade Prompt'],
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
                <Bot size={13} /> 1-CLICK PROMPT FOR HERMES (SELF-UPGRADE WORKER TO V2.0)
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
              Paste this into Hermes on your VPS so he upgrades his own <code>/opt/fraymus/hermes_motor_worker.py</code> to pull <code>claim_dispatch_job</code>, spawn <code>subagent-driven-development</code> pipelines, and run <code>$0.00 /script/exec</code> tasks:
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