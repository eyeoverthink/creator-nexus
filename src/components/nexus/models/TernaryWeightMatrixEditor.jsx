import React from 'react';

export const TERNARY_GATES = [
  { id: 'hook_velocity', label: 'Hook (<15w)' },
  { id: 'info_surprise', label: 'Surprise (>1.3b)' },
  { id: 'concrete_proof', label: 'Quant Proof' },
  { id: 'causal_chain', label: 'Causal Chain' },
  { id: 'pacing_cadence', label: 'Beat Cadence' },
  { id: 'signature_twist', label: 'Contrarian Twist' },
  { id: 'anti_fluff', label: 'Fluff Filter' },
  { id: 'ai_disclosure', label: 'AI Disclosure' },
];

export default function TernaryWeightMatrixEditor({
  ternaryState = 1,
  weight = 1.0,
  ternaryMatrix = [1, 1, 1, 1, 1, 1, -1, 1],
  onChangeState,
  onChangeWeight,
  onChangeMatrix,
  disabled = false,
}) {
  const safeMatrix =
    Array.isArray(ternaryMatrix) && ternaryMatrix.length === 8
      ? ternaryMatrix
      : [1, 1, 1, 1, 1, 1, -1, 1];

  const cycleGate = (idx) => {
    if (disabled) return;
    const cur = Number(safeMatrix[idx] ?? 0);
    // Cycle +1 -> 0 -> -1 -> +1
    const nextVal = cur === 1 ? 0 : cur === 0 ? -1 : 1;
    const next = [...safeMatrix];
    next[idx] = nextVal;
    onChangeMatrix?.(next);
  };

  return (
    <div className="rounded-lg border border-border bg-background/80 p-3 space-y-2.5 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-foreground">
          TERNARY QUANTIZATION &amp; ROUTING WEIGHT ({'{ -1, 0, +1 }'})
        </span>
        <div className="flex items-center gap-1">
          {[
            { val: 1, label: '+1 Excitatory', cls: 'bg-success/20 border-success text-success' },
            { val: 0, label: '0 Neutral / Mute', cls: 'bg-secondary border-border text-muted-foreground' },
            { val: -1, label: '-1 Inhibitory Critic', cls: 'bg-destructive/20 border-destructive text-destructive' },
          ].map((opt) => {
            const active = Number(ternaryState) === opt.val;
            return (
              <button
                key={opt.val}
                type="button"
                disabled={disabled}
                onClick={() => onChangeState?.(opt.val)}
                className={`px-2 py-1 rounded border text-[10px] font-semibold transition-all ${
                  active ? opt.cls : 'border-border bg-card text-muted-foreground opacity-60 hover:opacity-100'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Continuous Ensemble Weight Multiplier */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground shrink-0">
          Ensemble Weight Multiplier: <strong className="text-foreground">{Number(weight).toFixed(2)}x</strong>
        </span>
        <input
          type="range"
          min="0"
          max="2"
          step="0.05"
          disabled={disabled}
          value={Number(weight ?? 1)}
          onChange={(e) => onChangeWeight?.( parseFloat(e.target.value) )}
          className="flex-1 accent-primary"
        />
        <span className="text-[10px] text-primary shrink-0">
          Effective Steering: {(Number(ternaryState) * Number(weight || 0)).toFixed(2)}
        </span>
      </div>

      {/* 8-Channel Ternary Gate Matrix */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>8-Channel BitNet Ternary Gate Vector (Click gate to cycle +1 → 0 → -1)</span>
          <span>[{safeMatrix.map((v) => (v > 0 ? '+1' : v < 0 ? '-1' : '0')).join(', ')}]</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
          {TERNARY_GATES.map((gate, i) => {
            const v = Number(safeMatrix[i] ?? 0);
            const badgeCls =
              v === 1
                ? 'border-success/50 bg-success/15 text-success'
                : v === -1
                ? 'border-destructive/50 bg-destructive/15 text-destructive'
                : 'border-border bg-secondary/50 text-muted-foreground';
            return (
              <button
                key={gate.id}
                type="button"
                disabled={disabled}
                onClick={() => cycleGate(i)}
                className={`p-1.5 rounded border text-left transition-colors flex flex-col justify-between ${badgeCls}`}
              >
                <span className="text-[9.5px] truncate w-full">{gate.label}</span>
                <span className="text-[11px] font-bold mt-0.5">
                  {v === 1 ? '+1 BOOST' : v === -1 ? '-1 INHIBIT' : '0 MUTE'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}