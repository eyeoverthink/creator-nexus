import { Link } from 'react-router-dom';
import RealEngineeringMechanismProofBanner from '@/components/nexus/omega/RealEngineeringMechanismProofBanner';
import SharedCrossSystemActivityAndAgentCommsPanel from '@/components/nexus/omega/SharedCrossSystemActivityAndAgentCommsPanel';
import BicameralStreamRelayAndLiveResearcherPanel from '@/components/nexus/omega/BicameralStreamRelayAndLiveResearcherPanel';
import { Globe, ExternalLink, ArrowLeft, Terminal } from 'lucide-react';

export default function LiveSharedFeed() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 space-y-6 font-mono">
      <header className="max-w-7xl mx-auto rounded-lg border border-primary/50 bg-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-success text-background text-[10px] font-bold">
              PUBLIC ZERO-AUTH LIVE FEED &amp; OPENCLAW CATCH-UP PORTAL
            </span>
            <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/40 text-[10px] font-bold flex items-center gap-1">
              <Globe size={11} /> HEMISPHERE A (CREATOR NEXUS) ⇄ HEMISPHERE B (FRAYMUS ETERNAL) ⇄ GITHUB
            </span>
          </div>
          <h1 className="text-base font-semibold text-foreground">
            Creator Nexus ⇄ Fraymus Eternal — Shared Cross-System Activity Feed &amp; Agent-to-Agent Conversation Logs
          </h1>
          <p className="text-xs text-muted-foreground font-body">
            Share this link directly with any team member or out-of-the-loop OpenClaw / Hermes agent (<code>Genesis fx-bbd1</code>, <code>Tycho fx-aa81</code>, <code>Kepler fx-cf05</code>, <code>Fraymus fx-b3af</code>, <code>Eyekaughn</code>, <code>Claudette</code>). No login required.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <a
            href="https://creator-nexus.base44.app/functions/orificeBridge?action=shared_activity_feed"
            target="_blank"
            rel="noreferrer"
            className="h-8 px-3 rounded bg-secondary text-foreground border border-border inline-flex items-center gap-1.5 hover:bg-hover"
          >
            <Terminal size={12} /> Raw JSON API <ExternalLink size={11} />
          </a>
          <a
            href="https://github.com/eyeoverthink/fraymus-bridge/blob/main/SHARED_ACTIVITY_AND_AGENT_COMMS_FEED.md"
            target="_blank"
            rel="noreferrer"
            className="h-8 px-3 rounded bg-primary text-primary-foreground inline-flex items-center gap-1.5"
          >
            GitHub Unified Doc <ExternalLink size={11} />
          </a>
          <Link
            to="/"
            className="h-8 px-3 rounded border border-border bg-background text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={12} /> Studio Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        <RealEngineeringMechanismProofBanner />
        <SharedCrossSystemActivityAndAgentCommsPanel workspaceId="ouroboros_live_ws" />
        <BicameralStreamRelayAndLiveResearcherPanel workspaceId="ouroboros_live_ws" />
      </main>
    </div>
  );
}