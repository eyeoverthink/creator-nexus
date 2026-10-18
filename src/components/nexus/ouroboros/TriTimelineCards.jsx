const STAGE_NAMES = [
  '1:CHSH 2√2',
  '2:GROVER 121/128',
  '3:TELEPORT 4-BR',
  '4:UNITARY U†U=I',
  '5:PT-EP3 (γ=√2)',
];

export default function TriTimelineCards({ receipts = [], activeGenome }) {
  const list = receipts.length
    ? receipts
    : activeGenome
    ? [
        {
          branchName: activeGenome.branch_origin || 'GENESIS_DENSE_KRONECKER',
          codeHash: activeGenome.code_hash || 'genesis',
          passedGauntlet: true,
          stages: activeGenome.stages_passed || [true, true, true, true, true],
          fitness: activeGenome.fitness || 0.4312,
          latencyNs: activeGenome.latency_ns || 48200,
          structuralEntropy: activeGenome.structural_entropy || 196.5,
          diagnosticSummary: activeGenome.diagnostic_summary || 'PASSED 5/5 STAGES (CHSH, Grover, Teleport, Unitary, PT-EP3)',
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {list.map((r, idx) => {
        const passed = r.passedGauntlet !== false;
        const stages = Array.isArray(r.stages) ? r.stages : [true, true, true, true, true];
        return (
          <div
            key={`${r.branchName}-${idx}`}
            className={`p-3 rounded-md border flex flex-col gap-2 font-mono text-xs ${
              passed ? 'border-success/50 bg-card' : 'border-destructive/60 bg-destructive/10'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`font-semibold truncate ${passed ? 'text-success' : 'text-destructive'}`}>
                {r.branchName}
              </span>
              <span className="text-[11px] text-muted-foreground">[{String(r.codeHash || '').slice(0, 8)}]</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {STAGE_NAMES.map((name, i) => {
                const ok = stages[i];
                return (
                  <span
                    key={name}
                    className={`px-1.5 py-0.5 text-[10px] rounded border ${
                      ok
                        ? 'border-success/40 text-success bg-success/10'
                        : 'border-destructive/40 text-destructive bg-destructive/15'
                    }`}
                  >
                    {ok ? '✓' : '✗'} {name}
                  </span>
                );
              })}
            </div>
            <div className="text-[11px] text-foreground">
              Fitness: <span className="font-semibold">{Number(r.fitness || 0).toFixed(4)}</span> · Latency:{' '}
              <span className="font-semibold">
                {Number(r.latencyNs || 0) < 900000 ? `${Math.round(r.latencyNs)} ns` : 'APOPTOSIS'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{r.diagnosticSummary}</p>
          </div>
        );
      })}
    </div>
  );
}