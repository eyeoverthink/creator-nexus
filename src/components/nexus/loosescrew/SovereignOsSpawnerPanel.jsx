import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Cpu,
  GitMerge,
  Globe,
  Loader2,
  Plus,
  Radio,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

const FRONTIER_PRESETS = [
  {
    id: 'coral',
    label: '🐝 CORAL 4-Agent Co-Evolution OS',
    name: 'CORAL Swarm-1103 OS',
    directive:
      'Implement CORAL (2026) 4-agent autonomous co-evolution with shared persistent memory to reduce kernel execution cycles from 1363 to 1103 cycles.',
  },
  {
    id: 'avo',
    label: '⚡ AVO Variation Operator OS',
    name: 'AVO Micro-Stride OS',
    directive:
      'Elevate agent to an Agentic Variation Operator (AVO 2026) that mutates register stride & tensor butterfly layouts to surpass expert kernels.',
  },
  {
    id: 'dgm',
    label: '🔄 Karpathy AutoResearch / DGM-H OS',
    name: 'DGM-H AutoResearch OS',
    directive:
      'Implement Darwin-Gödel Machine Hyper (DGM-H) & Karpathy Loop: modify kernel -> run 5-stage gauntlet benchmark -> keep or prune to Black Hole.',
  },
  {
    id: 'synapse',
    label: '🌐 Cross-Window Synapse & Media OS',
    name: 'Polaris VMR-Synapse OS',
    directive:
      'Unify real-time cross-window selection memory, Verifiable Media Receipts (VMR), and 15-Agent Hive consensus on the One-Tick Heartbeat.',
  },
];

export default function SovereignOsSpawnerPanel({ onSyncToMonolith }) {
  const [systems, setSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [crossoverTargetId, setCrossoverTargetId] = useState('');
  const [customName, setCustomName] = useState('');
  const [directive, setDirective] = useState('');
  const [useAi, setUseAi] = useState(true);
  const [webGrounded, setWebGrounded] = useState(true);
  const [autoEvolve, setAutoEvolve] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastEventMsg, setLastEventMsg] = useState('');

  const loadSystems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'list_sovereign_os',
      });
      if (Array.isArray(data?.systems)) {
        setSystems(data.systems);
        setSelectedSystem((prev) =>
          prev ? data.systems.find((s) => s.id === prev.id) || data.systems[0] : data.systems[0]
        );
        onSyncToMonolith?.(data.systems, null);
      }
    } catch (e) {
      setError(e.message || 'Could not load Sovereign OS registry');
    } finally {
      setLoading(false);
    }
  }, [onSyncToMonolith]);

  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  const runSpawnOrEvolve = useCallback(
    async ({
      targetSystemId = null,
      secondSystemId = '',
      nameOverride = '',
      directiveOverride = '',
    } = {}) => {
      if (busy) return;
      setBusy(true);
      setError('');
      try {
        const { data } = await base44.functions.invoke('nexusEvolution', {
          action: 'evolve_sovereign_os',
          ...(targetSystemId ? { system_id: targetSystemId } : {}),
          ...(secondSystemId ? { crossover_system_id: secondSystemId } : {}),
          name: nameOverride || (targetSystemId && !secondSystemId ? '' : customName.trim()),
          directive: directiveOverride || directive.trim(),
          use_ai: useAi,
          web_grounded: webGrounded,
        });
        if (data?.error) throw new Error(data.error);
        if (Array.isArray(data?.systems)) {
          setSystems(data.systems);
        }
        if (data?.system) {
          setSelectedSystem(data.system);
          const actionVerb =
            data.mode === 'crossover'
              ? 'Cross-Pollinated'
              : data.mode === 'evolved'
              ? 'Evolved'
              : 'Spawned';
          setLastEventMsg(
            `${actionVerb} ${data.system.name} → Gen ${data.system.generation} (Fitness ${data.system.fitness} · ${data.system.speedup}x · CORAL ${data.system.coralCycles || 1103} cycles)`
          );
          onSyncToMonolith?.(data.systems || [], data.system);
        }
        if (!targetSystemId) {
          setCustomName('');
          setDirective('');
        }
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'OS evolution failed');
      } finally {
        setBusy(false);
      }
    },
    [busy, customName, directive, useAi, webGrounded, onSyncToMonolith]
  );

  useEffect(() => {
    const onMsg = (ev) => {
      if (ev?.data?.type === 'NEXUS_REQUEST_OS_EVOLVE') {
        runSpawnOrEvolve({ directiveOverride: ev.data.directive || '' });
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [runSpawnOrEvolve]);

  useEffect(() => {
    if (!autoEvolve) return undefined;
    const timer = setInterval(() => {
      if (!busy && systems.length > 0) {
        const shouldEvolveExisting = systems.length >= 4 || Math.random() > 0.45;
        const target = shouldEvolveExisting
          ? systems[Math.floor(Math.random() * systems.length)]
          : null;
        runSpawnOrEvolve({
          targetSystemId: target?.id || null,
          directiveOverride:
            'Autonomous CORAL 4-agent co-evolution & AVO variation operator cycle',
        });
      }
    }, 18000);
    return () => clearInterval(timer);
  }, [autoEvolve, busy, systems, runSpawnOrEvolve]);

  return (
    <div className="p-4 border-b border-border bg-background/95 font-mono text-xs text-foreground space-y-3 z-20 max-h-[62vh] overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-primary" />
          <div>
            <div className="font-semibold text-sm flex items-center gap-2">
              <span>F.R.A.Y.M.U.S. SOVEREIGN SUB-OS GENESIS &amp; CO-EVOLUTION ENGINE</span>
              <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 text-[10px]">
                {systems.length} LIVE SYSTEMS
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Powered by 2026 Frontier Multi-Agent Co-Evolution (CORAL), Agentic Variation Operators (AVO), Karpathy Keep/Discard Loops, and live web-grounded research synthesis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={autoEvolve ? 'default' : 'outline'}
            onClick={() => setAutoEvolve((v) => !v)}
            className="h-7 text-[11px] font-mono gap-1"
          >
            <Radio size={12} className={autoEvolve ? 'animate-pulse' : ''} />
            {autoEvolve ? 'Auto-Evolve Loop: ON (18s)' : 'Enable Auto-Evolve Loop'}
          </Button>
          <Link to="/argon" className="text-[11px] text-primary hover:underline">
            Argon Orbit →
          </Link>
          <Link to="/loose-screw" className="text-[11px] text-primary hover:underline">
            looseScrew CODE →
          </Link>
        </div>
      </div>

      {/* Frontier Research Presets Bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground mr-1">
          1-Click Frontier Blueprints:
        </span>
        {FRONTIER_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy}
            onClick={() =>
              runSpawnOrEvolve({
                nameOverride: p.name,
                directiveOverride: p.directive,
              })
            }
            className="px-2.5 py-1 rounded bg-secondary/70 hover:bg-primary/20 border border-border hover:border-primary/40 text-[10px] text-foreground transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom Spawner + Live Internet Grounding + Crossover Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-center bg-card p-3 rounded-lg border border-border">
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="OS name (optional)..."
          className="lg:col-span-2 h-8 px-2.5 rounded bg-background border border-input text-xs"
        />
        <input
          type="text"
          value={directive}
          onChange={(e) => setDirective(e.target.value)}
          placeholder="Directive or research topic (e.g. 'Zero-latency WebGPU shader kernel')..."
          className="lg:col-span-4 h-8 px-2.5 rounded bg-background border border-input text-xs"
        />
        <label className="lg:col-span-2 flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={useAi}
            onChange={(e) => setUseAi(e.target.checked)}
          />
          <Sparkles size={11} className="text-primary" /> AI Architect
        </label>
        <label className="lg:col-span-2 flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={webGrounded}
            onChange={(e) => setWebGrounded(e.target.checked)}
          />
          <Globe size={11} className="text-success" /> Live Web Search
        </label>
        <div className="lg:col-span-2 flex justify-end">
          <Button
            size="sm"
            disabled={busy}
            onClick={() => runSpawnOrEvolve()}
            className="w-full h-8 text-[11px] font-mono gap-1"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Spawn New OS
          </Button>
        </div>
      </div>

      {/* Genetic Crossover Bar when 2+ systems exist */}
      {systems.length >= 2 && selectedSystem && (
        <div className="px-3 py-2 rounded bg-secondary/40 border border-border flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <GitMerge size={13} className="text-primary" />
            <span>
              <strong>Genetic OS Crossover:</strong> Combine{' '}
              <span className="text-primary">{selectedSystem.name}</span> with:
            </span>
            <select
              aria-label="Second parent OS for crossover"
              value={crossoverTargetId}
              onChange={(e) => setCrossoverTargetId(e.target.value)}
              className="h-7 rounded bg-background border border-border px-2 text-[11px]"
            >
              <option value="">Choose second parent OS…</option>
              {systems
                .filter((s) => s.id !== selectedSystem.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Gen {s.generation})
                  </option>
                ))}
            </select>
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !crossoverTargetId}
            onClick={() =>
              runSpawnOrEvolve({
                targetSystemId: selectedSystem.id,
                secondSystemId: crossoverTargetId,
              })
            }
            className="h-7 text-[10px] font-mono gap-1"
          >
            <GitMerge size={11} /> Cross-Pollinate &amp; Spawn Hybrid OS
          </Button>
        </div>
      )}

      {lastEventMsg && (
        <div className="px-3 py-1.5 rounded bg-success/15 border border-success/40 text-success text-[11px] flex items-center justify-between">
          <span>⚡ {lastEventMsg}</span>
          <Link to="/library" className="underline text-[10px]">
            View in Library →
          </Link>
        </div>
      )}
      {error && <div className="text-destructive text-[11px]">{error}</div>}

      {/* Systems Grid + Live Executable Micro-OS Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-6 space-y-2 max-h-72 overflow-y-auto pr-1">
          {loading ? (
            <div className="text-muted-foreground p-3">Loading Sovereign OS lineage...</div>
          ) : (
            systems.map((sys) => {
              const isSel = selectedSystem?.id === sys.id;
              return (
                <div
                  key={sys.id}
                  onClick={() => {
                    setSelectedSystem(sys);
                    onSyncToMonolith?.(systems, sys);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isSel
                      ? 'border-primary bg-selection'
                      : 'border-border bg-card hover:bg-secondary/50'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sys.color || '#38bdf8' }}
                      />
                      <span className="font-semibold text-foreground truncate">{sys.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px]">
                        Gen {sys.generation}
                      </span>
                      <span className="text-[10px] text-muted-foreground">#{sys.codeHash}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2">{sys.focus}</div>
                    <div className="flex flex-wrap gap-2 text-[10px] text-success">
                      <span>Fitness: {sys.fitness}</span>
                      <span>· Speedup: {sys.speedup}x</span>
                      <span>· CORAL: {sys.coralCycles || 1103} cyc</span>
                      <span>· 3D Synapses: {sys.synapseCount}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation();
                        runSpawnOrEvolve({ targetSystemId: sys.id });
                      }}
                      className="h-7 px-2.5 text-[10px] font-mono gap-1"
                    >
                      <Zap size={11} /> Evolve Gen {sys.generation + 1}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Live Micro-OS Executable Kernel Preview */}
        <div className="lg:col-span-6 rounded-lg border border-border bg-card overflow-hidden flex flex-col h-72">
          <div className="px-3 py-1.5 border-b border-border bg-secondary/50 flex items-center justify-between text-[10px]">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <Terminal size={12} />
              {selectedSystem
                ? `LIVE KERNEL SANDBOX: ${selectedSystem.name} (Gen ${selectedSystem.generation})`
                : 'SELECT A SOVEREIGN OS'}
            </span>
            {selectedSystem && (
              <span className="text-muted-foreground">
                Syscalls: {(selectedSystem.syscalls || []).slice(0, 3).join(', ')}
              </span>
            )}
          </div>
          {selectedSystem?.appHtml ? (
            <iframe
              title={selectedSystem.name}
              srcDoc={selectedSystem.appHtml}
              className="flex-1 w-full border-0"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select or spawn a Sovereign OS to run its interactive kernel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}