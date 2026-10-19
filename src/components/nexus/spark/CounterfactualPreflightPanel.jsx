import { useState, useEffect, useCallback } from 'react';
import { Activity, Sparkles, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function CounterfactualPreflightPanel({
  narration,
  hookTitle = '',
  signatureTwist = '',
  spokenDisclosure = '',
  onApplyRewrite,
}) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = useCallback(async () => {
    const clean = String(narration || '').trim();
    if (!clean) {
      setReport(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'simulate_audience_preflight',
        narration: clean,
        hook_title: hookTitle,
        signature_twist: signatureTwist,
        spoken_disclosure: spokenDisclosure,
      });
      if (data?.preflight) {
        setReport(data.preflight);
      }
    } catch {
      // Silent fallback if offline
    } finally {
      setLoading(false);
    }
  }, [narration, hookTitle, signatureTwist, spokenDisclosure]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 350);
    return () => clearTimeout(timer);
  }, [runSimulation]);

  if (!narration?.trim()) return null;

  return (
    <div className="rounded-lg border border-border bg-background p-3.5 space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-primary" />
          <span className="font-mono font-semibold text-foreground">
            ARGON 4-PERSONA COUNTERFACTUAL AUDIENCE PRE-FLIGHT
          </span>
        </div>
        {report && (
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span
              className={`px-2 py-0.5 rounded border font-semibold ${
                report.overallRetentionPct >= 78
                  ? 'bg-success/15 border-success/40 text-success'
                  : 'bg-caution/15 border-caution/40 text-caution'
              }`}
            >
              Predicted Retention: {report.overallRetentionPct}%
            </span>
            <span className="px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
              Surprise: {report.avgSurpriseBits} bits/beat
            </span>
            <span className="px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
              Hook Velocity: {report.hookVelocity}%
            </span>
          </div>
        )}
      </div>

      {loading && !report ? (
        <p className="text-muted-foreground font-mono text-[11px]">
          Simulating counterfactual audience substrates…
        </p>
      ) : report ? (
        <>
          {/* 4 Persona Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(report.personas || []).map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded border border-border bg-card flex flex-col justify-between gap-1"
              >
                <div className="flex items-center justify-between gap-2 font-mono">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Users size={12} style={{ color: p.color }} />
                    {p.name}
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: p.retentionPct >= 78 ? '#47C686' : '#E5A93B' }}
                  >
                    {p.retentionPct}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded bg-secondary overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(5, p.retentionPct))}%`,
                      backgroundColor: p.color,
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{p.verdict}</p>
              </div>
            ))}
          </div>

          {/* Sentence-by-sentence Surprise & Retention Waveform Strip */}
          {report.sentenceTelemetry?.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>BEAT-BY-BEAT RETENTION & INFORMATION SURPRISE CURVE</span>
                <span>{report.sentenceTelemetry.length} sentences</span>
              </div>
              <div className="flex items-end gap-1 h-12 p-1.5 rounded bg-card border border-border">
                {report.sentenceTelemetry.map((s) => {
                  const hasBottleneck = Boolean(s.bottleneckReason);
                  const heightPct = Math.max(20, Math.min(100, s.compositeRetention));
                  return (
                    <div
                      key={s.index}
                      title={`Beat #${s.index} (${s.wordCount}w) · Retention: ${s.compositeRetention}% · Surprise: ${s.surpriseBits}b${
                        s.bottleneckReason ? ' · ' + s.bottleneckReason : ''
                      }`}
                      style={{ height: `${heightPct}%` }}
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

          {/* Surgical Bottleneck Warnings + 1-Click Fix */}
          {report.bottlenecksCount > 0 ? (
            <div className="p-2.5 rounded border border-caution/40 bg-caution/10 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-semibold text-caution flex items-center gap-1.5">
                  <AlertTriangle size={14} /> {report.bottlenecksCount} Pacing / Drop-Off Bottleneck(s) Detected
                </span>
                {report.hasSurgicalFixes && typeof onApplyRewrite === 'function' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onApplyRewrite(report.optimizedNarration)}
                  >
                    <Sparkles size={13} /> Apply Surgical Pacing Fix
                  </Button>
                )}
              </div>
              <ul className="space-y-1 text-[11px] text-foreground font-mono">
                {report.sentenceTelemetry
                  .filter((s) => s.bottleneckReason)
                  .slice(0, 3)
                  .map((s) => (
                    <li key={s.index}>
                      • Beat #{s.index}: {s.bottleneckReason}
                    </li>
                  ))}
              </ul>
            </div>
          ) : (
            <div className="p-2 rounded border border-success/40 bg-success/10 text-success font-mono text-[11px] flex items-center gap-2">
              <CheckCircle2 size={14} />
              <span>All sentences pass counterfactual pacing & information-surprise thresholds.</span>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}