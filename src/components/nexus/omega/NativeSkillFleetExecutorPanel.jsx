import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import {
  Zap,
  Play,
  Copy,
  Check,
  Bot,
  Send,
  ShieldCheck,
  Search,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const QUICK_NATIVE_PRESETS = [
  {
    skill_id: 'sherlock',
    label: 'Sherlock Handle Scan',
    query: 'eyeoverthink',
    badge: '10 LIVE NETWORKS · $0',
  },
  {
    skill_id: 'duckduckgo-search',
    label: 'DDG + arXiv + HN Search',
    query: 'HeartMuLa open source music foundation model',
    badge: 'METASEARCH · $0',
  },
  {
    skill_id: 'osint-investigation',
    label: 'OSINT Corporate/SEC/Wayback',
    query: 'Anthropic',
    badge: '14-SOURCE OSINT · $0',
  },
  {
    skill_id: 'oss-forensics',
    label: 'OSS npm/PyPI Supply-Chain Audit',
    query: 'react',
    badge: 'FORENSICS · $0',
  },
  {
    skill_id: 'web-pentest',
    label: 'OWASP Header & CORS Audit',
    query: 'https://nexus-create-sync.base44.app',
    badge: 'DAST SCAN · $0',
  },
  {
    skill_id: 'reddit-reading',
    label: 'Reddit + HN Live Pain-Points',
    query: 'r/LocalLLaMA',
    badge: 'SOCIAL INTEL · $0',
  },
  {
    skill_id: 'bioinformatics',
    label: 'FRAYMUS DNA GC & Duplex Audit',
    query: 'ATGCGTACGTAGCTAGCTAGCTAGCGATCGATCGGCTAGCTAGC',
    badge: 'BIO-COMPUTE · $0',
  },
  {
    skill_id: 'unbroker',
    label: 'Unbroker 22-Broker CCPA/DROP',
    query: 'Creator Nexus Sovereign Identity',
    badge: '22 BROKERS · $0',
  },
];

export default function NativeSkillFleetExecutorPanel({ skills = [], onJobCreated }) {
  const { toast } = useToast();
  const [selectedSkillId, setSelectedSkillId] = useState('sherlock');
  const [inputQuery, setInputQuery] = useState('eyeoverthink');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Embedded Sovereign Skill Fleet Agent Conversation state
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentBusy, setAgentBusy] = useState(false);

  const activeSkill =
    skills.find((s) => s.id === selectedSkillId) ||
    skills[0] || {
      id: selectedSkillId,
      category: 'Sovereign Native Skill',
      replaces: 'Paid SaaS APIs',
      savings_mo: 50,
      summary: 'Executes natively inside Creator Nexus without external Hermes.',
    };

  useEffect(() => {
    if (! conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [conversation?.id]);

  const handleRunNativeSkill = async (overrideSkillId, overrideQuery) => {
    const sId = overrideSkillId || selectedSkillId;
    const q = overrideQuery !== undefined ? overrideQuery : inputQuery;
    setSelectedSkillId(sId);
    setInputQuery(q);
    setBusy(true);
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'execute_native_skill',
        skill_id: sId,
        query: q,
        persist_to_vault: true,
      });
      if (res?.data?.ok) {
        setResult(res.data);
        if (res.data.job && onJobCreated) onJobCreated(res.data.job);
        toast({
          title: `Executed Natively: ${sId} (${res.data.elapsedMs}ms)`,
          description: `Saved to Library Vault — zero external Hermes server needed.`,
        });
      }
    } catch (err) {
      toast({
        title: 'Native skill execution failed',
        description: err?.message || 'Error executing skill',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSendToAgent = async () => {
    if (!agentPrompt.trim() || agentBusy) return;
    setAgentBusy(true);
    try {
      let conv = conversation;
      if (!conv) {
        conv = await base44.agents.createConversation({
          agent_name: 'sovereign_skill_fleet',
          metadata: {
            name: 'Sovereign 30-Skill Fleet Session',
            description: 'Zero-middleman native skill execution',
          },
        });
        setConversation(conv);
      }
      const text = agentPrompt.trim();
      setAgentPrompt('');
      await base44.agents.addMessage(conv, { role: 'user', content: text });
    } catch (err) {
      toast({
        title: 'Agent message failed',
        description: err?.message || 'Could not reach sovereign_skill_fleet agent',
        variant: 'destructive',
      });
    } finally {
      setAgentBusy(false);
    }
  };

  const totalMonthlySavings = skills.reduce((sum, s) => sum + (Number(s.savings_mo) || 0), 0);

  return (
    <section className="rounded-lg border border-primary bg-card p-4 space-y-3.5 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
              ZERO-MIDDLEMAN NATIVE 30-SKILL ENGINE // NO EXTERNAL HERMES REQUIRED
            </span>
            <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold">
              ● ${totalMonthlySavings || 1518}/MO SAAS REPLACED IN-APP
            </span>
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Run All 30 Manifest Tools Natively in Creator Nexus (Live OSINT, Sherlock, DDG/arXiv, OSS Forensics, DAST, Unbroker, HeartMuLa)
          </h2>
        </div>

        <Button
          size="sm"
          variant={showAgentChat ? 'default' : 'outline'}
          onClick={() => setShowAgentChat((v) => !v)}
          className="h-7 text-[11px] gap-1"
        >
          <Bot size={12} />
          {showAgentChat
            ? 'Hide Sovereign Fleet Agent'
            : 'Open Sovereign 30-Skill Agent Chat'}
        </Button>
      </div>

      {/* 1-Click Live Native Tool Presets */}
      <div className="space-y-1.5">
        <div className="text-[10.5px] text-muted-foreground">
          1-Click Live Zero-Cost Native Execution (runs directly inside Creator Nexus):
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_NATIVE_PRESETS.map((p) => (
            <button
              key={p.skill_id}
              type="button"
              disabled={busy}
              onClick={() => handleRunNativeSkill(p.skill_id, p.query)}
              className={`rounded border px-2.5 py-1 text-[10.5px] transition-colors flex items-center gap-1.5 ${
                selectedSkillId === p.skill_id
                  ? 'border-primary bg-selection text-foreground font-semibold'
                  : 'border-border bg-background text-muted-foreground hover:bg-hover hover:text-foreground'
              }`}
            >
              <Zap size={11} className="text-primary" />
              <span>{p.label}</span>
              <span className="rounded bg-secondary px-1 py-0.2 text-[9.5px] text-primary">
                {p.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Skill Selector + Input Bar */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr_auto] gap-2 items-end">
        <div>
          <label className="block text-[10.5px] text-muted-foreground mb-1">
            Select Any of the {skills.length || 30} Fleet Skills
          </label>
          <select
            value={selectedSkillId}
            onChange={(e) => {
              const nextId = e.target.value;
              setSelectedSkillId(nextId);
              const found = skills.find((s) => s.id === nextId);
              if (found?.sample_directive) setInputQuery(found.sample_directive);
            }}
            className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
          >
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — ({s.replaces})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10.5px] text-muted-foreground mb-1">
            Target Handle / URL / Package / DNA Sequence / Research Directive
          </label>
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="e.g., eyeoverthink, https://nexus-create-sync.base44.app, lodash, r/LocalLLaMA..."
            className="w-full h-8 rounded border border-input bg-background px-2.5 text-xs"
          />
        </div>

        <Button
          size="sm"
          disabled={busy}
          onClick={() => handleRunNativeSkill()}
          className="h-8 px-3 text-xs gap-1.5"
        >
          <Play size={12} />
          {busy ? 'Executing Natively...' : `Execute ${selectedSkillId} In-App`}
        </Button>
      </div>

      {/* Active Skill Metadata Bar */}
      <div className="rounded border border-border bg-background px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div>
          <span className="font-bold text-primary">{activeSkill.id}</span> ·{' '}
          <span className="text-muted-foreground">{activeSkill.summary}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-secondary px-2 py-0.5 text-[10px]">
            Replaces: {activeSkill.replaces}
          </span>
          <span className="rounded bg-success/15 text-success px-2 py-0.5 text-[10px] font-bold">
            Saves ${activeSkill.savings_mo || 30}/mo
          </span>
        </div>
      </div>

      {/* Live Execution Output */}
      {result && (
        <div className="rounded-md border border-primary/50 bg-background p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold">
                ✓ NATIVE IN-APP EXECUTION ({result.elapsedMs} ms)
              </span>
              <span className="text-xs font-semibold text-foreground">
                {result.skill?.id} → Saved to Library Vault
              </span>
              {result.githubVaultUrl && (
                <a
                  href={result.githubVaultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link underline inline-flex items-center gap-1 text-[10.5px]"
                >
                  GitHub Vault <ExternalLink size={10} />
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(result.liveData, null, 2));
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="text-[10.5px] text-primary hover:underline inline-flex items-center gap-1"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied JSON' : 'Copy Output JSON'}
            </button>
          </div>
          <pre className="text-[10.5px] text-foreground overflow-x-auto max-h-64 p-2 rounded bg-card border border-border">
            {JSON.stringify(result.liveData, null, 2)}
          </pre>
        </div>
      )}

      {/* Embedded Sovereign 30-Skill Fleet Agent Chat */}
      {showAgentChat && (
        <div className="rounded-md border border-primary/40 bg-background p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
              <Bot size={13} /> Sovereign 30-Skill Fleet Agent (`sovereign_skill_fleet`) — Autonomous In-App Operator
            </span>
            <span className="text-[10px] text-muted-foreground">
              Built-in Web Search + Native 30-Skill Execution
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 p-2 rounded bg-card border border-border">
            {messages.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Ask the Sovereign Fleet Agent to run any combination of the 30 tools (e.g., &quot;Scan handle eyeoverthink across platforms, audit npm package three, and draft a NeurIPS abstract&quot;).
              </p>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded text-[11px] ${
                    m.role === 'user'
                      ? 'bg-selection text-foreground ml-6'
                      : 'bg-background border border-border text-foreground mr-6'
                  }`}
                >
                  <div className="text-[9.5px] text-muted-foreground mb-0.5 uppercase">
                    {m.role}
                  </div>
                  {m.content && (
                    <div className="nexus-markdown text-xs">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendToAgent()}
              placeholder="Direct Sovereign 30-Skill Agent..."
              className="flex-1 h-8 rounded border border-input bg-card px-2.5 text-xs"
            />
            <Button
              size="sm"
              disabled={agentBusy}
              onClick={handleSendToAgent}
              className="h-8 px-3 text-xs gap-1"
            >
              <Send size={12} /> Send
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}