import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ProShell from '@/components/nexus/ProShell';
import useOrigin from '@/components/nexus/origin/useOrigin';
import WorkspaceRequired from '@/components/nexus/WorkspaceRequired';
import { Button } from '@/components/ui/button';
import { Zap, RotateCcw, ArrowLeft, Cpu, BookOpen, Sparkles } from 'lucide-react';
import CentripetalOrbitCanvas from '@/components/nexus/ouroboros/CentripetalOrbitCanvas';
import TriTimelineCards from '@/components/nexus/ouroboros/TriTimelineCards';
import ProofOfEvolutionPanel from '@/components/nexus/ouroboros/ProofOfEvolutionPanel';

export default function ArgonEngine() {
  const origin = useOrigin();
  const workspaceId = origin.workspace?.id;
  const [state, setState] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [aiNote, setAiNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const callEngine = useCallback(async (action, extra = {}) => {
    if (!workspaceId) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action,
        workspace_id: workspaceId,
        ...extra,
      });
      if (data?.state) setState(data.state);
      if (data?.receipts) setReceipts(data.receipts);
      if (data?.aiSynthesisNote) setAiNote(data.aiSynthesisNote);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Engine operation failed');
    } finally {
      setBusy(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) callEngine('state');
  }, [workspaceId, callEngine]);

  const active = state?.activeGenome;

  return (
    <ProShell>
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <ArrowLeft size={14} /> Studio
            </Link>
            <div className="border-l border-border pl-3">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-primary" />
                <h1 className="font-display font-semibold text-base sm:text-lg tracking-wide">
                  ARGON // OUROBOROS-GAUNTLET QUANTUM RSI ENGINE v2.0
                </h1>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground">
                CHSH 2√2 · GROVER 121/128 · TELEPORTATION · UNITARY U†U=I · PT-SYMMETRIC EP3 (γ=√2, ǁH³ǁ_F=0)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={busy || !workspaceId}
              onClick={() => callEngine('evolve')}
            >
              <Zap size={14} /> {busy ? 'Running Gauntlet…' : 'Evolve Next Generation'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || !workspaceId}
              onClick={() => callEngine('evolve', { use_ai_transmuter: true, consent: true })}
              title="Run Tri-Timeline Evolution with Bicameral AI Synthesis Commentary"
            >
              <Sparkles size={14} /> Bicameral AI Synthesis
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || !state?.fossils?.length}
              onClick={() => callEngine('rollback')}
            >
              <RotateCcw size={14} /> Fossil Rollback (.bak)
            </Button>
            <Link to="/knowledge" className="text-xs text-primary flex items-center gap-1 ml-2">
              <BookOpen size={14} /> Knowledge Library
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-5 sm:p-8 space-y-6">
        {error && (
          <div role="alert" className="p-3 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-xs flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="underline">Dismiss</button>
          </div>
        )}

        {origin.loading ? (
          <p className="text-sm text-muted-foreground">Initializing Argon Quantum RSI Engine…</p>
        ) : !origin.workspace ? (
          <WorkspaceRequired access={origin.workspaceAccess} />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Centripetal Polar Memory & Black Hole Horizon */}
              <div className="lg:col-span-5 p-4 rounded-md border border-border bg-card flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between text-xs font-mono border-b border-border pb-2">
                  <span className="font-semibold text-primary">CENTRIPETAL ORBITAL MEMORY (θ_g = 137.5077°)</span>
                  <span className="text-muted-foreground">
                    ORBITS: {state?.orbits?.length || 0} | FOSSILS: {state?.fossils?.length || 0} | BLACK HOLE: {state?.blackHoles?.length || 0}
                  </span>
                </div>

                <CentripetalOrbitCanvas state={state} />

                <div className="text-[11px] font-mono text-muted-foreground space-y-1 border-t border-border pt-3">
                  <div><strong className="text-success">● Green/Gold Core:</strong> Active Winning Quantum Kernel (r → 0)</div>
                  <div><strong className="text-primary">● Cobalt Ring:</strong> Active Agent Memory Orbits & Preserved .bak Fossils</div>
                  <div><strong className="text-destructive">◌ Crimson Horizon:</strong> Digital Black Hole (O(1) Rejected SHA-256 Shards)</div>
                </div>
              </div>

              {/* Right Column: Tri-Timeline Arena, Source Code & Cognitive Event Ledger */}
              <div className="lg:col-span-7 p-4 rounded-md border border-border bg-card flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-border pb-2">
                  <span className="font-semibold text-primary">TRI-TIMELINE QUANTUM GAUNTLET ARENA (ALPHA / BETA / GAMMA)</span>
                  <span className="text-muted-foreground">EP3 INVARIANT: γ²=2.0 | ǁH²ǁ_F=4.0 | ǁH³ǁ_F=0.0</span>
                </div>

                <TriTimelineCards receipts={receipts} activeGenome={active} />

                {aiNote && (
                  <div className="p-2.5 rounded bg-secondary border border-border text-xs font-mono text-foreground">
                    <strong className="text-primary">Bicameral Right-Brain Synthesis:</strong> {aiNote}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-muted-foreground">ACTIVE NUCLEUS SOURCE CODE</span>
                      <span className="text-primary">SHA-256: {active?.code_hash || '—'}</span>
                    </div>
                    <pre className="p-3 rounded bg-background border border-border text-[11px] font-mono text-foreground overflow-auto h-64 leading-relaxed">
                      {active?.source_code || '// Loading Genesis Kernel...'}
                    </pre>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-muted-foreground">COGNITIVE EVENT LEDGER (EVIDENCE BEFORE THEATER)</span>
                      <span className="text-muted-foreground">{state?.ledger?.length || 0} EVENTS</span>
                    </div>
                    <div className="p-3 rounded bg-background border border-border text-[11px] font-mono overflow-auto h-64 space-y-2">
                      {(state?.ledger || []).map((ev) => {
                        const isReject = String(ev.event_type).includes('REJECT') || String(ev.event_type).includes('SKIP');
                        const isPromote = String(ev.event_type).includes('SUPERSEDED') || String(ev.event_type).includes('ONLINE') || String(ev.event_type).includes('MINTED');
                        return (
                          <div
                            key={ev.id || ev.seq}
                            className={`pb-1.5 border-b border-border/50 ${
                              isReject ? 'text-destructive' : isPromote ? 'text-success' : 'text-foreground'
                            }`}
                          >
                            <strong>[#{String(ev.seq || 0).padStart(2, '0')} {ev.episode_id}]</strong> {ev.event_type} — {ev.detail}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ProofOfEvolutionPanel
              state={state}
              busy={busy}
              onMintProof={() => callEngine('mint_proof_certificate')}
              onStoreMemory={(title, payload) => callEngine('store_memory', { title, payload })}
              onRecallMemory={(nodeId) => callEngine('recall_memory', { node_id: nodeId })}
              onMemoryCycle={() => callEngine('memory_cycle')}
            />
          </>
        )}
      </main>
    </ProShell>
  );
}