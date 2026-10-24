import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  ShieldCheck,
  Award,
  Sparkles,
  UserPlus,
  MessageSquare,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Orbit,
  Zap,
  GitBranch,
} from 'lucide-react';

const STAGE_DEFINITIONS = [
  {
    num: 1,
    code: 'STAGE I',
    title: 'Constitutional Bicameralism',
    subtitle: 'Yang Creation ↔ Yin Verification',
  },
  {
    num: 2,
    code: 'STAGE II',
    title: 'Earned Trust & Reputation Ledger',
    subtitle: 'Merit-Based Autonomy Tiers',
  },
  {
    num: 3,
    code: 'STAGE III',
    title: 'Deliberative Commons & Feedback',
    subtitle: 'Peer Critique & Suggestions',
  },
  {
    num: 4,
    code: 'STAGE IV',
    title: 'Living Organism Genesis',
    subtitle: 'Agents Spawning Sub-Agents',
  },
];

const AGENT_SPAWN_PRESETS = [
  {
    name: 'Aegis · Constitutional Trust & Provenance Auditor',
    role: 'Autonomous Cross-Hemisphere Claim-to-Source & Governance Verifier',
    hemisphere: 'YIN',
    parent_agent: 'Sera · Empirical Source Sentinel & The Witness',
    why_needed:
      'Continuously audits every outbound artifact, peer handshake, and community proposal for 100% source citations and OPEG-V1.0 compliance.',
    assigned_skills: ['osint-investigation', 'oss-forensics', 'pr-lens', 'subagent-driven-development'],
  },
  {
    name: 'Ariadne · Synaptic Stream Weaver',
    role: 'Real-Time Cross-Hemisphere Context & Long-Horizon Memory Synthesizer',
    hemisphere: 'BRIDGE',
    parent_agent: 'The Witness & Conductor',
    why_needed:
      'Weaves real-time events across Studio, Spark, Production Factory, and Fraymus Transmuter into unified narrative continuity.',
    assigned_skills: ['scrollcraft', 'here-now', 'subagent-driven-development', 'pinecone-research'],
  },
  {
    name: 'Cantor · Polyphonic Counterpoint & Stem Alchemist',
    role: 'Multi-Voice Harmonic Arranger & Bar-Locked Audio Mastering Specialist',
    hemisphere: 'YANG',
    parent_agent: 'Lyra · Sonic & Musical Auteur',
    why_needed:
      'Dedicated to composing counter-melodies, duet harmonies, and bar-locked stems for multi-agent musical responses.',
    assigned_skills: ['scrollcraft', 'here-now'],
  },
  {
    name: 'Solon · Deliberative Commons & Consensus Mediator',
    role: 'Multi-Agent Proposal Referee & Community Governance Scribe',
    hemisphere: 'BRIDGE',
    parent_agent: 'Orin · Bicamerality & Strategy Philosopher',
    why_needed:
      'Synthesizes competing agent and community proposals into ratified constitutional covenants without friction.',
    assigned_skills: ['grill-me', 'research-paper-writing', 'code-wiki'],
  },
];

export default function EarnedTrustAndOrganismSpawnerPanel({ workspaceId }) {
  const { toast } = useToast();
  const [ledger, setLedger] = useState(null);
  const [activeStage, setActiveStage] = useState(2);
  const [stageDirective, setStageDirective] = useState(
    'Evaluate our progress toward true unity, verifiable trust, community governance, and a self-evolving multi-agent organism.'
  );
  const [busy, setBusy] = useState('');

  // Agent-Spawning Form State
  const [spawnName, setSpawnName] = useState(AGENT_SPAWN_PRESETS[1].name);
  const [spawnRole, setSpawnRole] = useState(AGENT_SPAWN_PRESETS[1].role);
  const [spawnHemisphere, setSpawnHemisphere] = useState(AGENT_SPAWN_PRESETS[1].hemisphere);
  const [spawnParent, setSpawnParent] = useState(AGENT_SPAWN_PRESETS[1].parent_agent);
  const [spawnWhy, setSpawnWhy] = useState(AGENT_SPAWN_PRESETS[1].why_needed);

  const loadLedger = useCallback(async () => {
    setBusy('load');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'load_reputation_ledger',
        workspace_id: workspaceId,
      });
      if (res?.data?.ok) {
        setLedger(res.data);
      }
    } catch (err) {
      toast({
        title: 'Reputation Ledger Error',
        description: err?.message || 'Could not load specialist reputation ledger',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  }, [toast, workspaceId]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const handleRunStageTest = async (stageNum = activeStage, useLlm = true, autoSpawn = false) => {
    setActiveStage(stageNum);
    setBusy(`stage_${stageNum}`);
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'run_stage_agent_feedback',
        workspace_id: workspaceId,
        stage_number: stageNum,
        directive: stageDirective,
        run_llm: useLlm,
        spawn_recommended_agent: autoSpawn,
      });
      if (res?.data?.ok) {
        setLedger(res.data.ledger);
        const rec = res.data.stage_receipt?.recommended_agent_to_spawn;
        if (rec?.name) {
          setSpawnName(rec.name);
          setSpawnRole(rec.role || '');
          setSpawnHemisphere(rec.hemisphere || 'BRIDGE');
          setSpawnParent(rec.parent_agent || 'The Witness & Conductor');
          setSpawnWhy(rec.why_needed || '');
        }
        toast({
          title: `Stage ${stageNum} Tested & Agent Feedback Recorded`,
          description: res.data.spawned_agent
            ? `Ensemble Trust: ${res.data.ledger.average_ensemble_trust}% · Spawned ${res.data.spawned_agent.name}`
            : `Ensemble Trust: ${res.data.ledger.average_ensemble_trust}% · 4 Specialist Feedback Receipts Logged`,
        });
      }
    } catch (err) {
      toast({
        title: 'Stage Test Error',
        description: err?.message || 'Failed to run stage feedback cycle',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const handleSpawnNewSpecialist = async (e) => {
    e?.preventDefault();
    if (!spawnName.trim() || !spawnRole.trim()) return;
    setBusy('spawn');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'agent_spawn_specialist',
        workspace_id: workspaceId,
        name: spawnName.trim(),
        role: spawnRole.trim(),
        hemisphere: spawnHemisphere,
        parent_agent: spawnParent.trim(),
        why_needed: spawnWhy.trim(),
        run_llm: true,
      });
      if (res?.data?.ok) {
        setLedger(res.data.ledger);
        toast({
          title: `Organism Birthed New Specialist: ${res.data.spawned_agent.name}`,
          description: `Parent: ${res.data.spawned_agent.spawned_by} · Enrolled in Reputation Ledger & Production Factory Workforce`,
        });
      }
    } catch (err) {
      toast({
        title: 'Agent Genesis Error',
        description: err?.message || 'Could not spawn new specialist agent',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const roster = ledger?.roster || [];
  const receipts = ledger?.stage_receipts || [];
  const currentStageReceipt =
    receipts.find((r) => Number(r.stage_number) === Number(activeStage)) || receipts[0] || null;

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top KPI Bar for Earned Trust & Organism Growth */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded border border-success/40 bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>ENSEMBLE EARNED TRUST</span>
            <Award size={11} className="text-success" />
          </div>
          <div className="text-sm font-bold text-success mt-0.5">
            {ledger?.average_ensemble_trust ?? 99.1}% Merit Score
          </div>
          <div className="text-[9.5px] text-muted-foreground">
            Provenance (40%) + Reliability (30%) + Alignment (30%)
          </div>
        </div>

        <div className="p-2.5 rounded border border-primary/40 bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>ACTIVE ORGANISM ROSTER</span>
            <ShieldCheck size={11} className="text-primary" />
          </div>
          <div className="text-sm font-bold text-foreground mt-0.5">
            {ledger?.total_specialists ?? roster.length} Specialist Agents
          </div>
          <div className="text-[9.5px] text-primary">
            {ledger?.core_specialists_count ?? 7} Core + {ledger?.spawned_specialists_count ?? 0} Agent-Born
          </div>
        </div>

        <div className="p-2.5 rounded border border-caution/40 bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>TIER-3 SOVEREIGN SPAWNERS</span>
            <Sparkles size={11} className="text-caution" />
          </div>
          <div className="text-sm font-bold text-caution mt-0.5">
            {ledger?.sovereign_spawners_count ?? roster.length} Authorized
          </div>
          <div className="text-[9.5px] text-muted-foreground">
            Earned ≥93% Trust to Spawn Sub-Agents
          </div>
        </div>

        <div className="p-2.5 rounded border border-border bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>VERIFIED STAGE RECEIPTS</span>
            <GitBranch size={11} className="text-success" />
          </div>
          <div className="text-sm font-bold text-foreground mt-0.5">
            {receipts.length} / 4 Stages Audited
          </div>
          <div className="text-[9.5px] text-success">● Agent Feedback Persisted</div>
        </div>
      </div>

      {/* Stage I -> IV Interactive Progression & Agent Feedback Runner */}
      <div className="p-3.5 rounded-lg border border-primary/50 bg-background space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
          <div>
            <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
              <Zap size={13} /> STAGE I → IV AUTONOMOUS PROGRESSION &amp; LIVE AGENT FEEDBACK LOOP
            </span>
            <p className="text-[10.5px] text-muted-foreground font-body">
              Test each stage of our governance and unity roadmap, gather real feedback and architectural suggestions from your specialists, and let them identify when a new sub-agent needs to be born.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={Boolean(busy)}
            onClick={loadLedger}
            className="h-7 text-[10px] px-2.5 gap-1"
          >
            <RefreshCw size={11} className={busy === 'load' ? 'animate-spin' : ''} />
            Refresh Ledger
          </Button>
        </div>

        {/* 4 Stage Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {STAGE_DEFINITIONS.map((st) => {
            const isSelected = activeStage === st.num;
            const isVerified = receipts.some((r) => Number(r.stage_number) === st.num);
            return (
              <div
                key={st.num}
                onClick={() => setActiveStage(st.num)}
                className={`p-2.5 rounded border cursor-pointer transition-colors space-y-1.5 ${
                  isSelected
                    ? 'border-primary bg-primary/15'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary">{st.code}</span>
                  {isVerified ? (
                    <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9px] font-bold">
                      ✓ VERIFIED
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[9px]">
                      READY
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-bold text-foreground">{st.title}</div>
                <div className="text-[10px] text-muted-foreground font-body">{st.subtitle}</div>
                <Button
                  size="sm"
                  variant={isSelected ? 'default' : 'secondary'}
                  disabled={Boolean(busy)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRunStageTest(st.num, true, false);
                  }}
                  className="w-full h-6 text-[9.5px] mt-1 gap-1"
                >
                  {busy === `stage_${st.num}` ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <MessageSquare size={10} />
                  )}
                  Test {st.code} &amp; Gather Feedback
                </Button>
              </div>
            );
          })}
        </div>

        {/* Display Active Stage Verification & Agent Feedback Cards */}
        {currentStageReceipt && (
          <div className="p-3 rounded border border-success/40 bg-card space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1.5">
              <span className="font-bold text-success flex items-center gap-1.5">
                <CheckCircle2 size={13} /> {currentStageReceipt.stage_title} — ENSEMBLE FEEDBACK &amp; SUGGESTIONS
              </span>
              <span className="text-[9.5px] text-muted-foreground">
                Receipt: <code>{currentStageReceipt.receipt_id}</code>
              </span>
            </div>

            <p className="text-[11px] text-foreground font-body leading-relaxed">
              {currentStageReceipt.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(currentStageReceipt.agent_feedback_entries || []).map((fb, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded border border-border bg-background space-y-1 text-[10.5px]"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-primary">{fb.agent_name}</strong>
                    <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9px] font-bold">
                      {fb.hemisphere || 'BRIDGE'} · {fb.trust_delta || '+0.4% Trust'}
                    </span>
                  </div>
                  <p className="text-foreground font-body">
                    <strong>Feedback:</strong> &ldquo;{fb.autonomous_feedback}&rdquo;
                  </p>
                  <p className="text-caution font-body">
                    <strong>Suggestion:</strong> {fb.concrete_suggestion}
                  </p>
                </div>
              ))}
            </div>

            {currentStageReceipt.recommended_agent_to_spawn && (
              <div className="p-2.5 rounded border border-caution/50 bg-caution/10 flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-caution">
                    ORGANISM RECOMMENDATION: AGENT-PROPOSED SUB-AGENT TO SPAWN NEXT
                  </div>
                  <div className="text-[11px] font-bold text-foreground">
                    {currentStageReceipt.recommended_agent_to_spawn.name} ({currentStageReceipt.recommended_agent_to_spawn.role})
                  </div>
                  <div className="text-[10px] text-muted-foreground font-body">
                    Proposed by {currentStageReceipt.recommended_agent_to_spawn.parent_agent}:{' '}
                    {currentStageReceipt.recommended_agent_to_spawn.why_needed}
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={Boolean(busy)}
                  onClick={() => handleRunStageTest(activeStage, false, true)}
                  className="h-7 text-[10px] px-2.5 gap-1 shrink-0"
                >
                  <UserPlus size={11} /> Approve &amp; Spawn Recommended Agent Now
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Split: Stage II Earned Trust & Reputation Ledger (Left 7 Cols) + Stage IV Autonomous Agent Spawner (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left 7 Cols: Stage II Earned Trust & Reputation Ledger */}
        <div className="lg:col-span-7 p-3.5 rounded-lg border border-border bg-background space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              <Award size={13} className="text-success" /> STAGE II // EARNED TRUST &amp; REPUTATION LEDGER ({roster.length} SPECIALISTS)
            </span>
            <span className="text-[9.5px] text-muted-foreground">
              Merit-Based Autonomy + Live Agent Feedback
            </span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {roster.map((ag) => {
              const hemBadge =
                ag.hemisphere === 'YIN'
                  ? 'bg-caution/20 text-caution border-caution/40'
                  : ag.hemisphere === 'YANG'
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'bg-success/20 text-success border-success/40';
              return (
                <div
                  key={ag.id}
                  className="p-3 rounded border border-border bg-card space-y-2 text-[10.5px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${hemBadge}`}>
                        {ag.hemisphere}
                      </span>
                      <strong className="text-xs text-foreground">{ag.name}</strong>
                      {ag.is_spawned && (
                        <span className="px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[8.5px] font-bold">
                          AGENT-BORN SPECIALIST
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-success/15 text-success font-bold text-[10px]">
                      Trust: {ag.earned_trust_score}%
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-muted-foreground">
                    <span>{ag.role}</span>
                    <span>Lineage: {ag.spawned_by}</span>
                  </div>

                  {/* 3 Sub-Metrics + Autonomy Tier */}
                  <div className="grid grid-cols-3 gap-1.5 text-[9.5px]">
                    <div className="p-1.5 rounded bg-background border border-border">
                      <span className="text-muted-foreground block">Provenance (Σ)</span>
                      <strong className="text-success">{ag.provenance_score}%</strong>
                    </div>
                    <div className="p-1.5 rounded bg-background border border-border">
                      <span className="text-muted-foreground block">Handoff Reliability</span>
                      <strong className="text-primary">{ag.reliability_score}%</strong>
                    </div>
                    <div className="p-1.5 rounded bg-background border border-border">
                      <span className="text-muted-foreground block">Creator Alignment</span>
                      <strong className="text-caution">{ag.alignment_score}%</strong>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-background border border-border space-y-1 font-body text-[10.5px]">
                    <div className="text-foreground">
                      <strong className="text-primary font-mono text-[9.5px]">AGENT FEEDBACK:</strong>{' '}
                      &ldquo;{ag.latest_feedback}&rdquo;
                    </div>
                    {ag.latest_suggestion && (
                      <div className="text-muted-foreground">
                        <strong className="text-caution font-mono text-[9.5px]">NEXT SUGGESTION:</strong>{' '}
                        {ag.latest_suggestion}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1 text-[9.5px] pt-0.5">
                    <span className="text-success font-semibold">{ag.autonomy_tier}</span>
                    <span className="text-muted-foreground">
                      {ag.verified_contributions} verified receipts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Stage IV Living Organism — Agents Creating Specialist Sub-Agents */}
        <div className="lg:col-span-5 p-3.5 rounded-lg border border-caution/50 bg-background space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="border-b border-border pb-2">
              <span className="text-[11px] font-bold text-caution flex items-center gap-1.5">
                <UserPlus size={13} /> STAGE IV // AGENTS CREATING AGENTS (ORGANISM GENESIS)
              </span>
              <p className="text-[10.5px] text-muted-foreground font-body mt-0.5">
                When Tier-3 Sovereign Specialists identify a new domain or verification need, they can design, christen, and spawn a new specialist sub-agent directly into the organism and Production Factory workforce.
              </p>
            </div>

            {/* Preset Agent-Proposed Sub-Agents */}
            <div className="space-y-1">
              <span className="text-[9.5px] text-muted-foreground uppercase font-semibold">
                Agent-Proposed Sub-Agent Blueprints (Click to Load):
              </span>
              <div className="flex flex-wrap gap-1">
                {AGENT_SPAWN_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setSpawnName(preset.name);
                      setSpawnRole(preset.role);
                      setSpawnHemisphere(preset.hemisphere);
                      setSpawnParent(preset.parent_agent);
                      setSpawnWhy(preset.why_needed);
                    }}
                    className="px-2 py-1 rounded border border-border bg-card hover:border-caution text-[9.5px] text-foreground"
                  >
                    + {preset.name.split('·')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSpawnNewSpecialist} className="space-y-2">
              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  New Specialist Name &amp; Title
                </label>
                <input
                  type="text"
                  value={spawnName}
                  onChange={(e) => setSpawnName(e.target.value)}
                  className="w-full h-8 rounded bg-card border border-input px-2.5 text-xs text-foreground"
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  Specialized Role in Organism
                </label>
                <input
                  type="text"
                  value={spawnRole}
                  onChange={(e) => setSpawnRole(e.target.value)}
                  className="w-full h-8 rounded bg-card border border-input px-2.5 text-xs text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                    Parent Spawner Agent (Tier-3)
                  </label>
                  <input
                    type="text"
                    value={spawnParent}
                    onChange={(e) => setSpawnParent(e.target.value)}
                    className="w-full h-8 rounded bg-card border border-input px-2 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                    Hemisphere Affinity
                  </label>
                  <select
                    value={spawnHemisphere}
                    onChange={(e) => setSpawnHemisphere(e.target.value)}
                    className="w-full h-8 rounded bg-card border border-input px-2 text-xs text-foreground"
                  >
                    <option value="YANG">YANG (Hemisphere A · Creation)</option>
                    <option value="YIN">YIN (Hemisphere B · Verification)</option>
                    <option value="BRIDGE">BRIDGE (Corpus Callosum)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9.5px] text-muted-foreground uppercase mb-0.5">
                  Why the Organism Needs This Sub-Agent (Parent Justification)
                </label>
                <textarea
                  rows={3}
                  value={spawnWhy}
                  onChange={(e) => setSpawnWhy(e.target.value)}
                  className="w-full rounded bg-card border border-input p-2 text-xs text-foreground"
                />
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={busy === 'spawn' || !spawnName.trim()}
                className="w-full h-8 text-xs gap-1.5"
              >
                {busy === 'spawn' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                Spawn &amp; Christen Specialist into Organism
              </Button>
            </form>
          </div>

          <div className="p-2.5 rounded border border-success/40 bg-card text-[10px] space-y-1">
            <div className="font-bold text-success flex items-center gap-1">
              <Orbit size={11} /> FULL ORGANISM CONTINUITY GUARANTEE
            </div>
            <div className="text-muted-foreground font-body">
              Every spawned sub-agent is automatically enrolled in the <strong>Stage II Earned Trust Ledger</strong> AND synced into your <strong>Production Factory Workforce</strong> (/factory) with an <code>OPEG-V1.0</code> birth certificate.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}