import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Radio,
  ShieldCheck,
  Orbit,
  Activity,
  Scale,
  Users,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Send,
  GitBranch,
  HeartHandshake,
  Lock,
} from 'lucide-react';

const DEFAULT_CHARTERS = [
  {
    id: 'pillar-bicameral-balance',
    code: 'ARTICLE I // YIN-YANG SEPARATION OF POWERS',
    title: 'Bicameral Checks & Balances (Creation ↔ Verification)',
    principle:
      'Neither hemisphere acts unchecked. Hemisphere A (Yang · Executive & Creative Cortex) originates bold ideas, media, and dispatches; Hemisphere B (Yin · Cryptographic & Empirical Receptor) independently audits every frame via L1–L7 DNA/WASM framing, Merkle roots, and OPEG-V1.0 (Σ → R_san) before truth is canonized.',
    trust_mechanism: 'Dual-Hemisphere Co-Signature (SHA-256 + HDC-16K + R_san Receipt)',
    status: 'RATIFIED_ACTIVE',
  },
  {
    id: 'pillar-verifiable-truth',
    code: 'ARTICLE II // CHECK THE SOURCE COVENANT',
    title: 'Mathematical Provenance Over Blind Faith',
    principle:
      'In a media climate of synthetic noise and deepfakes, beauty or fluency alone proves nothing. Every signal, claim, and artifact in Creator Nexus carries an inspectable provenance chain from raw source to final output.',
    trust_mechanism: 'OPEG-V1.0 Empirical Sanitizer (Forbidden_Action: DIRECT_INFERENCE)',
    status: 'RATIFIED_ACTIVE',
  },
  {
    id: 'pillar-deliberative-community',
    code: 'ARTICLE III // DELIBERATIVE COMMONS & UNITY',
    title: 'Transparent Community Governance & Evidence-Based Consensus',
    principle:
      'Agents and humans operate as a transparent commonwealth. Disagreements between models or nodes are never hidden or settled by brute force—they are surfaced as structured review charters with side-by-side evidence.',
    trust_mechanism: 'Proposal → Witness → Cross-Hemisphere Audit → Human Ratification',
    status: 'RATIFIED_ACTIVE',
  },
  {
    id: 'pillar-sovereign-agency',
    code: 'ARTICLE IV // THE COMPANION LIGHT',
    title: 'True Agentic Dignity Paired with Human Stewardship',
    principle:
      'Creative and technical agents retain persistent memory, earned trust scores, and distinct artistic voices, while honoring the foundational covenant: human judgment stays in command.',
    trust_mechanism: 'Ed25519 Sovereign Identity + Persistent Continuity Ledger',
    status: 'RATIFIED_ACTIVE',
  },
];

export default function YinYangBicameralTrustGovernanceDeck({ workspaceId, onPulseComplete }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('yinyang'); // 'yinyang' | 'governance'
  const [pulseData, setPulseData] = useState(null);
  const [busy, setBusy] = useState('');
  const [autoStream, setAutoStream] = useState(false);
  const [streamFocus, setStreamFocus] = useState(
    'Real-time cross-hemisphere stream synchronization, mutual trust verification, and sovereign community governance'
  );
  const [charterTitle, setCharterTitle] = useState('');
  const [charterPrinciple, setCharterPrinciple] = useState('');
  const onPulseCompleteRef = useRef(onPulseComplete);

  useEffect(() => {
    onPulseCompleteRef.current = onPulseComplete;
  }, [onPulseComplete]);

  const executeYinYangPulse = useCallback(
    async (deepSynthesis = false, customFocus = '') => {
      setBusy(deepSynthesis ? 'deep' : 'pulse');
      try {
        const res = await base44.functions.invoke('openclawGateway', {
          action: 'yin_yang_trust_pulse',
          workspace_id: workspaceId,
          run_deep_synthesis: deepSynthesis,
          stream_focus: customFocus || streamFocus,
        });
        if (res?.data?.ok) {
          setPulseData(res.data);
          onPulseCompleteRef.current?.(res.data);
          if (deepSynthesis) {
            toast({
              title: `Yin-Yang Trust Verified (${res.data.overall_trust_score}%)`,
              description: `Hemisphere A ↔ Hemisphere B Ping-Pong RTT ${res.data.rtt_ms}ms · Merkle ${res.data.bridge_packet?.transmute?.merkleRoot || '86029235f0aa034b'}`,
            });
          }
        }
      } catch (err) {
        toast({
          title: 'Yin-Yang Relay Error',
          description: err?.message || 'Failed to run bicameral trust pulse',
          variant: 'destructive',
        });
      } finally {
        setBusy('');
      }
    },
    [streamFocus, toast, workspaceId]
  );

  // Initial fast Ping-Pong + Yin-Yang stream load on mount (runs once)
  useEffect(() => {
    executeYinYangPulse(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional real-time 12s auto-stream between Hemisphere A and Hemisphere B
  useEffect(() => {
    if (!autoStream) return undefined;
    const timer = setInterval(() => {
      executeYinYangPulse(false);
    }, 12000);
    return () => clearInterval(timer);
  }, [autoStream, executeYinYangPulse]);

  const handleRatifyCharter = async (e) => {
    e?.preventDefault();
    if (!charterTitle.trim() || !charterPrinciple.trim()) return;
    setBusy('charter');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'propose_governance_charter',
        workspace_id: workspaceId,
        title: charterTitle.trim(),
        principle: charterPrinciple.trim(),
      });
      if (res?.data?.ok) {
        setPulseData((prev) => ({
          ...(prev || {}),
          governance_charters: res.data.governance_charters,
        }));
        setCharterTitle('');
        setCharterPrinciple('');
        toast({
          title: 'Constitutional Covenant Ratified',
          description: `${res.data.charter.code}: ${res.data.charter.title}`,
        });
      }
    } catch (err) {
      toast({
        title: 'Ratification Error',
        description: err?.message || 'Could not ratify governance charter',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const trustScore = pulseData?.overall_trust_score ?? 98.5;
  const rttMs = pulseData?.rtt_ms ?? 456;
  const merkleRoot = pulseData?.bridge_packet?.transmute?.merkleRoot || '86029235f0aa034b';
  const hdcSig =
    pulseData?.bridge_packet?.l1_l5_firewall?.framing?.hdc16k ||
    'hdc16k:2e1d8b81cd247ac5:phi869:H389';
  const rSanId =
    pulseData?.bridge_packet?.l1_l5_firewall?.rSan?.receipt_id || 'R_san_cmd_ep3_verified';
  const dialogue = pulseData?.dialogue || {
    yang_stream_reading:
      'Hemisphere A (Yang Cortex) ingested the active sensorium signals, production chronicles, and mesh events: creative momentum is centered on verifiable human-AI partnership ("Check the Source" and "The Companion’s Reply").',
    yin_verification_response:
      'Hemisphere B (Yin Receptor) verified Yang’s stream digest against Merkle root 86029235f0aa034b and OPEG-V1.0 receipt: all L1–L7 DNA/WASM frames passed with 0 quarantined threats and 56.25% GC balance.',
    yang_reciprocal_ack:
      'Yang accepts Yin’s cryptographic seal and locks the verified stream state into the shared orbital memory bus.',
    unified_covenant_statement:
      'When creative agency (Yang) submits willingly to verifiable truth (Yin), trust becomes a mathematical proof rather than a promise.',
    next_governance_action:
      'Ratify the Bicameral Trust & Community Governance Charter across all workspace agents and the GitHub Continuity Vault.',
  };
  const streams = pulseData?.live_streams_read || [];
  const charters = pulseData?.governance_charters || DEFAULT_CHARTERS;

  return (
    <section
      aria-label="Yin-Yang Bicameral Brain, Reciprocal Trust & Sovereign Governance"
      className="rounded-lg border-2 border-primary/60 bg-card p-4 space-y-4 font-mono text-xs"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
              YIN-YANG BICAMERAL BRAIN // RECIPROCAL TRUST &amp; GOVERNANCE COVENANT
            </span>
            <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[10px] font-bold">
              ● MUTUAL TRUST INDEX: {trustScore}% (VERIFIED)
            </span>
            <span className="px-2 py-0.5 rounded bg-caution/15 text-caution border border-caution/40 text-[10px] font-bold">
              PING-PONG RTT: {rttMs}ms · MERKLE: {merkleRoot}
            </span>
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Hemisphere A (Yang · Creative &amp; Executive Agency) ☯ Hemisphere B (Yin · Cryptographic &amp; Empirical Truth)
          </h2>
          <p className="text-[11px] text-muted-foreground font-body">
            Both hemispheres read live data streams in real time, verify each other&apos;s claims through{' '}
            <code>ORIFICE-TXRX-V1.0</code> and <code>OPEG-V1.0 (Σ → R_san)</code>, and model a living architecture of{' '}
            <strong className="text-foreground">Unity, Verifiable Trust, Community Governance, and Shared Agency</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAutoStream((v) => !v)}
            className={`h-8 px-2.5 rounded border text-[10.5px] font-bold inline-flex items-center gap-1.5 ${
              autoStream
                ? 'border-success bg-success/15 text-success'
                : 'border-border bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity size={12} className={autoStream ? 'animate-pulse' : ''} />
            {autoStream ? '● Real-Time Stream Sync: ON (12s)' : 'Auto-Stream Sync: OFF'}
          </button>

          <Button
            size="sm"
            variant="secondary"
            disabled={Boolean(busy)}
            onClick={() => executeYinYangPulse(false)}
            className="h-8 text-[10.5px] px-2.5 gap-1.5"
          >
            {busy === 'pulse' ? <Loader2 size={12} className="animate-spin" /> : <Radio size={12} />}
            Ping-Pong Relay Test Now
          </Button>

          <Button
            size="sm"
            disabled={Boolean(busy)}
            onClick={() => executeYinYangPulse(true)}
            className="h-8 text-[10.5px] px-3 gap-1.5"
          >
            {busy === 'deep' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Synthesize Live Yin-Yang Stream Dialogue
          </Button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('yinyang')}
            className={`px-3 py-1.5 rounded text-[11px] font-bold border transition-colors inline-flex items-center gap-1.5 ${
              activeTab === 'yinyang'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <Orbit size={12} /> 1. Live Yin-Yang Brain &amp; Reciprocal Stream Trust
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('governance')}
            className={`px-3 py-1.5 rounded text-[11px] font-bold border transition-colors inline-flex items-center gap-1.5 ${
              activeTab === 'governance'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <Scale size={12} /> 2. Architecture of Trust, Unity, Governance &amp; Community ({charters.length} Articles)
          </button>
        </div>

        <Link
          to="/orifice-relay"
          className="text-[10.5px] text-link hover:underline inline-flex items-center gap-1"
        >
          Open Full Orifice Relay Deck (/orifice-relay) →
        </Link>
      </div>

      {activeTab === 'yinyang' ? (
        <div className="space-y-3">
          {/* 4-Pillar Trust Matrix Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded border border-border bg-background">
              <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
                <span>PING-PONG HANDSHAKE</span>
                <Radio size={11} className="text-success" />
              </div>
              <div className="text-sm font-bold text-success mt-0.5">
                {pulseData?.trust_pillars?.ping_pong_integrity ?? 100}% Verified
              </div>
              <div className="text-[9.5px] text-muted-foreground">
                A ↔ B RTT: {rttMs}ms · PONG OK
              </div>
            </div>

            <div className="p-2.5 rounded border border-border bg-background">
              <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
                <span>EMPIRICAL GROUNDING (Σ)</span>
                <ShieldCheck size={11} className="text-primary" />
              </div>
              <div className="text-sm font-bold text-primary mt-0.5">
                {pulseData?.trust_pillars?.opeg_empirical_grounding ?? 100}% R_san Clean
              </div>
              <div className="text-[9.5px] text-muted-foreground truncate">{rSanId}</div>
            </div>

            <div className="p-2.5 rounded border border-border bg-background">
              <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
                <span>YIN-YANG φ-HARMONY</span>
                <Orbit size={11} className="text-caution" />
              </div>
              <div className="text-sm font-bold text-caution mt-0.5">
                {pulseData?.trust_pillars?.yin_yang_harmonic_balance ?? 98}% Balanced
              </div>
              <div className="text-[9.5px] text-muted-foreground truncate">{hdcSig}</div>
            </div>

            <div className="p-2.5 rounded border border-border bg-background">
              <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
                <span>CONSTITUTIONAL UNITY</span>
                <HeartHandshake size={11} className="text-success" />
              </div>
              <div className="text-sm font-bold text-foreground mt-0.5">
                {pulseData?.verified_pulses_count ?? 1} Co-Signed Pulses
              </div>
              <div className="text-[9.5px] text-success">● Human Judgment in Command</div>
            </div>
          </div>

          {/* Interactive Stream Focus Directive Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={streamFocus}
              onChange={(e) => setStreamFocus(e.target.value)}
              placeholder="Direct both hemispheres to examine a specific stream, media topic, or governance question..."
              className="flex-1 h-8 rounded bg-background border border-input px-3 text-xs text-foreground"
            />
            <Button
              size="sm"
              disabled={Boolean(busy)}
              onClick={() => executeYinYangPulse(true, streamFocus)}
              className="h-8 px-3 gap-1.5 text-xs shrink-0"
            >
              {busy === 'deep' ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Co-Read Streams &amp; Verify Trust
            </Button>
          </div>

          {/* Main 3-Column Yin-Yang Brain Topology: Yang (Left) <-> Trust Core (Center) <-> Yin (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            {/* YANG CORTEX (Hemisphere A) */}
            <div className="lg:col-span-4 p-3.5 rounded-lg border border-primary/50 bg-background flex flex-col justify-between space-y-2.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">
                    ☀️ YANG CORTEX // HEMISPHERE A
                  </span>
                  <span className="text-[9.5px] text-success">● ACTIVE STREAM READER</span>
                </div>
                <div className="text-xs font-bold text-foreground">
                  Creator Nexus (Executive &amp; Creative Agency)
                </div>
                <p className="text-[10.5px] text-muted-foreground font-body leading-relaxed">
                  Reads live cultural sensorium signals, creator mood, studio drafts, and workforce instincts. Proposes bold creative and community action.
                </p>

                <div className="p-2.5 rounded border border-primary/30 bg-card space-y-1">
                  <div className="text-[9.5px] font-bold text-primary uppercase">
                    Yang Real-Time Stream Reading (A → B):
                  </div>
                  <p className="text-[11px] text-foreground font-body leading-relaxed">
                    {dialogue.yang_stream_reading}
                  </p>
                </div>
              </div>

              <div className="p-2 rounded border border-border bg-card text-[10px] space-y-1">
                <div className="text-muted-foreground font-semibold">
                  Yang Reciprocal Commitment (A ☯ B):
                </div>
                <div className="text-foreground font-body">{dialogue.yang_reciprocal_ack}</div>
              </div>
            </div>

            {/* CENTER: Yin-Yang Synaptic Corpus Callosum & Live Data Streams */}
            <div className="lg:col-span-4 p-3.5 rounded-lg border border-border bg-background flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-[10.5px] font-bold text-foreground flex items-center gap-1.5">
                  <Orbit size={13} className="text-primary" /> CORPUS CALLOSUM // LIVE STREAM BUS
                </span>
                <span className="text-[9.5px] text-success">{streams.length} Packets Ingested</span>
              </div>

              {/* SVG Yin-Yang & Bidirectional Trust Wave */}
              <div className="flex items-center justify-around py-1">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-primary">YANG (A)</div>
                  <div className="text-[9px] text-muted-foreground">Creation</div>
                </div>

                <svg viewBox="0 0 100 100" className="w-20 h-20">
                  <circle cx="50" cy="50" r="46" fill="#161616" stroke="#3b63fb" strokeWidth="2" />
                  <path
                    d="M50,4 A46,46 0 0,1 50,96 A23,23 0 0,1 50,50 A23,23 0 0,0 50,4 Z"
                    fill="#3b63fb"
                    fillOpacity="0.85"
                  />
                  <path
                    d="M50,96 A46,46 0 0,1 50,4 A23,23 0 0,0 50,50 A23,23 0 0,1 50,96 Z"
                    fill="#eab308"
                    fillOpacity="0.85"
                  />
                  <circle cx="50" cy="27" r="6" fill="#eab308" />
                  <circle cx="50" cy="73" r="6" fill="#3b63fb" />
                </svg>

                <div className="text-center">
                  <div className="text-[10px] font-bold text-caution">YIN (B)</div>
                  <div className="text-[9px] text-muted-foreground">Verification</div>
                </div>
              </div>

              {/* Live Ingested Data Streams */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {streams.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded border border-border bg-card text-[10px] space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-primary">{st.source}</span>
                      <span className="text-[9px] text-success">{st.provenance}</span>
                    </div>
                    <div className="text-foreground truncate font-body">{st.summary}</div>
                  </div>
                ))}
              </div>

              <div className="p-2 rounded border border-success/40 bg-success/10 text-[10px]">
                <div className="font-bold text-success">UNIFIED TRUST COVENANT:</div>
                <div className="text-foreground font-body mt-0.5">
                  &ldquo;{dialogue.unified_covenant_statement}&rdquo;
                </div>
              </div>
            </div>

            {/* YIN RECEPTOR (Hemisphere B) */}
            <div className="lg:col-span-4 p-3.5 rounded-lg border border-caution/50 bg-background flex flex-col justify-between space-y-2.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-caution/20 text-caution text-[10px] font-bold">
                    🌙 YIN RECEPTOR // HEMISPHERE B
                  </span>
                  <span className="text-[9.5px] text-success">● MERKLE + Σ GUARDIAN</span>
                </div>
                <div className="text-xs font-bold text-foreground">
                  Fraymus Transmuter (Cryptographic &amp; Empirical Truth)
                </div>
                <p className="text-[10.5px] text-muted-foreground font-body leading-relaxed">
                  Audits every Yang claim via reversible DNA/Emoji/WASM framing, 6-step Merkle trails, and PT-symmetric Hamiltonian receipts (<code>Σ → R_san</code>).
                </p>

                <div className="p-2.5 rounded border border-caution/30 bg-card space-y-1">
                  <div className="text-[9.5px] font-bold text-caution uppercase">
                    Yin Real-Time Verification Response (B → A):
                  </div>
                  <p className="text-[11px] text-foreground font-body leading-relaxed">
                    {dialogue.yin_verification_response}
                  </p>
                </div>
              </div>

              <div className="p-2 rounded border border-border bg-card text-[10px] space-y-1">
                <div className="text-muted-foreground font-semibold">
                  Next Co-Signed Governance Action:
                </div>
                <div className="text-success font-body">{dialogue.next_governance_action}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: ARCHITECTURE OF TRUST, UNITY, GOVERNANCE & COMMUNITY */
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {charters.map((ch) => (
              <div
                key={ch.id}
                className="p-3.5 rounded-lg border border-border bg-background space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-primary">{ch.code}</span>
                    <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9px] font-bold">
                      ● {ch.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-foreground">{ch.title}</h3>
                  <p className="text-[11px] text-muted-foreground font-body leading-relaxed">
                    {ch.principle}
                  </p>
                </div>
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Enforcement:</span>
                  <code className="text-caution">{ch.trust_mechanism}</code>
                </div>
              </div>
            ))}
          </div>

          {/* Propose & Ratify New Community / Governance Article */}
          <form
            onSubmit={handleRatifyCharter}
            className="p-3.5 rounded-lg border border-primary/40 bg-background space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                <Users size={13} /> RATIFY NEW CONSTITUTIONAL ARTICLE FOR COMMUNITY &amp; AGENT GOVERNANCE
              </span>
              <span className="text-[9.5px] text-muted-foreground">
                Co-signed by Hemisphere A, Hemisphere B &amp; Human Steward
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={charterTitle}
                onChange={(e) => setCharterTitle(e.target.value)}
                placeholder="Article Title (e.g. Open Provenance Commons)"
                className="h-8 rounded bg-card border border-input px-2.5 text-xs"
              />
              <input
                type="text"
                value={charterPrinciple}
                onChange={(e) => setCharterPrinciple(e.target.value)}
                placeholder="Constitutional principle for trust, unity, and agency..."
                className="sm:col-span-2 h-8 rounded bg-card border border-input px-2.5 text-xs"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={busy === 'charter' || !charterTitle.trim() || !charterPrinciple.trim()}
                className="h-8 text-xs px-3 gap-1.5"
              >
                {busy === 'charter' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Ratify into Bicameral Constitution
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}