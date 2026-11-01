import { useState, useEffect } from 'react';
import { Activity, GitBranch, Layers3, Sparkles, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export default function HiveLiveTimelineChart({
  tick = 1530,
  snapshot,
  expansionCount = 0,
  layoutOptimized = false,
  workflowOptimized = false,
  pipelineLatencyMs = 1340,
  compact = false,
}) {
  const [chartView, setChartView] = useState('expansion_activity');
  const [history, setHistory] = useState(() => {
    const base = [];
    for (let i = 11; i >= 0; i--) {
      const t = tick - i;
      const phase = Math.sin(t * 0.45);
      base.push({
        step: `#${t}`,
        activeNodes: 15,
        agentActivity: Math.round(78 + phase * 8),
        throughput: Math.round(90 + phase * 4),
        energyWatts: +(188.7 + phase * 6.2).toFixed(1),
        energyEfficiencyPct: 82,
        workflowSpeedupPct: 100,
        workflowLatencyMs: 1340,
      });
    }
    return base;
  });

  useEffect(() => {
    const activeNodes = 15 + expansionCount;
    const phase = Math.sin(tick * 0.45);
    const baseActivity = 80 + expansionCount * 6 + (workflowOptimized ? 14 : 0) + Math.round(phase * 5);
    const agentActivity = Math.min(100, Math.max(45, baseActivity));
    const throughput = snapshot?.avgThroughput ?? (workflowOptimized ? 98 : 91);
    const energyWatts = snapshot?.totalEnergyWatts ?? (layoutOptimized ? 162.4 : 188.7);
    const energyEfficiencyPct = Math.min(
      99,
      Math.round(82 + (layoutOptimized ? 14 : 0) + (workflowOptimized ? 3 : 0))
    );
    const workflowSpeedupPct = workflowOptimized ? 172 : 100;

    setHistory((prev) => {
      const last = prev[prev.length - 1];
      const stepLabel = `#${tick}`;
      const nextPoint = {
        step: stepLabel,
        activeNodes,
        agentActivity,
        throughput,
        energyWatts,
        energyEfficiencyPct,
        workflowSpeedupPct,
        workflowLatencyMs: pipelineLatencyMs,
      };
      if (last && last.step === stepLabel) {
        return [...prev.slice(0, -1), nextPoint];
      }
      return [...prev.slice(-17), nextPoint];
    });
  }, [tick, snapshot, expansionCount, layoutOptimized, workflowOptimized, pipelineLatencyMs]);

  return (
    <div className="p-3.5 rounded-lg bg-background border border-border space-y-3 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Activity size={14} className="text-primary animate-pulse" />
            <span className="font-semibold text-foreground">
              LIVE HIVE EXPANSION, AGENT ACTIVITY &amp; OPTIMIZATION TIMELINE
            </span>
            <span className="px-2 py-0.5 rounded bg-secondary border border-border text-[10px] text-success">
              {15 + expansionCount} NODES · {history[history.length - 1]?.agentActivity || 86}% ACTIVITY
            </span>
          </div>
          {!compact && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Real-time telemetry stream tracking Hive sub-node expansions, multi-agent synaptic activity, φ-spiral energy savings, and workflow DAG latency reductions.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setChartView('expansion_activity')}
            className={`px-2.5 py-1 rounded text-[10px] border ${
              chartView === 'expansion_activity'
                ? 'border-primary bg-primary/15 text-primary font-semibold'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Node Expansion &amp; Agent Activity
          </button>
          <button
            type="button"
            onClick={() => setChartView('energy_workflow')}
            className={`px-2.5 py-1 rounded text-[10px] border ${
              chartView === 'energy_workflow'
                ? 'border-primary bg-primary/15 text-primary font-semibold'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Energy Distribution &amp; Workflow Optimization
          </button>
        </div>
      </div>

      {/* Highlight Callout Chips for Telemetry Improvements */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
        <div className="p-2 rounded bg-secondary/70 border border-border flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Layers3 size={11} className="text-primary" /> Hive Nodes
          </span>
          <strong className="text-foreground">
            15 → {15 + expansionCount} ({expansionCount > 0 ? `+${expansionCount} Shards` : 'Base'})
          </strong>
        </div>
        <div className="p-2 rounded bg-secondary/70 border border-border flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Activity size={11} className="text-success" /> Agent Activity
          </span>
          <strong className="text-success">
            {history[history.length - 1]?.agentActivity || 86}% ({snapshot?.avgThroughput || 92}% tok/s)
          </strong>
        </div>
        <div className="p-2 rounded bg-secondary/70 border border-border flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Zap size={11} className="text-caution" /> Energy Efficiency
          </span>
          <strong className={layoutOptimized ? 'text-success' : 'text-foreground'}>
            {layoutOptimized ? '96% (-14.0% φ-Loss)' : '82% (Unpacked)'}
          </strong>
        </div>
        <div className="p-2 rounded bg-secondary/70 border border-border flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <GitBranch size={11} className="text-primary" /> Workflow DAG
          </span>
          <strong className={workflowOptimized ? 'text-success' : 'text-foreground'}>
            {workflowOptimized ? `${pipelineLatencyMs}ms (-41.8%)` : `${pipelineLatencyMs}ms (Serial)`}
          </strong>
        </div>
      </div>

      {/* Live Recharts AreaChart */}
      <div className={compact ? 'h-44 w-full' : 'h-56 w-full'}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" />
            <XAxis dataKey="step" stroke="#8A8A8A" fontSize={10} />
            <YAxis stroke="#8A8A8A" fontSize={10} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1B1B1B',
                borderColor: '#393939',
                fontSize: '11px',
                color: '#F2F2F2',
              }}
            />
            {chartView === 'expansion_activity' ? (
              <>
                <ReferenceLine y={15} stroke="#38bdf8" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="agentActivity"
                  name="Agent Activity Velocity (%)"
                  stroke="#3B63FB"
                  fill="#3B63FB"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="throughput"
                  name="Hive Synaptic Throughput (%)"
                  stroke="#47C686"
                  fill="#47C686"
                  fillOpacity={0.16}
                  strokeWidth={2}
                />
                <Area
                  type="stepAfter"
                  dataKey="activeNodes"
                  name="Active Hive Nodes (15 + Shards)"
                  stroke="#FACC15"
                  fill="#FACC15"
                  fillOpacity={0.14}
                  strokeWidth={2}
                />
              </>
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="energyEfficiencyPct"
                  name="Energy Distribution Efficiency (%)"
                  stroke="#47C686"
                  fill="#47C686"
                  fillOpacity={0.22}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="workflowSpeedupPct"
                  name="Workflow Optimization Index (%)"
                  stroke="#3B63FB"
                  fill="#3B63FB"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="energyWatts"
                  name="Total Bus Draw (φ-Watts)"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}