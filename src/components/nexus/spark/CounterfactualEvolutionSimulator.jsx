import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import ModelfileArtifactManager from '@/components/nexus/models/ModelfileArtifactManager';
import {
  Activity,
  Sparkles,
  Users,
  Zap,
  ArrowRight,
  Sliders,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function CounterfactualEvolutionSimulator({
  initialNarration = '',
  initialHookTitle = '',
  initialSignatureTwist = '',
  onApplyEvolvedScript,
}) {
  const [activeTab, setActiveTab] = useState('simulator');
  const [narration, setNarration] = useState(
    initialNarration ||
      'Most AI benchmarks measure static token recall instead of real-time kernel adaptation. When four autonomous agents share a persistent polar memory bus, kernel execution cycles drop by 20 percent from 1363 to 1103 cycles. Instead of generating random drafts, agentic variation operators mutate register strides directly inside the sandbox. The voice and captions in this video were made with AI.'
  );
  const [hookTitle, setHookTitle] = useState(
    initialHookTitle || 'Why 4 Co-Evolving Agents Beat Single-Model Scaling'
  );
  const [signatureTwist, setSignatureTwist] = useState(
    initialSignatureTwist ||
      'Agentic Variation Operators mutate micro-architectural strides instead of guessing tokens'
  );
  const [useLlmEvolution, setUseLlmEvolution] = useState(true);

  const [artifacts, setArtifacts] = useState([]);
  const [simResult, setSimResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialNarration && initialNarration.trim()) {
      setNarration(initialNarration);
    }
  }, [initialNarration]);

  const loadInitial = useCallback(async () => {
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'list_model_artifacts',
      });
      if (Array.isArray(data?.artifacts)) {
        setArtifacts(data.artifacts);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const runSimulatorAndEvolve = useCallback(
    async (evolveAi = false) => {
      if (!narration.trim() || busy) return;
      setBusy(true);
      setError('');
      try {
        const { data } = await base44.functions.invoke('nexusEvolution', {
          action: 'run_counterfactual_evolution_loop',
          narration,
          hook_title: hookTitle,
          signature_twist: signatureTwist,
          evolve_ai: evolveAi,
          use_llm: evolveAi && useLlmEvolution,
        });
        if (data?.error) throw new Error(data.error);
        setSimResult(data);
        if (Array.isArray(data?.artifacts)) {
          setArtifacts(data.artifacts);
        }
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Counterfactual simulation failed');
      } finally {
        setBusy(false);
      }
    },
    [narration, hookTitle, signatureTwist, useLlmEvolution, busy]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (!simResult) runSimulatorAndEvolve(false);
    }, 250);
    return () => clearTimeout(t);
  }, []); // initial baseline projection

  const activePreflight = simResult?.evolvedPreflight || simResult?.baselinePreflight;
  const baselinePreflight = simResult?.baselinePreflight;

  const handleApplyTemplateToTest = (art) => {
    setActiveTab('simulator');
    if (art?.content) {
      const populated = String(art.content)
        .replace(/\{\{topic\}\}/g, hookTitle)
        .replace(/\{\{hook_title\}\}/g, hookTitle)
        .replace(/\{\{signature_twist\}\}/g, signatureTwist)
        .replace(/\{\{generation\}\}/g, String(art.evolution_generation || 1));
      setNarration(
        `${hookTitle}. ${signatureTwist}. Tested via [${art.name}]. The voice and captions in this video were made with AI.`
      );
      setTimeout(() => runSimulatorAndEvolve(true), 120);
    }
  };

  return (
    <div className="p-3.5 border-b border-border bg-background/95 font-mono text-xs text-foreground space-y-3 z-20 max-h-[64vh] overflow-y-auto">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-primary" />
          <div>
            <div className="font-semibold text-xs sm:text-sm flex flex-wrap items-center gap-2">
              <span>COUNTERFACTUAL AUDIENCE PRE-FLIGHT SIMULATOR &amp; TERNARY ({'{-1, 0, +1}'}) MODEL LAB</span>
              {activePreflight && (
                <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[10px]">
                  Projected Retention: {activePreflight.overallRetentionPct}% · Surprise:{' '}
                  {activePreflight.avgSurpriseBits}b
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Simulate 4-persona audience retention &amp; information surprise before publishing, evolve scripts + AI prompts from projections, and manage Modelfiles, models, and ternary {'{-1, 0, +1}'} weights.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={activeTab === 'simulator' ? 'default' : 'outline'}
            onClick={() => setActiveTab('simulator')}
            className="h-7 text-[10.5px] font-mono gap-1"
          >
            <Activity size={11} /> Pre-Flight Simulator &amp; AI Evolution
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'models' ? 'default' : 'outline'}
            onClick={() => setActiveTab('models')}
            className="h-7 text-[10.5px] font-mono gap-1"
          >
            <Sliders size={11} /> Modelfiles · Prompts · Ternary {'{-1,0,+1}'} ({artifacts.length})
          </Button>
        </div>
      </div>

      {error && <div className="text-destructive text-[11px]">{error}</div>}

      {activeTab === 'models' ? (
        <ModelfileArtifactManager
          artifacts={artifacts}
          onArtifactsChange={setArtifacts}
          onSelectForTest={handleApplyTemplateToTest}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left: Script / Content Pre-Flight Input + Active Ternary Ensemble Summary */}
          <div className="lg:col-span-5 space-y-2.5 bg-card p-3 rounded-lg border border-border">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="font-semibold text-primary">1. CONTENT / SCRIPT PRE-FLIGHT INPUT</span>
              <span className="text-muted-foreground">
                Active Ternary Ensemble:{' '}
                <strong className="text-success">
                  +{artifacts.filter((a) => Number(a.ternary_state) === 1).length}
                </strong>{' '}
                /{' '}
                <strong className="text-muted-foreground">
                  0:{artifacts.filter((a) => Number(a.ternary_state) === 0).length}
                </strong>{' '}
                /{' '}
                <strong className="text-destructive">
                  -{artifacts.filter((a) => Number(a.ternary_state) === -1).length}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={hookTitle}
                onChange={(e) => setHookTitle(e.target.value)}
                placeholder="Hook Title (<15 words)..."
                className="h-8 rounded bg-background border border-input px-2.5 text-xs"
              />
              <input
                type="text"
                value={signatureTwist}
                onChange={(e) => setSignatureTwist(e.target.value)}
                placeholder="Signature Contrarian Twist..."
                className="h-8 rounded bg-background border border-input px-2.5 text-xs"
              />
            </div>

            <textarea
              rows={5}
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Paste script, draft, or prompt output to test counterfactual audience retention before publishing..."
              className="w-full rounded bg-background border border-input p-2.5 text-[11px] leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLlmEvolution}
                  onChange={(e) => setUseLlmEvolution(e.target.checked)}
                />
                <Sparkles size={11} className="text-primary" /> Deep LLM + Ternary Co-Evolution
              </label>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => runSimulatorAndEvolve(false)}
                  className="h-7 text-[10.5px] font-mono"
                >
                  Test Baseline
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => runSimulatorAndEvolve(true)}
                  className="h-7 text-[10.5px] font-mono gap-1"
                >
                  {busy ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                  Evolve Content &amp; AI from Projections
                </Button>
              </div>
            </div>

            {/* Evolved Candidate Comparison & 1-Click Adoption */}
            {simResult?.evolvedNarration && simResult.retentionDelta > 0 && (
              <div className="p-2.5 rounded border border-success/40 bg-success/10 space-y-1.5">
                <div className="flex items-center justify-between text-[10.5px] font-semibold text-success">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} /> AI Evolved on Counterfactual Projections (+
                    {simResult.retentionDelta}% Retention Lift)
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setNarration(simResult.evolvedNarration);
                      onApplyEvolvedScript?.(simResult.evolvedNarration);
                    }}
                    className="h-6 px-2 text-[10px]"
                  >
                    Adopt Evolved Script
                  </Button>
                </div>
                <p className="text-[10.5px] text-foreground bg-background/80 p-2 rounded border border-border">
                  {simResult.evolvedNarration}
                </p>
                {simResult.evolvedPromptDirective && (
                  <div className="text-[10px] text-primary">
                    {simResult.evolvedPromptDirective}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: 4-Persona Projections + Beat Waveform + Bottleneck Inspector */}
          <div className="lg:col-span-7 space-y-2.5 bg-card p-3 rounded-lg border border-border">
            {activePreflight ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-[11px] text-foreground">
                    2. 4-PERSONA COUNTERFACTUAL AUDIENCE TELEMETRY
                  </span>
                  {baselinePreflight && simResult?.evolvedPreflight && (
                    <div className="flex items-center gap-1.5 text-[10.5px]">
                      <span className="text-muted-foreground">
                        Baseline: {baselinePreflight.overallRetentionPct}%
                      </span>
                      <ArrowRight size={11} className="text-primary" />
                      <span className="text-success font-bold">
                        Evolved: {simResult.evolvedPreflight.overallRetentionPct}% (+
                        {simResult.retentionDelta}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(activePreflight.personas || []).map((p) => (
                    <div
                      key={p.id}
                      className="p-2 rounded border border-border bg-background flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                          <Users size={11} style={{ color: p.color }} />
                          {p.name}
                        </span>
                        <span
                          className="font-bold text-[11px]"
                          style={{ color: p.retentionPct >= 78 ? '#47C686' : '#E5A93B' }}
                        >
                          {p.retentionPct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded bg-secondary overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.max(8, p.retentionPct))}%`,
                            backgroundColor: p.color,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{p.verdict}</p>
                    </div>
                  ))}
                </div>

                {/* Beat-by-Beat Retention & Surprise Strip */}
                {activePreflight.sentenceTelemetry?.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>BEAT-BY-BEAT RETENTION &amp; INFORMATION SURPRISE CURVE</span>
                      <span>
                        Hook Velocity: {activePreflight.hookVelocity}% ·{' '}
                        {activePreflight.sentenceTelemetry.length} Beats
                      </span>
                    </div>
                    <div className="flex items-end gap-1.5 h-14 p-2 rounded bg-background border border-border">
                      {activePreflight.sentenceTelemetry.map((s) => {
                        const hasBottleneck = Boolean(s.bottleneckReason);
                        const h = Math.max(22, Math.min(100, s.compositeRetention));
                        return (
                          <div
                            key={s.index}
                            title={`Beat #${s.index} (${s.wordCount}w) · Retention: ${s.compositeRetention}% · Surprise: ${s.surpriseBits}b`}
                            style={{ height: `${h}%` }}
                            className={`flex-1 rounded-sm transition-all ${
                              s.isDisclosure
                                ? 'bg-primary'
                                : hasBottleneck
                                ? 'bg-caution'
                                : 'bg-success/80'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {activePreflight.bottlenecksCount > 0 && (
                  <div className="p-2 rounded border border-caution/40 bg-caution/10 text-[10.5px] space-y-1">
                    <div className="font-semibold text-caution flex items-center gap-1.5">
                      <AlertTriangle size={12} /> {activePreflight.bottlenecksCount} Pacing / Surprise Bottleneck(s)
                    </div>
                    {activePreflight.sentenceTelemetry
                      .filter((s) => s.bottleneckReason)
                      .slice(0, 2)
                      .map((s) => (
                        <div key={s.index} className="text-foreground">
                          • Beat #{s.index}: {s.bottleneckReason}
                        </div>
                      ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                Running counterfactual audience pre-flight simulation...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}