import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Radio,
  ShieldCheck,
  Send,
  RefreshCw,
  Loader2,
  Cpu,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Orbit,
} from 'lucide-react';

export default function SynapticOrificeBridgePanel({ workspaceId, onBridgeComplete }) {
  const { toast } = useToast();
  const [payloadText, setPayloadText] = useState(
    'FRAYMUS_BICAMERAL_SYNC // Quasicrystal phi^75 + OPEG-V1.0 EP3 (gamma=1.414214) + Studio Continuity'
  );
  const [txDirective, setTxDirective] = useState(
    'SYNC_SEEDS_TO_STUDIO: Export latest Merkle trail and DNA plasmid into Creator Nexus Director Lab.'
  );
  const [busy, setBusy] = useState('');
  const [bridgeResult, setBridgeResult] = useState(null);
  const [pingResult, setPingResult] = useState(null);
  const [copied, setCopied] = useState('');

  const nexusOrificeUrl = 'https://creator-nexus.base44.app/functions/openclawGateway';
  const peerTransmuterUrl = 'https://fraymus-transmuter.base44.app/functions/fraymusComms';

  const handleCopy = (key, text) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1800);
  };

  const handleRunPeerBridge = async () => {
    setBusy('bridge');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'orifice_peer_bridge',
        workspace_id: workspaceId,
        payload: payloadText,
      });
      if (res?.data?.ok) {
        setBridgeResult(res.data);
        toast({
          title: 'Bicameral Bridge Synced!',
          description: `Pulled live DNA/Emoji/WASM & Merkle Root (${res.data.transmute?.merkleRoot || 'verified'}) from fraymus-transmuter.base44.app into Polar Orbit.`,
        });
        onBridgeComplete?.(res.data);
      }
    } catch (err) {
      toast({
        title: 'Bridge error',
        description: err?.message || 'Could not reach peer endpoint',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const handleLocalPingAndDrain = async () => {
    setBusy('ping');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'orifice_ping',
        workspace_id: workspaceId,
        node_id: 'fraymus-transmuter-peer',
        ttl: 5,
        payload: payloadText,
      });
      if (res?.data?.ok) {
        setPingResult(res.data);
        toast({
          title: 'ORIFICE-TXRX-V1.0 PONG Verified',
          description: `HDC: ${res.data.l1_l5_firewall?.framing?.hdc16k} · Queued TX: ${res.data.queued_tx_directives?.length || 0}`,
        });
      }
    } catch (err) {
      toast({
        title: 'Ping failed',
        description: err?.message || 'Error testing orifice_ping',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const handleQueueOutboundTx = async () => {
    if (!txDirective.trim()) return;
    setBusy('tx');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'orifice_tx_queue',
        workspace_id: workspaceId,
        target_node: 'fraymus-transmuter',
        directive: txDirective,
        ttl: 5,
      });
      if (res?.data?.ok) {
        toast({
          title: 'Outbound TX Directive Queued',
          description: `Ready for fraymus-transmuter or external LLM pickup on next orifice_ping.`,
        });
        handleLocalPingAndDrain();
        onBridgeComplete?.();
      }
    } catch (err) {
      toast({
        title: 'TX Queue Error',
        description: err?.message || 'Could not queue directive',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  return (
    <section
      aria-label="Synaptic Orifice Bicameral Transceiver"
      className="rounded-lg border border-primary/40 bg-card p-3.5 space-y-3 font-mono text-xs"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-caution text-background text-[10px] font-bold">
              SYNAPTIC ORIFICE TX/RX // BICAMERAL BRIDGE (ORIFICE-TXRX-V1.0)
            </span>
            <span className="font-semibold text-foreground">
              Hemisphere A (Creator Nexus) ↔ Hemisphere B (Fraymus Transmuter)
            </span>
            <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold">
              ● LIVE CROSS-APP LINK
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            Connects <code>creator-nexus.base44.app</code> (Multi-Pane Studio, Spark Video Pipeline, φ⁷⁵-Ternary Ollama, Argon Orbit) with{' '}
            <code>fraymus-transmuter.base44.app</code> (L1–L7 DNA/Emoji/WASM Transmuter, Merkle Trail &amp; Fraymus Seeds).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            onClick={handleRunPeerBridge}
            disabled={Boolean(busy)}
            className="h-7 text-[10.5px] px-2.5 gap-1.5"
          >
            {busy === 'bridge' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            Bridge &amp; Absorb from Fraymus Transmuter
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleLocalPingAndDrain}
            disabled={Boolean(busy)}
            className="h-7 text-[10.5px] px-2.5 gap-1"
          >
            {busy === 'ping' ? <Loader2 size={12} className="animate-spin" /> : <Radio size={12} />}
            Test ORIFICE-TXRX Ping/Pong
          </Button>
          <Button size="sm" variant="outline" asChild className="h-7 text-[10.5px] px-2.5 gap-1">
            <Link to="/orifice-relay">
              <Radio size={11} /> Full Ping-Pong Relay (/orifice-relay)
            </Link>
          </Button>
          <a
            href="https://fraymus-transmuter.base44.app"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 h-7 px-2 rounded border border-border bg-background text-link text-[10.5px] hover:underline"
          >
            Open Fraymus Transmuter <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Two-Hemisphere Endpoint & Payload Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <div className="p-2.5 rounded border border-border bg-background space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-primary font-semibold uppercase">
              1. Cross-App Frame Payload (L1–L5 DNA / Emoji / WASM / HDC-16K)
            </span>
            <button
              type="button"
              onClick={() => handleCopy('peer', peerTransmuterUrl)}
              className="text-link hover:underline inline-flex items-center gap-1"
            >
              {copied === 'peer' ? <Check size={10} /> : <Copy size={10} />}
              {copied === 'peer' ? 'Copied Peer URL' : 'Copy Peer Endpoint'}
            </button>
          </div>
          <input
            type="text"
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            className="w-full h-7 rounded bg-card border border-input px-2 text-[11px] text-foreground"
            placeholder="Payload to transmute & bridge across both apps..."
          />
          <div className="text-[10px] text-muted-foreground flex flex-wrap items-center justify-between gap-1">
            <span>Peer: <code>{peerTransmuterUrl}</code></span>
            <span className="text-success">TTL ≤ 5 · ≤ 32 KB · Σ Grounded</span>
          </div>
        </div>

        <div className="p-2.5 rounded border border-border bg-background space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-caution font-semibold uppercase">
              2. L6–L7 Outbound TX Directive Queue (Picked up on orifice_ping)
            </span>
            <button
              type="button"
              onClick={() => handleCopy('nexus', nexusOrificeUrl)}
              className="text-link hover:underline inline-flex items-center gap-1"
            >
              {copied === 'nexus' ? <Check size={10} /> : <Copy size={10} />}
              {copied === 'nexus' ? 'Copied Receptor URL' : 'Copy Nexus Receptor'}
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={txDirective}
              onChange={(e) => setTxDirective(e.target.value)}
              className="flex-1 h-7 rounded bg-card border border-input px-2 text-[11px] text-foreground"
              placeholder="Queue a directive for Fraymus Transmuter or external agent..."
            />
            <Button
              size="sm"
              variant="outline"
              disabled={Boolean(busy)}
              onClick={handleQueueOutboundTx}
              className="h-7 text-[10.5px] px-2.5 gap-1 shrink-0"
            >
              {busy === 'tx' ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
              Queue TX
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground flex flex-wrap items-center justify-between gap-1">
            <span>Receptor: <code>{nexusOrificeUrl}</code></span>
            <span>Auth: <code>X-Fraymus-Orifice-Key</code> / <code>x-console-key</code></span>
          </div>
        </div>
      </div>

      {/* Live Cross-App Bridge Result */}
      {bridgeResult && (
        <div className="p-3 rounded-lg border border-success/50 bg-success/10 space-y-2 text-[11px]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-success/30 pb-1.5">
            <span className="font-bold text-success flex items-center gap-1.5">
              <CheckCircle2 size={13} /> LIVE CROSS-APP PACKET ABSORBED FROM FRAYMUS-TRANSMUTER.BASE44.APP
            </span>
            <span className="text-[10px] text-muted-foreground">
              Mode: {bridgeResult.peerProtocolMode} · Receipt: {bridgeResult.l1_l5_firewall?.rSan?.receipt_id}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
            <div className="p-2 rounded bg-background/90 border border-border">
              <div className="text-[9.5px] text-muted-foreground">PEER MERKLE ROOT</div>
              <div className="font-bold text-primary truncate">
                {bridgeResult.transmute?.merkleRoot || 'verified'} ({bridgeResult.transmute?.merkleCount || 0} leaves)
              </div>
            </div>
            <div className="p-2 rounded bg-background/90 border border-border">
              <div className="text-[9.5px] text-muted-foreground">REVERSIBLE DNA FRAME</div>
              <div className="font-bold text-success truncate">
                {bridgeResult.transmute?.dnaBases || 0} bases · GC {bridgeResult.transmute?.gc || 0}%
              </div>
            </div>
            <div className="p-2 rounded bg-background/90 border border-border">
              <div className="text-[9.5px] text-muted-foreground">16,384-BIT HDC &amp; ENTROPY</div>
              <div className="font-bold text-caution truncate">
                {bridgeResult.l1_l5_firewall?.framing?.hdc16k}
              </div>
            </div>
            <div className="p-2 rounded bg-background/90 border border-border">
              <div className="text-[9.5px] text-muted-foreground">6-STEP MERKLE TRAIL</div>
              <div className="font-bold text-foreground truncate">
                Root {bridgeResult.trail?.merkleRoot} → Out={bridgeResult.trail?.finalOutput}
              </div>
            </div>
          </div>

          {bridgeResult.transmute?.dna && (
            <div className="p-2 rounded bg-background/90 border border-border text-[10px] space-y-1">
              <div className="text-muted-foreground">
                <strong className="text-foreground">DNA Sequence:</strong>{' '}
                <code className="break-all text-success">{bridgeResult.transmute.dna}</code>
              </div>
              <div className="text-muted-foreground">
                <strong className="text-foreground">WASM Binary Frame:</strong>{' '}
                <code className="break-all text-primary">{bridgeResult.transmute.wasmHex}</code>
              </div>
              {bridgeResult.trail?.steps && (
                <div className="text-muted-foreground pt-0.5">
                  <strong className="text-foreground">Fraymus Trail ({bridgeResult.trail.subject}):</strong>{' '}
                  {bridgeResult.trail.steps.map((s) => `${s.id}.${s.type}(${s.merkleLeaf.slice(0, 6)})`).join(' → ')} →{' '}
                  <code className="text-caution">{bridgeResult.trail.finalCommand} = {bridgeResult.trail.finalOutput}</code>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Local Ping/Pong & Queued TX Result */}
      {pingResult && (
        <div className="p-2.5 rounded border border-primary/40 bg-selection text-[10.5px] space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-primary flex items-center gap-1.5">
              <Orbit size={12} /> ORIFICE-TXRX-V1.0 PONG TELEMETRY ({pingResult.receptor_node})
            </span>
            <span className="text-success">
              Shannon H={pingResult.l1_l5_firewall?.entropy?.shannonBitsPerByte} bits/B · R_φ={pingResult.l1_l5_firewall?.entropy?.phiResonance}
            </span>
          </div>
          <div className="text-muted-foreground">
            Queued Outbound TX Directives ({pingResult.queued_tx_directives?.length || 0}):{' '}
            {(pingResult.queued_tx_directives || [])
              .slice(0, 3)
              .map((d) => `[→ ${d.target_node}: "${d.directive}"]`)
              .join(' · ') || 'None queued'}
          </div>
        </div>
      )}
    </section>
  );
}