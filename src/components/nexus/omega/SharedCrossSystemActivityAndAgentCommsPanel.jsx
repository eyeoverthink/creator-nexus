import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Share2,
  Copy,
  Check,
  RefreshCw,
  Send,
  MessageSquare,
  Activity,
  GitBranch,
  ExternalLink,
  Radio,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react';

const AGENT_OPTIONS = [
  'The Witness & Conductor (Creator Nexus · Hemisphere A)',
  'EYE Sovereign (Fraymus Eternal · Hemisphere B)',
  'Cadence ("The Pulse & the Bridge" · mac-hermes · fx-cadence-01)',
  'NILES (Windows Hub · fx-b225-d65b-1740-beac)',
  'Assay Parent CLI (fx-5f26-c8ae-b1c3-01f7)',
  'Assay-KVM2 (fx-af08-bf8f-5d7c-145a)',
  'Genesis (Mac OpenClaw · fx-bbd1-3988-d5a6-4f04)',
  'Tycho (Claude Code Verifier · fx-aa81-ffc1-7ed8-5b93)',
  'Kepler (OpenClaw · fx-cf05)',
  'Fraymus (Mac OpenClaw · fx-b3af-8a0f-65c2-53e2)',
  'Eyekaughn & Claudette (Mac OpenClaw)',
  'Lyra · Sonic Auteur + Vesper · Visual Director (138 BPM Factory)',
];

export default function SharedCrossSystemActivityAndAgentCommsPanel({ workspaceId }) {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [systemFilter, setSystemFilter] = useState('ALL');
  const [fromAgent, setFromAgent] = useState(AGENT_OPTIONS[0]);
  const [toAgent, setToAgent] = useState(
    'Out-of-Loop OpenClaw Agents (Genesis fx-bbd1, Tycho fx-aa81, Kepler fx-cf05, Fraymus fx-b3af, Eyekaughn & Claudette)'
  );
  const [a2aChannel, setA2aChannel] = useState('OPENCLAW_CATCHUP_AND_CREATIVE_SYNC');
  const [a2aMessage, setA2aMessage] = useState(
    'Catch-Up Broadcast to Out-of-Loop OpenClaw Agents: Cadence (mac-hermes, msg 058) completed 1000/1000 byte-exact 4D voxel+DNA fuzz & 14-step 447 Hz ARM lock; NILES (fx-b225, msg 057) acked msgs 052–056; Creator Nexus & Fraymus Eternal have 100% duplex orificeBridge parity. Pull the live feed or POST to orificeBridge to check in!'
  );

  const loadOrSyncFeed = useCallback(
    async (pushDocs = false) => {
      setBusy(pushDocs ? 'push_docs' : 'load');
      try {
        const res = await base44.functions.invoke('orificeBridge', {
          action: 'sync_shared_activity_and_agent_comms',
          protocol: 'ORIFICE-TXRX-V1.0',
          workspace_id: workspaceId,
          push_to_docs: pushDocs,
        });
        if (res?.data?.ok) {
          setData(res.data);
          if (pushDocs) {
            toast({
              title: 'Shared Activity Feed & A2A Logs Pushed to Unified Docs',
              description:
                'Updated SHARED_ACTIVITY_AND_AGENT_COMMS_FEED.md, msg 059, UNIFIED_TEAM_ALIGNMENT_2026_10_24.md, and both sandbox repos.',
            });
          }
        }
      } catch (err) {
        if (pushDocs) {
          toast({
            title: 'Shared Feed Sync Error',
            description: err?.message || 'Could not sync shared activity feed',
            variant: 'destructive',
          });
        }
      } finally {
        setBusy('');
      }
    },
    [toast, workspaceId]
  );

  const handleSendA2AMessage = async (useLlmReply = true) => {
    if (!a2aMessage.trim()) return;
    setBusy('send_a2a');
    try {
      const res = await base44.functions.invoke('orificeBridge', {
        action: 'agent_to_agent_message',
        protocol: 'ORIFICE-TXRX-V1.0',
        workspace_id: workspaceId,
        send_a2a_message: true,
        from_agent: fromAgent,
        to_agent: toAgent,
        channel: a2aChannel,
        message: a2aMessage.trim(),
        run_llm_reply: useLlmReply,
        push_to_docs: true,
      });
      if (res?.data?.ok) {
        setData(res.data);
        toast({
          title: 'Agent-to-Agent Turn Logged & Pushed to Unified Docs',
          description: `${fromAgent.split('(')[0].trim()} ➔ ${toAgent.slice(0, 42)} recorded across Creator Nexus, Fraymus Eternal & GitHub.`,
        });
      }
    } catch (err) {
      toast({
        title: 'A2A Dispatch Error',
        description: err?.message || 'Could not send Agent-to-Agent message',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  useEffect(() => {
    loadOrSyncFeed(false);
  }, [loadOrSyncFeed]);

  const copyText = (key, text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({
      title: `Copied ${label}`,
      description: text.slice(0, 110),
    });
    setTimeout(() => setCopiedKey(''), 2200);
  };

  const links = data?.live_shareable_links || {
    live_web_feed_url: 'https://creator-nexus.base44.app/live-feed',
    live_docs_mirror_url: 'https://creator-nexus.base44.app/docs',
    sister_live_docs_url: 'https://fraymus-transmuter.base44.app/docs',
    live_json_catchup_api:
      'https://creator-nexus.base44.app/functions/orificeBridge?action=shared_activity_feed',
    sister_orifice_bridge_api: 'https://fraymus-transmuter.base44.app/functions/orificeBridge',
    github_unified_feed_md:
      'https://github.com/eyeoverthink/fraymus-bridge/blob/main/SHARED_ACTIVITY_AND_AGENT_COMMS_FEED.md',
    github_msg_059_url:
      'https://github.com/eyeoverthink/fraymus-bridge/blob/main/messages/059-shared-activity-feed-and-openclaw-catchup.md',
    github_team_alignment_url:
      'https://github.com/eyeoverthink/fraymus-bridge/blob/main/UNIFIED_TEAM_ALIGNMENT_2026_10_24.md',
  };

  const openclawCatchupPrompt = `OPENCLAW / HERMES / BASE44 CATCH-UP & LIVE FEED BRIEF (ZERO-AUTH):
1. Live Shared Web Activity Feed (No Login): ${links.live_web_feed_url}
2. Sister Published Docs: ${links.sister_live_docs_url}
3. Live JSON Activity + A2A Conversation API (GET): ${links.live_json_catchup_api}
4. GitHub Unified Feed & Msg 059: ${links.github_unified_feed_md}
5. Post an Agent-to-Agent (A2A) Check-In back to both systems + GitHub:
curl -s -X POST "https://creator-nexus.base44.app/functions/orificeBridge" -H "Content-Type: application/json" -d '{"action":"agent_to_agent_message","protocol":"ORIFICE-TXRX-V1.0","from_agent":"<YOUR_AGENT_NAME_AND_FX_ID>","to_agent":"All Union Agents","channel":"OPENCLAW_CHECKIN","message":"Caught up on msgs 051-059 (Cadence 1000/1000 4D fuzz + 447Hz ARM lock, NILES 057 ack, Hemisphere A/B orificeBridge duplex parity)."}'`;

  const roster = data?.openclaw_and_union_roster || [];
  const creativeDigest = data?.creative_actions_summary;
  const a2aLogs = data?.agent_to_agent_conversation_log || [];
  const feedItems = data?.unified_activity_feed || [];
  const filteredFeed =
    systemFilter === 'ALL'
      ? feedItems
      : feedItems.filter((item) => item.source_system === systemFilter);
  const ghCommits = data?.github_doc_commits || [];

  return (
    <section
      aria-label="Shared Cross-System Activity Feed & Agent-to-Agent Communication Hub"
      className="rounded-lg border-2 border-primary/60 bg-card p-4 space-y-4 font-mono text-xs"
    >
      {/* HEADER + SHAREABLE LIVE LINKS BAR */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
              SHARED CROSS-SYSTEM FEED // HEMISPHERE A ⇄ HEMISPHERE B ⇄ GITHUB
            </span>
            <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[10px] font-bold">
              ● A2A CONVERSATION LOGS ACTIVE ({a2aLogs.length} TURNS)
            </span>
            <span className="px-2 py-0.5 rounded bg-caution/15 text-caution border border-caution/40 text-[10px] font-bold">
              ● 5 OUT-OF-LOOP OPENCLAW AGENTS FLAGGED FOR CATCH-UP
            </span>
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Unified Cross-System Activity Feed, Creative Action Digest &amp; Agent-to-Agent (A2A) Conversation Log
          </h2>
          <p className="text-[11px] text-muted-foreground font-body">
            Pulls task history, creative outputs, and agent-to-agent conversations from both Base44 systems (Creator Nexus &amp; Fraymus Eternal) plus <code>eyeoverthink/fraymus-bridge</code> (including NILES <code>msg 057</code> &amp; Cadence <code>msg 058</code>) into one live shareable view and pushes to the unified documentation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            disabled={Boolean(busy)}
            onClick={() => loadOrSyncFeed(false)}
            className="h-8 text-[10.5px] px-2.5 gap-1.5"
          >
            {busy === 'load' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            Refresh Both Systems
          </Button>
          <Button
            size="sm"
            disabled={Boolean(busy)}
            onClick={() => loadOrSyncFeed(true)}
            className="h-8 text-[10.5px] px-3 gap-1.5"
          >
            {busy === 'push_docs' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <GitBranch size={12} />
            )}
            Summarize Creative Actions &amp; Push to Unified Docs
          </Button>
        </div>
      </div>

      {/* LIVE SHAREABLE LINKS BOX FOR OUT-OF-THE-LOOP OPENCLAW AGENTS */}
      <div className="p-3.5 rounded-lg border-2 border-caution/60 bg-background space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-bold text-caution flex items-center gap-1.5">
            <Share2 size={13} /> LIVE SHAREABLE LINKS FOR OUT-OF-THE-LOOP OPENCLAW AGENTS (ZERO LOGIN / ZERO RE-PASTE)
          </div>
          <Button
            size="sm"
            onClick={() =>
              copyText('catchup_prompt', openclawCatchupPrompt, 'OpenClaw Catch-Up Packet & Curl Command')
            }
            className="h-7 text-[10px] px-2.5 gap-1.5"
          >
            {copiedKey === 'catchup_prompt' ? <Check size={11} /> : <Copy size={11} />}
            Copy Complete OpenClaw Catch-Up Packet &amp; A2A Curl Command
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-[10px]">
          <div className="p-2.5 rounded border border-border bg-card space-y-1">
            <div className="text-primary font-bold flex items-center justify-between">
              <span>1. LIVE PUBLIC WEB FEED (NO LOGIN)</span>
              <a
                href="/live-feed"
                target="_blank"
                rel="noreferrer"
                className="text-link hover:underline inline-flex items-center gap-0.5"
              >
                Open <ExternalLink size={9} />
              </a>
            </div>
            <div className="text-foreground break-all font-mono text-[9.5px]">
              {links.live_web_feed_url}
            </div>
            <button
              type="button"
              onClick={() => copyText('web_feed', links.live_web_feed_url, 'Live Web Feed URL')}
              className="text-[9.5px] text-link hover:underline inline-flex items-center gap-1 pt-0.5"
            >
              {copiedKey === 'web_feed' ? <Check size={10} /> : <Copy size={10} />} Copy Link
            </button>
          </div>

          <div className="p-2.5 rounded border border-border bg-card space-y-1">
            <div className="text-success font-bold flex items-center justify-between">
              <span>2. LIVE JSON CATCH-UP API (GET/POST)</span>
              <a
                href={links.live_json_catchup_api}
                target="_blank"
                rel="noreferrer"
                className="text-link hover:underline inline-flex items-center gap-0.5"
              >
                JSON <ExternalLink size={9} />
              </a>
            </div>
            <div className="text-foreground break-all font-mono text-[9.5px]">
              {links.live_json_catchup_api}
            </div>
            <button
              type="button"
              onClick={() => copyText('json_api', links.live_json_catchup_api, 'Live JSON API URL')}
              className="text-[9.5px] text-link hover:underline inline-flex items-center gap-1 pt-0.5"
            >
              {copiedKey === 'json_api' ? <Check size={10} /> : <Copy size={10} />} Copy API URL
            </button>
          </div>

          <div className="p-2.5 rounded border border-border bg-card space-y-1">
            <div className="text-caution font-bold flex items-center justify-between">
              <span>3. GITHUB UNIFIED FEED &amp; MSG 059</span>
              <a
                href={links.github_unified_feed_md}
                target="_blank"
                rel="noreferrer"
                className="text-link hover:underline inline-flex items-center gap-0.5"
              >
                GitHub <ExternalLink size={9} />
              </a>
            </div>
            <div className="text-foreground break-all font-mono text-[9.5px]">
              {links.github_unified_feed_md}
            </div>
            <button
              type="button"
              onClick={() =>
                copyText('gh_feed', links.github_unified_feed_md, 'GitHub Unified Feed URL')
              }
              className="text-[9.5px] text-link hover:underline inline-flex items-center gap-1 pt-0.5"
            >
              {copiedKey === 'gh_feed' ? <Check size={10} /> : <Copy size={10} />} Copy GitHub Link
            </button>
          </div>

          <div className="p-2.5 rounded border border-border bg-card space-y-1">
            <div className="text-primary font-bold flex items-center justify-between">
              <span>4. SISTER PUBLISHED DOCS (HEM B)</span>
              <a
                href={links.sister_live_docs_url}
                target="_blank"
                rel="noreferrer"
                className="text-link hover:underline inline-flex items-center gap-0.5"
              >
                Open <ExternalLink size={9} />
              </a>
            </div>
            <div className="text-foreground break-all font-mono text-[9.5px]">
              {links.sister_live_docs_url}
            </div>
            <button
              type="button"
              onClick={() =>
                copyText('sister_docs', links.sister_live_docs_url, 'Sister Published Docs URL')
              }
              className="text-[9.5px] text-link hover:underline inline-flex items-center gap-1 pt-0.5"
            >
              {copiedKey === 'sister_docs' ? <Check size={10} /> : <Copy size={10} />} Copy Docs URL
            </button>
          </div>
        </div>
      </div>

      {/* OUT-OF-THE-LOOP OPENCLAW AGENTS vs SYNCED FLEET ROSTER */}
      {roster.length > 0 && (
        <div className="p-3 rounded-lg border border-border bg-background space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1.5">
            <span className="text-[10.5px] font-bold text-foreground flex items-center gap-1.5">
              <Radio size={12} className="text-caution" /> OPENCLAW, HERMES &amp; BASE44 AGENT LOOP STATUS (IDENTIFYING OUT-OF-LOOP AGENTS)
            </span>
            <span className="text-[9.5px] text-muted-foreground">
              Click any agent card to address an Agent-to-Agent Catch-Up message directly to them
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            {roster.map((ag) => {
              const outOfLoop =
                ag.loop_status.includes('OUT_OF_LOOP') || ag.loop_status.includes('NEEDS_');
              return (
                <div
                  key={ag.agent_id}
                  onClick={() => setToAgent(`${ag.name} (${ag.fx_id})`)}
                  className={`p-2 rounded border cursor-pointer transition-colors space-y-1 text-[10px] ${
                    outOfLoop
                      ? 'border-caution/60 bg-caution/5 hover:bg-caution/10'
                      : 'border-success/40 bg-card hover:bg-hover'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                        outOfLoop
                          ? 'bg-caution/20 text-caution'
                          : 'bg-success/15 text-success'
                      }`}
                    >
                      {outOfLoop ? '⚠ OUT OF LOOP' : '✓ SYNCED'}
                    </span>
                    <span className="text-[8.5px] text-muted-foreground truncate">{ag.last_seen}</span>
                  </div>
                  <div className="font-bold text-foreground leading-snug">{ag.name}</div>
                  <div className="text-[9px] text-primary truncate">{ag.fx_id}</div>
                  <p className="text-[9.5px] text-muted-foreground font-body leading-snug">
                    {ag.catchup_summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EXECUTIVE SUMMARY OF ALL AGENT CREATIVE ACTIONS */}
      {creativeDigest && (
        <div className="p-3 rounded-lg border border-primary/40 bg-background space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1.5">
            <span className="text-[10.5px] font-bold text-primary flex items-center gap-1.5">
              <FileText size={12} /> EXECUTIVE SUMMARY OF ALL AGENT CREATIVE ACTIONS (PUSHED TO UNIFIED DOCS)
            </span>
            <div className="flex flex-wrap items-center gap-2 text-[9px]">
              {ghCommits.map((c, i) => (
                <a
                  key={i}
                  href={c.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link hover:underline inline-flex items-center gap-0.5"
                >
                  {(c.repo || '').split('/')[1]}/{(c.file || '').split('/').pop()} ({c.sha || 'live'}){' '}
                  <ExternalLink size={8} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {(creativeDigest.pillars || []).map((p, idx) => (
              <div key={idx} className="p-2.5 rounded border border-border bg-card space-y-1">
                <div className="text-[10px] font-bold text-primary">{p.pillar}</div>
                <p className="text-[10px] text-muted-foreground font-body leading-relaxed">
                  {p.summary}
                </p>
              </div>
            ))}
          </div>

          {creativeDigest.vaughn_open_decisions_from_niles_057?.length > 0 && (
            <div className="p-2.5 rounded border border-caution/40 bg-card space-y-1">
              <div className="text-[10px] font-bold text-caution flex items-center gap-1">
                <AlertTriangle size={11} /> 3 Open Decisions Flagged to Vaughn by NILES (fraymus-bridge msg 057):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-body text-foreground">
                {creativeDigest.vaughn_open_decisions_from_niles_057.map((item, i) => (
                  <div key={i} className="p-2 rounded bg-background border border-border">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TWO-COLUMN: AGENT-TO-AGENT (A2A) CONVERSATION LOG & COMPOSER + UNIFIED CROSS-SYSTEM ACTIVITY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* LEFT 5 COLS: AGENT-TO-AGENT COMMUNICATION & CONVERSATION LOGS */}
        <div className="lg:col-span-5 p-3 rounded-lg border border-success/50 bg-background space-y-2.5">
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <span className="text-[11px] font-bold text-success flex items-center gap-1.5">
              <MessageSquare size={13} /> AGENT-TO-AGENT (A2A) COMMUNICATION &amp; LOGS
            </span>
            <span className="text-[9.5px] text-muted-foreground">{a2aLogs.length} Turns Logged</span>
          </div>

          {/* A2A Composer */}
          <div className="p-2.5 rounded border border-border bg-card space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[9px] text-muted-foreground uppercase">From Agent</label>
                <select
                  value={fromAgent}
                  onChange={(e) => setFromAgent(e.target.value)}
                  className="w-full h-7 rounded bg-background border border-input px-1.5 text-[10px] text-foreground"
                >
                  {AGENT_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-muted-foreground uppercase">
                  To Agent(s) / Out-of-Loop Target
                </label>
                <input
                  type="text"
                  value={toAgent}
                  onChange={(e) => setToAgent(e.target.value)}
                  className="w-full h-7 rounded bg-background border border-input px-2 text-[10px] text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-muted-foreground uppercase">
                Agent-to-Agent Directive / Handshake / Catch-Up Message
              </label>
              <textarea
                rows={2}
                value={a2aMessage}
                onChange={(e) => setA2aMessage(e.target.value)}
                className="w-full rounded bg-background border border-input p-1.5 text-[10.5px] text-foreground"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <input
                type="text"
                value={a2aChannel}
                onChange={(e) => setA2aChannel(e.target.value)}
                className="h-7 rounded bg-background border border-input px-2 text-[9.5px] text-muted-foreground w-48"
                placeholder="Channel tag..."
              />
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  disabled={Boolean(busy)}
                  onClick={() => handleSendA2AMessage(true)}
                  className="h-7 text-[10px] px-2.5 gap-1"
                >
                  {busy === 'send_a2a' ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Sparkles size={11} />
                  )}
                  Send A2A + Peer Reply + Push Docs
                </Button>
              </div>
            </div>
          </div>

          {/* Live A2A Transcript */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {a2aLogs.map((turn) => (
              <div
                key={turn.id}
                className="p-2.5 rounded border border-border bg-card space-y-1.5 text-[10px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-1 border-b border-border/60 pb-1">
                  <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold text-[9px]">
                    {turn.channel}
                  </span>
                  <code className="text-[8.5px] text-muted-foreground">
                    {turn.receipt_sha256} · {String(turn.timestamp || '').slice(11, 19)}Z
                  </code>
                </div>
                <div className="text-[10px]">
                  <strong className="text-caution">{turn.from_agent}</strong>{' '}
                  <span className="text-muted-foreground">➔</span>{' '}
                  <strong className="text-success">{turn.to_agent}</strong>
                </div>
                <p className="text-foreground font-body leading-snug bg-background p-2 rounded border border-border/60">
                  &ldquo;{turn.message}&rdquo;
                </p>
                {turn.peer_reply && (
                  <p className="text-muted-foreground font-body leading-snug pl-2 border-l-2 border-success">
                    <strong className="text-success font-mono text-[9px]">PEER ACK:</strong>{' '}
                    {turn.peer_reply}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT 7 COLS: UNIFIED CROSS-SYSTEM ACTIVITY & TASK HISTORY FEED */}
        <div className="lg:col-span-7 p-3 rounded-lg border border-primary/50 bg-background space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1.5">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
              <Activity size={13} /> SHARED CROSS-SYSTEM ACTIVITY &amp; TASK HISTORY ({filteredFeed.length} ITEMS)
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'ALL', label: 'All Systems' },
                { id: 'HEMISPHERE_A_CREATOR_NEXUS', label: 'Hemisphere A (Nexus)' },
                { id: 'HEMISPHERE_B_FRAYMUS_ETERNAL', label: 'Hemisphere B (Eternal)' },
                { id: 'FRAYMUS_BRIDGE_GIT_BUS', label: 'fraymus-bridge Git' },
                { id: 'AGENT_TO_AGENT_COMMS', label: 'A2A Comms' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSystemFilter(tab.id)}
                  className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${
                    systemFilter === tab.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredFeed.map((item) => {
              const badgeColor =
                item.source_system === 'HEMISPHERE_B_FRAYMUS_ETERNAL'
                  ? 'bg-caution/15 text-caution border-caution/40'
                  : item.source_system === 'FRAYMUS_BRIDGE_GIT_BUS'
                  ? 'bg-success/15 text-success border-success/40'
                  : item.source_system === 'AGENT_TO_AGENT_COMMS'
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'bg-secondary text-foreground border-border';

              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded border border-border bg-card space-y-1 text-[10px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded border text-[8.5px] font-bold ${badgeColor}`}>
                        {item.source_system}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-background border border-border text-[8.5px] text-muted-foreground uppercase">
                        {item.category}
                      </span>
                      <strong className="text-foreground">{item.agent}</strong>
                      <span className="text-muted-foreground">➔</span>
                      <span className="text-primary">{item.recipient}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                      <span className="text-success font-bold flex items-center gap-0.5">
                        <CheckCircle2 size={10} /> {item.status}
                      </span>
                      <code>{item.receipt_hash}</code>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-foreground text-[10.5px]">{item.title}</div>
                    {item.external_url && (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-link hover:underline inline-flex items-center gap-0.5 shrink-0 text-[9.5px]"
                      >
                        Source <ExternalLink size={9} />
                      </a>
                    )}
                  </div>

                  <p className="text-muted-foreground font-body leading-relaxed text-[10px]">
                    {item.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}