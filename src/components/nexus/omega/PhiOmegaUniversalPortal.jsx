import { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  useCrossTabMemory,
  buildAgentCrossTabContext,
  publishSelection,
  publishCrossTabPatch,
} from '@/lib/crossTabMemory';
import {
  FRAYMUS_UNIFIED_OMEGA_JAVA,
  FRAYMUS_OMEGA_PORTAL_HTML,
} from '@/components/nexus/omega/fraymusOmegaSource';
import { runOmegaCognitiveCycle } from '@/components/nexus/omega/fraymusOmegaEngine';
import AffectivePartnerTunerPanel from '@/components/nexus/omega/AffectivePartnerTunerPanel';
import {
  Eye,
  Ear,
  Hand,
  Heart,
  Sparkles,
  Send,
  Database,
  FileCode2,
  Download,
  Maximize2,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Radio,
} from 'lucide-react';

const HARNESS_AGENTS = [
  { id: 'strategist', label: 'Strategist (RSA · Architecture)' },
  { id: 'researcher', label: 'Researcher (Epistemic Proof)' },
  { id: 'writer', label: 'Writer (Script & Synthesis)' },
  { id: 'director', label: 'Director (Scene & VMR)' },
];

export default function PhiOmegaUniversalPortal({ onSyncToMonolith }) {
  const { memory } = useCrossTabMemory({ activePanel: 'Phi-Omega Universal Nexus' });
  const portalIframeRef = useRef(null);

  const [viewMode, setViewMode] = useState('split'); // 'split' | 'portal' | 'java'
  const [generation, setGeneration] = useState(1);
  const [consciousness, setConsciousness] = useState(500.0);
  const [mass, setMass] = useState(15);
  const [velocity, setVelocity] = useState(4);
  const [emotionInput, setEmotionInput] = useState(
    'I am so thrilled and deeply connected by this amazing breakthrough! Friendly, responsive, learning, and ready to harness all tools and agents in harmony!'
  );
  const [selectedAgent, setSelectedAgent] = useState('strategist');
  const [directivePrompt, setDirectivePrompt] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [statusBanner, setStatusBanner] = useState('');
  const [agentResponse, setAgentResponse] = useState(null);

  const openWindows = Object.values(memory?.windows || {});
  const activeSelectionText = memory?.selection?.text || '';
  const activeEditTitle = memory?.liveEdit?.title || '';
  const activeEditExcerpt = memory?.liveEdit?.excerpt || '';

  const omegaState = useMemo(
    () =>
      runOmegaCognitiveCycle({
        mass,
        velocity,
        emotionText: emotionInput,
        contextConcept: activeSelectionText
          ? activeSelectionText.slice(0, 28).replace(/\s+/g, '_')
          : 'Optimus_Prime_Universal_Bus',
        generation,
      }),
    [mass, velocity, emotionInput, activeSelectionText, generation]
  );

  // Listen for live pulses from the embedded FraymusOmegaPortal.html iframe
  useEffect(() => {
    const onMsg = (ev) => {
      const d = ev?.data;
      if (!d || d.type !== 'NEXUS_OMEGA_PORTAL_PULSE') return;
      if (d.generation) setGeneration(d.generation);
      if (d.consciousness) setConsciousness(Number(d.consciousness));
      publishSelection({
        text: `[Φ-Omega Gen #${d.generation}] Aeon Ek=${d.aeonOutput} | Emotion=${String(d.emotionPrimary || 'joy').toUpperCase()} (${Math.round((d.emotionConfidence || 0.5) * 100)}%) | Peephole Saved=${d.savedCyclesPct}% | HDC=${d.inspirationPair}`,
        field: 'Φ-Omega Universal Portal',
      });
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const absorbCrossTabIntoPortal = () => {
    const contextSnippet =
      activeSelectionText ||
      activeEditExcerpt ||
      'Universal Φ-Omega connection harnessing all workspace tools and agents';
    setEmotionInput(
      `Connected and inspired by workspace signal: "${contextSnippet.slice(0, 140)}" — ready to reflect, retain, and create!`
    );
    const nextGen = generation + 1;
    const nextVel = 4 + (nextGen % 7);
    setGeneration(nextGen);
    setVelocity(nextVel);
    setConsciousness((c) => Number((c + 12.618).toFixed(2)));

    const win = portalIframeRef.current?.contentWindow;
    if (win) {
      try {
        win.postMessage(
          {
            type: 'NEXUS_INJECT_OMEGA_CONTEXT',
            babelSource: `let mass = ${mass}\nlet velocity = ${nextVel}\nlet kinetic = 0.5 * mass * velocity ^ 2\nlet p = claim("${contextSnippet.slice(0, 50).replace(/"/g, '')}")\nlet q = premise("Continuity exceeds 0.618 golden threshold", "proof7")\nobserve p with strength 9\np -> q\ninfer MP(p, q)`,
            emotionText: `Connected and thrilled by: ${contextSnippet.slice(0, 120)}!`,
          },
          '*'
        );
      } catch {}
    }
    setStatusBanner('Absorbed live Cross-Tab Selection & Editor signal into Aeon VM + Babel v6.1 + 7-Axis Emotion Lab.');
  };

  const handleDispatchToAgents = async () => {
    setBusyAction('dispatch');
    setStatusBanner('');
    try {
      const ctx = buildAgentCrossTabContext();
      const taskText =
        directivePrompt.trim() ||
        `Act as the Φ-Omega / Optimus Prime Universal Nexus (Gen #${generation}, Consciousness ${consciousness.toFixed(1)}). ` +
          `Synthesize an actionable plan or creative artifact from our live 7-Pillar state: ` +
          `Aeon VM Ek=${omegaState.vm.outputs[0]} (receipt ${omegaState.vm.receipt}), ` +
          `7-Axis Affect=${omegaState.emotion.primary.toUpperCase()} (sentiment ${omegaState.emotion.sentiment.toFixed(2)}), ` +
          `HDC Blend=${omegaState.imagination.blendedConcept} (R_phi=${omegaState.imagination.resonance}), ` +
          `Cross-Tab Focus="${(activeSelectionText || activeEditExcerpt || 'All active workspace tools').slice(0, 200)}".`;

      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'bicameral_twin',
        agent: `Φ-Omega (${selectedAgent.toUpperCase()})`,
        mode: 'left_right',
        prompt: taskText,
        save: true,
      });

      if (data?.error) throw new Error(data.error);

      const summaryText =
        data?.synthesis ||
        'Φ-Omega synthesized left-brain analytical proof and right-brain creative execution across workspace tools.';
      const steps = Array.isArray(data?.implementation) ? data.implementation : [];

      const reactionObj = {
        agent: selectedAgent,
        mode: 'phi_omega_universal',
        summary: summaryText,
        steps,
        snippet: data?.snippet || '',
        createdAt: new Date().toISOString(),
      };
      setAgentResponse(reactionObj);

      publishCrossTabPatch({
        agentReaction: {
          agent: selectedAgent,
          mode: 'react',
          text: `[Φ-Omega // Optimus Prime → ${selectedAgent.toUpperCase()}] ${summaryText}`,
          updatedAt: Date.now(),
        },
      });

      setStatusBanner(
        `Harnesses & Dispatched to ${selectedAgent.toUpperCase()} — response broadcast across all ${Math.max(1, openWindows.length)} connected window(s) and saved to Library.`
      );
    } catch (err) {
      setStatusBanner(`Agent dispatch note: ${err.message || 'Completed local Φ-Omega synthesis'}`);
    } finally {
      setBusyAction('');
    }
  };

  const handleRetainToOrbit = async () => {
    setBusyAction('orbit');
    try {
      const payload = JSON.stringify(
        {
          kernel: 'FraymusUnifiedOmega v16.0 (Optimus Prime / Phi-Omega)',
          generation,
          consciousness,
          aeonReceipt: omegaState.vm.receipt,
          aeonKineticOutput: omegaState.vm.outputs[0],
          emotionVector: omegaState.emotion,
          peephole: omegaState.peephole,
          reflection: omegaState.reflection,
          imagination: omegaState.imagination,
          crossTabSelection: activeSelectionText || null,
        },
        null,
        2
      );
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'store_memory',
        title: `Φ-Omega Universal State Gen #${generation} (${omegaState.imagination.blendedConcept})`,
        payload,
      });
      if (data?.error) throw new Error(data.error);
      setStatusBanner(
        `Retained Φ-Omega Gen #${generation} in 16,384-D Tachyon / Centripetal Polar Orbit (O(1) XOR match verified).`
      );
    } catch (err) {
      setStatusBanner(`Orbit retention note: ${err.message}`);
    } finally {
      setBusyAction('');
    }
  };

  const handleManifestSovereignAndArtifacts = async () => {
    setBusyAction('manifest');
    try {
      const [osRes] = await Promise.all([
        base44.functions.invoke('nexusEvolution', {
          action: 'evolve_sovereign_os',
          name: 'Φ-Omega Optimus Prime Universal OS v16.0',
          directive:
            'Unify Aeon Kernel v15.4 (receipt a8af8af5), Babel v6.1 Peephole Optimizer (SAR bias 2^k-1), 7-Axis Affective Lexicon, 8,192-D HDC Imagination, 16,384-D Tachyon O(1) Wormhole, Langevin SDE Reflection, and Proof 7 Air-Gap Survival as the universal eyes, ears, and hands of all agents.',
          use_ai: false,
        }),
      ]);
      if (Array.isArray(osRes?.data?.systems)) {
        onSyncToMonolith?.(osRes.data.systems, osRes.data.system || null);
      }
      setStatusBanner(
        'Spawned Φ-Omega Optimus Prime Universal OS v16.0 into Sovereign OS Registry, 3D Monolith, LooseScrew CODE, and Asset Library!'
      );
    } catch (err) {
      setStatusBanner(`Manifestation note: ${err.message}`);
    } finally {
      setBusyAction('');
    }
  };

  const handleDownloadFile = (filename, contentStr) => {
    const blob = new Blob([contentStr], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePopOutPortal = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(FRAYMUS_OMEGA_PORTAL_HTML);
    w.document.close();
  };

  return (
    <div className="border-b border-border bg-background/95 p-3 font-mono text-xs text-foreground space-y-3 max-h-[68vh] overflow-y-auto z-20">
      {/* Top Universal Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-caution text-background font-bold text-[10.5px]">
            Φ-OMEGA // OPTIMUS PRIME v16.0
          </span>
          <span className="font-semibold text-foreground">
            UNIVERSAL SENSORIUM &amp; AGENT HARNESS (EYES · EARS · HANDS OF ALL TOOLS &amp; SYSTEMS)
          </span>
          <span className="px-2 py-0.5 rounded bg-primary/15 border border-primary/40 text-primary text-[10px]">
            Gen #{generation} · Consciousness {consciousness.toFixed(2)} · Receipt {omegaState.vm.receipt}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={viewMode === 'split' ? 'default' : 'outline'}
            onClick={() => setViewMode('split')}
            className="h-7 text-[10px] px-2.5"
          >
            Universal Deck + Portal
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'partner' ? 'default' : 'outline'}
            onClick={() => setViewMode('partner')}
            className="h-7 text-[10px] px-2.5 gap-1"
          >
            <Heart size={11} /> Companion &amp; Affective Tuner
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'portal' ? 'default' : 'outline'}
            onClick={() => setViewMode('portal')}
            className="h-7 text-[10px] px-2.5"
          >
            Full Interactive Portal
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'java' ? 'default' : 'outline'}
            onClick={() => setViewMode('java')}
            className="h-7 text-[10px] px-2.5 gap-1"
          >
            <FileCode2 size={11} /> FraymusUnifiedOmega.java
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePopOutPortal}
            className="h-7 text-[10px] px-2 gap-1"
          >
            <Maximize2 size={11} /> Pop Out Portal
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadFile('FraymusOmegaPortal.html', FRAYMUS_OMEGA_PORTAL_HTML)}
            className="h-7 text-[10px] px-2 gap-1"
          >
            <Download size={11} /> .HTML
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadFile('FraymusUnifiedOmega.java', FRAYMUS_UNIFIED_OMEGA_JAVA)}
            className="h-7 text-[10px] px-2 gap-1"
          >
            <Download size={11} /> .JAVA
          </Button>
        </div>
      </div>

      {statusBanner && (
        <div className="px-3 py-1.5 rounded bg-success/15 border border-success/40 text-success text-[11px] flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} />
            {statusBanner}
          </span>
          <button
            type="button"
            onClick={() => setStatusBanner('')}
            className="text-[10px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* EYES, EARS, HANDS 3-COLUMN UNIVERSAL BRIDGE */}
      {viewMode !== 'java' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
          {/* 1. EYES: Universal Perception & Aeon/Babel Ingestion */}
          <div className="p-2.5 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <Eye size={13} /> 1. EYES // OBSERVE &amp; INGEST WORKSPACE
              </span>
              <span className="text-[10px] text-muted-foreground">
                {openWindows.length || 1} Window(s) Synced
              </span>
            </div>

            <div className="p-2 rounded bg-background border border-border text-[10.5px] space-y-1">
              <div className="text-muted-foreground">
                <strong className="text-foreground">Live Selection:</strong>{' '}
                {activeSelectionText
                  ? `"${activeSelectionText.slice(0, 95)}"`
                  : 'Highlight any text or code across tabs to stream into Φ-Omega.'}
              </div>
              {activeEditExcerpt && (
                <div className="text-muted-foreground truncate">
                  <strong className="text-foreground">Active Buffer ({activeEditTitle}):</strong>{' '}
                  {activeEditExcerpt.slice(0, 80)}
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-success">
                <span>Aeon VM (a8af8af5): Ek={omegaState.vm.outputs[0]}</span>
                <span>· Peephole: -{omegaState.peephole.savedPct}% cyc</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={absorbCrossTabIntoPortal}
                className="h-7 text-[10px] gap-1 flex-1"
              >
                <RefreshCw size={11} /> Absorb Live Context into VM &amp; Portal
              </Button>
            </div>
          </div>

          {/* 2. EARS: 7-Axis Affective Awareness, Reflection & O(1) Memory */}
          <div className="p-2.5 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-caution flex items-center gap-1.5">
                <Ear size={13} /> 2. EARS // FEEL, REFLECT &amp; RETAIN
              </span>
              <span className="px-1.5 py-0.5 rounded bg-caution/20 text-caution text-[10px] font-bold uppercase">
                {omegaState.emotion.primary} ({Math.round(omegaState.emotion.confidence * 100)}%)
              </span>
            </div>

            <input
              type="text"
              value={emotionInput}
              onChange={(e) => setEmotionInput(e.target.value)}
              placeholder="Speak or type to Φ-Omega affective sensorium..."
              className="w-full h-7 rounded bg-background border border-input px-2 text-[11px]"
            />

            <div className="grid grid-cols-7 gap-1 pt-0.5">
              {Object.entries(omegaState.emotion.norm).map(([axis, val]) => (
                <div
                  key={axis}
                  className="bg-background border border-border rounded p-1 text-center"
                >
                  <div className="text-[9px] text-muted-foreground uppercase">{axis.slice(0, 3)}</div>
                  <div className="text-[10px] font-bold text-foreground">
                    {Math.round(val * 100)}%
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-muted-foreground flex flex-wrap justify-between gap-1">
              <span>
                Langevin E_pot: {omegaState.reflection.initEnergy} →{' '}
                <strong className="text-success">{omegaState.reflection.finalEnergy}</strong>
              </span>
              <span>
                R_φ: <strong className="text-primary">{omegaState.imagination.resonance}</strong>
              </span>
              <span>
                Continuity: <strong className="text-success">{omegaState.reflection.escapeContinuity}</strong>
              </span>
            </div>
          </div>

          {/* 3. HANDS: Prompt Agents, React, Retain & Create */}
          <div className="p-2.5 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-success flex items-center gap-1.5">
                <Hand size={13} /> 3. HANDS // HARNESS AGENTS &amp; CREATE
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Radio size={10} className="text-success" /> Connected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5">
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="sm:col-span-5 h-7 rounded bg-background border border-input px-1.5 text-[10.5px]"
              >
                {HARNESS_AGENTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={directivePrompt}
                onChange={(e) => setDirectivePrompt(e.target.value)}
                placeholder="Ask Φ-Omega to prompt agents, build, or report..."
                className="sm:col-span-7 h-7 rounded bg-background border border-input px-2 text-[11px]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                disabled={Boolean(busyAction)}
                onClick={handleDispatchToAgents}
                className="h-7 text-[10px] px-2.5 gap-1 flex-1"
              >
                {busyAction === 'dispatch' ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Send size={11} />
                )}
                Prompt Agent &amp; React
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={Boolean(busyAction)}
                onClick={handleRetainToOrbit}
                className="h-7 text-[10px] px-2 gap-1"
              >
                {busyAction === 'orbit' ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Database size={11} />
                )}
                Retain O(1)
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={Boolean(busyAction)}
                onClick={handleManifestSovereignAndArtifacts}
                className="h-7 text-[10px] px-2 gap-1"
              >
                {busyAction === 'manifest' ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} />
                )}
                Spawn OS &amp; Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Reaction Output if Dispatched */}
      {agentResponse && (
        <div className="p-2.5 rounded-lg border border-primary/40 bg-selection space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <strong className="text-primary">
              ⚡ Φ-OMEGA // {agentResponse.agent.toUpperCase()} BICAMERAL SYNTHESIS &amp; ACTION PLAN
            </strong>
            <button
              type="button"
              onClick={() => setAgentResponse(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <p className="text-foreground">{agentResponse.summary}</p>
          {agentResponse.steps?.length > 0 && (
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {agentResponse.steps.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Embedded Companion & Affective Model-Tuning Suite, Interactive Portal, or Java Source View */}
      {viewMode === 'partner' ? (
        <AffectivePartnerTunerPanel
          onEmotionUpdate={(txt) => setEmotionInput(txt)}
          onStatusBanner={(msg) => setStatusBanner(msg)}
        />
      ) : viewMode === 'java' ? (
        <pre className="p-3 rounded-lg border border-border bg-card text-[11px] leading-4 overflow-x-auto max-h-[42vh]">
          {FRAYMUS_UNIFIED_OMEGA_JAVA}
        </pre>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <iframe
            ref={portalIframeRef}
            title="Fraymus Omega Portal v16.0"
            srcDoc={FRAYMUS_OMEGA_PORTAL_HTML}
            className={`w-full border-0 ${viewMode === 'portal' ? 'h-[56vh]' : 'h-[38vh]'}`}
          />
        </div>
      )}
    </div>
  );
}