import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, ShieldCheck, Send, ArrowLeft, Radio, Zap,
  Copy, CheckCircle2, AlertCircle, Loader2, Globe,
} from 'lucide-react';

const API = '/api/streaming';

function ArtifactCard({ artifact, onVerify }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold border border-primary/40">
              LIVING ARTIFACT
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {artifact.id?.slice(0, 12)}...
            </span>
          </div>
          <p className="text-sm font-medium text-foreground truncate">
            {artifact.donorName || 'Anonymous'} — ${artifact.amount}
          </p>
          {artifact.message && (
            <p className="text-xs text-muted-foreground">{artifact.message}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {artifact.verified ? (
            <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold border border-success/40 flex items-center gap-1">
              <ShieldCheck size={11} /> VERIFIED
            </span>
          ) : (
            <button
              onClick={() => onVerify?.(artifact)}
              className="px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-bold border border-border hover:text-foreground hover:border-primary/40"
            >
              Verify
            </button>
          )}
        </div>
      </div>

      {artifact.durationMs && (
        <div className="flex flex-wrap gap-3 text-[10px] font-mono text-muted-foreground">
          <span>Pipeline: {artifact.durationMs}ms</span>
          <span>SHA-256: {artifact.sha256?.slice(0, 16)}...</span>
          {artifact.timestamp && (
            <span>{new Date(artifact.timestamp).toLocaleTimeString()}</span>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded(e => !e)}
        className="text-[10px] text-primary hover:underline"
      >
        {expanded ? 'Collapse' : 'Show pipeline detail'}
      </button>

      {expanded && (
        <div className="rounded bg-background border border-border p-3 text-[10px] font-mono space-y-1 text-muted-foreground">
          <div>WASM Transmute → DNA Hypervector → Codon Encode</div>
          <div>→ Plasmid Forge → Ed25519 Sign → Emoji Stego → RGBA PNG</div>
          {artifact.stegoEmoji && (
            <div className="mt-2 text-lg">{artifact.stegoEmoji}</div>
          )}
          {artifact.pngBase64 && (
            <img
              src={`data:image/png;base64,${artifact.pngBase64}`}
              alt="Artifact RGBA transport"
              className="mt-2 border border-border rounded max-w-[200px]"
            />
          )}
        </div>
      )}
    </div>
  );
}

function MintForm({ onMinted }) {
  const [donor, setDonor] = useState('');
  const [amount, setAmount] = useState('5');
  const [message, setMessage] = useState('');
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');

  const handleMint = async (e) => {
    e.preventDefault();
    if (!donor.trim() || !amount) return;
    setMinting(true);
    setError('');
    try {
      const res = await fetch(`${API}/simulate-donation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name: donor.trim(),
          amount: parseFloat(amount),
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      onMinted?.(data);
      setDonor('');
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setMinting(false);
    }
  };

  return (
    <form onSubmit={handleMint} className="rounded-lg border border-primary/50 bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-primary" />
        <h3 className="text-sm font-semibold">Mint a Living Artifact</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Trigger the full FRAYMUS minting pipeline: WASM transmute → DNA fingerprint → codon encode → plasmid forge → Ed25519 sign → emoji stego → RGBA transport.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="Your name"
          value={donor}
          onChange={e => setDonor(e.target.value)}
          className="h-9 px-3 rounded border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          required
        />
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">$</span>
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="h-9 px-3 rounded border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
            required
          />
        </div>
        <input
          type="text"
          placeholder="Message (optional)"
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="h-9 px-3 rounded border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
      <button
        type="submit"
        disabled={minting || !donor.trim()}
        className="h-9 px-4 rounded bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
      >
        {minting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {minting ? 'Minting...' : 'Mint Artifact'}
      </button>
    </form>
  );
}

export default function LivingArtifact() {
  const [artifacts, setArtifacts] = useState([]);
  const [identity, setIdentity] = useState(null);
  const [overlayStatus, setOverlayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  const loadArtifacts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/artifacts?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setArtifacts(data);
      }
    } catch (err) {
      setError('Could not reach minting pipeline — is Chandra-FRAYMUS running?');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadIdentity = useCallback(async () => {
    try {
      const res = await fetch(`${API}/identity`);
      if (res.ok) setIdentity(await res.json());
    } catch {}
  }, []);

  const loadOverlayStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/overlay-status`);
      if (res.ok) setOverlayStatus(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    loadArtifacts();
    loadIdentity();
    loadOverlayStatus();
  }, [loadArtifacts, loadIdentity, loadOverlayStatus]);

  // WebSocket for live overlay feed
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/obs`;
    let ws;
    let retryTimer;

    function connect() {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        retryTimer = setTimeout(connect, 3000);
      };
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'artifact') {
            setArtifacts(prev => [msg.data, ...prev].slice(0, 100));
          }
        } catch {}
      };
      wsRef.current = ws;
    }

    connect();
    return () => {
      clearTimeout(retryTimer);
      ws?.close();
    };
  }, []);

  const handleMinted = (data) => {
    if (data.artifact) {
      setArtifacts(prev => [
        { ...data.artifact, durationMs: data.durationMs, verified: false },
        ...prev,
      ]);
    }
    loadOverlayStatus();
  };

  const handleVerify = async (artifact) => {
    if (!artifact.wasmBase64) return;
    try {
      const res = await fetch(`${API}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wasm_base64: artifact.wasmBase64 }),
      });
      if (res.ok) {
        const result = await res.json();
        setArtifacts(prev =>
          prev.map(a =>
            a.id === artifact.id ? { ...a, verified: result.valid } : a
          )
        );
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 space-y-6 font-mono">
      <header className="max-w-5xl mx-auto rounded-lg border border-primary/50 bg-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/40 text-[10px] font-bold">
              SOVEREIGN EMOTE / LIVING ARTIFACT
            </span>
            <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[10px] font-bold flex items-center gap-1">
              <Globe size={11} /> PUBLIC — NO AUTH REQUIRED
            </span>
            {wsConnected && (
              <span className="px-2 py-0.5 rounded bg-success text-background text-[10px] font-bold flex items-center gap-1">
                <Radio size={11} /> LIVE
              </span>
            )}
          </div>
          <h1 className="text-base font-semibold text-foreground">
            Living Artifact — FRAYMUS Minting Pipeline Demo
          </h1>
          <p className="text-xs text-muted-foreground font-body">
            Mint sovereign emotes through the full FRAYMUS IP stack. Every artifact is WASM-containerized, DNA-fingerprinted, Ed25519-signed, and steganographically encoded.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <a
            href="/streaming/overlay"
            target="_blank"
            rel="noreferrer"
            className="h-8 px-3 rounded bg-secondary text-foreground border border-border inline-flex items-center gap-1.5 hover:bg-hover"
          >
            <Sparkles size={12} /> OBS Overlay
          </a>
          <a
            href="/streaming/demo"
            target="_blank"
            rel="noreferrer"
            className="h-8 px-3 rounded bg-secondary text-foreground border border-border inline-flex items-center gap-1.5 hover:bg-hover"
          >
            <Send size={12} /> Phone Demo
          </a>
          <Link
            to="/"
            className="h-8 px-3 rounded border border-border bg-background text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={12} /> Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-6">
        {/* Status bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded border border-border bg-card p-3 text-center">
            <div className="text-2xl font-bold text-primary">{artifacts.length}</div>
            <div className="text-[10px] text-muted-foreground">ARTIFACTS MINTED</div>
          </div>
          <div className="rounded border border-border bg-card p-3 text-center">
            <div className="text-2xl font-bold text-success">
              {identity?.publicKey ? 'ACTIVE' : '—'}
            </div>
            <div className="text-[10px] text-muted-foreground">SERVER IDENTITY</div>
          </div>
          <div className="rounded border border-border bg-card p-3 text-center">
            <div className="text-2xl font-bold text-[#A78BFA]">
              {overlayStatus?.connectedOverlays ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">OBS OVERLAYS</div>
          </div>
          <div className="rounded border border-border bg-card p-3 text-center">
            <div className={`text-2xl font-bold ${wsConnected ? 'text-success' : 'text-destructive'}`}>
              {wsConnected ? 'LIVE' : 'OFF'}
            </div>
            <div className="text-[10px] text-muted-foreground">WEBSOCKET</div>
          </div>
        </div>

        {/* Mint form */}
        <MintForm onMinted={handleMinted} />

        {/* Error */}
        {error && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Artifact gallery */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary" />
            Minted Artifacts
          </h2>
          {loading ? (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading artifacts...
            </div>
          ) : artifacts.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No artifacts yet. Mint one above to see it appear here in real-time.
            </p>
          ) : (
            <div className="space-y-3">
              {artifacts.map((a, i) => (
                <ArtifactCard key={a.id || i} artifact={a} onVerify={handleVerify} />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-5xl mx-auto text-center text-[10px] text-muted-foreground py-8 border-t border-border">
        FRAYMUS IP Stack — Split-brain architecture: all encoding stays server-side, this page is verification-only "dumb glass"
      </footer>
    </div>
  );
}
