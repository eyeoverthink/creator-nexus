import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Cpu,
  Loader2,
  Play,
  Plus,
  Radio,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

export default function SovereignOsSpawnerPanel({ onSyncToMonolith }) {
  const [systems, setSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [customName, setCustomName] = useState('');
  const [directive, setDirective] = useState('');
  const [useAi, setUseAi] = useState(true);
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
    async (targetSystemId = null, customDirectiveOverride = '') => {
      if (busy) return;
      setBusy(true);
      setError('');
      try {
        const { data } = await base44.functions.invoke('nexusEvolution', {
          action: 'evolve_sovereign_os',
          ...(targetSystemId ? { system_id: targetSystemId } : {}),
          name: targetSystemId ? '' : customName.trim(),
          directive: customDirectiveOverride || directive.trim(),
          use_ai: useAi,
        });
        if (data?.error) throw new Error(data.error);
        if (Array.isArray(data?.systems)) {
          setSystems(data.systems);
        }
        if (data?.system) {
          setSelectedSystem(data.system);
          setLastEventMsg(
            `${data.mode === 'evolved' ? 'Evolved' : 'Spawned'} ${data.system.name} → Gen ${data.system.generation} (Fitness ${data.system.fitness} · ${data.system.speedup}x speedup · ${data.system.synapseCount} synapses)`
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
    [busy, customName, directive, useAi, onSyncToMonolith]
  );

  // Listen for inline evolve requests from inside the 3D Monolith iframe
  useEffect(() => {
    const onMsg = (ev) => {
      if (ev?.data?.type === 'NEXUS_REQUEST_OS_EVOLVE') {
        runSpawnOrEvolve(null, ev.data.directive || '');
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [runSpawnOrEvolve]);

  // Autonomous recursive evolution loop when toggled on
  useEffect(() => {
    if (!autoEvolve) return undefined;
    const timer = setInterval(() => {
      if (!busy && systems.length > 0) {
        // Pick either an existing system to evolve or spawn a new one
        const shouldEvolveExisting = systems.length >= 4 || Math.random() > 0.45;
        const target = shouldEvolveExisting
          ? systems[Math.floor(Math.random() * systems.length)]
          : null;
        runSpawnOrEvolve(target?.id || null, 'Autonomous recursive Ouroboros OS mutation');
      }
    }, 18000);
    return () => clearInterval(timer);
  }, [autoEvolve, busy, systems, runSpawnOrEvolve]);

  return (
    <div className="p-4 border-b border-border bg-background/95 font-mono text-xs text-foreground space-y-3 z-20 max-h-[60vh] overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-primary" />
          <div>
            <div className="font-semibold text-sm flex items-center gap-2">
              <span>F.R.A.Y.M.U.S. SOVEREIGN SUB-OS GENESIS &amp; EVOLUTION ENGINE</span>
              <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 text-[10px]">
                {systems.length} LIVE SYSTEMS
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Replaced static seed labels (&ldquo;Zubair OS&rdquo;) with real database-backed Sovereign Sub-OSes that spawn, mutate across generations, and inject directly into the 3D Monolith, Centripetal Orbit, looseScrew Studio, and Library.
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

      {/* Spawner Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center bg-card p-3 rounded-lg border border-border">
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Optional OS name (or leave blank for F.R.A.Y.M.U.S. naming)..."
          className="lg:col-span-3 h-8 px-2.5 rounded bg-background border border-input text-xs"
        />
        <input
          type="text"
          value={directive}
          onChange={(e) => setDirective(e.target.value)}
          placeholder="Evolution directive (e.g., 'Quantum telemetry scheduler', 'Autonomous video synthesis kernel')..."
          className="lg:col-span-5 h-8 px-2.5 rounded bg-background border border-input text-xs"
        />
        <label className="lg:col-span-2 flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={useAi}
            onChange={(e) => setUseAi(e.target.checked)}
          />
          AI Architect Synthesis
        </label>
        <div className="lg:col-span-2 flex justify-end">
          <Button
            size="sm"
            disabled={busy}
            onClick={() => runSpawnOrEvolve(null)}
            className="w-full h-8 text-[11px] font-mono gap-1"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Spawn New OS
          </Button>
        </div>
      </div>

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
                    <div className="flex items-center gap-2">
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
                        runSpawnOrEvolve(sys.id);
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