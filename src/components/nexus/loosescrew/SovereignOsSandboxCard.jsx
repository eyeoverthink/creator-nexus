import { Terminal, ShieldCheck, Share2, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SovereignOsSandboxCard({
  selectedSystem,
  busy,
  onFocusMonolith,
  onBroadcastSynapse,
  onMintProof,
}) {
  return (
    <div className="lg:col-span-6 rounded-lg border border-border bg-card overflow-hidden flex flex-col h-72">
      <div className="px-3 py-1.5 border-b border-border bg-secondary/50 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
        <span className="font-semibold text-primary flex items-center gap-1.5 truncate">
          <Terminal size={12} />
          {selectedSystem
            ? `LIVE KERNEL: ${selectedSystem.name} (Gen ${selectedSystem.generation})`
            : 'SELECT A SOVEREIGN OS'}
        </span>
        {selectedSystem && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onFocusMonolith?.(selectedSystem)}
              className="h-6 px-2 text-[9.5px] font-mono gap-1"
              title="Focus this OS hub inside the 3D Monolith"
            >
              <Crosshair size={10} /> 3D Focus
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBroadcastSynapse?.(selectedSystem)}
              className="h-6 px-2 text-[9.5px] font-mono gap-1"
              title="Broadcast OS architecture & syscalls across all open tabs"
            >
              <Share2 size={10} /> Sync Tabs
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onMintProof?.(selectedSystem)}
              className="h-6 px-2 text-[9.5px] font-mono gap-1 text-success border-success/40"
              title="Mint Proof-of-Evolution Certificate to Library"
            >
              <ShieldCheck size={10} /> Mint PoE
            </Button>
          </div>
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
  );
}