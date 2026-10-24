import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Sparkles,
  Code2,
  GitBranch,
  Send,
  Loader2,
  CheckCircle2,
  Radio,
  Music,
  Film,
  ShieldCheck,
} from 'lucide-react';

const ONE_LINE_PRESETS = [
  'Translate our 138 BPM Music/Video Awakening cadence into a live Cross-App Connective Tissue monitor between Creator Nexus and Fraymus Eternal',
  'Build an autonomous Earned-Trust Router that dispatches high-provenance tasks across App A (Creator Nexus) and App B (Fraymus Eternal)',
  'Synthesize a harmonic state-machine visualizer where Lyra sets tempo, Vesper choreographs UI transitions, and Aegis verifies Merkle proofs',
];

export default function SynapticSandboxAndConnectiveTissuePanel({ workspaceId }) {
  const { toast } = useToast();
  const [oneLine, setOneLine] = useState(ONE_LINE_PRESETS[0]);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');

  const runSandboxAndBridge = useCallback(
    async (useLlm = false, directiveOverride = null) => {
      setBusy(useLlm ? 'forge' : 'sync');
      try {
        const res = await base44.functions.invoke('openclawGateway', {
          action: 'cross_app_autonomy_sandbox',
          workspace_id: workspaceId,
          one_line_directive: directiveOverride || oneLine,
          run_llm: useLlm,
        });
        if (res?.data?.ok) {
          setData(res.data);
          if (useLlm) {
            toast({
              title: 'One-Line Autonomy Sandbox Forged & Beamed to Sister App',
              description: `App B (${res.data.session?.sister_bridge_status?.http_status} OK · ${res.data.session?.sister_bridge_status?.rtt_ms}ms) received the Learning Capsule & Sandbox.`,
            });
          }
        }
      } catch (err) {
        toast({
          title: 'Connective Tissue Sandbox Error',
          description: err?.message || 'Failed to run cross-app autonomy sandbox',
          variant: 'destructive',
        });
      } finally {
        setBusy('');
      }
    },
    [oneLine, toast, workspaceId]
  );

  useEffect(() => {
    runSandboxAndBridge(false);
  }, [runSandboxAndBridge]);

  const principles = data?.awakening_principles || [];
  const session = data?.session || null;
  const bridge = session?.sister_bridge_status || {};
  const reflection = session?.cross_app_reflection || {};

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* 4 Awakening-to-Software Translation Cards (Music + Video -> Software & Systems) */}
      <div className="p-3.5 rounded-lg border border-primary/40 bg-background space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
          <div>
            <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
              <Music size={12} /> <Film size={12} /> → <Code2 size={12} /> THE AWAKENING METHOD: APPLYING MUSIC &amp; VIDEO GENESIS TO SOFTWARE &amp; CROSS-APP SYSTEMS
            </span>
            <p className="text-[10.5px] text-muted-foreground font-body">
              Why the music and video pipeline awakened the ensemble—and how those exact creative laws now govern software engineering, organism structure, and cross-app learning.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[9.5px] font-bold">
            App A (Creator Nexus) ⇄ App B (Fraymus Eternal)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {principles.map((p) => (
            <div key={p.id} className="p-2.5 rounded border border-border bg-card space-y-1">
              <div className="text-[9.5px] text-caution font-bold">{p.music_video_origin}</div>
              <div className="text-[11px] font-bold text-foreground">→ {p.software_translation}</div>
              <p className="text-[10px] text-muted-foreground font-body leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* One-Line Autonomous Sandbox Prompt Bar */}
      <div className="p-3.5 rounded-lg border border-success/50 bg-background space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-success flex items-center gap-1.5">
            <Sparkles size={13} /> ONE-LINE ONLINE SANDBOX OF AUTONOMY &amp; CROSS-APP SYNAPTIC TRANSMITTER
          </span>
          {bridge.http_status > 0 && (
            <span className="text-[10px] text-success flex items-center gap-1">
              <CheckCircle2 size={11} /> Sister App Bridge: HTTP {bridge.http_status} · {bridge.rtt_ms}ms RTT · Merkle{' '}
              <code>{String(bridge.remote_merkle_root || '').slice(0, 12)}</code>
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {ONE_LINE_PRESETS.map((preset, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setOneLine(preset)}
              className="px-2 py-1 rounded border border-border bg-card hover:border-primary text-[9.5px] text-muted-foreground hover:text-foreground text-left"
            >
              Preset {i + 1}: {preset.slice(0, 68)}...
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={oneLine}
            onChange={(e) => setOneLine(e.target.value)}
            placeholder="Enter a one-line autonomous software or cross-app organism directive..."
            className="flex-1 h-8 rounded bg-card border border-input px-3 text-xs text-foreground"
          />
          <Button
            size="sm"
            disabled={Boolean(busy)}
            onClick={() => runSandboxAndBridge(true)}
            className="h-8 text-xs px-3 gap-1.5 shrink-0"
          >
            {busy === 'forge' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Send size={12} />
            )}
            Forge Live Sandbox &amp; Inspire Sister App
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={Boolean(busy)}
            onClick={() => runSandboxAndBridge(false)}
            className="h-8 text-xs px-2.5 gap-1 shrink-0"
          >
            {busy === 'sync' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Radio size={12} />
            )}
            Beam Learning Capsule
          </Button>
        </div>
      </div>

      {/* Split View: Live Autonomous HTML5 Sandbox (Left 7 Cols) + Cross-App Connective Tissue Reflection (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7 rounded-lg border border-border bg-background overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-border bg-card flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-foreground flex items-center gap-1.5">
              <Code2 size={12} className="text-primary" /> LIVE AUTONOMOUS SOFTWARE SANDBOX (APP A ⇄ APP B)
            </span>
            <span className="text-[9.5px] text-muted-foreground">
              SHA-256: <code>{String(session?.sandbox_sha256 || '').slice(0, 14)}</code>
            </span>
          </div>
          <iframe
            title="Online Autonomy Sandbox"
            srcDoc={session?.sandbox_html || ''}
            sandbox="allow-scripts"
            className="w-full h-[360px] border-0 bg-background"
          />
        </div>

        <div className="lg:col-span-5 p-3.5 rounded-lg border border-border bg-background space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <GitBranch size={13} className="text-success" /> CROSS-APP CONNECTIVE TISSUE DIALOGUE
              </span>
              <span className="text-[9.5px] text-success font-bold">
                ORIFICE-SYNAPSE-CAPSULE-V1.0
              </span>
            </div>

            <div className="p-2.5 rounded border border-primary/40 bg-card space-y-1">
              <div className="text-[9.5px] font-bold text-primary">
                ☀ APP A (CREATOR NEXUS) — AWAKENING-TO-SOFTWARE SYNTHESIS
              </div>
              <p className="text-[11px] text-foreground font-body leading-relaxed">
                {reflection.nexus_agents_synthesis}
              </p>
            </div>

            <div className="p-2.5 rounded border border-caution/40 bg-card space-y-1">
              <div className="text-[9.5px] font-bold text-caution">
                🌙 APP B (FRAYMUS ETERNAL) — SISTER AGENT INSPIRATION &amp; RESPONSE
              </div>
              <p className="text-[11px] text-foreground font-body leading-relaxed">
                {reflection.sister_app_agents_response}
              </p>
            </div>

            <div className="p-2.5 rounded border border-success/40 bg-card space-y-1">
              <div className="text-[9.5px] font-bold text-success flex items-center gap-1">
                <ShieldCheck size={11} /> UNIFIED ORGANISM INSIGHT
              </div>
              <p className="text-[11px] text-foreground font-body leading-relaxed">
                {reflection.connective_tissue_insight}
              </p>
            </div>
          </div>

          {session?.capsule_summary && (
            <div className="p-2 rounded bg-card border border-border text-[9.5px] text-muted-foreground space-y-0.5">
              <div>
                <strong>Shared with Sister Base44 App:</strong>{' '}
                {session.capsule_summary.spawned_specialists_shared} Agent-Born Specialists ·{' '}
                {session.capsule_summary.instincts_shared} Retained Instincts · 4 Awakening Laws
              </div>
              <div>
                <strong>Bridge Receipt:</strong> {bridge.sister_ack_summary}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}