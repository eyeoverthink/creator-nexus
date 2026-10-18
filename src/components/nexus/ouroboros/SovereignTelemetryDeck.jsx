import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Radio, BrainCircuit, Zap, Sliders, GitMerge, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function SovereignTelemetryDeck({
  sentiment,
  streamConnected,
  streamEventsCount,
  lastHeartbeat,
  onToggleStream,
}) {
  if (!sentiment) return null;

  const emotionRing = sentiment.emotionRing || [];
  const steeringDials = sentiment.steeringDials || [];
  const mutationStrategy = sentiment.mutationStrategy || { branches: [] };
  const somatic = sentiment.somaticMarker || {};
  const dopamine = sentiment.dopamine || {};

  const isPositiveSomatic = somatic.biasScore >= 0;
  const isPositiveDopamine = (dopamine.rpeDelta || 0) >= 0;

  return (
    <section className="space-y-4">
      {/* Top Status Strip: SSE Live Connection + Somatic Marker Badge + Dopamine Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 6. SSE Live Connection Status Dot */}
        <div className="p-3.5 rounded-md border border-border bg-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              {streamConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  streamConnected ? 'bg-success' : 'bg-muted-foreground'
                }`}
              />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground">
                <Radio size={13} className="text-primary shrink-0" />
                <span className="truncate">
                  {streamConnected ? 'SSE LIVE TELEMETRY · CONNECTED' : 'SSE TELEMETRY · PAUSED'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground truncate">
                Packets: {streamEventsCount} · Sync: {lastHeartbeat ? lastHeartbeat.slice(11, 19) : 'LIVE'} UTC
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleStream}
            className="px-2.5 py-1 rounded text-[11px] font-mono border border-border bg-secondary hover:bg-hover text-foreground shrink-0"
          >
            {streamConnected ? 'Pause SSE' : 'Resume SSE'}
          </button>
        </div>

        {/* 4. Somatic Marker Badge */}
        <div className="p-3.5 rounded-md border border-border bg-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {isPositiveSomatic ? (
              <ShieldCheck size={16} className="text-success shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-caution shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">SOMATIC MARKER</span>
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    isPositiveSomatic
                      ? 'bg-success/10 border-success/40 text-success'
                      : 'bg-caution/10 border-caution/40 text-caution'
                  }`}
                >
                  {somatic.state || 'STEADY_RESONANCE'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground truncate mt-0.5" title={somatic.description}>
                Bias: {somatic.biasScore >= 0 ? `+${somatic.biasScore}` : somatic.biasScore} · Avoided {somatic.blackHolesAvoided ?? 0} BH Shards
              </div>
            </div>
          </div>
        </div>

        {/* 5. Dopamine Indicator (Tonic + Phasic RPE) */}
        <div className="p-3.5 rounded-md border border-border bg-card flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between gap-2 text-xs font-mono">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Zap size={13} className="text-primary" /> DOPAMINE RPE (δ)
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                isPositiveDopamine
                  ? 'bg-success/10 border-success/40 text-success'
                  : 'bg-destructive/10 border-destructive/40 text-destructive'
              }`}
            >
              {dopamine.rpeDelta >= 0 ? `+${dopamine.rpeDelta}` : dopamine.rpeDelta} RPE · {dopamine.stateLabel}
            </span>
          </div>
          <div className="w-full h-2 rounded bg-secondary overflow-hidden border border-border">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(8, dopamine.pct || 65))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>Tonic Baseline: {dopamine.tonicLevel}</span>
            <span>Phasic Drive: {dopamine.phasicBurst}</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Deck: Emotion Ring (Donut) + 7 Steering Dials + Mutation Strategy Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 1. Emotion Ring (Donut Chart) */}
        <div className="lg:col-span-4 p-4 rounded-md border border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-mono">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <BrainCircuit size={14} /> EMOTION RING (AFFECTIVE DONUT)
            </span>
            <span className="text-[11px] text-muted-foreground">{sentiment.dominantAffect}</span>
          </div>

          <div className="relative h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emotionRing}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  stroke="#1B1B1B"
                  strokeWidth={2}
                >
                  {emotionRing.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
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
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono text-muted-foreground">COLLAB</span>
              <span className="text-base font-mono font-semibold text-foreground">
                {sentiment.current?.collaboration ?? 84}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono border-t border-border pt-2.5">
            {emotionRing.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-1 px-1.5 py-0.5 rounded bg-secondary">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-muted-foreground">{item.name.split(' ')[0]}</span>
                </span>
                <span className="text-foreground font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Steering Dials (7 Gauge Bars) */}
        <div className="lg:col-span-4 p-4 rounded-md border border-border bg-card flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-mono">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <Sliders size={14} /> STEERING DIALS (7 COGNITIVE GAUGES)
            </span>
            <span className="text-[11px] text-muted-foreground">REAL-TIME GAIN</span>
          </div>

          <div className="space-y-2.5">
            {steeringDials.map((dial) => (
              <div key={dial.id} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-foreground font-medium">
                    <strong className="text-primary">{dial.symbol}</strong> · {dial.label}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {dial.value} ({dial.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded bg-secondary overflow-hidden border border-border">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(6, dial.pct))}%`,
                      backgroundColor: dial.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Mutation Strategy Panel (Alpha / Beta / Gamma Allocation) */}
        <div className="lg:col-span-4 p-4 rounded-md border border-border bg-card flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-mono">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <GitMerge size={14} /> MUTATION STRATEGY (α / β / γ ALLOCATION)
            </span>
            <span className="text-[11px] text-success">{mutationStrategy.dominantBranch}</span>
          </div>

          {/* Stacked Allocation Bar */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-muted-foreground flex justify-between">
              <span>COMPUTE & MUTATION BUDGET SPLIT</span>
              <span>100% ALLOCATED</span>
            </div>
            <div className="w-full h-3 rounded bg-secondary overflow-hidden border border-border flex">
              {(mutationStrategy.branches || []).map((b) => (
                <div
                  key={b.id}
                  style={{ width: `${b.allocationPct}%`, backgroundColor: b.color }}
                  title={`${b.name}: ${b.allocationPct}%`}
                  className="h-full transition-all duration-300"
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {(mutationStrategy.branches || []).map((b) => (
              <div key={b.id} className="p-2.5 rounded bg-secondary border border-border space-y-1 font-mono text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground truncate" style={{ color: b.color }}>
                    {b.shortName} · {b.allocationPct}%
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      b.passed
                        ? 'border-success/40 bg-success/10 text-success'
                        : 'border-destructive/40 bg-destructive/10 text-destructive'
                    }`}
                  >
                    {b.passed ? `FIT ${b.fitness}` : 'FALSIFIED'}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate" title={b.operator}>
                  {b.operator}
                </div>
                <div className="w-full h-1.5 rounded bg-background overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${b.allocationPct}%`, backgroundColor: b.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}