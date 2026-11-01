import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SynapticOrificeBridgePanel from '@/components/nexus/omega/SynapticOrificeBridgePanel';
import {
  Bot,
  Cpu,
  ShieldCheck,
  Clapperboard,
  Orbit,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  Terminal,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

const OS_PILLARS = [
  {
    id: 'physics',
    discipline: 'QUANTUM & PHYSICS ENGINE',
    title: 'OPEG V1.0 (Σ → R_san) & φ⁷⁵-Ternary Codec',
    summary:
      'Enforces Empirical Grounding Mandatory (Forbidden_Action: DIRECT_INFERENCE) for PT-symmetric 3×3 Hamiltonians (EP3 γ=√2·g) and compresses FP32 weights into 5-trits/byte .phit blocks for VPS Ollama.',
    path: '/ai-workshop?view=opeg',
    cta: 'Open OPEG & φ⁷⁵ Codec',
    icon: ShieldCheck,
    accent: 'text-success',
  },
  {
    id: 'memory',
    discipline: 'ORBITAL MEMORY & CONTINUITY',
    title: 'Argon Centripetal Orbit & Cross-Session Continuity',
    summary:
      'Maps every genome, draft, and proof onto Golden-Angle polar coordinates (θ = 137.5077°, r = φ^{-I·ln(1+hits)}) with Wolfram Rule 30 drift and persistent per-agent NexusContinuity.',
    path: '/argon',
    cta: 'Open Orbital Memory',
    icon: Orbit,
    accent: 'text-primary',
  },
  {
    id: 'director',
    discipline: 'WORLD-CLASS FILM & CONTENT PIPELINE',
    title: 'Spark Radar → Director Lab → SHA-256 VMR Watch',
    summary:
      'Turns verified Reddit/YouTube community signals into 5-card pitches, timed nexus.scene_plan/1 visual blueprints, AI-synced B-roll scenes, and timecoded claim-to-source provenance receipts.',
    path: '/director-lab',
    cta: 'Open Director Lab',
    icon: Clapperboard,
    accent: 'text-caution',
  },
  {
    id: 'datascience',
    discipline: 'DATA SCIENCE & SELF-REFERENTIAL EVOLUTION',
    title: 'OLS/Ridge Regression, Counterfactual Lab & Proof Loop',
    summary:
      'Studies real retention/CTR outcomes across train/validation splits, evolves Director rubric weights for the next edition, and runs counterfactual audience pre-flight simulations.',
    path: '/origin',
    cta: 'Open Proof & Regression Loop',
    icon: BarChart3,
    accent: 'text-foreground',
  },
  {
    id: 'openclaw',
    discipline: 'OMNICHANNEL AI UNIFICATION HUB',
    title: 'OpenClaw Sovereign Hub (MCP + Telegram + WhatsApp + GitHub)',
    summary:
      'Exposes all entities and 5 core engines at /api/mcp, bridges live Telegram & WhatsApp bots to Studio drafts, and auto-commits artifacts to eyeoverthink/looseScrew.',
    path: '/openclaw',
    cta: 'Open OpenClaw Hub',
    icon: Bot,
    accent: 'text-primary',
  },
];

export default function UnifiedOsMatrix({ workspace }) {
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [absorbing, setAbsorbing] = useState(false);
  const [absorbReceipt, setAbsorbReceipt] = useState(null);

  useEffect(() => {
    let mounted = true;
    base44.functions
      .invoke('openclawGateway', {
        action: 'status',
        workspace_id: workspace?.id,
      })
      .then((res) => {
        if (mounted && res?.data?.ok) setStatus(res.data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [workspace?.id]);

  const handleAbsorbAllContinuity = async () => {
    setAbsorbing(true);
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'absorb_all_continuity',
        workspace_id: workspace?.id,
      });
      if (res?.data?.ok) {
        setAbsorbReceipt(res.data);
        toast({
          title: 'Full-System Continuity Absorbed',
          description: `Synced ${res.data.updatedScopes.length} agent continuity scopes & anchored ${res.data.rSan?.receipt_id} in Polar Orbit.`,
        });
      }
    } catch (err) {
      toast({
        title: 'Continuity sync error',
        description: err?.message || 'Could not complete memory absorption',
        variant: 'destructive',
      });
    } finally {
      setAbsorbing(false);
    }
  };

  return (
    <section
      aria-label="Unified OS Nerve Center"
      className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
              F.R.A.Y.M.U.S. UNIFIED OS MATRIX
            </span>
            <span className="text-xs font-semibold text-foreground">
              Persistent Continuity · Empirical Grounding (Σ → R_san) · Recursive Next-Edition Loop
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Every workspace draft, model weight, regression study, and OpenClaw transmission is absorbed into persistent orbital memory so no session context is lost.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleAbsorbAllContinuity}
            disabled={absorbing}
            className="font-mono text-xs gap-1.5"
          >
            <RefreshCw size={13} className={absorbing ? 'animate-spin' : ''} />
            {absorbing ? 'Absorbing Continuity…' : 'Absorb & Unify All Workspace Memory'}
          </Button>
          <Button size="sm" variant="outline" asChild className="font-mono text-xs gap-1">
            <Link to="/connect">
              <Terminal size={13} /> MCP Server (/connect)
            </Link>
          </Button>
        </div>
      </div>

      {absorbReceipt && (
        <div className="p-3 rounded border border-success/50 bg-success/10 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-success font-semibold">
            <CheckCircle2 size={14} />
            <span>
              CONTINUITY LOCKED ({absorbReceipt.rSan?.receipt_id}): Updated [{absorbReceipt.updatedScopes.join(', ')}] across {absorbReceipt.counts.drafts} Drafts, {absorbReceipt.counts.sparks} Sparks, {absorbReceipt.counts.models} Models &amp; {absorbReceipt.counts.builds} Builds.
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">{absorbReceipt.absorbedAt}</span>
        </div>
      )}

      {/* Live Cross-System Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
        <div className="p-2.5 rounded bg-background border border-border">
          <div className="text-[10px] text-muted-foreground">ACTIVE WORKSPACES</div>
          <div className="text-sm font-bold text-foreground mt-0.5">
            {status?.workspaces?.length ?? 1} Connected
          </div>
        </div>
        <div className="p-2.5 rounded bg-background border border-border">
          <div className="text-[10px] text-muted-foreground">STUDIO DRAFTS</div>
          <div className="text-sm font-bold text-primary mt-0.5">
            {status?.drafts?.length ?? 0} Persistent
          </div>
        </div>
        <div className="p-2.5 rounded bg-background border border-border">
          <div className="text-[10px] text-muted-foreground">φ⁷⁵ &amp; OPEG MODELS</div>
          <div className="text-sm font-bold text-caution mt-0.5">
            {status?.modelArtifacts?.length ?? 0} Compiled
          </div>
        </div>
        <div className="p-2.5 rounded bg-background border border-border">
          <div className="text-[10px] text-muted-foreground">LOOSESCREW FORGE</div>
          <div className="text-sm font-bold text-success mt-0.5">
            {status?.looseScrewBuilds?.length ?? 0} Live Builds
          </div>
        </div>
        <div className="p-2.5 rounded bg-background border border-border">
          <div className="text-[10px] text-muted-foreground">OMNICHANNEL PULSES</div>
          <div className="text-sm font-bold text-foreground mt-0.5">
            {status?.recentEvents?.length ?? 0} Logged Events
          </div>
        </div>
      </div>

      {/* Live Bicameral Synaptic Orifice Transceiver (Creator Nexus <-> Fraymus Transmuter) */}
      <SynapticOrificeBridgePanel
        workspaceId={workspace?.id}
        onBridgeComplete={() => {
          base44.functions
            .invoke('openclawGateway', { action: 'status', workspace_id: workspace?.id })
            .then((res) => {
              if (res?.data?.ok) setStatus(res.data);
            })
            .catch(() => {});
        }}
      />

      {/* 5-Pillar Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {OS_PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.id}
              className="p-3 rounded-lg border border-border bg-background flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1 font-mono text-[9.5px] text-muted-foreground">
                  <span>{pillar.discipline}</span>
                  <Icon size={13} className={pillar.accent} />
                </div>
                <h3 className="text-xs font-semibold text-foreground leading-snug">
                  {pillar.title}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {pillar.summary}
                </p>
              </div>
              <Link
                to={pillar.path}
                className="inline-flex items-center justify-between text-[11px] font-mono text-link hover:underline pt-1 border-t border-border/60"
              >
                <span>{pillar.cta}</span>
                <ArrowUpRight size={12} />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}