import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import ProShell from '@/components/nexus/ProShell';
import useOrigin from '@/components/nexus/origin/useOrigin';
import WorkspaceRequired from '@/components/nexus/WorkspaceRequired';

async function invokeNexusEvolution(payload) {
  try {
    const { data } = await base44.functions.invoke('nexusEvolution', payload);
    return data;
  } catch (err) {
    const headers = { 'Content-Type': 'application/json', 'X-App-Id': String(appParams.appId || '') };
    if (appParams.functionsVersion) headers['Base44-Functions-Version'] = String(appParams.functionsVersion);
    const res = await fetch(`/api/apps/${appParams.appId}/functions/nexusEvolution`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.error) {
      throw new Error(data?.error || err?.response?.data?.error || err?.message || 'nexusEvolution call failed');
    }
    return data;
  }
}
import { Button } from '@/components/ui/button';
import { Zap, RotateCcw, ArrowLeft, Cpu, BookOpen, Sparkles } from 'lucide-react';
import CentripetalOrbitCanvas from '@/components/nexus/ouroboros/CentripetalOrbitCanvas';
import TriTimelineCards from '@/components/nexus/ouroboros/TriTimelineCards';
import ProofOfEvolutionPanel from '@/components/nexus/ouroboros/ProofOfEvolutionPanel';
import ConsciousnessFalsificationPanel from '@/components/nexus/ouroboros/ConsciousnessFalsificationPanel';
import WorkspaceSentimentPanel from '@/components/nexus/ouroboros/WorkspaceSentimentPanel';
import StrategyGenomeEvolutionPanel from '@/components/nexus/ouroboros/StrategyGenomeEvolutionPanel';
import SovereignTelemetryDeck, { EMOTION_COLORS } from '@/components/nexus/ouroboros/SovereignTelemetryDeck';
import LinkedInAutoPublisherPanel from '@/components/nexus/spark/LinkedInAutoPublisherPanel';
import GoogleCalendarSyncPanel from '@/components/nexus/calendar/GoogleCalendarSyncPanel';
import AssetBrowser from '@/components/nexus/library/AssetBrowser';

// Spec Section 6: Exact Event type -> Badge label & color
function getLedgerBadgeMeta(eventType = '') {
  const t = String(eventType).toUpperCase();
  if (t === 'GENESIS_ESTABLISHED' || t.includes('GENESIS')) {
    return { label: 'GENESIS', className: 'bg-secondary border-border text-muted-foreground' };
  }
  if (t === 'ARENA_VERIFIED' || t.includes('PASSED') || t.includes('PROVEN')) {
    return { label: 'VERIFIED', className: 'bg-success/15 border-success/40 text-success' };
  }
  if (t === 'GAUNTLET_REJECTED' || t.includes('REJECT') || t.includes('SKIP') || t.includes('FALSIFIED')) {
    return { label: 'REJECTED', className: 'bg-destructive/15 border-destructive/40 text-destructive' };
  }
  if (t === 'FOSSIL_ARCHIVED' || t.includes('FOSSIL') || t.includes('ROLLBACK')) {
    return { label: 'FOSSIL', className: 'bg-caution/15 border-caution/40 text-caution' };
  }
  if (t === 'GENOME_SUPERSEDED' || t === 'NUCLEUS_SUPERSEDED') {
    return { label: 'EVOLVED', className: 'bg-primary/15 border-primary/40 text-primary' };
  }
  if (t === 'NO_SUPERIOR_MUTATION' || t.includes('HOMEOSTASIS')) {
    return { label: 'STABLE', className: 'bg-secondary border-border text-muted-foreground' };
  }
  if (t === 'OBSERVE_ENTROPY') {
    return { label: 'OBSERVE', className: 'bg-[#A78BFA]/15 border-[#A78BFA]/40 text-[#A78BFA]' };
  }
  if (t === 'EMOTION_STEER' || t.includes('SENTIMENT')) {
    return { label: 'EMOTION', className: 'bg-[#F472B6]/15 border-[#F472B6]/40 text-[#F472B6]' };
  }
  return { label: t, className: 'bg-secondary border-border text-muted-foreground' };
}

export default function ArgonEngine() {
  const origin = useOrigin();
  const [resolvedWorkspace, setResolvedWorkspace] = useState(null);
  const activeWorkspace = origin.workspace || resolvedWorkspace;
  const workspaceIdRef = useRef(activeWorkspace?.id);
  workspaceIdRef.current = activeWorkspace?.id;

  const [state, setState] = useState(null);
  const [emotionState, setEmotionState] = useState(null);
  const [emotionSteering, setEmotionSteering] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [consciousnessAudit, setConsciousnessAudit] = useState([]);
  const [sentimentTelemetry, setSentimentTelemetry] = useState(null);
  const [somaticRecallResult, setSomaticRecallResult] = useState(null);

  const [sseUrl, setSseUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('polling'); // 'connected' | 'reconnecting' | 'polling'
  const [streamEventsCount, setStreamEventsCount] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState('');
  const [flashedEmotion, setFlashedEmotion] = useState(null);

  const [showLibrary, setShowLibrary] = useState(true);
  const [aiNote, setAiNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const esRef = useRef(null);
  const hydratedRef = useRef(false);

  const applyEnginePayload = useCallback((data, isEvolve = false) => {
    if (!data) return;
    if (data.workspace) {
      setResolvedWorkspace((prev) => (prev?.id === data.workspace.id ? prev : data.workspace));
    }
    if (data.sse_url) setSseUrl(data.sse_url);

    const nextState = data.state || (data.activeGenome ? data : null);
    if (nextState) {
      setState((prev) => ({
        ...(prev || {}),
        ...nextState,
        orbits: Array.isArray(data.orbits) ? data.orbits : nextState.orbits || prev?.orbits || [],
        ledger: Array.isArray(data.ledger) ? data.ledger : nextState.ledger || prev?.ledger || [],
        activeGenome: data.activeGenome || nextState.activeGenome || prev?.activeGenome || null,
        activeSource:
          data.activeSource ??
          nextState.activeSource ??
          data.activeGenome?.source_code ??
          nextState.activeGenome?.source_code ??
          prev?.activeSource ??
          '',
      }));
    }

    if (Array.isArray(data.receipts)) {
      setReceipts(data.receipts);
    } else if (Array.isArray(nextState?.receipts)) {
      setReceipts(nextState.receipts);
    }

    const nextEmotion = data.emotionState || data.emotion || nextState?.emotionState;
    if (nextEmotion) {
      setEmotionState(nextEmotion);
      if (isEvolve && Array.isArray(nextEmotion.emotions) && nextEmotion.emotions.length > 0) {
        const top = [...nextEmotion.emotions].sort((a, b) => Number(b.intensity || 0) - Number(a.intensity || 0))[0];
        if (top?.name) {
          setFlashedEmotion({
            name: String(top.name).toUpperCase(),
            intensity: Math.round(Number(top.intensity || 0) * 100),
            color: EMOTION_COLORS[String(top.name).toLowerCase()] || '#60A5FA',
          });
          setTimeout(() => setFlashedEmotion(null), 4500);
        }
      }
    }

    const nextSteering = data.emotionSteering || nextState?.emotionSteering;
    if (nextSteering) {
      setEmotionSteering(nextSteering);
    }

    if (data.consciousnessAudit) setConsciousnessAudit(data.consciousnessAudit);
    if (data.sentimentTelemetry) setSentimentTelemetry(data.sentimentTelemetry);
    if (data.aiSynthesisNote) setAiNote(data.aiSynthesisNote);

    setLastHeartbeat(data.streamTimestamp || new Date().toISOString());
    setStreamEventsCount((c) => c + 1);
  }, []);

  const callEngine = useCallback(
    async (action, extra = {}) => {
      if (action !== 'telemetry') setBusy(true);
      setError('');
      const wsId = workspaceIdRef.current;
      const payload = {
        action,
        ...(wsId ? { workspace_id: wsId } : {}),
        ...extra,
      };
      try {
        const data = await invokeNexusEvolution(payload);
        if (action === 'recall') {
          setSomaticRecallResult(data);
        } else {
          applyEnginePayload(data, action === 'evolve');
        }
        return data;
      } catch (err) {
        setError(err.message || 'Engine operation failed');
        return null;
      } finally {
        if (action !== 'telemetry') setBusy(false);
      }
    },
    [applyEnginePayload]
  );

  // 1. Page mount -> call nexusEvolution({ action: "telemetry" }) -> hydrate all UI
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      callEngine('telemetry');
    }
  }, [callEngine]);

  // 2. SSE -> connect to sse_url from telemetry response -> live updates
  const connectSseStream = useCallback((url) => {
    if (!url || typeof EventSource === 'undefined') return;
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    try {
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        setConnectionStatus('connected');
        setLastHeartbeat(new Date().toISOString());
      };

      es.addEventListener('state', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          setConnectionStatus('connected');
          setStreamEventsCount((c) => c + 1);
          setLastHeartbeat(new Date().toISOString());
          setState((prev) => {
            const rawLedger = Array.isArray(parsed.ledger) ? parsed.ledger : prev?.ledger || [];
            const sortedLedger = [...rawLedger]
              .map((ev) => ({
                ...ev,
                id: ev.id || `${ev.seq}_${ev.eventId || ev.event_id || ''}`,
                event_type: ev.eventType || ev.event_type || 'EVENT',
                episode_id: ev.episodeId || ev.episode_id || '',
              }))
              .sort((a, b) => (b.seq || 0) - (a.seq || 0));
            return {
              ...(prev || {}),
              ...parsed,
              activeGenome: {
                ...(prev?.activeGenome || {}),
                ...(parsed.activeGenome || {}),
                generation: parsed.activeGenome?.gen ?? parsed.activeGenome?.generation ?? prev?.activeGenome?.generation ?? 0,
                code_hash: String(parsed.activeGenome?.hash || parsed.activeGenome?.code_hash || prev?.activeGenome?.code_hash || '').slice(0, 12),
                source_code: parsed.activeSource || parsed.activeGenome?.source_code || prev?.activeGenome?.source_code || '',
              },
              ledger: sortedLedger,
            };
          });
          if (parsed.emotionState) setEmotionState(parsed.emotionState);
          if (parsed.emotionSteering) setEmotionSteering(parsed.emotionSteering);
        } catch {}
      });

      es.addEventListener('emotion', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          setConnectionStatus('connected');
          setStreamEventsCount((c) => c + 1);
          setLastHeartbeat(new Date().toISOString());
          setEmotionState(parsed);
        } catch {}
      });

      es.addEventListener('ledger', (e) => {
        try {
          const ev = JSON.parse(e.data);
          setConnectionStatus('connected');
          setStreamEventsCount((c) => c + 1);
          setLastHeartbeat(new Date().toISOString());
          const normalizedEv = {
            ...ev,
            id: ev.id || `${ev.seq}_${ev.eventId || ev.event_id || ''}`,
            event_type: ev.eventType || ev.event_type || 'EVENT',
            episode_id: ev.episodeId || ev.episode_id || '',
          };
          setState((prev) => {
            if (!prev) return prev;
            const existing = Array.isArray(prev.ledger) ? prev.ledger : [];
            if (existing.some((x) => x.seq === normalizedEv.seq && (x.eventId || x.event_id) === (normalizedEv.eventId || normalizedEv.event_id))) {
              return prev;
            }
            return {
              ...prev,
              ledger: [normalizedEv, ...existing].sort((a, b) => (b.seq || 0) - (a.seq || 0)),
            };
          });
        } catch {}
      });

      es.addEventListener('heartbeat', () => {
        setConnectionStatus('connected');
        setStreamEventsCount((c) => c + 1);
        setLastHeartbeat(new Date().toISOString());
      });

      es.onerror = () => {
        setConnectionStatus('reconnecting');
      };
    } catch {
      setConnectionStatus('polling');
    }
  }, []);

  useEffect(() => {
    if (sseUrl) {
      connectSseStream(sseUrl);
    }
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [sseUrl, connectSseStream]);

  // Fallback polling every 25s
  useEffect(() => {
    const timer = setInterval(() => {
      callEngine('telemetry');
    }, 25000);
    return () => clearInterval(timer);
  }, [callEngine]);

  const active = state?.activeGenome;
  const activeSource = state?.activeSource || active?.source_code || '';
  const bootErrorMsg = origin.workspaceAccess?.boot?.error?.message || '';
  const dopamineVal = Number(emotionState?.dopamine ?? 0);

  const headerDotClass =
    connectionStatus === 'connected'
      ? 'bg-success'
      : connectionStatus === 'reconnecting'
      ? 'bg-caution'
      : 'bg-muted-foreground';
  const headerStatusText =
    connectionStatus === 'connected'
      ? 'LIVE'
      : connectionStatus === 'reconnecting'
      ? 'RECONNECTING'
      : 'POLLING';

  return (
    <ProShell>
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <ArrowLeft size={14} /> Studio
            </Link>
            <div className="border-l border-border pl-3">
              <div className="flex flex-wrap items-center gap-2">
                <Cpu size={18} className="text-primary" />
                <h1 className="font-display font-semibold text-base sm:text-lg tracking-wide">
                  ARGON // OUROBOROS-GAUNTLET QUANTUM RSI ENGINE v2.0
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono">
                  <span className={`w-2 h-2 rounded-full ${headerDotClass}`} />
                  {headerStatusText}
                </span>
                {emotionState && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono font-semibold ${
                      dopamineVal >= 0
                        ? 'bg-success/15 border-success/40 text-success'
                        : 'bg-destructive/15 border-destructive/40 text-destructive'
                    }`}
                  >
                    Dopamine: {dopamineVal >= 0 ? `+${dopamineVal.toFixed(2)}` : dopamineVal.toFixed(2)}{' '}
                    {dopamineVal >= 0 ? '▲' : '▼'}
                  </span>
                )}
                {flashedEmotion && (
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold animate-pulse"
                    style={{
                      backgroundColor: `${flashedEmotion.color}25`,
                      color: flashedEmotion.color,
                      border: `1px solid ${flashedEmotion.color}`,
                    }}
                  >
                    ⚡ {flashedEmotion.name} ({flashedEmotion.intensity}%)
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-muted-foreground">
                CHSH 2√2 · GROVER 121/128 · TELEPORTATION · UNITARY U†U=I · PT-SYMMETRIC EP3 (γ=√2, ǁH³ǁ_F=0)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 3. Evolve button -> call nexusEvolution({ action: "evolve" }) -> update all UI from response */}
            <Button size="sm" disabled={busy} onClick={() => callEngine('evolve')}>
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
              disabled={busy || !(state?.fossilCount > 0 || state?.fossils?.length > 0)}
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
          <div
            role="alert"
            className="p-3 rounded-md border border-caution/40 bg-caution/10 text-caution text-xs flex flex-wrap items-center justify-between gap-3"
          >
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
                <button onClick={() => setError('')} className="underline">
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {!state && origin.loading ? (
          <p className="text-sm text-muted-foreground">Hydrating Argon Quantum RSI Telemetry from live engine…</p>
        ) : !state && !activeWorkspace ? (
          <WorkspaceRequired access={origin.workspaceAccess} />
        ) : (
          <>
            <SovereignTelemetryDeck
              emotionState={emotionState}
              emotionSteering={emotionSteering}
              sentiment={sentimentTelemetry}
              connectionStatus={connectionStatus}
              streamEventsCount={streamEventsCount}
              lastHeartbeat={lastHeartbeat}
              sseUrl={sseUrl}
              busy={busy}
              onToggleStream={() => {
                if (sseUrl) connectSseStream(sseUrl);
                else callEngine('telemetry');
              }}
              onEmotionTick={() => callEngine('tick')}
              onEmotionEvent={(payload) => callEngine('event', { payload })}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Centripetal Polar Memory & Black Hole Horizon */}
              <div className="lg:col-span-5 p-4 rounded-md border border-border bg-card flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between text-xs font-mono border-b border-border pb-2">
                  <span className="font-semibold text-primary">CENTRIPETAL ORBITAL MEMORY (θ_g = 137.5077°)</span>
                  <span className="text-muted-foreground">
                    ORBITS: {state?.orbits?.length || 0} | FOSSILS: {state?.fossilCount ?? state?.fossils?.length ?? 0} | BLACK HOLE:{' '}
                    {state?.blackHoleCount ?? state?.blackHoles?.length ?? 0}
                  </span>
                </div>

                <CentripetalOrbitCanvas state={state} />

                <div className="text-[11px] font-mono text-muted-foreground space-y-1 border-t border-border pt-3">
                  <div>
                    <strong className="text-success">● Green/Gold Core:</strong> Active Winning Quantum Kernel (r → 0)
                  </div>
                  <div>
                    <strong className="text-primary">● Cobalt Ring:</strong> Active Agent Memory Orbits & Preserved .bak Fossils
                  </div>
                  <div>
                    <strong className="text-destructive">◌ Crimson Horizon:</strong> Digital Black Hole (O(1) Rejected SHA-256 Shards)
                  </div>
                </div>
              </div>

              {/* Right Column: Tri-Timeline Arena, Source Code & Color-Coded Cognitive Event Ledger */}
              <div className="lg:col-span-7 p-4 rounded-md border border-border bg-card flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-border pb-2">
                  <span className="font-semibold text-primary">
                    TRI-TIMELINE QUANTUM GAUNTLET ARENA (ALPHA_AST / BETA_RULE30 / GAMMA_BICAMERAL)
                  </span>
                  <span className="text-muted-foreground">
                    FITNESS: {Number(active?.fitness || 0).toFixed(4)} | BASELINE: {Math.round(Number(state?.baselineLatencyNs || 322962))} ns
                  </span>
                </div>

                <TriTimelineCards receipts={receipts} activeGenome={active} />

                {/* Inline Mutation Strategy Bar inside Gauntlet Arena per Spec 3c */}
                {emotionSteering && (
                  <div className="p-2.5 rounded bg-secondary/80 border border-border text-[11px] font-mono flex flex-wrap items-center justify-between gap-2">
                    <span>
                      STRATEGY · Curiosity: <strong className="text-[#60A5FA]">{Number(emotionSteering.curiosity || 0).toFixed(2)}</strong> · Fear:{' '}
                      <strong className="text-[#F87171]">{Number(emotionSteering.fear || 0).toFixed(2)}</strong>
                    </span>
                    <span>
                      ALPHA: <strong>{emotionSteering.alpha_runs ?? 1}</strong> · BETA: <strong>{emotionSteering.beta_runs ?? 1}</strong> · GAMMA:{' '}
                      <strong>{emotionSteering.gamma_runs ?? 1}</strong> ({emotionSteering.total_candidates ?? 3} candidates)
                    </span>
                    <span className={emotionSteering.improved ? 'text-success font-semibold' : 'text-caution font-semibold'}>
                      {emotionSteering.improved
                        ? `IMPROVED (+${Number(emotionSteering.fitness_delta || 0).toFixed(4)} Δfit)`
                        : 'NO IMPROVEMENT (stagnation)'}
                    </span>
                  </div>
                )}

                {aiNote && (
                  <div className="p-2.5 rounded bg-secondary border border-border text-xs font-mono text-foreground">
                    <strong className="text-primary">Bicameral Right-Brain Synthesis:</strong> {aiNote}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-muted-foreground">ACTIVE NUCLEUS SOURCE CODE</span>
                      <span className="text-primary">
                        SHA-256: {String(active?.hash || active?.code_hash || '—').slice(0, 12)}
                      </span>
                    </div>
                    <pre className="p-3 rounded bg-background border border-border text-[11px] font-mono text-foreground overflow-auto h-64 leading-relaxed">
                      {activeSource || '// Hydrating Genesis Kernel...'}
                    </pre>
                  </div>

                  {/* Spec Section 6: Color-coded event badges in Cognitive Event Ledger */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-muted-foreground">COGNITIVE EVENT LEDGER (EVIDENCE BEFORE THEATER)</span>
                      <span className="text-primary font-semibold">{state?.ledger?.length || 0} EVENTS</span>
                    </div>
                    <div className="p-3 rounded bg-background border border-border text-[11px] font-mono overflow-auto h-64 space-y-2.5">
                      {(state?.ledger || []).map((ev) => {
                        const rawType = ev.eventType || ev.event_type || 'EVENT';
                        const badge = getLedgerBadgeMeta(rawType);
                        const epId = ev.episodeId || ev.episode_id || '';
                        const evId = ev.eventId || ev.event_id || '';
                        return (
                          <div
                            key={ev.id || `${ev.seq}-${evId}`}
                            className="p-2 rounded bg-secondary/60 border border-border/70 space-y-1"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px] text-muted-foreground">
                                  #{String(ev.seq || 0).padStart(2, '0')}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${badge.className}`}
                                  title={rawType}
                                >
                                  {badge.label}
                                </span>
                                {epId && <span className="text-[10px] text-muted-foreground">{epId}</span>}
                              </div>
                              {Number(ev.fitness || 0) > 0 && (
                                <span className="text-[10px] text-primary">F={Number(ev.fitness).toFixed(4)}</span>
                              )}
                            </div>
                            <div className="text-foreground leading-relaxed break-words">{ev.detail}</div>
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

            {activeWorkspace && (
              <StrategyGenomeEvolutionPanel
                workspace={activeWorkspace}
                onEvolved={() => callEngine('telemetry')}
              />
            )}

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
              emotionState={emotionState}
              busy={busy}
              onMintProof={() => callEngine('mint_proof_certificate')}
              onStoreMemory={(title, payload) => callEngine('store_memory', { title, payload })}
              onRecallMemory={(nodeId) => callEngine('recall_memory', { node_id: nodeId })}
              onMemoryCycle={() => callEngine('memory_cycle')}
              onSomaticRecall={(context) => callEngine('recall', { payload: { context } })}
              somaticRecallResult={somaticRecallResult}
            />
          </>
        )}
      </main>
    </ProShell>
  );
}