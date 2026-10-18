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
import ConsciousnessFalsificationPanel from '@/components/nexus/ouroboros/ConsciousnessFalsificationPanel';
import WorkspaceSentimentPanel from '@/components/nexus/ouroboros/WorkspaceSentimentPanel';
import SovereignTelemetryDeck from '@/components/nexus/ouroboros/SovereignTelemetryDeck';
import LinkedInAutoPublisherPanel from '@/components/nexus/spark/LinkedInAutoPublisherPanel';
import GoogleCalendarSyncPanel from '@/components/nexus/calendar/GoogleCalendarSyncPanel';
import AssetBrowser from '@/components/nexus/library/AssetBrowser';

function getLedgerBadgeClass(eventType = '') {
  const t = String(eventType).toUpperCase();
  if (t.includes('REJECT') || t.includes('SKIP') || t.includes('FALSIFIED')) {
    return 'bg-destructive/15 border-destructive/40 text-destructive';
  }
  if (t.includes('SUPERSEDED') || t.includes('PASSED') || t.includes('PROVEN') || t.includes('ONLINE') || t.includes('MINTED')) {
    return 'bg-success/15 border-success/40 text-success';
  }
  if (t.includes('FOSSIL') || t.includes('ROLLBACK') || t.includes('GRAVITY')) {
    return 'bg-caution/15 border-caution/40 text-caution';
  }
  if (t.includes('ORBIT') || t.includes('PULL') || t.includes('SENTIMENT') || t.includes('CYCLE')) {
    return 'bg-primary/15 border-primary/40 text-primary';
  }
  return 'bg-secondary border-border text-muted-foreground';
}

export default function ArgonEngine() {
  const origin = useOrigin();
  const [resolvedWorkspace, setResolvedWorkspace] = useState(null);
  const activeWorkspace = origin.workspace || resolvedWorkspace;
  const workspaceId = activeWorkspace?.id;
  const [state, setState] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [consciousnessAudit, setConsciousnessAudit] = useState([]);
  const [sentimentTelemetry, setSentimentTelemetry] = useState(null);
  const [streamConnected, setStreamConnected] = useState(true);
  const [streamEventsCount, setStreamEventsCount] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState('');
  const [showLibrary, setShowLibrary] = useState(true);
  const [aiNote, setAiNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const callEngine = useCallback(async (action, extra = {}) => {
    if (action !== 'telemetry') setBusy(true);
    setError('');
    const payload = {
      action,
      ...(workspaceId ? { workspace_id: workspaceId } : {}),
      ...extra,
    };
    const applyData = (data) => {
      if (data?.workspace) setResolvedWorkspace(data.workspace);
      if (data?.state) setState(data.state);
      if (data?.receipts) setReceipts(data.receipts);
      if (data?.consciousnessAudit) setConsciousnessAudit(data.consciousnessAudit);
      if (data?.sentimentTelemetry) setSentimentTelemetry(data.sentimentTelemetry);
      if (data?.aiSynthesisNote) setAiNote(data.aiSynthesisNote);
      setLastHeartbeat(data?.streamTimestamp || new Date().toISOString());
      setStreamEventsCount((c) => c + 1);
    };
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', payload);
      applyData(data);
    } catch (err) {
      try {
        const res = await fetch('/functions/nexusEvolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || data?.error) {
          throw new Error(data?.error || err?.response?.data?.error || err.message || 'Engine operation failed');
        }
        applyData(data);
      } catch (fallbackErr) {
        setError(fallbackErr.message || 'Engine operation failed');
      }
    } finally {
      setBusy(false);
    }
  }, [workspaceId]);

  // Prompt 1 fix: Hydrate immediately from real API telemetry on mount instead of zeroed simulation defaults
  useEffect(() => {
    callEngine('telemetry');
  }, [callEngine]);

  // Prompt 2: Live SSE / real-time entity stream subscription + heartbeat
  useEffect(() => {
    if (!streamConnected) return;
    let unsubscribe = null;
    try {
      unsubscribe = base44.entities.NexusOuroborosEvent.subscribe((event) => {
        if (!workspaceId || event?.data?.workspace_id === workspaceId) {
          setLastHeartbeat(new Date().toISOString());
          setStreamEventsCount((c) => c + 1);
        }
      });
    } catch {
      unsubscribe = null;
    }
    const timer = setInterval(() => {
      callEngine('telemetry');
    }, 25000);
    return () => {
      unsubscribe?.();
      clearInterval(timer);
    };
  }, [workspaceId, streamConnected, callEngine]);

  const active = state?.activeGenome;
  const bootErrorMsg = origin.workspaceAccess?.boot?.error?.message || '';

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
              disabled={busy}
              onClick={() => callEngine('evolve')}
            >
              <Zap size={14} /> {busy ? 'Running Gauntlet…' : 'Evolve Next Generation'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
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
            <Button
              size="sm"
              variant={showLibrary ? 'default' : 'outline'}
              onClick={() => setShowLibrary((v) => !v)}
            >
              <BookOpen size={14} /> {showLibrary ? 'Hide Contents Library' : 'Contents Library'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-5 sm:p-8 space-y-6">
        {(error || bootErrorMsg.includes('support panel')) && (
          <div role="alert" className="p-3 rounded-md border border-caution/40 bg-caution/10 text-caution text-xs flex flex-wrap items-center justify-between gap-3">
            <span>
              {bootErrorMsg.includes('support panel')
                ? 'Your browser has a temporary support-panel token stored in local storage. Click "Reset Session & Sign In" to sign in with your normal app account.'
                : error}
            </span>
            <div className="flex items-center gap-2">
              {bootErrorMsg.includes('support panel') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    try {
                      localStorage.clear();
                      sessionStorage.clear();
                    } catch {}
                    base44.auth.logout('/login');
                  }}
                >
                  Reset Session & Sign In
                </Button>
              )}
              {error && (
                <button onClick={() => setError('')} className="underline">Dismiss</button>
              )}
            </div>
          </div>
        )}

        {!state && origin.loading ? (
          <p className="text-sm text-muted-foreground">Hydrating Argon Quantum RSI Telemetry from live workspace…</p>
        ) : !state && !activeWorkspace ? (
          <WorkspaceRequired access={origin.workspaceAccess} />
        ) : (
          <>
            {/* Prompt 2: 6 Sovereign Telemetry Sections (SSE Status Dot, Somatic Marker, Dopamine RPE, Emotion Ring Donut, 7 Steering Dials, α/β/γ Mutation Strategy) */}
            <SovereignTelemetryDeck
              sentiment={sentimentTelemetry}
              streamConnected={streamConnected}
              streamEventsCount={streamEventsCount}
              lastHeartbeat={lastHeartbeat}
              onToggleStream={() => setStreamConnected((v) => !v)}
            />

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

              {/* Right Column: Tri-Timeline Arena, Source Code & Color-Coded Cognitive Event Ledger */}
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
                      {active?.source_code || '// Hydrating Genesis Kernel...'}
                    </pre>
                  </div>

                  {/* Prompt 1 fix: Color-coded event badges in Cognitive Event Ledger */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-muted-foreground">COGNITIVE EVENT LEDGER (EVIDENCE BEFORE THEATER)</span>
                      <span className="text-muted-foreground">{state?.ledger?.length || 0} EVENTS</span>
                    </div>
                    <div className="p-3 rounded bg-background border border-border text-[11px] font-mono overflow-auto h-64 space-y-2.5">
                      {(state?.ledger || []).map((ev) => {
                        const badgeClass = getLedgerBadgeClass(ev.event_type);
                        return (
                          <div
                            key={ev.id || `${ev.seq}-${ev.event_id}`}
                            className="p-2 rounded bg-secondary/60 border border-border/70 space-y-1"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px] text-muted-foreground">
                                  #{String(ev.seq || 0).padStart(2, '0')}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${badgeClass}`}>
                                  {ev.event_type}
                                </span>
                                {ev.episode_id && (
                                  <span className="text-[10px] text-muted-foreground">{ev.episode_id}</span>
                                )}
                              </div>
                              {Number(ev.fitness || 0) > 0 && (
                                <span className="text-[10px] text-primary">
                                  F={Number(ev.fitness).toFixed(3)}
                                </span>
                              )}
                            </div>
                            <div className="text-foreground leading-relaxed break-words">
                              {ev.detail}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <WorkspaceSentimentPanel
              sentiment={sentimentTelemetry}
              busy={busy}
              onInjectStimulus={(stimulus) => callEngine('inject_sentiment_stimulus', { stimulus })}
            />

            <ConsciousnessFalsificationPanel
              results={consciousnessAudit}
              busy={busy}
              onRunAudit={(opts) => callEngine('audit_consciousness', opts)}
            />

            {activeWorkspace && <LinkedInAutoPublisherPanel workspace={activeWorkspace} />}

            {activeWorkspace && <GoogleCalendarSyncPanel workspace={activeWorkspace} />}

            {showLibrary && activeWorkspace && (
              <div className="p-4 rounded-md border border-border bg-card space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="font-heading text-sm font-semibold">WORKSPACE CONTENTS & ASSET LIBRARY</h3>
                  <Link to="/library" className="text-xs text-primary hover:underline">
                    Open Full Library Page →
                  </Link>
                </div>
                <AssetBrowser workspace={activeWorkspace} />
              </div>
            )}

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