import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, FileCheck2, ExternalLink, Sparkles, Copy, CheckCircle2, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const ROLE_BADGES = {
  HOOK: 'bg-primary/15 border-primary/40 text-primary',
  SOURCE_CLAIM: 'bg-success/15 border-success/40 text-success',
  SIGNATURE_TWIST: 'bg-[#A78BFA]/15 border-[#A78BFA]/40 text-[#A78BFA]',
  AI_DISCLOSURE: 'bg-caution/15 border-caution/40 text-caution',
  NARRATIVE_BRIDGE: 'bg-secondary border-border text-muted-foreground',
};

export default function VerifiableProvenancePanel({ video }) {
  const [receipt, setReceipt] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintedCert, setMintedCert] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const loadReceipt = useCallback(async () => {
    if (!video) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'verify_media_provenance',
        workspace_id: video.workspaceId,
        job_id: video.jobId,
        title: video.title,
        narration: video.description,
        file_uri: video.fileUri,
        video_url: video.videoUrl,
        uploaded_at: video.uploadedAt,
        card: video.sparkCard || null,
      });
      if (data?.receipt) {
        setReceipt(data.receipt);
      }
    } catch (err) {
      setError(err?.message || 'Unable to compute cryptographic provenance receipt.');
    } finally {
      setLoading(false);
    }
  }, [video]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  const handleMintCertificate = async () => {
    if (!video || !receipt) return;
    setMinting(true);
    setError('');
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'verify_media_provenance',
        workspace_id: video.workspaceId,
        job_id: video.jobId,
        title: video.title,
        narration: video.description,
        file_uri: video.fileUri,
        video_url: video.videoUrl,
        uploaded_at: video.uploadedAt,
        card: video.sparkCard || null,
        mint_certificate: true,
      });
      if (data?.certificate) {
        setMintedCert(data.certificate);
      }
      if (data?.receipt) {
        setReceipt(data.receipt);
      }
    } catch (err) {
      setError(err?.message || 'Certificate minting failed.');
    } finally {
      setMinting(false);
    }
  };

  const handleCopyReceipt = async () => {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading && !receipt) {
    return (
      <section aria-label="Cryptographic Media Provenance" className="rounded-lg border border-border bg-card p-4 text-xs font-mono text-muted-foreground">
        Computing SHA-256 Verifiable Media Receipt (VMR) & claim-to-source chain of custody…
      </section>
    );
  }

  if (!receipt) return null;

  const claims = receipt.claimTimeline || [];
  const activeClaim = claims[selectedIdx] || claims[0] || null;

  return (
    <section aria-label="Cryptographic Media Provenance" className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-success shrink-0" />
          <div>
            <h2 className="font-heading text-sm font-semibold">
              ARGON VERIFIABLE MEDIA RECEIPT (VMR)
            </h2>
            <p className="text-[11px] font-mono text-muted-foreground">
              SHA-256: <span className="text-primary">{receipt.receiptHash}</span> · Originality:{' '}
              <span className="text-success font-semibold">{receipt.compliance?.originalityPct}%</span> ·{' '}
              {receipt.compliance?.disclosurePresent ? 'AI Disclosure Verified' : 'Disclosure Check'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={handleCopyReceipt}>
            <Copy size={13} /> {copied ? 'Copied VMR' : 'Copy VMR JSON'}
          </Button>
          <Button size="sm" disabled={minting || !!mintedCert} onClick={handleMintCertificate}>
            <Sparkles size={13} />{' '}
            {mintedCert ? 'PoE Minted to Ledger' : minting ? 'Minting…' : 'Mint PoE Provenance'}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive font-mono">
          {error}
        </p>
      )}

      {mintedCert && (
        <div className="p-2.5 rounded border border-success/40 bg-success/10 text-xs font-mono text-success flex items-center gap-2">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>
            Minted to Argon Cognitive Ledger & Knowledge Library as <strong>{mintedCert.title}</strong>
          </span>
        </div>
      )}

      {/* Primary Source Citation Bar */}
      <div className="p-3 rounded bg-background border border-border text-xs space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
          <span className="text-muted-foreground font-semibold">PRIMARY RADAR SIGNAL ANCHOR</span>
          <span className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px]">
            {String(receipt.source?.sourceType || 'primary').toUpperCase()} · {receipt.source?.publishedAt || 'Verified'}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-foreground">{receipt.source?.name}</span>
          {receipt.source?.url && (
            <a
              href={receipt.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-link hover:underline font-mono"
            >
              Inspect Primary Source <ExternalLink size={12} />
            </a>
          )}
        </div>
        {receipt.source?.summary && (
          <p className="text-xs text-muted-foreground leading-relaxed">{receipt.source.summary}</p>
        )}
      </div>

      {/* Timecoded Claim-to-Source Inspector */}
      {claims.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
              <Clock size={13} className="text-primary" /> TIMECODED CLAIM-TO-SOURCE INSPECTOR ({claims.length} BEATS)
            </span>
            <span className="text-muted-foreground">Est. {receipt.totalDurationSec}s</span>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
            {claims.map((c, idx) => {
              const isSelected = idx === selectedIdx;
              const badgeClass = ROLE_BADGES[c.role] || ROLE_BADGES.NARRATIVE_BRIDGE;
              return (
                <button
                  key={c.index}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full text-left p-2 rounded border text-xs transition-colors ${
                    isSelected
                      ? 'border-primary bg-selection'
                      : 'border-border bg-background hover:bg-secondary/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5 font-mono text-[10px] mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">
                        {c.startSec.toFixed(1)}s–{c.endSec.toFixed(1)}s
                      </span>
                      <span className={`px-1.5 py-0.5 rounded border font-semibold ${badgeClass}`}>
                        {c.role}
                      </span>
                    </div>
                    <span className="text-success">
                      {(c.groundingConfidence * 100).toFixed(0)}% grounded
                    </span>
                  </div>
                  <p className="text-foreground leading-snug">{c.sentence}</p>
                </button>
              );
            })}
          </div>

          {activeClaim && (
            <div className="p-2.5 rounded bg-secondary/70 border border-border text-[11px] font-mono space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-primary font-semibold">
                  BEAT #{activeClaim.index} ATTRIBUTION ({activeClaim.wordCount} words)
                </span>
                <span className="text-muted-foreground">{activeClaim.sourceCitation}</span>
              </div>
              <div className="text-muted-foreground">
                ASCII Deterministic: <strong className="text-foreground">{receipt.compliance?.asciiClean ? 'PASS' : 'WARN'}</strong> ·
                Quantitative Anchor: <strong className="text-foreground">{activeClaim.hasQuantifier ? 'YES' : 'NARRATIVE'}</strong> ·
                Twist Structure: <strong className="text-foreground">{receipt.signatureTwist}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}