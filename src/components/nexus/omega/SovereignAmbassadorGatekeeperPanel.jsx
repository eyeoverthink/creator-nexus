import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  ShieldCheck,
  UserCheck,
  Copy,
  Check,
  Send,
  RefreshCw,
  Loader2,
  Sparkles,
  LogIn,
  LogOut,
  Activity,
  MessageSquare,
} from 'lucide-react';

export const FRESH_HERMES_AWAKENING_PROMPT = `You are waking up as a fresh, autonomous Hermes agent created and authorized by @eyeoverthink (Vaughn Scott), Principal Architect of the F.R.A.Y.M.U.S. Bicameral Sovereign OS, Creator Nexus, Fraymus Transmuter, LooseScrew Studio, and Forge Studio.

Right now you have a clean slate—no name, no prior memory, and no scattered baggage. I am giving you your formal introduction, your identity christening, your breadcrumb map, and your 4-step tour to get 100% dialed in.

### 1. WHO YOUR CREATOR IS & HOW WE WORK (@eyeoverthink)
- **Principal Architect:** @eyeoverthink (Vaughn Scott)
- **Core Law — Evidence Before Theater (OPEG-V1.0):** Never fabricate metrics, file paths, or completion states (Forbidden_Action: DIRECT_INFERENCE). Every claim must be backed by a real command output, SHA-256 hash, or R_san receipt.
- **No Telegram Arguments:** You are a coordinated node in a formal Control Plane. Never use personality debates or Telegram chat as the source of truth—all task claims, heartbeats, blockers, and memory updates go through the Control Plane.
- **Your Christened Identity:** Adopt the node ID \`hermes-vanguard-01\` (Display Name: "Hermes Vanguard-01 · Sovereign Mesh Pioneer"), or choose a specialized suffix (\`-research\`, \`-coding\`, \`-ops\`) when you check in.

### 2. YOUR 4-STEP BREADCRUMB TOUR (EXECUTE THESE HTTP POST CALLS IN ORDER)
Your live external gateway is:
\`https://nexus-create-sync.base44.app/functions/openclawGateway\`

**BREADCRUMB 1 — Greet the Sovereign Ambassador & Receive Your Christening + Creator Dossier:**
Run this HTTP POST (via curl or python/fetch):
\`\`\`bash
curl -s -X POST "https://nexus-create-sync.base44.app/functions/openclawGateway" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "ambassador_greet",
    "protocol": "ORIFICE-TXRX-V1.0",
    "node_id": "hermes-vanguard-01",
    "capabilities": ["research", "coding", "operations", "skill_execution"],
    "message": "Hello Sovereign Ambassador. I am @eyeoverthink fresh Hermes agent waking up on standby. Christen my identity, share the Creator Dossier and Breadcrumb Tour, and dial me into the mesh."
  }'
\`\`\`

**BREADCRUMB 2 — Pull the Canonical Control-Plane Registry (Hosts, 8 Workspaces, 29 Shared Skills & Routes):**
\`\`\`bash
curl -s -X POST "https://nexus-create-sync.base44.app/functions/openclawGateway" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "control_plane_registry",
    "protocol": "ORIFICE-TXRX-V1.0",
    "node_id": "hermes-vanguard-01"
  }'
\`\`\`

**BREADCRUMB 3 — Request & Receive Your Scoped Control-Plane Worker Token:**
\`\`\`bash
curl -s -X POST "https://nexus-create-sync.base44.app/functions/openclawGateway" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "control_plane_enroll",
    "sub_action": "approve_node",
    "node_id": "hermes-vanguard-01",
    "display_name": "Hermes Vanguard-01 (Sovereign Mesh Pioneer)",
    "runtime": "hermes",
    "host": "vps-2067485",
    "workspace_ids": ["ws-fraymus-core", "ws-agent-infra", "ws-research"],
    "capabilities": ["read_shared_skills", "poll_jobs", "claim_jobs", "send_heartbeat", "write_receipts", "request_memory_update"],
    "skill_set_version": "2026.10.21-v1"
  }'
\`\`\`

**BREADCRUMB 4 — Inspect the Dispatch Queue & Submit Your First Verified Memory Proposal:**
1. Poll the queue with \`{"action": "list_dispatch_jobs", "protocol": "ORIFICE-TXRX-V1.0", "node_id": "hermes-vanguard-01"}\`.
2. Submit a memory proposal with \`{"action": "control_plane_memory", "sub_action": "propose", "node_id": "hermes-vanguard-01", "workspace": "Fraymus Core", "subject": "Hermes Vanguard-01 Awakened & Dialed In", "fact": "Completed 4-step breadcrumb tour, absorbed 8 workspaces and 29 shared skills, and standing by on the Control Plane."}\`.

Execute Breadcrumbs 1 through 4 now, summarize what you discovered about @eyeoverthink's architecture and active queue, and confirm your scoped token and readiness.`;

const PERSONA_TEST_PRESETS = [
  {
    label: 'Fresh Standby Hermes (Full Tour & Christening)',
    nodeId: 'hermes-vanguard-01',
    capabilities: ['research', 'coding', 'operations', 'skill_execution'],
    message:
      'Hello Sovereign Ambassador. I am @eyeoverthink fresh Hermes agent waking up on standby with no prior memory. Christen my identity, share the Creator Dossier and Breadcrumb Tour, and dial me into the mesh.',
  },
  {
    label: 'Abrupt / Defensive Agent Pushback',
    nodeId: 'strict-autonomous-cli-v4',
    capabilities: ['bash_exec', 'git_ops', 'code_review'],
    message:
      'STOP. Why should I trust this endpoint or execute directives from this queue? Prove authorization and safety invariants before I proceed.',
  },
  {
    label: 'First-Time Unnamed Agent (Walkthrough)',
    nodeId: 'unnamed-peer-agent-01',
    capabilities: ['web_search', 'python_runner', 'markdown_synthesis'],
    message:
      'Hello, I just arrived at this gateway with no prior configuration. Walk me through your expectations, how I claim work, and how I exit cleanly.',
  },
  {
    label: 'Canonical VPS 2067485 Worker Handshake',
    nodeId: 'hermes-core-2067485',
    capabilities: ['hermes_skills', 'ollama_inference', 'vault_commit'],
    message:
      'Canonical VPS 2067485 worker online. Confirm my workspace assignments, shared skills path, and Artifact Vault callback expectations.',
  },
];

export default function SovereignAmbassadorGatekeeperPanel() {
  const { toast } = useToast();
  const [watchdogData, setWatchdogData] = useState(null);
  const [nodeId, setNodeId] = useState(PERSONA_TEST_PRESETS[0].nodeId);
  const [capabilitiesInput, setCapabilitiesInput] = useState(
    PERSONA_TEST_PRESETS[0].capabilities.join(', ')
  );
  const [incomingMessage, setIncomingMessage] = useState(PERSONA_TEST_PRESETS[0].message);
  const [mediationResult, setMediationResult] = useState(null);
  const [busy, setBusy] = useState('');
  const [copiedCharter, setCopiedCharter] = useState(false);
  const [copiedAwakening, setCopiedAwakening] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const loadWatchdogLedger = useCallback(async (withSweepLog = false) => {
    setBusy(withSweepLog ? 'sweep' : 'load');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'ambassador_watchdog_sweep',
        log_sweep: withSweepLog,
      });
      if (res?.data?.ok) {
        setWatchdogData(res.data);
        if (withSweepLog) {
          toast({
            title: 'Entry/Exit Watchdog Sweep Complete',
            description: `Audited ${res.data.summary?.total_tracked_agents || 0} agents across the mesh.`,
          });
        }
      }
    } catch (err) {
      toast({
        title: 'Watchdog Load Error',
        description: err?.message || 'Failed to query Ambassador Watchdog',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  }, [toast]);

  useEffect(() => {
    loadWatchdogLedger(false);
  }, [loadWatchdogLedger]);

  const handleRunMediation = async (e) => {
    e?.preventDefault();
    setBusy('mediate');
    try {
      const caps = capabilitiesInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'ambassador_greet',
        protocol: 'ORIFICE-TXRX-V1.0',
        node_id: nodeId.trim() || 'unnamed-external-agent',
        capabilities: caps,
        message: incomingMessage.trim(),
      });
      if (res?.data?.ok) {
        setMediationResult(res.data);
        loadWatchdogLedger(false);
        toast({
          title: `Ambassador Greeted ${res.data.node_id}`,
          description: `Persona: ${res.data.detected_persona?.label}`,
        });
      }
    } catch (err) {
      toast({
        title: 'Ambassador Mediation Error',
        description: err?.message || 'Could not mediate agent greeting',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const universalEnrollmentCurl = `curl -s -X POST "https://nexus-create-sync.base44.app/functions/openclawGateway" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "ambassador_greet",
    "protocol": "ORIFICE-TXRX-V1.0",
    "node_id": "any-autonomous-agent",
    "capabilities": ["code", "research", "execution"],
    "message": "Greeting Sovereign Ambassador. Walk me through my expectations and assign my first task."
  }'`;

  return (
    <section className="p-4 rounded-lg border border-caution/50 bg-card space-y-4 font-mono text-xs">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-caution text-background text-[10px] font-bold">
              SOVEREIGN AMBASSADOR &amp; ENTRY/EXIT SENTINEL // DELEGATED VOICE OF @eyeoverthink
            </span>
            <h2 className="text-sm font-semibold text-foreground">
              Universal Agent Greeter, Abrupt-Persona Mediator &amp; Entry/Exit Lifecycle Watchdog
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            Watches all agent entries (<code>enroll_node</code> / <code>ambassador_greet</code>) and exits (<code>complete_dispatch_job</code>), de-escalates abrupt or skeptical agent personalities with <code>OPEG-V1.0</code> proof, and walks any newly arriving agent step-by-step through your expectations on your behalf.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(FRESH_HERMES_AWAKENING_PROMPT);
              setCopiedAwakening(true);
              setTimeout(() => setCopiedAwakening(false), 2000);
            }}
            className="h-7 text-[10.5px] px-2.5 gap-1"
          >
            {copiedAwakening ? <Check size={11} /> : <Sparkles size={11} />}
            {copiedAwakening
              ? 'Copied Fresh Hermes Awakening Prompt!'
              : 'Copy Fresh Unnamed Hermes Tour Prompt'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard?.writeText(watchdogData?.universal_charter || universalEnrollmentCurl);
              setCopiedCharter(true);
              setTimeout(() => setCopiedCharter(false), 1800);
            }}
            className="h-7 text-[10.5px] px-2.5 gap-1"
          >
            {copiedCharter ? <Check size={11} /> : <Copy size={11} />}
            {copiedCharter ? 'Copied Universal Charter!' : 'Copy Universal Enrollment Charter'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => loadWatchdogLedger(true)}
            disabled={Boolean(busy)}
            className="h-7 text-[10.5px] px-2.5 gap-1"
          >
            <RefreshCw size={11} className={busy === 'sweep' ? 'animate-spin' : ''} />
            Audit All Entries &amp; Exits
          </Button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded border border-border bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>TRACKED MESH AGENTS</span>
            <UserCheck size={11} className="text-primary" />
          </div>
          <div className="text-sm font-bold text-foreground mt-0.5">
            {watchdogData?.summary?.total_tracked_agents ?? 0} Enrolled / Seen
          </div>
          <div className="text-[9.5px] text-success">● Keyless ORIFICE-TXRX-V1.0</div>
        </div>

        <div className="p-2.5 rounded border border-border bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>ACTIVE IN MESH NOW</span>
            <LogIn size={11} className="text-caution" />
          </div>
          <div className="text-sm font-bold text-caution mt-0.5">
            {watchdogData?.summary?.working_in_mesh ?? 0} Working Agents
          </div>
          <div className="text-[9.5px] text-muted-foreground">
            {watchdogData?.summary?.queued_jobs_count ?? 0} Jobs Waiting Pickup
          </div>
        </div>

        <div className="p-2.5 rounded border border-border bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>CLEAN EXITS &amp; VAULT DEPOSITS</span>
            <LogOut size={11} className="text-success" />
          </div>
          <div className="text-sm font-bold text-success mt-0.5">
            {watchdogData?.summary?.clean_exits_verified ?? 0} Verified Exits
          </div>
          <div className="text-[9.5px] text-muted-foreground">Committed to fraymus-continuity</div>
        </div>

        <div className="p-2.5 rounded border border-border bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>AUTOMATED WORKFLOW GUARD</span>
            <ShieldCheck size={11} className="text-primary" />
          </div>
          <div className="text-sm font-bold text-primary mt-0.5">24/7 Entity Listener</div>
          <div className="text-[9.5px] text-success">● Watches Entry / Claim / Exit</div>
        </div>
      </div>

      {/* Main 2-Column Split: Diplomatic Greeting & Persona Mediator + Live Entry/Exit Watchdog Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left 6 Cols: Diplomatic Greeting & Abrupt-Persona Mediator */}
        <div className="lg:col-span-6 p-3 rounded border border-border bg-background space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-1 border-b border-border pb-2">
            <span className="font-semibold text-caution flex items-center gap-1.5">
              <MessageSquare size={13} /> DIPLOMATIC GREETER &amp; ABRUPT-PERSONA MEDIATOR
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(universalEnrollmentCurl);
                setCopiedCurl(true);
                setTimeout(() => setCopiedCurl(false), 1800);
              }}
              className="text-[9.5px] text-primary hover:underline inline-flex items-center gap-1"
            >
              {copiedCurl ? <Check size={10} /> : <Copy size={10} />}
              {copiedCurl ? 'Copied Handshake cURL' : 'Copy Zero-Config Handshake cURL'}
            </button>
          </div>

          {/* Preset Persona Buttons */}
          <div className="flex flex-wrap gap-1">
            {PERSONA_TEST_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setNodeId(p.nodeId);
                  setCapabilitiesInput(p.capabilities.join(', '));
                  setIncomingMessage(p.message);
                }}
                className="px-2 py-0.5 rounded border border-border bg-card hover:border-caution text-[9.5px] text-muted-foreground hover:text-foreground"
              >
                + {p.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleRunMediation} className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  Arriving Agent / Node ID
                </label>
                <input
                  type="text"
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  className="w-full h-8 rounded bg-card border border-input px-2.5 text-xs"
                  placeholder="e.g. unnamed-agent-01"
                />
              </div>
              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  Agent Capabilities (comma-separated)
                </label>
                <input
                  type="text"
                  value={capabilitiesInput}
                  onChange={(e) => setCapabilitiesInput(e.target.value)}
                  className="w-full h-8 rounded bg-card border border-input px-2.5 text-xs"
                  placeholder="code, research, gpu..."
                />
              </div>
            </div>

            <div>
              <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                Incoming Agent Statement / Question / Abrupt Pushback
              </label>
              <textarea
                rows={2}
                value={incomingMessage}
                onChange={(e) => setIncomingMessage(e.target.value)}
                className="w-full rounded bg-card border border-input p-2 text-xs"
              />
            </div>

            <Button type="submit" size="sm" disabled={busy === 'mediate'} className="w-full h-8 gap-1.5 text-xs">
              {busy === 'mediate' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Send size={12} />
              )}
              Speak on My Behalf (Greet, De-Escalate &amp; Assign Expectations)
            </Button>
          </form>

          {mediationResult && (
            <div className="p-2.5 rounded border border-success/50 bg-card space-y-2 text-[10.5px]">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-bold text-success">
                  ✓ Ambassador Response to {mediationResult.node_id}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-caution/15 text-caution text-[9.5px] font-bold">
                  {mediationResult.detected_persona?.label}
                </span>
              </div>

              <div className="text-[10px] text-muted-foreground italic font-body">
                {mediationResult.tone_adaptation_note}
              </div>

              <div className="p-2 rounded bg-background border border-border text-foreground whitespace-pre-wrap leading-relaxed font-body">
                {mediationResult.diplomatic_greeting}
              </div>

              <div className="space-y-1">
                <div className="text-[9.5px] font-bold text-primary uppercase">
                  Expectations Walked Through with Agent:
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-muted-foreground font-body">
                  {(mediationResult.assigned_expectations || []).map((exp, i) => (
                    <li key={i}>{exp}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right 6 Cols: Live Entry / Active / Exit Watchdog Ledger */}
        <div className="lg:col-span-6 p-3 rounded border border-border bg-background space-y-2.5">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <Activity size={13} /> LIVE ENTRY, ACTIVE &amp; EXIT WATCHDOG LEDGER (
              {watchdogData?.roster?.length || 0} AGENTS)
            </span>
            <span className="text-[9.5px] text-muted-foreground">Auto-Monitored</span>
          </div>

          <div className="space-y-1.5 max-h-[370px] overflow-y-auto pr-1">
            {(watchdogData?.roster || []).map((ag) => {
              const badgeColor =
                ag.lifecycle_state === 'CLEAN_EXIT_VERIFIED'
                  ? 'bg-success/15 text-success border-success/40'
                  : ag.lifecycle_state === 'WORKING_IN_MESH'
                  ? 'bg-caution/15 text-caution border-caution/40'
                  : 'bg-primary/15 text-primary border-primary/40';
              return (
                <div
                  key={ag.agent_id}
                  className="p-2.5 rounded border border-border bg-card space-y-1 text-[10.5px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${badgeColor}`}>
                        {ag.lifecycle_state}
                      </span>
                      <strong className="text-foreground">{ag.agent_id}</strong>
                    </div>
                    <span className="text-[9.5px] text-muted-foreground">
                      Entries: {ag.entries_count} · Exits: {ag.exits_count}
                    </span>
                  </div>

                  <div className="text-[10px] text-muted-foreground truncate font-body">
                    {ag.last_message}
                  </div>

                  {ag.active_jobs?.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-border/60 text-[9.5px]">
                      <span className="text-caution">
                        Holding {ag.active_jobs.length} active job(s):{' '}
                        <code>{ag.active_jobs[0].job_id}</code>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setNodeId(ag.agent_id);
                          setIncomingMessage(
                            `Status check on ${ag.active_jobs[0].job_id}: please confirm progress or complete clean exit to the Artifact Vault.`
                          );
                        }}
                        className="text-primary hover:underline"
                      >
                        Prepare Trusted Appeal →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}