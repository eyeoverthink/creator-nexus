import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Server,
  ShieldCheck,
  GitBranch,
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ExternalLink,
  KeyRound,
  FolderGit2,
  Scale,
  Terminal,
} from 'lucide-react';

const MIGRATION_RUNBOOK_COMMANDS = `# PHASE 1-4 SAFE CONSOLIDATION RUNBOOK (NO DELETION UNTIL VERIFIED)
# Target Canonical Agent Core: VPS 2067485 (srv2067485.hstgr.cloud · 2.24.68.223 / 100.72.161.48)
# Control Plane & App Server:  VPS 1944678 (srv1944678.hstgr.cloud · 45.82.73.49 / 100.110.6.44)

# 1. INVENTORY ALL PROFILES FIRST (Run on VPS 1944678, VPS 2067485, Managed Hermes, Windows/Mac):
hermes profile list

# 2. CREATE CANONICAL FOLDER & SHARED SKILLS HIERARCHY ON VPS 2067485:
mkdir -p /shared/hermes-skills/{common,fraymus,infrastructure,coding,research,communication}
mkdir -p /opt/fraymus/{agents,skills,memory,history}/{coordinator,research,coding,operations,content,personal}
mkdir -p /opt/fraymus/skills/shared /opt/fraymus/memory/shared

# 3. PULL CANONICAL CONTROL-PLANE REGISTRY & 29 SHARED SKILLS FROM GITHUB VAULT:
cd /shared/hermes-skills && git clone https://github.com/eyeoverthink/fraymus-continuity.git . || git pull

# 4. ENROLL CANONICAL AGENT CORE (VPS 2067485) WITH TWO-STAGE SIGNED TOKEN:
curl -s -X POST "https://creator-nexus.base44.app/functions/openclawGateway" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "control_plane_enroll",
    "sub_action": "request_challenge",
    "node_id": "hermes-core-2067485",
    "display_name": "Hermes Canonical Agent Core (VPS 2067485)",
    "runtime": "hermes",
    "host": "vps-2067485",
    "workspace_ids": ["ws-fraymus-core", "ws-agent-infra", "ws-research"],
    "capabilities": ["read_shared_skills", "poll_jobs", "claim_jobs", "send_heartbeat", "write_receipts", "request_memory_update"],
    "skill_set_version": "2026.10.21-v1"
  }'`;

export default function FraymusControlPlanePanel() {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('topology'); // 'topology' | 'enrollment' | 'memory' | 'disagreement' | 'runbook'
  const [registry, setRegistry] = useState(null);
  const [githubCommitUrl, setGithubCommitUrl] = useState('');
  const [busy, setBusy] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // Two-Stage Enrollment State
  const [nodeId, setNodeId] = useState('hermes-worker-2067485-01');
  const [displayName, setDisplayName] = useState('Hermes Research Worker (VPS 2067485)');
  const [runtime, setRuntime] = useState('hermes');
  const [host, setHost] = useState('vps-2067485');
  const [enrollmentReceipt, setEnrollmentReceipt] = useState(null);

  // Memory Proposal State
  const [memWorkspace, setMemWorkspace] = useState('Fraymus Core');
  const [memScope, setMemScope] = useState('profile');
  const [memSubject, setMemSubject] = useState(
    'Canonical Role Split: VPS 2067485 Agent Core + VPS 1944678 Control Plane'
  );
  const [memFact, setMemFact] = useState(
    'VPS 2067485 (2.24.68.223 / 100.72.161.48) is the canonical Hermes + Ollama worker plane with /shared/hermes-skills/. VPS 1944678 (45.82.73.49 / 100.110.6.44) hosts Fraymus Hub, Dispatch, Vault, Memory Bridge, and Forge Studio. Telegram is restricted to operator alerts and approvals only.'
  );
  const [memEvidence, setMemEvidence] = useState(
    'fraymus-control-plane-architecture.md, fraymus-control-plane-registry.json'
  );

  // Disagreement Escalation State
  const [disputedClaim, setDisputedClaim] = useState(
    'Whether Hermes on VPS 1944678 or VPS 2067485 owns the active research schedule and shared skills path.'
  );
  const [agentA, setAgentA] = useState('hermes-vps-1944678');
  const [agentB, setAgentB] = useState('hermes-core-2067485');

  const loadRegistry = useCallback(async () => {
    setBusy('load');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'control_plane_registry',
      });
      if (res?.data?.ok) {
        setRegistry(res.data.registry);
      }
    } catch (err) {
      toast({
        title: 'Control Plane Load Error',
        description: err?.message || 'Could not load canonical service registry',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  }, [toast]);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  const handleCommitRegistryToGithub = async () => {
    setBusy('commit');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'control_plane_commit_github',
      });
      if (res?.data?.ok) {
        setRegistry(res.data.registry);
        setGithubCommitUrl(res.data.github_url || '');
        toast({
          title: 'Canonical Registry Published to GitHub Vault',
          description: `Committed control-plane/fraymus-control-plane-registry.json (${res.data.commit_sha || 'synced'})`,
        });
      }
    } catch (err) {
      toast({
        title: 'GitHub Commit Failed',
        description: err?.message || 'Could not push registry to GitHub',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const handleEnrollmentStep = async (subAction, targetNodeId = nodeId) => {
    setBusy(subAction);
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'control_plane_enroll',
        sub_action: subAction,
        node_id: targetNodeId,
        display_name: displayName,
        runtime,
        host,
        workspace_ids: ['ws-fraymus-core', 'ws-agent-infra'],
        capabilities: [
          'read_shared_skills',
          'poll_jobs',
          'claim_jobs',
          'send_heartbeat',
          'write_receipts',
          'request_memory_update',
        ],
        skill_set_version: '2026.10.21-v1',
      });
      if (res?.data?.ok) {
        setEnrollmentReceipt(res.data);
        loadRegistry();
        toast({
          title:
            subAction === 'approve_node'
              ? `Issued Scoped Token for ${targetNodeId}`
              : `Enrollment Challenge Issued for ${targetNodeId}`,
          description: res.data.stage,
        });
      }
    } finally {
      setBusy('');
    }
  };

  const handleProposeMemory = async (e) => {
    e?.preventDefault();
    setBusy('propose_mem');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'control_plane_memory',
        sub_action: 'propose',
        node_id: 'hermes-core-2067485',
        workspace: memWorkspace,
        target_scope: memScope,
        subject: memSubject,
        fact: memFact,
        evidence: memEvidence.split(',').map((s) => s.trim()).filter(Boolean),
        confidence: 'verified',
      });
      if (res?.data?.ok) {
        loadRegistry();
        toast({
          title: 'Memory Proposal Submitted to Memory Bridge',
          description: 'Ready for operator Merge or Reject review.',
        });
      }
    } finally {
      setBusy('');
    }
  };

  const handleReviewMemoryProposal = async (prop, decision) => {
    setBusy(`mem_${prop.proposal_id}`);
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'control_plane_memory',
        sub_action: decision,
        proposal_id: prop.proposal_id,
        target_scope: prop.target_scope || 'profile',
        subject: prop.subject,
        fact: prop.fact,
      });
      if (res?.data?.ok) {
        loadRegistry();
        toast({
          title:
            decision === 'merge'
              ? 'Merged into Canonical Shared Documentation'
              : 'Memory Proposal Rejected',
          description: prop.subject,
        });
      }
    } finally {
      setBusy('');
    }
  };

  const handleEscalateDisagreement = async (e) => {
    e?.preventDefault();
    setBusy('disagree');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'control_plane_disagreement',
        workspace: 'Agent Infrastructure',
        disputed_claim: disputedClaim,
        agent_a: agentA,
        agent_b: agentB,
        evidence_a: 'VPS 1944678 local container config',
        evidence_b: 'Canonical Control Plane Registry v1.0 on VPS 2067485',
        decision_owner: '@eyeoverthink (Forge Studio)',
      });
      if (res?.data?.ok) {
        loadRegistry();
        toast({
          title: 'Disagreement Logged as AWAITING_REVIEW Task',
          description: 'Telegram debate suppressed; formal review task created.',
        });
      }
    } finally {
      setBusy('');
    }
  };

  const handleCopy = (key, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1800);
  };

  return (
    <section className="p-4 rounded-lg border border-primary/60 bg-card space-y-4 font-mono text-xs">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
              FRAYMUS SOVEREIGN CONTROL PLANE CONTRACT V1.0
            </span>
            <h2 className="text-sm font-semibold text-foreground">
              Canonical Registry: VPS 1944678 (Hub/Dispatch/Vault/Forge) + VPS 2067485 (Agent Core) + Managed Hermes
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            Eliminates state fragmentation and Telegram arguments: enforces one canonical service &amp; workspace registry, two-stage signed node enrollment, 3-layer <code>proposal-then-merge</code> memory updates, and structured task evidence across all 4 agent runtimes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            onClick={handleCommitRegistryToGithub}
            disabled={Boolean(busy)}
            className="h-7 text-[10.5px] px-2.5 gap-1.5"
          >
            {busy === 'commit' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <GitBranch size={12} />
            )}
            Publish Canonical Registry to GitHub Vault
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              handleCopy('registry_json', JSON.stringify(registry || {}, null, 2))
            }
            className="h-7 text-[10.5px] px-2.5 gap-1"
          >
            {copiedKey === 'registry_json' ? <Check size={11} /> : <Copy size={11} />}
            {copiedKey === 'registry_json' ? 'Copied Registry JSON' : 'Copy Registry JSON'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={loadRegistry}
            disabled={busy === 'load'}
            className="h-7 text-[10.5px] px-2.5 gap-1"
          >
            <RefreshCw size={11} className={busy === 'load' ? 'animate-spin' : ''} />
            Sync Registry
          </Button>
        </div>
      </div>

      {githubCommitUrl && (
        <div className="p-2 rounded border border-success/40 bg-success/10 flex items-center justify-between text-[10.5px]">
          <span className="text-success font-semibold">
            ✓ Canonical Registry v1.0 live in GitHub for all VPS &amp; Managed Hermes agents
          </span>
          <a
            href={githubCommitUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-link hover:underline"
          >
            Open control-plane/fraymus-control-plane-registry.json <ExternalLink size={10} />
          </a>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
        {[
          ['topology', '1. 4-Runtime Topology & 8 Workspaces'],
          ['enrollment', '2. Two-Stage Signed Node Enrollment'],
          ['memory', '3. Memory Bridge (Proposal-Then-Merge)'],
          ['disagreement', '4. Disagreement Escalation (No Telegram Debate)'],
          ['runbook', '5. VPS 2067485 Consolidation Runbook'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSubTab(id)}
            className={`px-2.5 py-1 rounded text-[10.5px] font-bold border transition-colors ${
              activeSubTab === id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: 4-RUNTIME TOPOLOGY & 8 WORKSPACES */}
      {activeSubTab === 'topology' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {(registry?.hosts || []).map((h) => (
              <div
                key={h.id}
                className="p-3 rounded border border-border bg-background space-y-1.5 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <strong className="text-primary text-xs">{h.id}</strong>
                    <span className="px-1.5 py-0.5 rounded bg-secondary text-[9px] font-bold uppercase text-foreground">
                      {h.role}
                    </span>
                  </div>
                  <div className="text-[10.5px] font-semibold text-foreground">
                    {h.hostname} ({h.public_ip})
                  </div>
                  <div className="text-[9.5px] text-success">{h.resources}</div>
                  <p className="text-[10px] text-muted-foreground font-body leading-relaxed">
                    {h.notes}
                  </p>
                </div>

                <div className="pt-1.5 border-t border-border/60">
                  <div className="text-[9px] text-muted-foreground uppercase mb-1">
                    Verified Containers ({h.containers?.length || 0}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(h.containers || []).slice(0, 8).map((c) => (
                      <span
                        key={c}
                        className="px-1.5 py-0.5 rounded bg-card border border-border text-[9px] text-foreground"
                      >
                        {c}
                      </span>
                    ))}
                    {(h.containers?.length || 0) > 8 && (
                      <span className="px-1.5 py-0.5 rounded bg-card text-[9px] text-muted-foreground">
                        +{h.containers.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 8 Canonical Workspaces */}
          <div className="p-3 rounded border border-border bg-background space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-caution">
                8 CANONICAL WORKSPACES (ISOLATED MEMORY NAMESPACES + SHARED SKILLS)
              </span>
              <span className="text-[9.5px] text-muted-foreground">
                Shared Skills: <code>/shared/hermes-skills/</code> (29 skills v2026.10.21-v1)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {(registry?.workspaces || []).map((ws) => (
                <div key={ws.id} className="p-2 rounded border border-border bg-card space-y-1 text-[10px]">
                  <div className="flex items-center justify-between">
                    <strong className="text-foreground">{ws.name}</strong>
                    <span className="text-[9px] text-primary">{ws.memory_scope}</span>
                  </div>
                  <div className="text-muted-foreground text-[9.5px]">
                    Agents: {ws.allowed_agents?.join(', ')}
                  </div>
                  <div className="text-success text-[9px]">Rule: {ws.approval_rule}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TWO-STAGE SIGNED NODE ENROLLMENT */}
      {activeSubTab === 'enrollment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6 p-3 rounded border border-border bg-background space-y-2.5">
            <div className="font-semibold text-primary flex items-center gap-1.5 border-b border-border pb-2">
              <KeyRound size={13} /> TWO-STAGE CHALLENGE &amp; SCOPED TOKEN ENROLLMENT
            </div>
            <p className="text-[10.5px] text-muted-foreground font-body">
              Replaces permanent keyless enrollment with the 2-stage security contract: 1) Agent requests a challenge nonce; 2) Operator approves in Forge Studio / Nexus to issue a scoped HMAC token with least-privilege worker permissions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  Node ID
                </label>
                <input
                  type="text"
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  className="w-full h-8 rounded bg-card border border-input px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-8 rounded bg-card border border-input px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  Runtime
                </label>
                <select
                  value={runtime}
                  onChange={(e) => setRuntime(e.target.value)}
                  className="w-full h-8 rounded bg-card border border-input px-2 text-xs"
                >
                  <option value="hermes">hermes</option>
                  <option value="openclaw">openclaw</option>
                  <option value="managed-hermes">managed-hermes</option>
                  <option value="local">local</option>
                </select>
              </div>
              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  Host
                </label>
                <select
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full h-8 rounded bg-card border border-input px-2 text-xs"
                >
                  <option value="vps-2067485">vps-2067485 (Canonical Agent Core)</option>
                  <option value="vps-1944678">vps-1944678 (Control Plane &amp; Apps)</option>
                  <option value="managed-hermes">managed-hermes (fraymus.cloud)</option>
                  <option value="local-workstations">local-workstations (Windows/Mac)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                disabled={Boolean(busy)}
                onClick={() => handleEnrollmentStep('request_challenge')}
                className="h-8 text-xs gap-1"
              >
                1. Issue One-Time Challenge
              </Button>
              <Button
                size="sm"
                disabled={Boolean(busy)}
                onClick={() => handleEnrollmentStep('approve_node')}
                className="h-8 text-xs gap-1"
              >
                <ShieldCheck size={12} /> 2. Approve &amp; Issue Scoped Worker Token
              </Button>
            </div>

            {enrollmentReceipt && (
              <pre className="p-2.5 rounded bg-card border border-success/40 text-[9.5px] leading-4 max-h-48 overflow-y-auto text-foreground">
                {JSON.stringify(enrollmentReceipt, null, 2)}
              </pre>
            )}
          </div>

          {/* Registered Agent Inventory */}
          <div className="lg:col-span-6 p-3 rounded border border-border bg-background space-y-2">
            <div className="font-semibold text-success border-b border-border pb-2">
              REGISTERED AGENT INVENTORY ({registry?.agents?.length || 0} NODES)
            </div>
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {(registry?.agents || []).map((ag) => (
                <div
                  key={ag.node_id}
                  className="p-2.5 rounded border border-border bg-card space-y-1 text-[10.5px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <strong className="text-foreground">{ag.display_name || ag.node_id}</strong>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        ag.auth_state === 'scoped_token_issued'
                          ? 'bg-success/15 text-success'
                          : 'bg-caution/15 text-caution'
                      }`}
                    >
                      {ag.auth_state || ag.status}
                    </span>
                  </div>
                  <div className="text-[9.5px] text-muted-foreground">
                    ID: <code>{ag.node_id}</code> · Runtime: <strong>{ag.runtime}</strong> · Host:{' '}
                    <strong className="text-primary">{ag.host}</strong>
                  </div>
                  {ag.auth_state !== 'scoped_token_issued' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEnrollmentStep('approve_node', ag.node_id)}
                      className="h-6 px-2 text-[9.5px] mt-1"
                    >
                      Approve &amp; Issue Scoped Token
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEMORY BRIDGE (PROPOSAL-THEN-MERGE) */}
      {activeSubTab === 'memory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6 p-3 rounded border border-border bg-background space-y-2.5">
            <div className="font-semibold text-caution flex items-center gap-1.5 border-b border-border pb-2">
              <Database size={13} /> SUBMIT CONTROLLED MEMORY UPDATE PROPOSAL
            </div>
            <form onSubmit={handleProposeMemory} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                    Workspace
                  </label>
                  <input
                    type="text"
                    value={memWorkspace}
                    onChange={(e) => setMemWorkspace(e.target.value)}
                    className="w-full h-8 rounded bg-card border border-input px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                    Target Continuity Scope
                  </label>
                  <select
                    value={memScope}
                    onChange={(e) => setMemScope(e.target.value)}
                    className="w-full h-8 rounded bg-card border border-input px-2 text-xs"
                  >
                    <option value="profile">profile (Canonical Architecture)</option>
                    <option value="models">models</option>
                    <option value="researcher">researcher</option>
                    <option value="writer">writer</option>
                    <option value="strategist">strategist</option>
                    <option value="director">director</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  Subject (What Changed)
                </label>
                <input
                  type="text"
                  value={memSubject}
                  onChange={(e) => setMemSubject(e.target.value)}
                  className="w-full h-8 rounded bg-card border border-input px-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  Durable Verified Fact
                </label>
                <textarea
                  rows={3}
                  value={memFact}
                  onChange={(e) => setMemFact(e.target.value)}
                  className="w-full rounded bg-card border border-input p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  Evidence References (comma-separated)
                </label>
                <input
                  type="text"
                  value={memEvidence}
                  onChange={(e) => setMemEvidence(e.target.value)}
                  className="w-full h-8 rounded bg-card border border-input px-2 text-xs"
                />
              </div>
              <Button type="submit" size="sm" disabled={busy === 'propose_mem'} className="w-full h-8 text-xs">
                Submit Memory Proposal (No Silent Overwrite)
              </Button>
            </form>
          </div>

          <div className="lg:col-span-6 p-3 rounded border border-border bg-background space-y-2">
            <div className="font-semibold text-foreground border-b border-border pb-2">
              MEMORY PROPOSALS QUEUE ({registry?.active_memory_proposals?.length || 0})
            </div>
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {(registry?.active_memory_proposals || []).length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-[11px]">
                  No pending memory proposals yet. Click &ldquo;Submit Memory Proposal&rdquo; on the left to test the Proposal-Then-Merge workflow.
                </div>
              ) : (
                (registry?.active_memory_proposals || []).map((prop, idx) => (
                  <div
                    key={prop.proposal_id || idx}
                    className="p-2.5 rounded border border-border bg-card space-y-1.5 text-[10.5px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-foreground">{prop.subject}</strong>
                      <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] uppercase">
                        {prop.review_status || 'pending_review'}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body">{prop.fact}</p>
                    {prop.review_status === 'pending_review' && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleReviewMemoryProposal(prop, 'merge')}
                          disabled={busy === `mem_${prop.proposal_id}`}
                          className="h-6 px-2.5 text-[9.5px] gap-1"
                        >
                          <CheckCircle2 size={10} /> Approve &amp; Merge into Shared Docs
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReviewMemoryProposal(prop, 'reject')}
                          disabled={busy === `mem_${prop.proposal_id}`}
                          className="h-6 px-2.5 text-[9.5px] text-destructive"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DISAGREEMENT ESCALATION PROTOCOL */}
      {activeSubTab === 'disagreement' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6 p-3 rounded border border-border bg-background space-y-2.5">
            <div className="font-semibold text-caution flex items-center gap-1.5 border-b border-border pb-2">
              <Scale size={13} /> ESCALATE AGENT DISAGREEMENT TO REVIEW TASK (NO TELEGRAM DEBATE)
            </div>
            <form onSubmit={handleEscalateDisagreement} className="space-y-2">
              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  Disputed Claim / Blocker
                </label>
                <textarea
                  rows={2}
                  value={disputedClaim}
                  onChange={(e) => setDisputedClaim(e.target.value)}
                  className="w-full rounded bg-card border border-input p-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                    Agent A
                  </label>
                  <input
                    type="text"
                    value={agentA}
                    onChange={(e) => setAgentA(e.target.value)}
                    className="w-full h-8 rounded bg-card border border-input px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                    Agent B
                  </label>
                  <input
                    type="text"
                    value={agentB}
                    onChange={(e) => setAgentB(e.target.value)}
                    className="w-full h-8 rounded bg-card border border-input px-2 text-xs"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" disabled={busy === 'disagree'} className="w-full h-8 text-xs">
                Create Formal AWAITING_REVIEW Task Record
              </Button>
            </form>
          </div>

          <div className="lg:col-span-6 p-3 rounded border border-border bg-background space-y-2">
            <div className="font-semibold text-foreground border-b border-border pb-2">
              ACTIVE REVIEW &amp; DISAGREEMENT RECORDS ({registry?.active_disagreements?.length || 0})
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {(registry?.active_disagreements || []).map((d, i) => (
                <div key={d.job_id || i} className="p-2.5 rounded border border-border bg-card space-y-1 text-[10.5px]">
                  <div className="flex items-center justify-between">
                    <strong className="text-caution">{d.job_id}</strong>
                    <span className="text-success text-[9.5px]">Telegram Argument Suppressed</span>
                  </div>
                  <div className="text-foreground font-body">{d.disputed_claim}</div>
                  <div className="text-[9.5px] text-muted-foreground">
                    Decision Owner: {d.decision_owner}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VPS 2067485 CONSOLIDATION RUNBOOK */}
      {activeSubTab === 'runbook' && (
        <div className="p-3 rounded border border-border bg-background space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <Terminal size={13} /> PHASE 1–4 SAFE MIGRATION COMMANDS FOR VPS 2067485 &amp; VPS 1944678
            </span>
            <button
              type="button"
              onClick={() => handleCopy('runbook', MIGRATION_RUNBOOK_COMMANDS)}
              className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
            >
              {copiedKey === 'runbook' ? <Check size={11} /> : <Copy size={11} />}
              {copiedKey === 'runbook' ? 'Copied Runbook!' : 'Copy Commands'}
            </button>
          </div>
          <pre className="p-2.5 rounded bg-card border border-border text-[10px] leading-4 overflow-x-auto text-foreground/90">
            {MIGRATION_RUNBOOK_COMMANDS}
          </pre>
        </div>
      )}
    </section>
  );
}