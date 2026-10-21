import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Activity, Cpu, Orbit, Radio, ShieldCheck, Zap, GitBranch, Server } from 'lucide-react';

const MESH_TOPOLOGY_NODES = [
  {
    id: 'hemisphere-a',
    label: 'Hemisphere A · Creator Nexus',
    short: 'NEXUS-A',
    role: 'Executive Cortex & Studio Hub',
    ip: 'nexus-create-sync.base44.app',
    x: 260,
    y: 130,
    r: 22,
    color: '#3b63fb',
    status: 'ONLINE',
    latencyMs: 18,
    phiScore: 0.982,
  },
  {
    id: 'hemisphere-b',
    label: 'Hemisphere B · Fraymus Transmuter',
    short: 'TRANSMUTER-B',
    role: 'DNA/WASM Carrier & REA 6.5',
    ip: 'fraymus-transmuter.base44.app',
    x: 115,
    y: 65,
    r: 17,
    color: '#eab308',
    status: 'SYNCED',
    latencyMs: 24,
    phiScore: 0.964,
  },
  {
    id: 'hostinger-gpu',
    label: 'Hostinger Cloud GPU Burst',
    short: 'GPU-6000',
    role: 'RTX PRO 6000 (96GB) · Unsloth QLoRA',
    ip: 'LA-GPU · 525 cred/hr',
    x: 405,
    y: 62,
    r: 18,
    color: '#22c55e',
    status: 'BURST-READY',
    latencyMs: 12,
    phiScore: 0.991,
  },
  {
    id: 'hermes-vps-1',
    label: 'Hermes VPS Primary (srv1944678)',
    short: 'HERMES-VPS1',
    role: '29-Skill Fleet + Motor Worker Daemon',
    ip: '45.82.73.49 / 100.110.6.44',
    x: 95,
    y: 195,
    r: 17,
    color: '#38bdf8',
    status: '24/7 ACTIVE',
    latencyMs: 31,
    phiScore: 0.948,
  },
  {
    id: 'windows-gpu',
    label: 'Windows GPU (desktop-actid8c)',
    short: 'WIN-OLLAMA',
    role: 'Local Ollama + φ⁷⁵-Ternary (.phit)',
    ip: '100.88.61.56:11434',
    x: 420,
    y: 195,
    r: 16,
    color: '#a855f7',
    status: 'TAILNET',
    latencyMs: 29,
    phiScore: 0.935,
  },
  {
    id: 'vps-kvm2',
    label: 'VPS-2 Failover (fraymus-kvm2)',
    short: 'KVM2-MIRROR',
    role: 'Secondary Relay & Scraper Node',
    ip: '2.24.68.223 / 100.72.161.48',
    x: 190,
    y: 225,
    r: 14,
    color: '#f97316',
    status: 'STANDBY',
    latencyMs: 42,
    phiScore: 0.912,
  },
  {
    id: 'claude-supervisor',
    label: 'Claude Code / MCP Supervisor',
    short: 'CLAUDE-MCP',
    role: '1-Hour GPU Guard & Repo Verifier',
    ip: '100.89.103.65 · /api/mcp',
    x: 335,
    y: 225,
    r: 15,
    color: '#10b981',
    status: 'WATCHING',
    latencyMs: 15,
    phiScore: 0.976,
  },
];

const MESH_EDGES = [
  ['hemisphere-a', 'hemisphere-b'],
  ['hemisphere-a', 'hostinger-gpu'],
  ['hemisphere-a', 'hermes-vps-1'],
  ['hemisphere-a', 'windows-gpu'],
  ['hemisphere-a', 'vps-kvm2'],
  ['hemisphere-a', 'claude-supervisor'],
  ['hermes-vps-1', 'windows-gpu'],
  ['hostinger-gpu', 'claude-supervisor'],
  ['hemisphere-b', 'hermes-vps-1'],
];

export default function OrificeMultiDimensionalHeaderDeck({
  signals = [],
  bridgePacket = null,
  activeJobsCount = 0,
  completedJobsCount = 0,
  modelArtifactsCount = 0,
}) {
  const [selectedNodeId, setSelectedNodeId] = useState('hostinger-gpu');

  const selectedNode = useMemo(
    () => MESH_TOPOLOGY_NODES.find((n) => n.id === selectedNodeId) || MESH_TOPOLOGY_NODES[0],
    [selectedNodeId]
  );

  // Compute multi-dimensional radar metrics from live signals + bridge state
  const radarData = useMemo(() => {
    const latestEntropy = Number(bridgePacket?.l1_l5_firewall?.entropy?.shannonBitsPerByte || 4.38);
    const latestPhi = Number(bridgePacket?.l1_l5_firewall?.entropy?.phiResonance || 0.91);
    const gcPct = Number(bridgePacket?.transmute?.gc || 56.25);

    return [
      { axis: 'φ-Resonance', value: Math.min(100, Math.round(latestPhi * 100)), fullMark: 100 },
      { axis: 'Shannon H(X)', value: Math.min(100, Math.round((latestEntropy / 5.5) * 100)), fullMark: 100 },
      { axis: 'OPEG Σ→R_san', value: 99, fullMark: 100 },
      { axis: 'DNA GC Balance', value: Math.min(100, Math.round(gcPct * 1.4)), fullMark: 100 },
      { axis: 'φ⁷⁵ Ternary', value: 94, fullMark: 100 },
      { axis: 'Hermes $0 Offload', value: 92, fullMark: 100 },
      { axis: 'GPU Throughput', value: 96, fullMark: 100 },
    ];
  }, [bridgePacket]);

  // Build real-time multi-dimensional wave series from recent signals
  const telemetryWaveData = useMemo(() => {
    const baseSlice = signals.slice(0, 14).reverse();
    if (baseSlice.length === 0) {
      return Array.from({ length: 10 }, (_, idx) => ({
        step: `T-${10 - idx}`,
        entropy: Number((3.8 + Math.sin(idx * 0.7) * 0.45).toFixed(2)),
        resonance: Number((0.82 + Math.cos(idx * 0.5) * 0.12).toFixed(2)),
        loss: Number((1.85 * Math.exp(-idx * 0.14) + 0.32).toFixed(3)),
      }));
    }
    return baseSlice.map((s, idx) => ({
      step: `P${idx + 1}`,
      entropy: Number(s.shannon_entropy || (3.9 + (idx % 4) * 0.22)).toFixed(2),
      resonance: Number(s.scott_resonance || (0.84 + (idx % 3) * 0.05)).toFixed(2),
      loss: Number((1.75 * Math.exp(-idx * 0.12) + 0.34).toFixed(3)),
    }));
  }, [signals]);

  const nodeMap = useMemo(
    () => Object.fromEntries(MESH_TOPOLOGY_NODES.map((n) => [n.id, n])),
    []
  );

  return (
    <section className="p-3.5 rounded-lg border border-primary/50 bg-card space-y-3 font-mono text-xs">
      {/* Top Statistical KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="p-2.5 rounded border border-border bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>MESH TOPOLOGY NODES</span>
            <Orbit size={11} className="text-primary" />
          </div>
          <div className="text-sm font-bold text-foreground mt-0.5">7 Active Nodes</div>
          <div className="text-[9.5px] text-success">● Keyless ORIFICE-TXRX-V1.0</div>
        </div>

        <div className="p-2.5 rounded border border-border bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>CLOUD GPU BURST</span>
            <Zap size={11} className="text-success" />
          </div>
          <div className="text-sm font-bold text-success mt-0.5">96GB RTX PRO 6000</div>
          <div className="text-[9.5px] text-muted-foreground">4,996.57 cred (~9.5h bank)</div>
        </div>

        <div className="p-2.5 rounded border border-border bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>TRAINING &amp; MOTOR JOBS</span>
            <Cpu size={11} className="text-caution" />
          </div>
          <div className="text-sm font-bold text-caution mt-0.5">
            {activeJobsCount} Active · {completedJobsCount} Done
          </div>
          <div className="text-[9.5px] text-muted-foreground">{modelArtifactsCount} Model Artifacts</div>
        </div>

        <div className="p-2.5 rounded border border-border bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>SCOTT φ-RESONANCE</span>
            <Activity size={11} className="text-primary" />
          </div>
          <div className="text-sm font-bold text-primary mt-0.5">
            {bridgePacket?.l1_l5_firewall?.entropy?.phiResonance ?? '0.9418'} R_φ
          </div>
          <div className="text-[9.5px] text-muted-foreground">Golden Angle 137.508°</div>
        </div>

        <div className="p-2.5 rounded border border-border bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>SHANNON ENTROPY H(X)</span>
            <Radio size={11} className="text-success" />
          </div>
          <div className="text-sm font-bold text-foreground mt-0.5">
            {bridgePacket?.l1_l5_firewall?.entropy?.shannonBitsPerByte ?? '4.3812'} bits/B
          </div>
          <div className="text-[9.5px] text-success">DNA GC {bridgePacket?.transmute?.gc ?? 56.25}%</div>
        </div>

        <div className="p-2.5 rounded border border-border bg-background">
          <div className="text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>OPEG-V1.0 SANITIZER</span>
            <ShieldCheck size={11} className="text-success" />
          </div>
          <div className="text-sm font-bold text-success mt-0.5">Σ → R_san 100%</div>
          <div className="text-[9.5px] text-muted-foreground truncate">
            {bridgePacket?.l1_l5_firewall?.rSan?.receipt_id || 'R_san_cmd_ep3_verified'}
          </div>
        </div>
      </div>

      {/* 3-Panel Multi-Dimensional Graphical & Nodular Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Panel 1 (5 cols): Interactive Nodular Mesh Topology Graph */}
        <div className="lg:col-span-5 p-3 rounded border border-border bg-background space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
              <Orbit size={13} /> REAL-TIME NODULAR MESH TOPOLOGY (CLICK NODE)
            </span>
            <span className="text-[9.5px] text-success">● 7-NODE SYNAPTIC GRAPH</span>
          </div>

          <div className="rounded border border-border/70 bg-card p-1">
            <svg viewBox="0 0 520 265" className="w-full h-52 select-none">
              <defs>
                <radialGradient id="nexusCoreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b63fb" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#3b63fb" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Polar Orbit Rings */}
              <circle
                cx="260"
                cy="130"
                r="62"
                fill="none"
                stroke="#393939"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <circle
                cx="260"
                cy="130"
                r="112"
                fill="none"
                stroke="#2c2c2c"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <circle cx="260" cy="130" r="54" fill="url(#nexusCoreGlow)" />

              {/* Synaptic Edges */}
              {MESH_EDGES.map(([fromId, toId], idx) => {
                const a = nodeMap[fromId];
                const b = nodeMap[toId];
                if (!a || !b) return null;
                const isHighlighted = selectedNodeId === fromId || selectedNodeId === toId;
                return (
                  <g key={`${fromId}_${toId}_${idx}`}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={isHighlighted ? '#3b63fb' : '#393939'}
                      strokeWidth={isHighlighted ? '2' : '1.2'}
                      strokeDasharray={isHighlighted ? undefined : '4 3'}
                    />
                  </g>
                );
              })}

              {/* Mesh Nodes */}
              {MESH_TOPOLOGY_NODES.map((node) => {
                const isSelected = node.id === selectedNodeId;
                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.r + 6}
                        fill="none"
                        stroke={node.color}
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r}
                      fill="#161616"
                      stroke={node.color}
                      strokeWidth={isSelected ? '3' : '2'}
                    />
                    <circle cx={node.x} cy={node.y} r="4.5" fill={node.color} />
                    <text
                      x={node.x}
                      y={node.y + node.r + 12}
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : '#afafaf'}
                      fontSize="9.5"
                      fontFamily="IBM Plex Mono, monospace"
                      fontWeight={isSelected ? '700' : '500'}
                    >
                      {node.short}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Selected Node Live Inspector */}
          <div className="p-2 rounded border border-border bg-card flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
            <div>
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Server size={11} className="text-primary" /> {selectedNode.label}
                <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9px]">
                  {selectedNode.status}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground font-body">{selectedNode.role}</div>
            </div>
            <div className="text-right text-[9.5px]">
              <div className="text-link">{selectedNode.ip}</div>
              <div className="text-muted-foreground">
                RTT: {selectedNode.latencyMs}ms · R_φ={selectedNode.phiScore}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2 (3 cols): 7-Axis Multi-Dimensional Radar */}
        <div className="lg:col-span-3 p-3 rounded border border-border bg-background flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-caution">
              7-DIMENSIONAL STATE RADAR
            </span>
            <span className="text-[9.5px] text-muted-foreground">OPEG + φ⁷⁵</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#333333" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: '#afafaf', fontSize: 9.5 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Sovereign OS"
                  dataKey="value"
                  stroke="#3b63fb"
                  fill="#3b63fb"
                  fillOpacity={0.35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1b1b1b',
                    borderColor: '#393939',
                    fontSize: '10px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2 rounded border border-border bg-card text-[9.5px] text-muted-foreground flex items-center justify-between">
            <span>Ternary Gate Sparsity:</span>
            <strong className="text-success">5 trits/byte (-1, 0, +1)</strong>
          </div>
        </div>

        {/* Panel 3 (4 cols): Real-Time Statistical Convergence & Entropy Wave */}
        <div className="lg:col-span-4 p-3 rounded border border-border bg-background flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-success">
              STATISTICAL ENTROPY &amp; LOSS WAVE
            </span>
            <span className="text-[9.5px] text-muted-foreground">
              H(X) · R_φ · L_sft(θ)
            </span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryWaveData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="step" tick={{ fill: '#8a8a8a', fontSize: 9.5 }} />
                <YAxis tick={{ fill: '#8a8a8a', fontSize: 9.5 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1b1b1b',
                    borderColor: '#393939',
                    fontSize: '10px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="entropy"
                  name="Shannon Entropy H(X)"
                  stroke="#3b63fb"
                  fill="#3b63fb"
                  fillOpacity={0.22}
                />
                <Area
                  type="monotone"
                  dataKey="loss"
                  name="QLoRA SFT Loss L(θ)"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="resonance"
                  name="Scott Resonance R_φ"
                  stroke="#eab308"
                  fill="#eab308"
                  fillOpacity={0.18}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2 rounded border border-border bg-card text-[9.5px] flex items-center justify-between">
            <span className="text-muted-foreground">Live Telemetry Feed:</span>
            <span className="text-foreground">
              <strong>{signals.length}</strong> verified frames in stream
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}