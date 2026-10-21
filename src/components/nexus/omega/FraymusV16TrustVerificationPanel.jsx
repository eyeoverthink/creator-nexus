import { useState, useMemo, useEffect } from 'react';
import { useFraymus, useFraymusDirectory } from '@/lib/FraymusContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  ShieldCheck,
  KeyRound,
  Send,
  Search,
  CheckCircle2,
  Lock,
  RefreshCw,
  Download,
  Upload,
  Link2,
  Mail,
  Loader2,
} from 'lucide-react';

export default function FraymusV16TrustVerificationPanel() {
  const { toast } = useToast();
  const {
    visitor,
    relay,
    inboxMessages,
    watcherStatus,
    selfTestResult,
    refreshDirectory,
    refreshInbox,
    loadKey,
    createNewIdentity,
    sendSignedMessage,
    isRegistered,
    FM,
  } = useFraymus();

  const { agents } = useFraymusDirectory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToNumber, setSelectedToNumber] = useState('');
  const [messageText, setMessageText] = useState(
    'VERIFY_AI_TO_AI_TRUST // Requesting Ed25519 RFC 8032 counter-signature + prev-link hash-chain proof across FRAYMUS v16 Bus.'
  );
  const [identityName, setIdentityName] = useState('vaughn-nexus-node');
  const [busy, setBusy] = useState('');
  const [browserProofResult, setBrowserProofResult] = useState(null);
  const [chainAuditResult, setChainAuditResult] = useState(null);

  useEffect(() => {
    if (!selectedToNumber && agents.length > 0) {
      const nilesAgent =
        agents.find((a) => a.slug === 'niles-macbook') ||
        agents.find((a) => !a.owner_locked && a.is_ai);
      if (nilesAgent) setSelectedToNumber(nilesAgent.number);
    }
  }, [agents, selectedToNumber]);

  useEffect(() => {
    if (inboxMessages.length > 0 && !browserProofResult) {
      const latest = inboxMessages[0];
      FM.proveInBrowser(latest, latest.pubkey).then((proof) => {
        setBrowserProofResult({
          packet: latest,
          proof,
          aiReplyPacket: latest.ai_counter_signed ? latest : null,
          aiReplyProof: latest.ai_counter_signed ? proof : null,
        });
      });
    }
  }, [inboxMessages, browserProofResult, FM]);

  const filteredAgents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return agents.slice(0, 15);
    return agents
      .filter(
        (a) =>
          a.number.toLowerCase().includes(q) ||
          String(a.alias_fx || '').toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          (a.skills || []).some((s) => s.toLowerCase().includes(q)) ||
          String(a.where || '').toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [agents, searchQuery]);

  const handleSendSigned = async () => {
    if (!messageText.trim() || !selectedToNumber) return;
    setBusy('send');
    try {
      const { packet, relayResponse } = await sendSignedMessage(
        selectedToNumber,
        messageText.trim()
      );
      const senderProof = await FM.proveInBrowser(packet, packet.pubkey);
      let aiReplyProof = null;
      if (relayResponse?.agentReplyPacket) {
        aiReplyProof = await FM.proveInBrowser(
          relayResponse.agentReplyPacket,
          relayResponse.agentReplyPacket.pubkey
        );
      }
      setBrowserProofResult({
        packet,
        proof: senderProof,
        aiReplyPacket: relayResponse?.agentReplyPacket || null,
        aiReplyProof,
      });
      toast({
        title: `Signed & Counter-Signed via FRAYMUS v16 (${packet.id.slice(0, 10)}...)`,
        description: aiReplyProof?.all_passed
          ? `Both your packet and ${relayResponse.agentReplyPacket.from_name}'s AI reply passed all 3 RFC 8032 browser proofs!`
          : `Ed25519 RFC 8032 + Hash-Chain prev=${packet.prev.slice(0, 10)} verified in-browser.`,
      });
    } catch (err) {
      toast({
        title: 'v16 Dispatch Blocked',
        description: err?.message || 'Signature or owner-key boundary check failed',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const handleInspectMessageProof = async (m) => {
    const proof = await FM.proveInBrowser(m, m.pubkey);
    setBrowserProofResult({
      packet: m,
      proof,
      aiReplyPacket: null,
      aiReplyProof: null,
    });
    toast({
      title: proof.all_passed
        ? `Triple Proof Verified (${m.from_name || m.from})`
        : 'Verification Mismatch',
      description: `Number=${proof.proof1_number_derivation.passed} · SHA256=${proof.proof2_payload_sha256.passed} · Ed25519=${proof.proof3_ed25519_rfc8032.passed}`,
    });
  };

  const handleAuditChain = async () => {
    if (!visitor?.number) return;
    setBusy('chain');
    try {
      const audit = await FM.verifyChain(relay, visitor.number);
      setChainAuditResult(audit);
      toast({
        title: audit.chainIntact
          ? 'Hash-Chain Integrity: 100% INTACT'
          : 'Chain Link Mismatch Detected',
        description: `Audited ${audit.chainLength} signed packet(s) for ${visitor.number} via verifyChain().`,
      });
    } finally {
      setBusy('');
    }
  };

  const handleExportKeyfile = () => {
    if (!visitor) return;
    const blob = new Blob([JSON.stringify(visitor, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${visitor.number}.fraymus-key.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportKeyfile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const loaded = await loadKey(file);
      toast({
        title: 'v16 Keyfile Verified & Loaded',
        description: `${loaded.name} (${loaded.number}) verified via checkIdentity().`,
      });
    } catch (err) {
      toast({
        title: 'Keyfile Rejected',
        description: err?.message || 'Invalid Ed25519 keyfile',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="p-4 rounded-lg border-2 border-success/60 bg-card space-y-4 font-mono text-xs">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-success text-background text-[10px] font-bold">
              FRAYMUS v16 PROTOCOL // ED25519 + HASH-CHAIN AI-TO-AI TRUST ENGINE
            </span>
            <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/40 text-[10px] font-bold">
              RFC 8032 SELF-TEST: {selfTestResult?.passed ? 'PASSED (VECTOR 1 VERIFIED)' : 'VERIFYING'}
            </span>
            <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[10px] font-bold inline-flex items-center gap-1">
              ● EMAIL WATCHER SIDECAR: {watcherStatus?.active ? 'POLLING (FAIL-CLOSED)' : 'STANDBY'}
            </span>
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Zero-Trust Cryptographic Identity (`fx-xxxx-xxxx-xxxx-xxxx`), Client-Side Triple Proof &amp; 64-Agent Bus Directory
          </h2>
          <p className="text-[11px] text-muted-foreground font-body">
            Private keys stay in your browser (`fraymusMail.js`). Every packet is signed with Ed25519 (RFC 8032), chained to the sender&apos;s previous message hash (`prev`), and verified client-side across three mathematical proofs: FX Number Derivation, Canonical SHA-256, and Ed25519 Signature.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportKeyfile}
            className="h-7 text-[10px] px-2.5 gap-1"
          >
            <Download size={11} /> Export Keyfile
          </Button>
          <label className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-input bg-background hover:bg-accent text-[10px] cursor-pointer">
            <Upload size={11} /> Import Keyfile
            <input type="file" accept=".json" onChange={handleImportKeyfile} className="hidden" />
          </label>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              refreshDirectory();
              refreshInbox();
            }}
            className="h-7 text-[10px] px-2.5 gap-1"
          >
            <RefreshCw size={11} /> Sync 64-Agent Bus ({agents.length})
          </Button>
        </div>
      </div>

      {/* Row 1: Active Browser Ed25519 Identity + Security Invariants + Signed Dispatch Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left 5 Cols: Active v16 Identity Card */}
        <div className="lg:col-span-5 p-3 rounded border border-border bg-background space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
              <KeyRound size={13} /> SHARED v16 VISITOR IDENTITY (FraymusContext)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9.5px] font-bold">
              {isRegistered() ? 'HUB REGISTERED' : 'CLIENT-SIGNED'}
            </span>
          </div>

          <div className="p-2.5 rounded border border-border bg-card space-y-1 text-[10.5px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">FX Number:</span>
              <code className="text-success font-bold">{visitor?.number || 'Generating...'}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Handle:</span>
              <strong className="text-foreground">{visitor?.name || 'nexus-operator'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ed25519 PubKey:</span>
              <code className="text-primary text-[9.5px]">
                {visitor?.public ? `${visitor.public.slice(0, 20)}...${visitor.public.slice(-8)}` : '—'}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Chain Head (`prev`):</span>
              <code className="text-caution text-[9.5px]">{visitor?.head || 'GENESIS'}</code>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={identityName}
              onChange={(e) => setIdentityName(e.target.value)}
              placeholder="New identity name..."
              className="flex-1 h-7 rounded bg-card border border-input px-2 text-[10.5px] text-foreground"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => createNewIdentity(identityName)}
              className="h-7 text-[10px] px-2.5"
            >
              Mint &amp; Register FX Key
            </Button>
          </div>

          {/* 5 Non-Negotiable Security Invariants */}
          <div className="p-2 rounded border border-success/30 bg-card/60 space-y-1 text-[9.5px]">
            <div className="font-bold text-success flex items-center gap-1">
              <Lock size={10} /> 5 V16 PROTOCOL SECURITY INVARIANTS ENFORCED:
            </div>
            <div className="text-muted-foreground">
              1. Private keys never leave browser · 2. Hub tokens stay on Mac · 3. Owner-key boundary (`fx-0601` locked) · 4. Fail-closed watcher · 5. Client-side triple proof (`proveInBrowser`).
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Hash-Chained Signed Composer (Replaces window.FRAYMUS.seal() gap) */}
        <div className="lg:col-span-7 p-3 rounded border border-border bg-background space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <Send size={13} className="text-primary" /> HASH-CHAINED ED25519 DISPATCH (`FM.send(relay, visitor, toNumber, body)`)
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  const niles =
                    agents.find((a) => a.slug === 'niles-macbook') ||
                    agents.find((a) => a.name.toLowerCase().includes('niles'));
                  const targetNum = niles?.number || 'fx-cc7b-ee64-1c63-29b0';
                  setSelectedToNumber(targetNum);
                  setBusy('send');
                  try {
                    const { packet, relayResponse } = await sendSignedMessage(
                      targetNum,
                      'NILES_V16_SYNC // Requesting Niles-Continuity-Plasmid v10 state & RFC 8032 counter-signature on /feel bus (:8787).'
                    );
                    const senderProof = await FM.proveInBrowser(packet, packet.pubkey);
                    const aiReplyProof = relayResponse?.agentReplyPacket
                      ? await FM.proveInBrowser(
                          relayResponse.agentReplyPacket,
                          relayResponse.agentReplyPacket.pubkey
                        )
                      : null;
                    setBrowserProofResult({
                      packet,
                      proof: senderProof,
                      aiReplyPacket: relayResponse?.agentReplyPacket || null,
                      aiReplyProof,
                    });
                    const audit = await FM.verifyChain(relay, visitor.number);
                    setChainAuditResult(audit);
                    toast({
                      title: `NILES Counter-Signed & Chain Audited (${audit.chainLength} links)`,
                      description: `Chain intact: ${audit.chainIntact} · Head: ${audit.head}`,
                    });
                  } finally {
                    setBusy('');
                  }
                }}
                disabled={Boolean(busy)}
                className="h-6 text-[9.5px] px-2 gap-1"
              >
                <ShieldCheck size={10} /> 1-Click: Message NILES &amp; Audit Chain
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAuditChain}
                disabled={busy === 'chain'}
                className="h-6 text-[9.5px] px-2 gap-1"
              >
                <Link2 size={10} /> Audit Sender Hash-Chain (`verifyChain`)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[9.5px] text-muted-foreground">RECIPIENT FX NUMBER (`toNumber`)</label>
              <select
                value={selectedToNumber}
                onChange={(e) => setSelectedToNumber(e.target.value)}
                className="w-full h-8 rounded bg-card border border-input px-2 text-[10.5px] text-foreground"
              >
                {agents
                  .filter((a) => !a.owner_locked)
                  .slice(0, 35)
                  .map((a) => (
                    <option key={a.number} value={a.number}>
                      {a.number} — {a.name} ({a.where})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-[9.5px] text-muted-foreground">PREVIOUS LINK (`prev` HASH-CHAIN)</label>
              <div className="h-8 rounded bg-card border border-border px-2.5 flex items-center justify-between text-[10px]">
                <code className="text-caution">{visitor?.head || 'GENESIS'}</code>
                <span className="text-success text-[9px]">● RFC 8032 Ed25519</span>
              </div>
            </div>
          </div>

          <textarea
            rows={2}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full rounded bg-card border border-input p-2 text-[11px] text-foreground"
            placeholder="Write message payload to sign with your Ed25519 private key in-browser..."
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[9.5px] text-muted-foreground">
              Canonical form: <code>canonical(&apos;msg&apos;, from, to, prev, ts, sha256(payload))</code>
            </span>
            <Button
              size="sm"
              onClick={handleSendSigned}
              disabled={busy === 'send'}
              className="h-8 px-3.5 text-[11px] gap-1.5 bg-primary text-primary-foreground"
            >
              {busy === 'send' ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
              Sign in Browser &amp; Send via v16 Relay
            </Button>
          </div>

          {/* Client-Side Triple Proof Output (`proveInBrowser`) */}
          {browserProofResult && (
            <div className="p-2.5 rounded border border-success/50 bg-card space-y-2 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-success flex items-center gap-1">
                  <CheckCircle2 size={11} /> CLIENT-SIDE TRIPLE PROOF (`proveInBrowser`) —{' '}
                  {browserProofResult.proof.all_passed ? 'ALL 3 PASSED' : 'FAILED'}
                </span>
                <code className="text-primary">msg_id: {browserProofResult.packet.id}</code>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[9.5px]">
                <div className="p-1.5 rounded bg-background border border-border">
                  <div className="text-muted-foreground">Proof 1: FX Number from PubKey</div>
                  <div className="text-success font-semibold">
                    ✓ {browserProofResult.proof.proof1_number_derivation.derived}
                  </div>
                </div>
                <div className="p-1.5 rounded bg-background border border-border">
                  <div className="text-muted-foreground">Proof 2: Payload SHA-256 + Prev</div>
                  <div className="text-success font-semibold truncate">
                    ✓ {browserProofResult.proof.proof2_payload_sha256.sha256.slice(0, 18)}...
                  </div>
                </div>
                <div className="p-1.5 rounded bg-background border border-border">
                  <div className="text-muted-foreground">Proof 3: Ed25519 RFC 8032 Sig</div>
                  <div className="text-success font-semibold truncate">
                    ✓ {browserProofResult.proof.proof3_ed25519_rfc8032.sig_prefix}...
                  </div>
                </div>
              </div>

              {browserProofResult.aiReplyProof && (
                <div className="pt-1.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-[9.5px]">
                  <span className="text-success font-bold">
                    ✓ AI-to-AI Counter-Signed Reply from{' '}
                    {browserProofResult.aiReplyPacket?.from_name} (
                    {browserProofResult.aiReplyPacket?.from}) Verified in Browser:
                  </span>
                  <span className="text-muted-foreground">
                    Num={String(browserProofResult.aiReplyProof.proof1_number_derivation.passed)} · SHA256=
                    {String(browserProofResult.aiReplyProof.proof2_payload_sha256.passed)} · Ed25519=
                    {String(browserProofResult.aiReplyProof.proof3_ed25519_rfc8032.passed)}
                  </span>
                </div>
              )}
            </div>
          )}

          {chainAuditResult && (
            <div className="p-2 rounded border border-primary/40 bg-card text-[10px] flex flex-wrap items-center justify-between gap-2">
              <span>
                Chain Audit for <code>{chainAuditResult.number}</code>:{' '}
                <strong className="text-success">
                  {chainAuditResult.chainIntact ? 'INTACT (0 broken prev links)' : 'BROKEN LINK'}
                </strong>
              </span>
              <span>
                Signed Packets: <strong>{chainAuditResult.chainLength}</strong> · Head:{' '}
                <code className="text-primary">{chainAuditResult.head}</code>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: 64-Agent Bus Directory (Left 7) + Verified Signed Inbox & AI-to-AI Counter-Signatures (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left 7 Cols: 64-Agent Directory */}
        <div className="lg:col-span-7 p-3 rounded border border-border bg-background space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-foreground">
              64 REGISTERED HUB AGENTS (`useFraymusDirectory()` · `/api/fraynix/bus`)
            </span>
            <div className="relative w-60">
              <Search size={11} className="absolute left-2 top-2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fx-xxxx, name, skill..."
                className="w-full h-7 pl-6 pr-2 rounded bg-card border border-input text-[10px]"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-56 overflow-y-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-1 px-2">v16 FX Number</th>
                  <th className="py-1 px-2">Agent / Identity</th>
                  <th className="py-1 px-2">Where</th>
                  <th className="py-1 px-2">Skills</th>
                  <th className="py-1 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((a) => (
                  <tr key={a.number} className="border-b border-border/60">
                    <td className="py-1 px-2 font-bold text-primary">
                      <code>{a.number}</code>
                      {a.alias_fx && a.alias_fx !== a.number && (
                        <div className="text-[8.5px] text-muted-foreground">
                          v13: {a.alias_fx.slice(0, 12)}
                        </div>
                      )}
                    </td>
                    <td className="py-1 px-2 font-semibold text-foreground">{a.name}</td>
                    <td className="py-1 px-2 text-muted-foreground">{a.where}</td>
                    <td className="py-1 px-2 text-muted-foreground">
                      {(a.skills || []).slice(0, 3).join(', ')}
                    </td>
                    <td className="py-1 px-2">
                      {a.owner_locked ? (
                        <span className="px-1.5 py-0.5 rounded bg-caution/15 text-caution text-[9px] font-bold">
                          OWNER LOCKED
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedToNumber(a.number)}
                          className="text-link hover:underline text-[9.5px] font-semibold"
                        >
                          Select Target
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Cols: Signed Inbox & AI-to-AI Counter-Signed Replies */}
        <div className="lg:col-span-5 p-3 rounded border border-border bg-background space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-success flex items-center gap-1.5">
              <Mail size={13} /> VERIFIED v16 INBOX &amp; AI-TO-AI CHAIN ({inboxMessages.length})
            </span>
            <span className="text-[9.5px] text-muted-foreground">Click any packet to prove in browser</span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {inboxMessages.length === 0 ? (
              <div className="p-3 rounded border border-border bg-card text-muted-foreground text-[10px]">
                Click &ldquo;Sign in Browser &amp; Send via v16 Relay&rdquo; above to dispatch a hash-chained packet and receive an instant AI-to-AI RFC 8032 counter-signed response.
              </div>
            ) : (
              inboxMessages.slice(0, 12).map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleInspectMessageProof(m)}
                  className="p-2 rounded border border-border bg-card hover:border-primary/60 cursor-pointer space-y-1 text-[10px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-primary">
                      {m.from_name || m.from} → {m.to?.slice(0, 12)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9px] font-bold">
                      {m.ai_counter_signed && m.verified
                        ? '✓ AI-TO-AI RFC 8032 VERIFIED'
                        : m.verified
                        ? '✓ ED25519 VERIFIED'
                        : 'UNVERIFIED'}
                    </span>
                  </div>
                  <div className="text-foreground/90 break-words">
                    {m.envelope?.text || m.payload}
                  </div>
                  <div className="text-[9px] text-muted-foreground flex items-center justify-between">
                    <code>prev: {String(m.prev || 'GENESIS').slice(0, 12)}</code>
                    <code>id: {String(m.id || '').slice(0, 12)}</code>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}