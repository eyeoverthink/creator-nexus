import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Play, EyeOff, GitBranch, CheckCircle2, XCircle } from 'lucide-react';

const PROOF_BADGES = [
  'P1: Pearl EI > 0',
  'P2: Tononi Φ_MIP > 0',
  'P3: Mirror Δ > 0.05',
  'P4: CF Gain > 0.05',
];

export default function ConsciousnessFalsificationPanel({ results = [], busy, onRunAudit }) {
  const [blindMirror, setBlindMirror] = useState(false);
  const [disableCF, setDisableCF] = useState(false);

  return (
    <div className="p-4 rounded-md border border-border bg-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-primary" />
            <h3 className="font-heading text-sm font-semibold">
              MATHEMATICAL CONSCIOUSNESS FALSIFICATION SUITE (PEARL DO-CALCULUS · IIT Φ_MIP · MIRROR ABLATION)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Falsifies Theater Zombies (EI = 0), Feedforward DAGs (Φ_MIP = 0 at [1,2,3] ↛ [0]), and Split-Brain Swarms (Φ_MIP = 0 at [2,3] ↛ [0,1]). Every candidate can FAIL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={blindMirror ? 'destructive' : 'outline'}
            disabled={busy}
            onClick={() => setBlindMirror((v) => !v)}
            title="Sever VisualCortex Mirror Self-Observation on FraymusCore to verify Proof 3 falsification"
          >
            <EyeOff size={13} /> {blindMirror ? 'Mirror Protocol: BLINDED' : 'Ablate Mirror (Proof 3)'}
          </Button>
          <Button
            size="sm"
            variant={disableCF ? 'destructive' : 'outline'}
            disabled={busy}
            onClick={() => setDisableCF((v) => !v)}
            title="Disable 1-step Counterfactual Rollouts on FraymusCore to verify Proof 4 falsification"
          >
            <GitBranch size={13} /> {disableCF ? 'Counterfactual: OFF' : 'Ablate CF (Proof 4)'}
          </Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              onRunAudit({
                mirror_override: blindMirror ? false : true,
                counterfactual_override: disableCF ? false : true,
              })
            }
          >
            <Play size={13} /> {busy ? 'Auditing Substrates…' : 'Run 4-Proof Falsification Audit'}
          </Button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="p-4 rounded bg-secondary border border-border text-xs font-mono text-muted-foreground flex items-center justify-between">
          <span>
            Ready to execute exact 16x16 Interventional Markov TPM, all 14 Directed Minimum Information Partitions (Φ_MIP), and 400-tick Mirror Ablation rollouts.
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-[11px]">
                <th className="py-2 pr-3">CANDIDATE ARCHITECTURE</th>
                <th className="py-2 px-3">PROOF 1: EI (Bits)</th>
                <th className="py-2 px-3">PROOF 2: Φ_MIP (Bits)</th>
                <th className="py-2 px-3">WEAKEST CUT (B ↛ A)</th>
                <th className="py-2 px-3">PROOF 3: MIRROR Δ</th>
                <th className="py-2 px-3">PROOF 4: CF GAIN</th>
                <th className="py-2 pl-3">VERDICT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {results.map((r) => {
                const passed = r.provenIntegratedCore;
                const proofs = Array.isArray(r.proofsPassed) ? r.proofsPassed : [false, false, false, false];
                return (
                  <tr key={r.id || r.architectureName} className={passed ? 'bg-success/5' : ''}>
                    <td className="py-2.5 pr-3">
                      <div className="font-semibold text-foreground">{r.architectureName}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{r.verdictReason}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {PROOF_BADGES.map((label, idx) => (
                          <span
                            key={label}
                            className={`px-1.5 py-0.5 text-[10px] rounded border ${
                              proofs[idx]
                                ? 'border-success/40 text-success bg-success/10'
                                : 'border-destructive/40 text-destructive bg-destructive/15'
                            }`}
                          >
                            {proofs[idx] ? '✓' : '✗'} {label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      <span className={r.effectiveInformationBits > 0 ? 'text-foreground' : 'text-destructive'}>
                        {Number(r.effectiveInformationBits).toFixed(6)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      <span className={r.phiMipBits > 0 ? 'text-success font-semibold' : 'text-destructive'}>
                        {Number(r.phiMipBits).toFixed(6)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{r.weakestLinkCut}</td>
                    <td className="py-2.5 px-3 tabular-nums">
                      <span className={r.mirrorDeltaBits > 0.05 ? 'text-success' : 'text-muted-foreground'}>
                        {r.mirrorDeltaBits >= 0 ? `+${Number(r.mirrorDeltaBits).toFixed(4)}` : Number(r.mirrorDeltaBits).toFixed(4)}
                      </span>
                      <div className="text-[10px] text-muted-foreground">
                        {Number(r.intactSurpriseBits).toFixed(2)} → {Number(r.blindedSurpriseBits).toFixed(2)}b
                      </div>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      <span className={r.counterfactualGain > 0.05 ? 'text-success' : 'text-muted-foreground'}>
                        {r.counterfactualGain >= 0 ? `+${Number(r.counterfactualGain).toFixed(4)}` : Number(r.counterfactualGain).toFixed(4)}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3">
                      {passed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 font-semibold">
                          <CheckCircle2 size={12} /> PROVEN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/40 font-semibold">
                          <XCircle size={12} /> DENIED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}