import { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/nexus/Sidebar';
import { Button } from '@/components/ui/button';
import { Copy, Check, Terminal, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import '@/components/nexus/theme.css';

const CLIENT_TABS = [
  {
    id: 'claude',
    label: 'Claude',
    steps: [
      'Open your profile menu in Claude → Settings → Connectors.',
      'Click "Add custom connector".',
      'Name it "Creator Nexus OS", paste the MCP Server URL above, and click Add.',
      'Complete the OAuth sign-in & consent screen when prompted so Claude acts with your workspace permissions.',
    ],
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    steps: [
      'Open Apps in ChatGPT → enable Developer mode (note ChatGPT’s warning that custom developer connectors can access external data and actions).',
      'Click "Create app", name it "Creator Nexus OS", paste the MCP Server URL above, and click Create.',
      'Enable the app from the chat composer before prompting it.',
      'Approve the Creator Nexus OAuth consent prompt when it opens.',
    ],
  },
  {
    id: 'cursor',
    label: 'Cursor',
    steps: [
      'Open Cursor Settings → Customize → MCPs tab → click "New MCP Server" to open mcp.json.',
      'Add an entry whose "url" is the MCP Server URL above, save mcp.json, and toggle the server on.',
      'Complete the OAuth sign-in on the Creator Nexus consent page when prompted.',
    ],
  },
  {
    id: 'custom',
    label: 'Custom',
    steps: [
      'Copy the MCP Server URL above and register it as a Streamable HTTP MCP server in OpenClaw or any MCP-compatible client.',
      'Name + URL is all most clients need — then reload your client.',
      'When the OAuth consent window opens, sign in with your Creator Nexus account and approve access.',
    ],
  },
];

export default function Connect() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeClient, setActiveClient] = useState('claude');
  const [copied, setCopied] = useState(false);

  const mcpUrl = new URL('/api/mcp', window.location.origin).toString();
  const activeTab = CLIENT_TABS.find((t) => t.id === activeClient) || CLIENT_TABS[0];

  const handleCopy = () => {
    navigator.clipboard?.writeText(mcpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="nexus-shell">
      <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed((v) => !v)} />
      <main className="nexus-main p-4 md:p-6 space-y-5 overflow-y-auto">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-primary" />
              <h1 className="text-lg font-semibold text-foreground">
                Connect AI Clients &amp; OpenClaw Agents via MCP
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Point Claude, ChatGPT, Cursor, or your custom OpenClaw MCP client at Creator Nexus.
            </p>
          </div>
          <Link to="/openclaw">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft size={13} /> OpenClaw Sovereign Hub
            </Button>
          </Link>
        </header>

        {/* Read-only MCP Server URL */}
        <section className="p-4 rounded-lg border border-border bg-card space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground block">
            Creator Nexus Streamable HTTP MCP Server URL
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              readOnly
              value={mcpUrl}
              aria-label="MCP Server URL"
              className="flex-1 min-w-[260px] h-9 rounded bg-background border border-input px-3 font-mono text-xs text-foreground"
            />
            <Button size="sm" onClick={handleCopy} className="h-9 px-4 gap-1.5">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied URL' : 'Copy MCP URL'}
            </Button>
          </div>
        </section>

        {/* 4 Client Tabs: Claude, ChatGPT, Cursor, Custom */}
        <section className="p-4 rounded-lg border border-border bg-card space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-border pb-3">
            {CLIENT_TABS.map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeClient === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveClient(tab.id)}
                className="text-xs"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2.5">
            <h2 className="text-sm font-semibold text-foreground">
              Connecting {activeTab.label}
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-xs text-foreground/90">
              {activeTab.steps.map((step, i) => (
                <li key={i} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {activeClient === 'cursor' && (
            <pre className="p-3 rounded bg-background border border-border font-mono text-[11px] text-muted-foreground overflow-x-auto">
{`{
  "mcpServers": {
    "creator-nexus": {
      "url": "${mcpUrl}"
    }
  }
}`}
            </pre>
          )}
        </section>

        {/* OAuth & Refresh Notes */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
              <ShieldCheck size={14} /> OAuth Sign-In &amp; Consent
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Because Creator Nexus uses OAuth protection, each client opens the app&apos;s consent page on first connect. Sign in with your account and approve — the connected agent only ever acts as you and respects your workspace permissions.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-caution">
              <RefreshCw size={14} /> Refresh After Shipping Changes
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI assistants cache the MCP tool list. Whenever we publish new entities, agents, or custom MCP functions, refresh or reconnect the connector in your AI client to pick up the updated tools.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}