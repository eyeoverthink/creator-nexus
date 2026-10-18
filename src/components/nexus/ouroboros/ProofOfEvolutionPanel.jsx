import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Sparkles, ArrowUpCircle, Orbit, Search } from 'lucide-react';

export default function ProofOfEvolutionPanel({
  state,
  emotionState,
  busy,
  onMintProof,
  onStoreMemory,
  onRecallMemory,
  onMemoryCycle,
  onSomaticRecall,
  somaticRecallResult,
}) {
  const [title, setTitle] = useState('');
  const [payload, setPayload] = useState('');
  const [recallContext, setRecallContext] = useState('');

  const submitMemory = async (e) => {
    e.preventDefault();
    if (!title.trim() || !payload.trim()) return;
    await onStoreMemory(title.trim(), payload.trim());
    setTitle('');
    setPayload('');
  };

  const submitSomaticLookup = async (e) => {
    e.preventDefault();
    if (!recallContext.trim() || !onSomaticRecall) return;
    await onSomaticRecall(recallContext.trim());
  };

  const memoryNodes = (state?.orbits || []).filter((n) => n.node_kind === 'orbit');
  const certificates = state?.proofArtifacts || [];
  const somaticCount = Number(emotionState?.somatic_markers ?? 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="p-4 rounded-md border border-border bg-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Orbit size={16} className="text-primary" />
            <h3 className="font-heading text-sm font-semibold">Centripetal Agent Brain Memory (θ_g = 137.5077°)</h3>
            <span className="px-2 py-0.5 rounded border border-primary/40 bg-primary/15 text-primary text-[11px] font-mono font-semibold">
              🧠 {somaticCount} somatic markers stored
            </span>
          </div>
          <Button size="sm" variant="outline" disabled={busy} onClick={onMemoryCycle}>
            Rule 30 Gravity Tick
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Memories stored here orbit the Core Nucleus and are tagged with Damasio Somatic Markers. Recalling a node pulls it inward (r → 0); unused nodes drift outward via Wolfram Rule 30 chaos toward the Event Horizon (r ≥ 21.0).
        </p>

        {/* Somatic Marker Recall Lookup (Layer 5 Damasio Engine) */}
        {onSomaticRecall && (
          <div className="p-2.5 rounded bg-secondary/60 border border-border space-y-2">
            <form onSubmit={submitSomaticLookup} className="flex items-center gap-2">
              <Input
                placeholder="Query Damasio somatic marker context (e.g., GAMMA, stagnation, evolution)..."
                value={recallContext}
                onChange={(e) => setRecallContext(e.target.value)}
                disabled={busy}
                className="text-xs font-mono"
              />
              <Button type="submit" size="sm" variant="secondary" disabled={busy || !recallContext.trim()}>
                <Search size={13} /> Recall Marker
              </Button>
            </form>
            {somaticRecallResult && (
              <div className="p-2 rounded bg-background border border-border text-[11px] font-mono">
                {somaticRecallResult.found ? (
                  <div className="space-y-0.5">
                    <div className="text-success font-semibold">
                      MATCHED SOMATIC MARKER: {somaticRecallResult.emotion || 'tagged'} (valence={Number(somaticRecallResult.valence || 0).toFixed(2)}, arousal={Number(somaticRecallResult.arousal || 0).toFixed(2)})
                    </div>
                    <div className="text-muted-foreground">{somaticRecallResult.context}</div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No somatic marker matched "{recallContext}".</span>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={submitMemory} className="space-y-2">
          <Input
            placeholder="Memory or directive key (e.g., PT-Resonance Hook Law)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
          />
          <Textarea
            placeholder="High-signal heuristic, verified fact, or algorithmic pattern for your AI agents..."
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={2}
            disabled={busy}
          />
          <Button type="submit" size="sm" disabled={busy || !title.trim() || !payload.trim()}>
            Insert into Polar Orbit
          </Button>
        </form>
        {memoryNodes.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border max-h-44 overflow-y-auto">
            {memoryNodes.map((node) => (
              <div key={node.id} className="flex items-center justify-between gap-2 p-2 rounded bg-secondary text-xs font-mono">
                <div className="truncate">
                  <span className="font-semibold text-foreground">{node.title}</span>
                  <span className="ml-2 text-muted-foreground">
                    r={Number(node.radius || 0).toFixed(2)} · fit={Number(node.fitness || 0).toFixed(2)}
                  </span>
                </div>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => onRecallMemory(node.id)}>
                  <ArrowUpCircle size={13} /> Pull to Core
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded-md border border-border bg-card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-success" />
            <h3 className="font-heading text-sm font-semibold">Proof-of-Evolution (PoE) Certificate Mint</h3>
          </div>
          <Button size="sm" disabled={busy} onClick={onMintProof}>
            <Sparkles size={14} /> Mint PoE Certificate
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Package the active Nucleus Genome, its 5-Stage Quantum + PT-Symmetric EP3 mathematical proof receipt, and SHA-256 lineage into a tamper-evident certificate synced directly to your shared Knowledge Library.
        </p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {certificates.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono p-3 rounded bg-secondary">
              No PoE certificates minted yet. Evolve the Nucleus to Gen 2 (71.55x GAMMA_BICAMERAL speedup) and mint your first cryptographic receipt.
            </p>
          ) : (
            certificates.map((cert) => (
              <div key={cert.id} className="p-2.5 rounded bg-secondary border border-border text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-success">{cert.title}</span>
                  <span className="text-muted-foreground">[{String(cert.code_hash || '').slice(0, 10)}]</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Fitness: {Number(cert.fitness || 0).toFixed(4)} · Speedup: {Number(cert.speedup || 1).toFixed(2)}x · Synced to Knowledge Library
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}