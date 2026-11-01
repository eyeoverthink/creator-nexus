import { useState, useEffect, useCallback } from 'react';
import { Dna, Zap, ShieldAlert, CheckCircle2, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function StrategyGenomeEvolutionPanel({ workspace, onEvolved }) {
  const [genomeData, setGenomeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evolving, setEvolving] = useState(false);
  const [error, setError] = useState('');

  const loadGenomePreview = useCallback(async (commit = false) => {
    if (!workspace?.id) return;
    if (commit) setEvolving(true);
    else setLoading(true);
    setError('');
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'evolve_strategy_genome',
        workspace_id: workspace.id,
        commit,
      });
      if (data?.strategyGenome) {
        setGenomeData(data.strategyGenome);
        if (commit && typeof onEvolved === 'function') {
          onEvolved(data);
        }
      }
    } catch (err) {
      setError(err?.message || 'Failed to compute evolutionary strategy genome.');
    } finally {
      setLoading(false);
      setEvolving(false);
    }
  }, [workspace?.id, onEvolved]);

  useEffect(() => {
    loadGenomePreview(false);
  }, [loadGenomePreview]);

  if (!workspace?.id) return null;

  const winner = genomeData?.winner;
  const baseline = genomeData?.baselineWeights || {
    taste_fit: 0.30,
    timeliness: 0.20,
    feasibility: 0.20,
    safety: 0.20,
    originality: 0.10,
  };
  const activeWeights = winner?.weights || baseline;
  const exclusions = genomeData?.blackHoleExclusions || [];
  const evSummary = genomeData?.evidenceSummary || {};

  return (
    <section
      aria-label="Closed-Loop Evolutionary Strategy Genome"
      className="p-4 rounded-md border border-border bg-card space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <Dna size={18} className="text-primary shrink-0" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-sm font-semibold">
                CLOSED-LOOP OUROBOROS DIRECTOR STRATEGY GENOME
              </h2>
              {genomeData?.genomeHash && (
                <span className="px-2 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono text-primary">
                  #{genomeData.genomeHash} · {winner?.branch}
                </span>
              )}
              {genomeData?.committed && (
                <span className="px-2 py-0.5 rounded bg-success/15 border border-success/40 text-[10px] font-mono text-success font-semibold flex items-center gap-1">
                  <CheckCircle2 size={11} /> SYNCED TO DIRECTOR CONTINUITY
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Bridges NexusExperiment Outcomes ({evSummary.experimentsCount || 0}) + Regression Fits + Spark Archive ({evSummary.sparksAnalyzed || 0}) into Evolving Rubric Weights
            </p>
          </div>
        </div>

        <Button
          size="sm"
          disabled={loading || evolving}
          onClick={() => loadGenomePreview(true)}
        >
          <Zap size={14} />{' '}
          {evolving
            ? 'Evolving & Syncing Genome…'
            : 'Evolve & Lock Director Rubric Genome'}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive font-mono">
          {error}
        </p>
      )}

      {/* Weight comparison: Static vs Argon Evolved */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-muted-foreground">
              DIRECTOR RUBRIC WEIGHT MUTATION (STATIC BASELINE → EVOLVED GENOME)
            </span>
            {winner && (
              <span className="text-success font-semibold flex items-center gap-1">
                <TrendingUp size={13} /> +{winner.predictedRetentionLiftPct}% Counterfactual Lift
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.keys(baseline).map((key) => {
              const baseVal = Number(baseline[key] || 0);
              const evolvedVal = Number(activeWeights[key] || baseVal);
              const delta = evolvedVal - baseVal;
              return (
                <div
                  key={key}
                  className="p-2.5 rounded border border-border bg-background font-mono space-y-1"
                >
                  <div className="text-[10px] text-muted-foreground uppercase">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {(evolvedVal * 100).toFixed(1)}%
                  </div>
                  <div
                    className={`text-[10px] ${
                      Math.abs(delta) < 0.001
                        ? 'text-muted-foreground'
                        : delta > 0
                        ? 'text-success'
                        : 'text-caution'
                    }`}
                  >
                    Base {(baseVal * 100).toFixed(0)}% ({delta >= 0 ? '+' : ''}
                    {(delta * 100).toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>

          {genomeData?.continuityDirective && (
            <div className="p-2.5 rounded bg-secondary/70 border border-border text-[11px] font-mono text-foreground">
              <strong className="text-primary">Active Director Continuity Injection:</strong>{' '}
              {genomeData.continuityDirective}
            </div>
          )}
        </div>

        {/* Right: 3 Candidate Strategy Timelines & Digital Black Hole Exclusions */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="text-xs font-mono font-semibold text-muted-foreground">
            TRI-TIMELINE RUBRIC ARENA & DIGITAL BLACK HOLE PRUNING
          </div>
          <div className="space-y-1.5">
            {(genomeData?.candidates || []).map((c) => {
              const isWin = c.branch === winner?.branch;
              return (
                <div
                  key={c.branch}
                  className={`p-2 rounded border text-xs font-mono flex items-center justify-between ${
                    isWin
                      ? 'border-primary bg-selection text-foreground'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  <span>{c.branch}</span>
                  <span className={isWin ? 'text-success font-bold' : ''}>
                    F={c.fitness} (+{c.predictedRetentionLiftPct}%)
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 rounded border border-border bg-background space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-destructive font-semibold flex items-center gap-1">
                <ShieldAlert size={13} /> DIGITAL BLACK HOLE ANGLE EXCLUSIONS
              </span>
              <span className="text-muted-foreground">{exclusions.length} pruned</span>
            </div>
            {exclusions.length === 0 ? (
              <p className="text-[11px] font-mono text-muted-foreground">
                No fatigued or losing topic tags crossed the Event Horizon yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {exclusions.map((ex) => (
                  <span
                    key={ex.tag}
                    title={ex.reason}
                    className="px-2 py-0.5 rounded border border-destructive/40 bg-destructive/10 text-destructive text-[10px] font-mono"
                  >
                    ⊘ {ex.tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}