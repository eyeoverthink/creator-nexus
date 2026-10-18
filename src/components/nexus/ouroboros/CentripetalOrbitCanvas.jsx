import { useEffect, useRef } from 'react';

const GOLDEN_ANGLE = 2.0 * Math.PI * (1.0 - 1.0 / 1.618033988749895);

export default function CentripetalOrbitCanvas({ state, onSelectNode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    // Draw Orbital Rings & Event Horizon
    const rings = [38, 78, 118, 162];
    rings.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 3 ? 'rgba(244, 63, 94, 0.55)' : 'rgba(59, 99, 251, 0.22)';
      ctx.lineWidth = idx === 3 ? 1.5 : 1;
      ctx.stroke();
    });

    // Draw Core Nucleus (r = 0)
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#eab308';
    ctx.fill();

    // Draw Digital Black Hole Rejected Shards on Outer Horizon Ring (r = 162)
    (state.blackHoles || []).forEach((bh, i) => {
      const angle = (i * GOLDEN_ANGLE) % (Math.PI * 2);
      const x = cx + Math.cos(angle) * 162;
      const y = cy + Math.sin(angle) * 162;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
      ctx.fillStyle = '#fda4af';
      ctx.font = '10px monospace';
      ctx.fillText('✗ ' + String(bh.code_hash || '').slice(0, 6), x - 18, y - 8);
    });

    // Draw Preserved Fossils (.bak) on Cyan Ring
    (state.fossils || []).forEach((f, i) => {
      const angle = ((f.theta || i * GOLDEN_ANGLE) + 0.4) % (Math.PI * 2);
      const scaledR = Math.min(142, 48 + (f.radius || 3.0) * 12);
      const x = cx + Math.cos(angle) * scaledR;
      const y = cy + Math.sin(angle) * scaledR;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`.bak G${f.generation}`, x + 8, y + 3);
    });

    // Draw Active Centripetal Genome & Memory Orbits
    (state.orbits || []).forEach((node) => {
      const isNucleus = node.node_kind === 'nucleus';
      const scaledR = Math.min(145, 16 + (node.radius || 0) * 16);
      const angle = Number(node.theta || 1.25);
      const x = cx + Math.cos(angle) * scaledR;
      const y = cy + Math.sin(angle) * scaledR;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = isNucleus ? 'rgba(234, 179, 8, 0.45)' : 'rgba(59, 99, 251, 0.35)';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, isNucleus ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = isNucleus ? '#22c55e' : '#3b63fb';
      ctx.fill();

      ctx.fillStyle = '#f2f2f2';
      ctx.font = '10px monospace';
      const label = isNucleus
        ? `G${node.generation} (r=${Number(node.radius || 0).toFixed(2)})`
        : `${String(node.title || '').slice(0, 12)} (r=${Number(node.radius || 0).toFixed(1)})`;
      ctx.fillText(label, x + 10, y + 3);
    });
  }, [state]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={360}
        height={360}
        onClick={() => onSelectNode?.(state?.activeGenome)}
        className="rounded-md border border-border bg-background cursor-pointer max-w-full"
        aria-label="Centripetal Polar Memory Orbital Topology"
      />
      <div className="mt-3 w-full grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">ACTIVE GEN</div>
          <div className="font-semibold text-foreground">GEN {state?.activeGenome?.generation ?? 0}</div>
        </div>
        <div className="p-2 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">SPEEDUP</div>
          <div className="font-semibold text-success">{Number(state?.activeGenome?.speedup || 1).toFixed(2)}x</div>
        </div>
        <div className="p-2 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">CORE RADIUS</div>
          <div className="font-semibold text-foreground">{Number(state?.activeGenome?.radius || 0).toFixed(4)}</div>
        </div>
        <div className="p-2 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">CONTINUITY</div>
          <div className="font-semibold text-primary">{Number(state?.activeGenome?.continuity || 0).toFixed(4)}</div>
        </div>
      </div>
    </div>
  );
}