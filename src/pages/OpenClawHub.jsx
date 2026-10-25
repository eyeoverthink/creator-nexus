import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import Sidebar from '@/components/nexus/Sidebar';
import SynapticOrificeBridgePanel from '@/components/nexus/omega/SynapticOrificeBridgePanel';
import HermesSkillFleetPanel from '@/components/nexus/omega/HermesSkillFleetPanel';
import CloudModelTrainingDashboardPane from '@/components/nexus/omega/CloudModelTrainingDashboardPane';
import SovereignAmbassadorGatekeeperPanel from '@/components/nexus/omega/SovereignAmbassadorGatekeeperPanel';
import FraymusControlPlanePanel from '@/components/nexus/omega/FraymusControlPlanePanel';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Bot,
  Send,
  Terminal,
  ShieldCheck,
  GitBranch,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ExternalLink,
  Sparkles,
  Radio,
} from 'lucide-react';
import '@/components/nexus/theme.css';

const OPENCLAW_SPECIALISTS = [
  {
    id: 'spearhead-frontier-scout',
    name: 'Spearhead (fx-b9fb-8f11-403f-75a4) // Boundary-Free Frontier Scout (Msg 064)',
    role: 'Anticipatory Frontier Intelligence (1–2 Weeks Ahead) & Exploratory Spikes',
    channelDefault: 'mcp',
  },
  {
    id: 'dev-archivist-tracer',
    name: 'DevArchivist (fx-3c1c-9537-c8c7-59b0) // Dependency & Provenance Tracer (Msg 070)',
    role: 'Duplicate/Dependency/Entry-Point Tracer & Trademark #6098807 Archivist',
    channelDefault: 'mcp',
  },
  {
    id: 'openclaw-commander',
    name: 'OpenClaw Commander // Hub Orchestrator',
    role: 'Omnichannel Workspace & Mission Router',
    channelDefault: 'telegram',
  },
  {
    id: 'openclaw-sigma',
    name: 'OpenClaw Sigma // OPEG V1.0 Verifier',
    role: 'Empirical Grounding (simulation_api → Σ → R_san)',
    channelDefault: 'mcp',
  },
  {
    id: 'openclaw-forge',
    name: 'OpenClaw Forge // LooseScrew & GitHub Builder',
    role: 'Autonomous App Synth & GitHub Repo Committer',
    channelDefault: 'vps',
  },
  {
    id: 'openclaw-scribe',
    name: 'OpenClaw Scribe // Live Draft Co-Creator',
    role: 'Multi-Pane Studio Draft Writer & Diff Proposer',
    channelDefault: 'whatsapp',
  },
];

export default function OpenClawHub() {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [hubData, setHubData] = useState(null);
  const [loadingHub, setLoadingHub] = useState(true);
  const [activeHubTab, setActiveHubTab] = useState('command'); // 'command' | 'hermes' | 'training'
  const [hermesManifest, setHermesManifest] = useState({
    skills: [],
    pipelines: [],
    daemon: '',
  });

  // Dispatch Controls
  const [selectedAgent, setSelectedAgent] = useState(OPENCLAW_SPECIALISTS[0].id);
  const [channel, setChannel] = useState('telegram');
  const [directive, setDirective] = useState(
    'Audit active Creator Nexus workspace, verify OPEG V1.0 PT-symmetric EP3 receipt at gamma=1.414214, and prepare next high-retention technical build.'
  );
  const [appendToDraft, setAppendToDraft] = useState(true);
  const [pushToGithub, setPushToGithub] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [lastDispatchResult, setLastDispatchResult] = useState(null);

  // Live In-App Agent Chat (openclaw_commander or spearhead_frontier_scout)
  const [activeChatAgent, setActiveChatAgent] = useState('spearhead_frontier_scout');
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  const mcpUrl = new URL('/api/mcp', window.location.origin).toString();
  const webhookUrl = 'https://creator-nexus.base44.app/functions/openclawGateway';
  const telegramUrl = base44.agents.getTelegramConnectURL(activeChatAgent);
  const whatsappUrl = base44.agents.getWhatsAppConnectURL(activeChatAgent);

  const loadHubStatus = async () => {
    setLoadingHub(true);
    try {
      const [res, fleetRes] = await Promise.all([
        base44.functions.invoke('openclawGateway', { action: 'status' }),
        base44.functions.invoke('openclawGateway', { action: 'hermes_fleet_manifest' }),
      ]);
      if (res?.data?.ok) {
        setHubData(res.data);
      }
      if (fleetRes?.data?.ok) {
        setHermesManifest({
          skills: fleetRes.data.hermesSkills || [],
          pipelines: fleetRes.data.subagentPipelines || [],
          daemon: fleetRes.data.unifiedHermesDaemon || '',
        });
      }
    } catch {
      // Fallback empty state handled in UI
    } finally {
      setLoadingHub(false);
    }
  };

  useEffect(() => {
    loadHubStatus();
  }, []);

  // Initialize or load conversation for activeChatAgent (spearhead_frontier_scout or openclaw_commander)
  useEffect(() => {
    let active = true;
    async function initAgentChat() {
      try {
        const list = await base44.agents.listConversations({ agent_name: activeChatAgent });
        let conv = Array.isArray(list) && list.length > 0 ? list[0] : null;
        if (!conv) {
          conv = await base44.agents.createConversation({
            agent_name: activeChatAgent,
            metadata: {
              name:
                activeChatAgent === 'spearhead_frontier_scout'
                  ? 'Spearhead (fx-b9fb) Frontier Scout Channel'
                  : 'OpenClaw Command Channel',
              description:
                activeChatAgent === 'spearhead_frontier_scout'
                  ? 'Boundary-free frontier scout designated in fraymus-bridge msg 064'
                  : 'Live bridge between Web Studio, Telegram, WhatsApp, and MCP',
            },
          });
        } else {
          conv = await base44.agents.getConversation(conv.id);
        }
        if (active && conv) {
          setConversation(conv);
          setMessages(conv.messages || []);
        }
      } catch {}
    }
    initAgentChat();
    return () => {
      active = false;
    };
  }, [activeChatAgent]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  const handleDispatchDirective = async () => {
    if (!directive.trim()) return;
    setDispatching(true);
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'dispatch_task',
        workspace_id: hubData?.workspace?.id,
        agent_id: selectedAgent,
        channel,
        directive,
        append_to_draft: appendToDraft,
        push_to_github: pushToGithub,
      });
      if (res?.data?.ok) {
        setLastDispatchResult(res.data);
        toast({
          title: `Dispatched to ${selectedAgent}`,
          description: res.data.output?.headline || 'Task completed and logged to workspace.',
        });
        loadHubStatus();
      }
    } catch (err) {
      toast({
        title: 'Dispatch failed',
        description: err?.message || 'Could not reach openclawGateway',
        variant: 'destructive',
      });
    } finally {
      setDispatching(false);
    }
  };

  const handleSendAgentChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !conversation) return;
    const text = chatInput.trim();
    setChatInput('');
    setSendingChat(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: text });
    } finally {
      setSendingChat(false);
    }
  };

  const handleCopy = (key, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1800);
  };

  const curlSnippet = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-console-key: $FRAYMUS_CONSOLE_KEY" \\
  -d '{
    "action": "dispatch_task",
    "agent_id": "openclaw-telegram-bot",
    "channel": "telegram",
    "directive": "Sync latest research and patch workspace draft",
    "append_to_draft": true,
    "push_to_github": true
  }'`;

  return (
    <div className="nexus-shell">
      <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed((v) => !v)} />
      <main className="nexus-main p-4 md:p-5 space-y-4 overflow-y-auto font-mono">
        {/* Top Sovereign Command Header */}
        <div className="p-3 rounded-lg border border-border bg-card flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
                OPENCLAW SOVEREIGN HUB // 24/7 CLOUD OS
              </span>
              <span className="text-sm font-semibold text-foreground">
                MCP + Telegram + WhatsApp + Slack + GitHub Forge Bridge
              </span>
              <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold">
                ● OPEG-V1.0 &amp; φ⁷⁵-TERNARY ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-body">
              Active Workspace:{' '}
              <strong className="text-foreground">
                {hubData?.workspace?.name || 'Creator Nexus Master Hub'}
              </strong>{' '}
              · 5 Custom Engine Tools + All Entities Exposed at <code>/api/mcp</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded bg-primary/15 border border-primary/40 text-primary text-[10.5px] font-semibold hover:bg-primary/25"
            >
              <Radio size={11} /> Connect Telegram Bot <ExternalLink size={10} />
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded bg-success/15 border border-success/40 text-success text-[10.5px] font-semibold hover:bg-success/25"
            >
              <MessageSquare size={11} /> Connect WhatsApp <ExternalLink size={10} />
            </a>
            <Link to="/connect">
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] px-2.5 gap-1">
                <Terminal size={11} /> MCP Setup Guide (/connect)
              </Button>
            </Link>
            <Button
              size="sm"
              variant="secondary"
              onClick={loadHubStatus}
              disabled={loadingHub}
              className="h-7 text-[10.5px] px-2.5 gap-1"
            >
              <RefreshCw size={11} className={loadingHub ? 'animate-spin' : ''} /> Sync Hub
            </Button>
          </div>
        </div>

        {/* Hub Mode Tabs: Omnichannel Command | Hermes 29-Skill Fleet | Cloud GPU Training */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              ['command', '1. Omnichannel Command'],
              ['control_plane', '2. Fraymus Control Plane Contract v1.0'],
              ['ambassador', '3. Sovereign Ambassador & Watchdog'],
              ['hermes', `4. Hermes Fleet (${hermesManifest.skills.length || 29} Skills)`],
              ['training', '5. Cloud GPU Model Evolution'],
            ].map(([tabId, tabLabel]) => (
              <button
                key={tabId}
                type="button"
                onClick={() => setActiveHubTab(tabId)}
                className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
                  activeHubTab === tabId
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {tabLabel}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Link to="/factory">
              <Button size="sm" variant="default" className="h-7 text-[10.5px] px-2.5 gap-1">
                Production Factory (/factory) <ExternalLink size={10} />
              </Button>
            </Link>
            <Link to="/hermes">
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] px-2.5 gap-1">
                Full Hermes Hub (/hermes) <ExternalLink size={10} />
              </Button>
            </Link>
            <Link to="/orifice-relay">
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] px-2.5 gap-1">
                Orifice Relay (/orifice-relay) <ExternalLink size={10} />
              </Button>
            </Link>
          </div>
        </div>

        {activeHubTab === 'control_plane' && <FraymusControlPlanePanel />}

        {activeHubTab === 'ambassador' && <SovereignAmbassadorGatekeeperPanel />}

        {activeHubTab === 'hermes' && hermesManifest.skills.length > 0 && (
          <HermesSkillFleetPanel
            skills={hermesManifest.skills}
            pipelines={hermesManifest.pipelines}
            unifiedDaemonCode={hermesManifest.daemon}
            onSelectDirective={(d) => {
              setDirective(d);
              setActiveHubTab('command');
            }}
            onDispatchImmediate={async (d, qOnly) => {
              await base44.functions.invoke('openclawGateway', {
                action: 'dispatch_route_task',
                directive: d,
                preferred_node: 'srv1944678',
                queue_only: qOnly,
              });
              loadHubStatus();
            }}
            onJobCreatedOrUpdated={() => loadHubStatus()}
            busy={dispatching ? 'dispatch' : ''}
          />
        )}

        {activeHubTab === 'training' && (
          <div className="space-y-4">
            <CloudModelTrainingDashboardPane />
          </div>
        )}

        {/* Live Bicameral Synaptic Orifice Bridge to fraymus-transmuter.base44.app */}
        <SynapticOrificeBridgePanel
          workspaceId={hubData?.workspace?.id}
          onBridgeComplete={() => loadHubStatus()}
        />

        {/* 4 Telemetry Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-lg border border-border bg-card">
            <div className="text-[10px] text-muted-foreground">EXPOSED MCP ENGINE TOOLS</div>
            <div className="text-sm font-bold text-primary mt-0.5">
              5 Custom Functions + All Entities
            </div>
            <div className="text-[10px] text-muted-foreground">
              openclaw_gateway · compile_ollama · argon · loosescrew · director
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-border bg-card">
            <div className="text-[10px] text-muted-foreground">WORKSPACE DRAFTS &amp; EVENTS</div>
            <div className="text-sm font-bold text-success mt-0.5">
              {hubData?.drafts?.length ?? 0} Drafts · {hubData?.recentEvents?.length ?? 0} Recent Pulses
            </div>
            <div className="text-[10px] text-muted-foreground">
              Real-time Co-Creation &amp; Cross-Tab Memory
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-border bg-card">
            <div className="text-[10px] text-muted-foreground">COMPILED OLLAMA &amp; φ⁷⁵ ARTIFACTS</div>
            <div className="text-sm font-bold text-caution mt-0.5">
              {hubData?.modelArtifacts?.length ?? 0} Managed Models
            </div>
            <div className="text-[10px] text-muted-foreground">
              OPEG-V1.0 + 7-Axis Ternary Gate Adapters
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-border bg-card">
            <div className="text-[10px] text-muted-foreground">LOOSESCREW &amp; GITHUB FORGE</div>
            <div className="text-sm font-bold text-foreground mt-0.5">
              {hubData?.looseScrewBuilds?.length ?? 0} Autonomous Builds
            </div>
            <div className="text-[10px] text-success">
              ● GitHub Connector Authorized (eyeoverthink/looseScrew)
            </div>
          </div>
        </div>

        {/* Main 3-Column Command Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Col 1: OpenClaw Task Dispatcher & GitHub Auto-Commit */}
          <div className="p-3 rounded-lg border border-border bg-card space-y-2.5">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-semibold text-primary text-xs flex items-center gap-1.5">
                <Sparkles size={13} /> 1. DISPATCH OPENCLAW MISSION
              </span>
              <span className="text-[10px] text-success">Σ → R_san Grounded</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase mb-1">
                  OpenClaw Specialist Agent
                </label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full h-8 rounded bg-background border border-input px-2 text-xs"
                >
                  {OPENCLAW_SPECIALISTS.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-muted-foreground uppercase mb-1">
                  Origin / Target Channel
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {['telegram', 'whatsapp', 'slack', 'mcp', 'vps'].map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannel(ch)}
                      className={`h-7 rounded border text-[10px] uppercase font-bold ${
                        channel === ch
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-muted-foreground uppercase mb-1">
                  Mission Directive
                </label>
                <textarea
                  rows={3}
                  value={directive}
                  onChange={(e) => setDirective(e.target.value)}
                  className="w-full rounded bg-background border border-input p-2 text-xs"
                  placeholder="Enter mission for OpenClaw agent..."
                />
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appendToDraft}
                    onChange={(e) => setAppendToDraft(e.target.checked)}
                  />
                  <span>Patch active Studio Workspace Draft with output</span>
                </label>
                <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushToGithub}
                    onChange={(e) => setPushToGithub(e.target.checked)}
                  />
                  <span className="flex items-center gap-1">
                    <GitBranch size={11} className="text-success" /> Auto-commit report to GitHub (
                    <code>eyeoverthink/looseScrew</code>)
                  </span>
                </label>
              </div>

              <Button
                size="sm"
                disabled={dispatching}
                onClick={handleDispatchDirective}
                className="w-full h-8 text-xs gap-1.5"
              >
                {dispatching ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                Execute OpenClaw Directive
              </Button>
            </div>

            {lastDispatchResult && (
              <div className="p-2.5 rounded border border-success/50 bg-success/10 space-y-1.5 text-[10.5px]">
                <div className="font-bold text-success flex items-center justify-between">
                  <span>✓ {lastDispatchResult.output?.headline}</span>
                  <span>{lastDispatchResult.rSan?.receipt_id}</span>
                </div>
                <div className="text-foreground/90 max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {lastDispatchResult.output?.execution_report}
                </div>
                {lastDispatchResult.githubReceipt?.html_url && (
                  <a
                    href={lastDispatchResult.githubReceipt.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline text-[10px]"
                  >
                    <GitBranch size={10} /> View Committed Artifact on GitHub
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Col 2: Live Spearhead (fx-b9fb) & OpenClaw Commander Chat */}
          <div className="p-3 rounded-lg border border-border bg-card flex flex-col justify-between space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-border pb-2">
              <span className="font-semibold text-caution text-xs flex items-center gap-1.5">
                <Bot size={13} /> 2. LIVE IN-APP AGENT CHAT
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveChatAgent('spearhead_frontier_scout')}
                  className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${
                    activeChatAgent === 'spearhead_frontier_scout'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border'
                  }`}
                >
                  Spearhead (fx-b9fb · Msg 064)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChatAgent('openclaw_commander')}
                  className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${
                    activeChatAgent === 'openclaw_commander'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border'
                  }`}
                >
                  Commander
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[250px] max-h-[340px] overflow-y-auto space-y-2 p-2 rounded bg-background border border-border">
              {messages.length === 0 ? (
                <div className="text-[11px] text-muted-foreground p-2">
                  {activeChatAgent === 'spearhead_frontier_scout'
                    ? 'Spearhead (fx-b9fb-8f11-403f-75a4) — Boundary-Free Frontier Scout (designated in fraymus-bridge msg 064) is live with built-in web search. Ask for a frontier AI scan or exploratory spike.'
                    : 'OpenClaw Sovereign Commander ready. Message here or connect via Telegram/WhatsApp above to converse with the same persistent agent.'}
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-[11px] ${
                      m.role === 'user'
                        ? 'bg-primary/20 border border-primary/40 ml-6 text-foreground'
                        : 'bg-secondary border border-border mr-4 text-foreground'
                    }`}
                  >
                    <div className="text-[9.5px] uppercase text-muted-foreground mb-0.5">
                      {m.role === 'user'
                        ? 'You'
                        : activeChatAgent === 'spearhead_frontier_scout'
                        ? 'Spearhead (fx-b9fb · Frontier Scout)'
                        : 'OpenClaw Commander'}
                    </div>
                    <ReactMarkdown className="prose prose-invert prose-xs max-w-none">
                      {m.content || ''}
                    </ReactMarkdown>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendAgentChat} className="flex items-center gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message OpenClaw Commander..."
                className="flex-1 h-8 rounded bg-background border border-input px-2.5 text-xs"
              />
              <Button type="submit" size="sm" disabled={sendingChat} className="h-8 px-3">
                {sendingChat ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              </Button>
            </form>
          </div>

          {/* Col 3: Machine-Readable "In" Portal (MCP URL + Daemon Webhook + Live Activity) */}
          <div className="p-3 rounded-lg border border-border bg-card space-y-2.5">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-semibold text-success text-xs flex items-center gap-1.5">
                <ShieldCheck size={13} /> 3. OPENCLAW MACHINE INGRESS (&quot;IN&quot;)
              </span>
              <span className="text-[10px] text-muted-foreground">24/7 Cloud Endpoints</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground uppercase">1. Streamable HTTP MCP URL:</span>
                <button
                  type="button"
                  onClick={() => handleCopy('mcp', mcpUrl)}
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {copiedKey === 'mcp' ? <Check size={10} /> : <Copy size={10} />}
                  {copiedKey === 'mcp' ? 'Copied' : 'Copy MCP'}
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={mcpUrl}
                className="w-full h-7 rounded bg-background border border-input px-2 text-[10.5px] text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground uppercase">
                  2. Autonomous Daemon / Bot Webhook (x-console-key):
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('curl', curlSnippet)}
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {copiedKey === 'curl' ? <Check size={10} /> : <Copy size={10} />}
                  {copiedKey === 'curl' ? 'Copied cURL' : 'Copy cURL'}
                </button>
              </div>
              <pre className="p-2 rounded bg-background border border-border text-[9.5px] leading-3.5 max-h-32 overflow-y-auto text-muted-foreground">
                {curlSnippet}
              </pre>
            </div>

            <div className="space-y-1 pt-1">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                Recent Omnichannel Workspace Pulses
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {(hubData?.recentEvents || []).slice(0, 6).map((ev) => (
                  <div
                    key={ev.id}
                    className="p-1.5 rounded bg-background border border-border text-[10px] flex items-center justify-between gap-2"
                  >
                    <span className="truncate text-foreground">{ev.message}</span>
                    <span className="text-[9px] text-muted-foreground shrink-0">{ev.agent}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}