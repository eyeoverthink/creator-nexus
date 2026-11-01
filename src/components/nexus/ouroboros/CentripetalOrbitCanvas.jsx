import { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowUpCircle,
  Archive,
  CheckCircle2,
  Cpu,
  Database,
  Flame,
  Orbit,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';

const GOLDEN_ANGLE = 2.0 * Math.PI * (1.0 - 1.0 / 1.618033988749895);

function mapRadiusToCanvas(r, kind) {
  if (kind === 'nucleus') return 0;
  if (kind === 'black_hole') return 162;
  const numR = Math.max(0.35, Number(r || 1.2));
  // Smooth logarithmic/linear hybrid mapping so r in [0.35, 20] maps cleanly across [32px, 148px]
  return Math.min(148, 26 + Math.sqrt(numR) * 28);
}

export default function CentripetalOrbitCanvas({
  state,
  busy = false,
  onSelectNode,
  onRecallMemory,
  onStoreMemory,
  onMemoryCycle,
  onSyncWorkspace,
  onPromoteNucleus,
  onArchiveFossil,
  onCollapseBlackHole,
  onDeleteNode,
}) {
  const canvasRef = useRef(null);
  const plottedRef = useRef([]);
  const phaseRef = useRef(0);

  const [animateOrbit, setAnimateOrbit] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [kindFilter, setKindFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPayload, setNewPayload] = useState('');

  // Combine all orbital entities with collision-free polar coordinates
  const allNodes = useMemo(() => {
    if (!state) return [];
    const list = [];
    const seenIds = new Set();

    const active = state.activeGenome;
    if (active) {
      const nId = active.id || `nucleus_${active.code_hash}`;
      seenIds.add(nId);
      list.push({
        ...active,
        id: nId,
        node_kind: 'nucleus',
        radius: 0,
        theta: Number(active.theta || 0),
        color: '#22c55e',
      });
    }

    (state.orbits || []).forEach((n, idx) => {
      const nId = n.id || `orbit_${idx}_${n.code_hash}`;
      if (seenIds.has(nId) || n.node_kind === 'nucleus') return;
      seenIds.add(nId);
      list.push({
        ...n,
        id: nId,
        node_kind: 'orbit',
        radius: Math.max(0.38, Number(n.radius || 1.2)),
        theta: Number(n.theta ?? (idx + 1) * GOLDEN_ANGLE),
        color: '#3b63fb',
      });
    });

    (state.fossils || []).forEach((f, idx) => {
      const nId = f.id || `fossil_${idx}_${f.code_hash}`;
      if (seenIds.has(nId)) return;
      seenIds.add(nId);
      list.push({
        ...f,
        id: nId,
        node_kind: 'fossil',
        radius: Math.max(2.6, Number(f.radius || 3.4)),
        theta: Number(f.theta ?? (idx + 3) * GOLDEN_ANGLE + 0.4),
        color: '#38bdf8',
      });
    });

    (state.blackHoles || []).forEach((bh, idx) => {
      const nId = bh.id || `bh_${idx}_${bh.code_hash}`;
      if (seenIds.has(nId)) return;
      seenIds.add(nId);
      list.push({
        ...bh,
        id: nId,
        node_kind: 'black_hole',
        radius: 21.0,
        theta: Number(bh.theta ?? (idx + 1) * GOLDEN_ANGLE),
        color: '#f43f5e',
      });
    });

    // Resolve any exact (r, theta) collisions using Golden-Angle phyllotaxis nudge
    const occupied = [];
    return list.map((node, i) => {
      if (node.node_kind === 'nucleus') {
        return { ...node, plotR: 0, plotTheta: 0 };
      }
      let plotR = mapRadiusToCanvas(node.radius, node.node_kind);
      let plotTheta = Number(node.theta || i * GOLDEN_ANGLE) % (Math.PI * 2);
      if (plotTheta < 0) plotTheta += Math.PI * 2;

      for (let attempt = 0; attempt < 12; attempt++) {
        const x = Math.cos(plotTheta) * plotR;
        const y = Math.sin(plotTheta) * plotR;
        const tooClose = occupied.some((p) => Math.hypot(p.x - x, p.y - y) < 16);
        if (!tooClose) {
          occupied.push({ x, y });
          break;
        }
        plotTheta = (plotTheta + GOLDEN_ANGLE * 0.5) % (Math.PI * 2);
        if (node.node_kind !== 'black_hole') {
          plotR = Math.min(148, Math.max(30, plotR + (attempt % 2 === 0 ? 7 : -5)));
        }
      }
      return { ...node, plotR, plotTheta };
    });
  }, [state]);

  const selectedNode = useMemo(() => {
    return (
      allNodes.find((n) => n.id === selectedId) ||
      allNodes.find((n) => n.node_kind === 'nucleus') ||
      allNodes[0] ||
      null
    );
  }, [allNodes, selectedId]);

  const hoveredNode = useMemo(
    () => allNodes.find((n) => n.id === hoveredId) || null,
    [allNodes, hoveredId]
  );

  // Render canvas with optional slow orbital precession & non-overlapping labels
  useEffect(() => {
    let rafId = null;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      ctx.clearRect(0, 0, W, H);

      // Subtle polar coordinate grid lines
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * 162, cy + Math.sin(ang) * 162);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw Orbital Rings & Event Horizon
      const rings = [
        { r: 42, label: 'r=1.0', color: 'rgba(59, 99, 251, 0.22)' },
        { r: 82, label: 'r=4.0', color: 'rgba(59, 99, 251, 0.20)' },
        { r: 122, label: 'r=10.0', color: 'rgba(56, 189, 248, 0.22)' },
        { r: 162, label: 'r=21.0 (HORIZON)', color: 'rgba(244, 63, 94, 0.55)' },
      ];
      rings.forEach((ring, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = idx === 3 ? 1.5 : 1;
        ctx.stroke();
      });

      const currentPlots = [];
      const labelBoxes = [];

      allNodes.forEach((node) => {
        const isNucleus = node.node_kind === 'nucleus';
        const isBh = node.node_kind === 'black_hole';
        const isFossil = node.node_kind === 'fossil';
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredId === node.id;

        const angularSpeed = isNucleus ? 0 : isBh ? 0.15 : 1.0 / (1.0 + node.plotR * 0.025);
        const angle = node.plotTheta + phaseRef.current * angularSpeed;
        const x = isNucleus ? cx : cx + Math.cos(angle) * node.plotR;
        const y = isNucleus ? cy : cy + Math.sin(angle) * node.plotR;

        currentPlots.push({ id: node.id, node, x, y, r: isNucleus ? 10 : 7 });

        // Radial gravity vector line for nucleus, selected, hovered, or active orbits
        if (!isNucleus && (isSelected || isHovered || node.node_kind === 'orbit')) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(x, y);
          ctx.strokeStyle = isSelected || isHovered
            ? 'rgba(34, 197, 94, 0.75)'
            : 'rgba(59, 99, 251, 0.22)';
          ctx.lineWidth = isSelected || isHovered ? 1.5 : 1;
          ctx.stroke();
        }

        // Selection / hover outer halo
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(x, y, isNucleus ? 13 : 10, 0, Math.PI * 2);
          ctx.strokeStyle = isHovered ? '#facc15' : '#22c55e';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Node body
        ctx.beginPath();
        ctx.arc(x, y, isNucleus ? 8 : isBh ? 5.5 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isNucleus
          ? '#22c55e'
          : isFossil
          ? '#38bdf8'
          : isBh
          ? '#f43f5e'
          : '#3b63fb';
        ctx.fill();

        if (isNucleus) {
          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#eab308';
          ctx.fill();
        }

        // Non-overlapping smart label placement
        const rawTitle = String(node.title || node.code_hash || '')
          .replace(/^\[(Knowledge|Asset|Studio Draft[^\]]*|Spark|Experiment|Ouroboros[^\]]*)\]\s*/i, '')
          .slice(0, 16);
        const text = isNucleus
          ? `CORE G${node.generation ?? 0}`
          : isFossil
          ? `.bak G${node.generation ?? 0}`
          : isBh
          ? `✗ ${String(node.code_hash || '').slice(0, 6)}`
          : `${rawTitle} (r=${Number(node.radius || 0).toFixed(1)})`;

        ctx.font = isSelected || isHovered ? 'bold 10px monospace' : '10px monospace';
        const tw = ctx.measureText(text).width;
        const lx = x + 10 + tw > W - 6 ? x - tw - 10 : x + 10;
        const ly = Math.max(14, Math.min(H - 8, y + 3));
        const box = { x1: lx - 2, y1: ly - 10, x2: lx + tw + 2, y2: ly + 3 };

        const overlaps = labelBoxes.some(
          (b) => !(box.x2 < b.x1 || box.x1 > b.x2 || box.y2 < b.y1 || box.y1 > b.y2)
        );

        if (isSelected || isHovered || isNucleus || (!overlaps && labelBoxes.length < 9)) {
          labelBoxes.push(box);
          ctx.fillStyle = 'rgba(17, 17, 17, 0.82)';
          ctx.fillRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
          ctx.fillStyle = isSelected || isHovered
            ? '#facc15'
            : isNucleus
            ? '#4ade80'
            : isFossil
            ? '#7dd3fc'
            : isBh
            ? '#fda4af'
            : '#e2e8f0';
          ctx.fillText(text, lx, ly);
        }
      });

      plottedRef.current = currentPlots;

      if (animateOrbit) {
        phaseRef.current += 0.0025;
        rafId = requestAnimationFrame(render);
      }
    };

    render();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [allNodes, animateOrbit, hoveredId, selectedNode?.id]);

  const findHitNode = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let closest = null;
    let bestDist = 16;
    for (const p of plottedRef.current) {
      const d = Math.hypot(p.x - mx, p.y - my);
      if (d < bestDist) {
        bestDist = d;
        closest = p.node;
      }
    }
    return closest;
  };

  const handleCanvasMove = (e) => {
    const hit = findHitNode(e);
    setHoveredId(hit ? hit.id : null);
  };

  const handleCanvasClick = (e) => {
    const hit = findHitNode(e);
    if (hit) {
      setSelectedId(hit.id);
      onSelectNode?.(hit);
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPayload.trim() || !onStoreMemory) return;
    await onStoreMemory(newTitle.trim(), newPayload.trim());
    setNewTitle('');
    setNewPayload('');
    setShowAddForm(false);
  };

  const filteredList = useMemo(() => {
    return allNodes.filter((n) => {
      if (kindFilter !== 'ALL' && n.node_kind !== kindFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          String(n.title || '').toLowerCase().includes(q) ||
          String(n.code_hash || '').toLowerCase().includes(q) ||
          String(n.branch_origin || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allNodes, kindFilter, search]);

  const activeG = state?.activeGenome;

  return (
    <div className="flex flex-col space-y-3">
      {/* Interactive Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {onSyncWorkspace && (
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={onSyncWorkspace}
              className="h-7 px-2 text-[10px] font-mono"
              title="Ingest real Knowledge, Drafts, Assets, Sparks & Experiments into Polar Orbit"
            >
              <Database size={11} /> Sync Workspace Data
            </Button>
          )}
          {onMemoryCycle && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={onMemoryCycle}
              className="h-7 px-2 text-[10px] font-mono"
              title="Run Wolfram Rule 30 centrifugal drift tick"
            >
              <RefreshCw size={11} /> Rule 30 Drift
            </Button>
          )}
          {onStoreMemory && (
            <Button
              size="sm"
              variant={showAddForm ? 'default' : 'outline'}
              disabled={busy}
              onClick={() => setShowAddForm((v) => !v)}
              className="h-7 px-2 text-[10px] font-mono"
            >
              <Plus size={11} /> Register Memory
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setAnimateOrbit((v) => !v)}
          className="px-2 py-1 rounded bg-secondary border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          {animateOrbit ? <Pause size={10} /> : <Play size={10} />}
          {animateOrbit ? 'Live Orbit' : 'Paused'}
        </button>
      </div>

      {/* Inline Register Memory Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMemory}
          className="p-2.5 rounded bg-secondary/70 border border-border space-y-2 text-xs font-mono"
        >
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Memory node title (e.g., Golden-Angle Spatial Packing Rule)"
            className="w-full rounded bg-background border border-input px-2.5 py-1.5 text-xs"
          />
          <textarea
            value={newPayload}
            onChange={(e) => setNewPayload(e.target.value)}
            rows={2}
            placeholder="Real data payload, code snippet, or verified heuristic to store in polar orbit..."
            className="w-full rounded bg-background border border-input px-2.5 py-1.5 text-xs"
          />
          <div className="flex justify-end gap-1.5">
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddForm(false)} className="h-7 text-[10px]">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={busy || !newTitle.trim() || !newPayload.trim()}
              className="h-7 text-[10px]"
            >
              Insert into Orbit
            </Button>
          </div>
        </form>
      )}

      {/* Interactive Polar Canvas */}
      <div className="relative flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          onMouseMove={handleCanvasMove}
          onMouseLeave={() => setHoveredId(null)}
          onClick={handleCanvasClick}
          className="rounded-md border border-border bg-background cursor-pointer max-w-full"
          aria-label="Interactive Centripetal Polar Memory Orbital Topology"
        />
        {hoveredNode && (
          <div className="absolute bottom-2 left-2 right-2 p-2 rounded bg-background/95 border border-primary/50 text-[10px] font-mono flex items-center justify-between gap-2 pointer-events-none">
            <span className="truncate font-semibold text-foreground">
              [{hoveredNode.node_kind?.toUpperCase()}] {hoveredNode.title}
            </span>
            <span className="text-primary shrink-0">
              r={Number(hoveredNode.radius || 0).toFixed(2)} · θ={Number(hoveredNode.theta || 0).toFixed(2)} · F=
              {Number(hoveredNode.fitness || 0).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Core KPI Strip */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">ACTIVE GEN</div>
          <div className="font-semibold text-foreground">GEN {activeG?.generation ?? 0}</div>
        </div>
        <div className="p-2 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">SPEEDUP</div>
          <div className="font-semibold text-success">{Number(activeG?.speedup || 1).toFixed(2)}x</div>
        </div>
        <div className="p-2 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">CORE RADIUS</div>
          <div className="font-semibold text-foreground">{Number(activeG?.radius || 0).toFixed(4)}</div>
        </div>
        <div className="p-2 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">CONTINUITY</div>
          <div className="font-semibold text-primary">{Number(activeG?.continuity || 0).toFixed(4)}</div>
        </div>
      </div>

      {/* Selected Node Live Inspector & Direct Manipulation */}
      {selectedNode && (
        <div className="p-2.5 rounded bg-background border border-border space-y-2 text-[11px] font-mono">
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-border pb-1.5">
            <div className="truncate">
              <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] mr-1.5 uppercase">
                {selectedNode.node_kind}
              </span>
              <strong className="text-foreground">{selectedNode.title}</strong>
            </div>
            <span className="text-[10px] text-muted-foreground">
              [{String(selectedNode.code_hash || '').slice(0, 10)}]
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-[10px]">
            <div className="p-1.5 rounded bg-secondary/60">
              <span className="text-muted-foreground block">Radius r</span>
              <strong className="text-foreground">{Number(selectedNode.radius || 0).toFixed(3)}</strong>
            </div>
            <div className="p-1.5 rounded bg-secondary/60">
              <span className="text-muted-foreground block">Angle θ</span>
              <strong className="text-foreground">{Number(selectedNode.theta || 0).toFixed(3)} rad</strong>
            </div>
            <div className="p-1.5 rounded bg-secondary/60">
              <span className="text-muted-foreground block">Fitness F</span>
              <strong className="text-success">{Number(selectedNode.fitness || 0).toFixed(3)}</strong>
            </div>
            <div className="p-1.5 rounded bg-secondary/60">
              <span className="text-muted-foreground block">Hits / C</span>
              <strong className="text-primary">
                {selectedNode.access_count || 1} / {Number(selectedNode.continuity || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          {selectedNode.diagnostic_summary && (
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {selectedNode.diagnostic_summary}
            </p>
          )}

          {selectedNode.source_code && (
            <pre className="p-2 rounded bg-secondary/50 border border-border text-[10px] text-foreground max-h-28 overflow-auto leading-relaxed">
              {String(selectedNode.source_code).slice(0, 1200)}
            </pre>
          )}

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {selectedNode.node_kind !== 'nucleus' && selectedNode.node_kind !== 'black_hole' && onRecallMemory && (
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => onRecallMemory(selectedNode.id)}
                className="h-6 px-2 text-[10px]"
              >
                <ArrowUpCircle size={11} /> Pull to Core (Recall)
              </Button>
            )}
            {selectedNode.node_kind !== 'nucleus' && selectedNode.node_kind !== 'black_hole' && onPromoteNucleus && (
              <Button
                size="sm"
                variant="default"
                disabled={busy}
                onClick={() => onPromoteNucleus(selectedNode.id)}
                className="h-6 px-2 text-[10px]"
              >
                <Cpu size={11} /> Promote to Core Nucleus
              </Button>
            )}
            {selectedNode.node_kind === 'orbit' && onArchiveFossil && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onArchiveFossil(selectedNode.id)}
                className="h-6 px-2 text-[10px]"
              >
                <Archive size={11} /> Archive .bak
              </Button>
            )}
            {selectedNode.node_kind !== 'nucleus' && selectedNode.node_kind !== 'black_hole' && onCollapseBlackHole && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onCollapseBlackHole(selectedNode.id)}
                className="h-6 px-2 text-[10px] text-destructive"
              >
                <Flame size={11} /> Black Hole
              </Button>
            )}
            {selectedNode.node_kind !== 'nucleus' && onDeleteNode && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => onDeleteNode(selectedNode.id)}
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive ml-auto"
              >
                <Trash2 size={11} />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filterable Orbital Registry List */}
      <div className="space-y-1.5 pt-1 border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap gap-1">
            {[
              ['ALL', `All (${allNodes.length})`],
              ['orbit', `Orbits (${allNodes.filter((n) => n.node_kind === 'orbit').length})`],
              ['fossil', `Fossils (${allNodes.filter((n) => n.node_kind === 'fossil').length})`],
              ['black_hole', `Black Holes (${allNodes.filter((n) => n.node_kind === 'black_hole').length})`],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKindFilter(k)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                  kindFilter === k
                    ? 'border-primary bg-primary/15 text-primary font-semibold'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter nodes..."
            className="w-28 rounded bg-background border border-input px-2 py-0.5 text-[10px] font-mono"
          />
        </div>

        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
          {filteredList.map((n) => {
            const isSel = selectedNode?.id === n.id;
            return (
              <div
                key={n.id}
                onClick={() => {
                  setSelectedId(n.id);
                  onSelectNode?.(n);
                }}
                className={`p-1.5 rounded border text-[10px] font-mono flex items-center justify-between gap-2 cursor-pointer ${
                  isSel
                    ? 'border-primary bg-primary/15 text-foreground'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="truncate">
                  <strong className="text-foreground">{n.title}</strong>
                </span>
                <span className="shrink-0">
                  r={Number(n.radius || 0).toFixed(2)} · F={Number(n.fitness || 0).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}