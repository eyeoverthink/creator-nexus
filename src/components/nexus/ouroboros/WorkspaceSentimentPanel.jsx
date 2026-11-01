import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { Button } from '@/components/ui/button';
import { Activity, Sparkles, Flame, Compass, ShieldAlert, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const STIMULUS_PRESETS = [
  {
    id: 'breakthrough',
    label: 'Creative Breakthrough',
    icon: Sparkles,
    payload: {
      label: 'Creative Breakthrough & Approved Spark Lock',
      agent: 'scribe',
      rewardDelta: 0.88,
      predictionError: 0.62,
      taskLoad: 0.68,
      successRate: 0.94,
      conflictLevel: 0.04,
    },
  },
  {
    id: 'curiosity_sprint',
    label: 'Deep Research Pulse',
    icon: Compass,
    payload: {
      label: 'High-Novelty Epistemic Radar Discovery',
      agent: 'scout',
      rewardDelta: 0.45,
      predictionError: 0.92,
      taskLoad: 0.74,
      successRate: 0.82,
      conflictLevel: 0.08,
    },
  },
  {
    id: 'gauntlet_friction',
    label: 'Gauntlet Falsification Alert',
    icon: ShieldAlert,
    payload: {
      label: 'Hypothesis Refuted -> Triggering Adaptive Replanning',
      agent: 'director',
      rewardDelta: -0.55,
      predictionError: 0.84,
      taskLoad: 0.88,
      successRate: 0.38,
      conflictLevel: 0.72,
    },
  },
  {
    id: 'flow_sync',
    label: 'Multi-Agent Flow Sync',
    icon: Flame,
    payload: {
      label: 'Synchronized Multi-Agent Production Handshake',
      agent: 'argon',
      rewardDelta: 0.76,
      predictionError: 0.35,
      taskLoad: 0.58,
      successRate: 0.95,
      conflictLevel: 0.02,
    },
  },
];

async function invokeSentimentBackend(payload) {
  try {
    const { data } = await base44.functions.invoke('nexusEvolution', payload);
    return data;
  } catch (err) {
    const headers = { 'Content-Type': 'application/json', 'X-App-Id': String(appParams.appId || '') };
    if (appParams.functionsVersion) headers['Base44-Functions-Version'] = String(appParams.functionsVersion);
    const res = await fetch(`/api/apps/${appParams.appId}/functions/nexusEvolution`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.error) {
      throw new Error(data?.error || err?.message || 'Sentiment telemetry request failed');
    }
    return data;
  }
}

export default function WorkspaceSentimentPanel({ sentiment: propSentiment, workspace, busy: propBusy, onInjectStimulus }) {
  const [viewMode, setViewMode] = useState('collaboration');
  const [localSentiment, setLocalSentiment] = useState(null);
  const [localBusy, setLocalBusy] = useState(false);

  const fetchStandaloneSentiment = useCallback(async () => {
    if (propSentiment) return;
    setLocalBusy(true);
    try {
      const data = await invokeSentimentBackend({
        action: 'telemetry',
        ...(workspace?.id ? { workspace_id: workspace.id } : {}),
      });
      if (data?.sentimentTelemetry) {
        setLocalSentiment(data.sentimentTelemetry);
      }
    } catch {
      // Ignore background telemetry error
    } finally {
      setLocalBusy(false);
    }
  }, [propSentiment, workspace?.id]);

  useEffect(() => {
    if (!propSentiment) {
      fetchStandaloneSentiment();
    }
  }, [propSentiment, fetchStandaloneSentiment]);

  const handleStimulus = async (stimulusPayload) => {
    if (onInjectStimulus) {
      onInjectStimulus(stimulusPayload);
      return;
    }
    setLocalBusy(true);
    try {
      const data = await invokeSentimentBackend({
        action: 'inject_sentiment_stimulus',
        ...(workspace?.id ? { workspace_id: workspace.id } : {}),
        stimulus: stimulusPayload,
      });
      if (data?.sentimentTelemetry) {
        setLocalSentiment(data.sentimentTelemetry);
      }
    } catch {
      // Ignore error
    } finally {
      setLocalBusy(false);
    }
  };

  const sentiment = propSentiment || localSentiment;
  const busy = propBusy || localBusy;

  if (!sentiment) {
    return (
      <section className="p-4 rounded-md border border-border bg-card flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span className="flex items-center gap-2">
          <Activity size={14} className="text-primary animate-pulse" />
          Loading Workspace Sentiment & Agent Engagement Telemetry…
        </span>
      </section>
    );
  }

  const current = sentiment.current || {};
  const mods = sentiment.modulators || {};
  const timeline = sentiment.timeline || [];
  const agents = sentiment.agentBreakdown || [];

  return (
    <section className="p-4 rounded-md border border-border bg-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h3 className="font-heading text-sm font-semibold">
              WORKSPACE AFFECTIVE SENTIMENT & AGENT ENGAGEMENT TELEMETRY (VAD + EPISTEMIC DYNAMICS)
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary border border-border text-primary">
              STATE: {sentiment.dominantAffect}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tracks creative collaboration health, Valence-Arousal-Dominance (VAD) sentiment trajectories, and per-agent engagement across workspace events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STIMULUS_PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <Button
                key={preset.id}
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => handleStimulus(preset.payload)}
              >
                <Icon size={12} /> {preset.label}
              </Button>
            );
          })}
          {!propSentiment && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={fetchStandaloneSentiment}
              title="Refresh workspace sentiment telemetry"
            >
              <RefreshCw size={12} className={busy ? 'animate-spin' : ''} />
            </Button>
          )}
        </div>
      </div>

      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono">
        <div className="p-2.5 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">COLLABORATION INDEX</div>
          <div className="text-sm font-semibold text-success mt-0.5">{current.collaboration ?? 82}%</div>
        </div>
        <div className="p-2.5 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">AGENT ENGAGEMENT</div>
          <div className="text-sm font-semibold text-primary mt-0.5">{current.engagement ?? 78}%</div>
        </div>
        <div className="p-2.5 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">VALENCE / AROUSAL</div>
          <div className="text-sm font-semibold text-foreground mt-0.5">
            {current.valence >= 0 ? `+${current.valence}` : current.valence} / {current.arousal}
          </div>
        </div>
        <div className="p-2.5 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">CURIOSITY DRIVE</div>
          <div className="text-sm font-semibold text-primary mt-0.5">{current.curiosityPct ?? 55}%</div>
        </div>
        <div className="p-2.5 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">EXPLORATION σ / η</div>
          <div className="text-sm font-semibold text-foreground mt-0.5">
            σ={mods.explorationSigma} · η={mods.stepSizeEta}
          </div>
        </div>
        <div className="p-2.5 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">EMPATHETIC BIAS β</div>
          <div className="text-sm font-semibold text-success mt-0.5">
            β={mods.empatheticBias} (D={mods.attentionDepth})
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Time-series Fluctuation Chart */}
        <div className="lg:col-span-8 p-3 rounded bg-background border border-border space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-muted-foreground">
              TEMPORAL SENTIMENT & COLLABORATION FLUCTUATION ({timeline.length} WORKSPACE PULSES)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('collaboration')}
                className={`px-2 py-0.5 rounded text-[11px] border ${
                  viewMode === 'collaboration'
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                Collaboration & Engagement
              </button>
              <button
                type="button"
                onClick={() => setViewMode('vad')}
                className={`px-2 py-0.5 rounded text-[11px] border ${
                  viewMode === 'vad'
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                Valence · Curiosity · Frustration
              </button>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" />
                <XAxis dataKey="step" stroke="#8A8A8A" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#8A8A8A" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1B1B1B',
                    borderColor: '#393939',
                    fontSize: '11px',
                    color: '#F2F2F2',
                  }}
                />
                {viewMode === 'collaboration' ? (
                  <>
                    <Area
                      type="monotone"
                      dataKey="collaboration"
                      name="Collaboration (%)"
                      stroke="#47C686"
                      fill="#47C686"
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="engagement"
                      name="Agent Engagement (%)"
                      stroke="#3B63FB"
                      fill="#3B63FB"
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="dominancePct"
                      name="Confidence / Dominance (%)"
                      stroke="#E5A93B"
                      fill="#E5A93B"
                      fillOpacity={0.08}
                      strokeWidth={1.5}
                    />
                  </>
                ) : (
                  <>
                    <Area
                      type="monotone"
                      dataKey="valencePct"
                      name="Positive Valence (%)"
                      stroke="#47C686"
                      fill="#47C686"
                      fillOpacity={0.16}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="curiosityPct"
                      name="Epistemic Curiosity (%)"
                      stroke="#3B63FB"
                      fill="#3B63FB"
                      fillOpacity={0.16}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="frustrationPct"
                      name="Friction / Replanning (%)"
                      stroke="#F0555D"
                      fill="#F0555D"
                      fillOpacity={0.14}
                      strokeWidth={1.5}
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-Agent Engagement & Sentiment Breakdown */}
        <div className="lg:col-span-4 p-3 rounded bg-background border border-border space-y-2">
          <div className="text-xs font-mono text-muted-foreground">
            AGENT ENGAGEMENT & AFFECTIVE ALIGNMENT
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agents} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" />
                <XAxis type="number" domain={[0, 100]} stroke="#8A8A8A" fontSize={10} />
                <YAxis type="category" dataKey="agent" stroke="#AFAFAF" fontSize={10} width={115} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1B1B1B',
                    borderColor: '#393939',
                    fontSize: '11px',
                    color: '#F2F2F2',
                  }}
                />
                <Bar dataKey="engagement" name="Engagement (%)" fill="#3B63FB" radius={[0, 3, 3, 0]} />
                <Bar dataKey="sentimentPct" name="Positive Sentiment (%)" fill="#47C686" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}