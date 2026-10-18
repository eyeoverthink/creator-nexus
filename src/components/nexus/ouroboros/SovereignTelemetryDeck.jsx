import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Radio, BrainCircuit, Zap, Sliders, GitMerge, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EMOTION_COLORS = {
  curiosity: '#60A5FA', // blue — Engine wants to explore — more GAMMA mutations
  joy: '#34D399',       // green — Recent improvement — engine is confident
  fear: '#F87171',      // red — Stagnation risk — engine goes conservative
  sadness: '#A78BFA',   // purple — No progress — engine is deflated
  surprise: '#FBBF24',  // amber — Unexpected result — recalibrating
  anger: '#EF4444',     // deep red — Repeated failure — frustration building
  neutral: '#94A3B8',
};

export const EMOTION_MEANINGS = {
  curiosity: 'Engine wants to explore — more GAMMA mutations',
  joy: 'Recent improvement — engine is confident',
  fear: 'Stagnation risk — engine goes conservative',
  sadness: 'No progress — engine is deflated',
  surprise: 'Unexpected result — recalibrating',
  anger: 'Repeated failure — frustration building',
};

const DIAL_ORDER = [
  'exploration_rate',
  'risk_budget',
  'patience',
  'focus',
  'learning_rate',
  'trust_weight',
  'save_frequency',
];

function getDialColor(val) {
  if (val < 0.3) return '#F87171'; // red (suppressed)
  if (val > 0.7) return '#34D399'; // green (elevated)
  return '#60A5FA'; // blue (nominal 0.3–0.7)
}

function getDialStatusLabel(val) {
  if (val < 0.3) return 'SUPPRESSED';
  if (val > 0.7) return 'ELEVATED';
  return 'NOMINAL';
}

export default function SovereignTelemetryDeck({
  emotionState,
  emotionSteering,
  sentiment,
  connectionStatus = 'connected',
  streamEventsCount = 0,
  lastHeartbeat = '',
  sseUrl = '',
  busy = false,
  onToggleStream,
  onEmotionTick,
  onEmotionEvent,
}) {
  if (!emotionState && !sentiment) return null;

  // Build Emotion Ring data directly from emotionState.emotions[] per Spec 3a
  const rawEmotions = Array.isArray(emotionState?.emotions) ? emotionState.emotions : [];
  const sortedEmotions = [...rawEmotions].sort((a, b) => Number(b.intensity || 0) - Number(a.intensity || 0));
  const dominantEmotion = sortedEmotions[0] || { name: 'neutral', intensity: 0.5, trigger: 'Homeostatic baseline' };
  const dominantName = String(dominantEmotion.name || 'neutral').toLowerCase();
  const dominantPct = Math.round(Number(dominantEmotion.intensity || 0) * 100);
  const dominantColor = EMOTION_COLORS[dominantName] || '#60A5FA';

  const ringChartData =
    sortedEmotions.length > 0
      ? [
          ...sortedEmotions.map((em) => {
            const name = String(em.name || 'neutral').toLowerCase();
            return {
              name,
              value: Math.max(4, Math.round(Number(em.intensity || 0) * 100)),
              rawIntensity: Number(em.intensity || 0),
              trigger: em.trigger || '',
              color: EMOTION_COLORS[name] || '#60A5FA',
            };
          }),
          // Remaining ring capacity for proportional fill visualization
          ...(sortedEmotions.reduce((acc, e) => acc + Number(e.intensity || 0), 0) < 1
            ? [
                {
                  name: 'baseline',
                  value: Math.max(
                    5,
                    Math.round((1 - sortedEmotions.reduce((acc, e) => acc + Number(e.intensity || 0), 0)) * 100)
                  ),
                  rawIntensity: 0,
                  trigger: 'Unallocated affective headroom',
                  color: '#262626',
                },
              ]
            : []),
        ]
      : (sentiment?.emotionRing || []).map((item) => ({
          name: item.name,
          value: item.value,
          rawIntensity: item.value / 100,
          trigger: '',
          color: item.color,
        }));

  const valence = Number(emotionState?.valence ?? 0);
  const arousal = Number(emotionState?.arousal ?? 0.45);
  const dopamineVal = Number(emotionState?.dopamine ?? sentiment?.dopamine?.rpeDelta ?? 0);
  const somaticCount = Number(emotionState?.somatic_markers ?? 0);
  const tickCount = Number(emotionState?.tick ?? 0);
  const bodyVec = emotionState?.body || {};

  // Build 7 Steering Dials from emotionState.dials per Spec 3b
  const rawDials = emotionState?.dials || {};
  const dialsList = DIAL_ORDER.map((key) => {
    const val = Number(rawDials[key] ?? 0.5);
    return {
      key,
      value: val,
      pct: Math.round(val * 100),
      color: getDialColor(val),
      status: getDialStatusLabel(val),
    };
  });

  // Build Mutation Strategy data from emotionSteering per Spec 3c
  const steering = emotionSteering || {
    exploration_rate: rawDials.exploration_rate ?? 0.5,
    risk_budget: rawDials.risk_budget ?? 0.41,
    patience: rawDials.patience ?? 0.49,
    curiosity: sortedEmotions.find((e) => e.name === 'curiosity')?.intensity ?? 0,
    fear: sortedEmotions.find((e) => e.name === 'fear')?.intensity ?? 0,
    alpha_runs: 1,
    beta_runs: 1,
    gamma_runs: 1,
    total_candidates: 3,
    improved: false,
    fitness_delta: 0.0,
  };

  const totalRuns = Math.max(1, Number(steering.total_candidates || 3));
  const statusDotClass =
    connectionStatus === 'connected'
      ? 'bg-success'
      : connectionStatus === 'reconnecting'
      ? 'bg-caution'
      : 'bg-muted-foreground';
  const statusLabel =
    connectionStatus === 'connected'
      ? 'LIVE'
      : connectionStatus === 'reconnecting'
      ? 'RECONNECTING'
      : 'POLLING';

  return (
    <section className="space-y-4">
      {/* Top Status Strip: SSE Stream Status + Somatic Markers Badge + Dopamine RPE Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 4b. SSE Connection Status Indicator */}
        <div className="p-3.5 rounded-md border border-border bg-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              {connectionStatus === 'connected' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${statusDotClass}`} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground">
                <Radio size={13} className="text-primary shrink-0" />
                <span className="truncate">SSE TELEMETRY · {statusLabel}</span>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground truncate" title={sseUrl}>
                Packets: {streamEventsCount} · Sync: {lastHeartbeat ? lastHeartbeat.slice(11, 19) : 'LIVE'} UTC
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleStream}
            className="px-2.5 py-1 rounded text-[11px] font-mono border border-border bg-secondary hover:bg-hover text-foreground shrink-0"
          >
            {connectionStatus === 'polling' ? 'Connect SSE' : 'Reconnect'}
          </button>
        </div>

        {/* 3d. Somatic Marker Count + Emotion Tick/Event Controls */}
        <div className="p-3.5 rounded-md border border-border bg-card flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">DAMASIO LAYER 5</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded border bg-primary/15 border-primary/40 text-primary">
                🧠 {somaticCount} somatic markers stored
              </span>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground truncate mt-1">
              Interoceptive Tick #{tickCount} · Log Depth: {emotionState?.log_depth ?? tickCount}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onEmotionTick && (
              <Button size="sm" variant="outline" disabled={busy} onClick={onEmotionTick} title="Advance emotional timestep (decay + reappraise)">
                <RefreshCw size={12} /> Tick
              </Button>
            )}
            {onEmotionEvent && (
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  onEmotionEvent({
                    event_type: 'novelty_spike',
                    description: 'Operator triggered curiosity exploration pulse from /argon console',
                    body_perturbation: { novelty: 0.25, energy: 0.12, uncertainty: -0.1 },
                    appraisal_hints: { novelty: 0.9, goal_relevance: 0.85, control: 0.8 },
                  })
                }
                title="Inject novelty/curiosity appraisal event into EmotionEngine"
              >
                <Activity size={12} /> Pulse
              </Button>
            )}
          </div>
        </div>

        {/* 3e. Dopamine Indicator */}
        <div className="p-3.5 rounded-md border border-border bg-card flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between gap-2 text-xs font-mono">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Zap size={13} className="text-primary" /> DOPAMINE SIGNAL
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${
                dopamineVal >= 0
                  ? 'bg-success/15 border-success/40 text-success'
                  : 'bg-destructive/15 border-destructive/40 text-destructive'
              }`}
            >
              Dopamine: {dopamineVal >= 0 ? `+${dopamineVal.toFixed(2)}` : dopamineVal.toFixed(2)}{' '}
              {dopamineVal >= 0 ? '▲' : '▼'}
            </span>
          </div>
          <div className="w-full h-2 rounded bg-secondary overflow-hidden border border-border">
            <div
              className={`h-full transition-all duration-300 ${dopamineVal >= 0 ? 'bg-success' : 'bg-destructive'}`}
              style={{ width: `${Math.min(100, Math.max(8, Math.round(((dopamineVal + 1) / 2) * 100)))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>Valence: {valence.toFixed(2)}</span>
            <span>Arousal: {arousal.toFixed(2)}</span>
            <span>Coherence: {Number(bodyVec.coherence ?? 0.95).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Deck: 3a Emotion Ring + 3b 7 Steering Dials + 3c Emotion-Steered Mutation Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 3a. Emotion Ring */}
        <div className="lg:col-span-4 p-4 rounded-md border border-border bg-card flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-mono">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <BrainCircuit size={14} /> EMOTION RING (OCC / BARRETT)
            </span>
            <span
              className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase"
              style={{ backgroundColor: `${dominantColor}22`, color: dominantColor, border: `1px solid ${dominantColor}66` }}
            >
              {dominantName} · {dominantPct}%
            </span>
          </div>

          <div className="relative h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ringChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="#1B1B1B"
                  strokeWidth={2}
                >
                  {ringChartData.map((entry, i) => (
                    <Cell key={`${entry.name}-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1B1B1B',
                    borderColor: '#393939',
                    fontSize: '11px',
                    color: '#F2F2F2',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: dominantColor }}>
                {dominantName}
              </span>
              <span className="text-lg font-mono font-semibold text-foreground">{dominantPct}%</span>
              <span className="text-[10px] font-mono text-muted-foreground mt-0.5">
                Valence: {valence.toFixed(2)} | Arousal: {arousal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Active emotions list + trigger + Dopamine line */}
          <div className="space-y-1.5 text-[11px] font-mono border-t border-border pt-2.5">
            {sortedEmotions.map((em, idx) => {
              const eName = String(em.name || 'neutral').toLowerCase();
              const eColor = EMOTION_COLORS[eName] || '#60A5FA';
              return (
                <div key={`${eName}-${idx}`} className="p-1.5 rounded bg-secondary border border-border/60 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold uppercase" style={{ color: eColor }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: eColor }} />
                      {eName}
                    </span>
                    <span className="text-foreground font-semibold">
                      {(Number(em.intensity || 0) * 100).toFixed(0)}% ({Number(em.intensity || 0).toFixed(2)})
                    </span>
                  </div>
                  {em.trigger && <div className="text-[10px] text-muted-foreground truncate">Trigger: {em.trigger}</div>}
                  {EMOTION_MEANINGS[eName] && (
                    <div className="text-[10px] text-muted-foreground/80">{EMOTION_MEANINGS[eName]}</div>
                  )}
                </div>
              );
            })}

            {/* Layer 1 Body Vector mini-grid */}
            {Object.keys(bodyVec).length > 0 && (
              <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] text-muted-foreground">
                {['energy', 'integrity', 'bond', 'uncertainty', 'novelty', 'coherence', 'deviation'].map((k) =>
                  bodyVec[k] !== undefined ? (
                    <div key={k} className="px-1.5 py-0.5 rounded bg-background border border-border/60 truncate">
                      <span className="uppercase">{k.slice(0, 4)}:</span>{' '}
                      <span className="text-foreground">{Number(bodyVec[k]).toFixed(2)}</span>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3b. Steering Dials (7 Horizontal Gauge Bars) */}
        <div className="lg:col-span-4 p-4 rounded-md border border-border bg-card flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-mono">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <Sliders size={14} /> STEERING DIALS (LAYER 4 MODULATION)
            </span>
            <span className="text-[10px] text-muted-foreground">&lt;0.3 RED · 0.3-0.7 BLUE · &gt;0.7 GREEN</span>
          </div>

          <div className="space-y-2.5 my-auto">
            {dialsList.map((dial) => (
              <div key={dial.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-foreground font-medium">{dial.key}</span>
                  <span className="tabular-nums font-semibold" style={{ color: dial.color }}>
                    {dial.value.toFixed(2)} · {dial.status}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded bg-secondary overflow-hidden border border-border">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(4, dial.pct))}%`,
                      backgroundColor: dial.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3c. Emotion-Steered Mutation Strategy Panel */}
        <div className="lg:col-span-4 p-4 rounded-md border border-border bg-card flex flex-col justify-between space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-border pb-2 text-xs">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <GitMerge size={14} /> EMOTION-STEERED MUTATION STRATEGY
            </span>
            <span className="text-[11px] text-muted-foreground">{totalRuns} CANDIDATES</span>
          </div>

          <div className="p-2.5 rounded bg-secondary border border-border text-xs flex items-center justify-between">
            <span>
              Curiosity: <strong className="text-[#60A5FA]">{Number(steering.curiosity || 0).toFixed(2)}</strong>
            </span>
            <span>
              Fear: <strong className="text-[#F87171]">{Number(steering.fear || 0).toFixed(2)}</strong>
            </span>
            <span>
              Explore: <strong className="text-foreground">{Number(steering.exploration_rate || 0).toFixed(2)}</strong>
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              {
                label: 'ALPHA (conservative)',
                sub: 'ALPHA_AST safe algebraic hoist',
                runs: Number(steering.alpha_runs ?? 1),
                color: '#60A5FA',
              },
              {
                label: 'BETA  (chaos)',
                sub: 'BETA_RULE30 Wolfram bit-chaos',
                runs: Number(steering.beta_runs ?? 1),
                color: '#FBBF24',
              },
              {
                label: 'GAMMA (radical)',
                sub: 'GAMMA_BICAMERAL closed-form Gauss',
                runs: Number(steering.gamma_runs ?? 1),
                color: '#34D399',
              },
            ].map((row) => {
              const widthPct = Math.min(100, Math.max(12, Math.round((row.runs / totalRuns) * 100)));
              return (
                <div key={row.label} className="p-2.5 rounded bg-secondary/70 border border-border space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{row.label}</span>
                    <span className="font-semibold" style={{ color: row.color }}>
                      {row.runs} {row.runs === 1 ? 'run' : 'runs'}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{row.sub}</div>
                  <div className="w-full h-2 rounded bg-background overflow-hidden border border-border/60">
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${widthPct}%`, backgroundColor: row.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 rounded bg-background border border-border text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total candidates:</span>
              <span className="font-semibold text-foreground">{totalRuns}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Result:</span>
              <span className={`font-semibold ${steering.improved ? 'text-success' : 'text-caution'}`}>
                {steering.improved
                  ? `IMPROVED (+${Number(steering.fitness_delta || 0).toFixed(4)} Δfit)`
                  : 'NO IMPROVEMENT (stagnation)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}