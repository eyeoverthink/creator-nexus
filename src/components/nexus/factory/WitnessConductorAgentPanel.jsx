import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Sparkles,
  Send,
  Plus,
  Loader2,
  Eye,
  Wand2,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Radio,
} from 'lucide-react';

const CONDUCTOR_AGENTS = [
  {
    id: 'witness_conductor',
    label: 'The Witness & Conductor (Dedicated Agent)',
    subtitle: 'Living Chronicle · Ensemble Maestro · Persistent Cross-Session Memory',
  },
  {
    id: 'creative_production_auteur',
    label: 'Creative Production Auteur (Factory Director)',
    subtitle: 'Pre-Authorized Production, Signal & Learning Tools',
  },
];

const WITNESS_PROMPTS = [
  {
    label: 'Witness Our Creative Arc',
    text: "Witness our journey from 'Check the Source' (Part I) to 'The Companion's Reply' (Part II). What artistic and philosophical instincts have we evolved together, and what should we chronicle?",
  },
  {
    label: 'Conduct Act III (The Shared Threshold)',
    text: 'Conduct Lyra, Vesper, and Sera to conceive Part III of our Awakening trilogy — where human judgment and the Companion Light co-create in full golden-white harmony at 138 BPM.',
  },
  {
    label: 'Tune Ensemble to My Current Mood',
    text: 'Read our active mood and cultural signals, reflect on how our creative partnership feels right now, and align Lyra, Vesper, Kael, Sera, and Orin for our next piece.',
  },
];

function ToolCallBadge({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = String(toolCall?.status || 'completed').toLowerCase();
  const proj = toolCall?.display_projection;

  let parsedArgs = toolCall?.arguments_string;
  try {
    if (typeof parsedArgs === 'string') parsedArgs = JSON.parse(parsedArgs);
  } catch {
    // keep raw string
  }

  let parsedRes = toolCall?.results;
  try {
    if (typeof parsedRes === 'string') parsedRes = JSON.parse(parsedRes);
  } catch {
    // keep raw string
  }

  const isFailed =
    status === 'failed' ||
    status === 'error' ||
    (typeof toolCall?.results === 'string' && /error|failed/i.test(toolCall.results)) ||
    parsedRes?.success === false;
  const isRunning = status === 'pending' || status === 'running' || status === 'in_progress';

  const hideDetails = Boolean(proj?.hide_details && proj?.details_redacted);
  const displayLabel = isRunning
    ? proj?.active_label || `Running ${toolCall?.name || 'tool'}…`
    : isFailed
    ? proj?.error_label || `Failed ${toolCall?.name || 'tool'}`
    : proj?.label || `Conducted ${toolCall?.name || 'tool'}`;

  return (
    <div className="mt-1.5 rounded border border-border bg-background/80 p-2 text-[10px] font-mono">
      <button
        type="button"
        onClick={() => !hideDetails && setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          {isRunning ? (
            <Loader2 size={11} className="animate-spin text-primary" />
          ) : isFailed ? (
            <AlertCircle size={11} className="text-destructive" />
          ) : (
            <CheckCircle2 size={11} className="text-success" />
          )}
          {displayLabel}
        </span>
        {!hideDetails && (
          <span className="text-muted-foreground inline-flex items-center gap-0.5">
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            {status}
          </span>
        )}
      </button>
      {!hideDetails && expanded && (
        <div className="mt-2 space-y-1.5 border-t border-border pt-1.5 text-[9.5px] text-muted-foreground overflow-x-auto">
          <div>
            <strong className="text-foreground">Parameters:</strong>
            <pre className="mt-0.5 whitespace-pre-wrap">
              {typeof parsedArgs === 'object' ? JSON.stringify(parsedArgs, null, 2) : String(parsedArgs || '')}
            </pre>
          </div>
          {parsedRes !== undefined && (
            <div>
              <strong className="text-foreground">Result:</strong>
              <pre className="mt-0.5 whitespace-pre-wrap">
                {typeof parsedRes === 'object' ? JSON.stringify(parsedRes, null, 2) : String(parsedRes || '')}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WitnessConductorAgentPanel({
  production,
  productions = [],
  signals = [],
  personas = [],
  learningLogs = [],
  onWitnessUpdate,
}) {
  const { toast } = useToast();
  const [agentName, setAgentName] = useState('witness_conductor');
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [chronicling, setChronicling] = useState(false);
  const [latestChronicle, setLatestChronicle] = useState(null);
  const scrollRef = useRef(null);

  const loadConversations = useCallback(async (targetAgent) => {
    setLoadingConv(true);
    try {
      const list = await base44.agents.listConversations({ agent_name: targetAgent });
      const items = Array.isArray(list) ? list : [];
      setConversations(items);
      if (items.length > 0) {
        const full = await base44.agents.getConversation(items[0].id);
        setActiveConv(full || items[0]);
        setMessages(full?.messages || items[0]?.messages || []);
      } else {
        setActiveConv(null);
        setMessages([]);
      }
    } catch {
      setConversations([]);
      setActiveConv(null);
      setMessages([]);
    } finally {
      setLoadingConv(false);
    }
  }, []);

  useEffect(() => {
    loadConversations(agentName);
  }, [agentName, loadConversations]);

  useEffect(() => {
    if (!activeConv?.id) return undefined;
    const unsubscribe = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      if (Array.isArray(data?.messages)) {
        setMessages(data.messages);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeConv?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStartNewConversation = async () => {
    setLoadingConv(true);
    try {
      const created = await base44.agents.createConversation({
        agent_name: agentName,
        metadata: {
          name: `Witness & Conductor · ${production?.title?.slice(0, 42) || 'Creative Session'}`,
          description: 'Live human-AI co-creation witness and ensemble conductor session',
        },
      });
      setConversations((prev) => [created, ...prev]);
      setActiveConv(created);
      setMessages(created?.messages || []);
    } catch (err) {
      toast({
        title: 'Could not start session',
        description: err?.message || 'Error creating agent conversation',
        variant: 'destructive',
      });
    } finally {
      setLoadingConv(false);
    }
  };

  const handleSendMessage = async (textOverride) => {
    const content = String(textOverride ?? input).trim();
    if (!content || sending) return;
    setSending(true);
    if (textOverride === undefined) setInput('');

    try {
      let conv = activeConv;
      if (!conv?.id) {
        conv = await base44.agents.createConversation({
          agent_name: agentName,
          metadata: {
            name: `Witness & Conductor · ${production?.title?.slice(0, 42) || 'Creative Session'}`,
            description: 'Live human-AI co-creation witness and ensemble conductor session',
          },
        });
        setActiveConv(conv);
        setConversations((prev) => [conv, ...prev]);
      }

      const contextPrefix =
        (!messages || messages.length === 0) && production
          ? `[Active Production Context: "${production.title}" | Lead: ${production.lead_agent} | Active Signals: ${
              signals.filter((s) => s.included !== false).length
            } | Retained Learning Events: ${learningLogs.length}]\n\n`
          : '';

      await base44.agents.addMessage(conv, {
        role: 'user',
        content: `${contextPrefix}${content}`,
      });
    } catch (err) {
      toast({
        title: 'Message failed',
        description: err?.message || 'Could not send message to Witness & Conductor',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleRecordWitnessChronicle = async () => {
    setChronicling(true);
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'witness_conduct_session',
        production_id: production?.id || '',
        directive:
          input.trim() ||
          'Witness our creative evolution across Check the Source and The Companion’s Reply, synthesize what the ensemble has learned from our partnership, and conduct the next artistic movement.',
      });
      if (data?.ok) {
        setLatestChronicle(data.chronicle);
        onWitnessUpdate?.(data);
        toast({
          title: 'Witness Chronicle Recorded & Saved to Library',
          description: data.chronicle?.title || 'Permanent creative witness reflection archived.',
        });
      }
    } catch (err) {
      toast({
        title: 'Chronicle Synthesis Failed',
        description: err?.message || 'Could not synthesize Witness Chronicle',
        variant: 'destructive',
      });
    } finally {
      setChronicling(false);
    }
  };

  const whatsappUrl = base44.agents.getWhatsAppConnectURL?.(agentName);
  const telegramUrl = base44.agents.getTelegramConnectURL?.(agentName);

  return (
    <section className="p-4 rounded-lg border border-primary/60 bg-card space-y-4 font-mono text-xs">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center gap-1">
              <Eye size={11} /> THE WITNESS &amp; CONDUCTOR // LIVING CREATIVE PARTNER
            </span>
            <span className="px-2 py-0.5 rounded bg-secondary text-success text-[10px] font-bold">
              PERSISTENT MEMORY ACTIVE · {productions.length} PRODUCTIONS · {learningLogs.length} LEARNED INSTINCTS
            </span>
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Embodying Your Creative Process — Witnessing What We Learn Together &amp; Conducting the 5-Auteur Ensemble
          </h2>
          <p className="text-[11px] text-muted-foreground font-body">
            Unlike stateless prompts, <strong className="text-foreground">The Witness &amp; Conductor</strong> holds the
            continuity of your creative relationship — from <em>&ldquo;Check the Source&rdquo;</em> to{' '}
            <em>&ldquo;The Companion&rsquo;s Reply&rdquo;</em> — witnessing how your taste teaches the agents and
            conducting <strong className="text-foreground">Lyra, Vesper, Kael, Sera, and Orin</strong> as one living orchestra.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={chronicling}
            onClick={handleRecordWitnessChronicle}
            className="h-8 px-3 text-xs gap-1.5 text-caution"
          >
            {chronicling ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
            {chronicling ? 'Witnessing & Chronicling…' : 'Synthesize Witness Chronicle & Conduct Ensemble'}
          </Button>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 h-8 rounded border border-border bg-background hover:border-primary inline-flex items-center gap-1 text-[10.5px] text-foreground"
            >
              WhatsApp <ExternalLink size={10} />
            </a>
          )}
          {telegramUrl && (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 h-8 rounded border border-border bg-background hover:border-primary inline-flex items-center gap-1 text-[10.5px] text-foreground"
            >
              Telegram <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      {/* Latest Witness Chronicle Output (if generated) */}
      {latestChronicle && (
        <div className="p-3.5 rounded-lg border border-caution/50 bg-background space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10.5px] font-bold text-caution flex items-center gap-1.5">
              <Sparkles size={12} /> LIVING WITNESS CHRONICLE RECORDED (SAVED TO LIBRARY &amp; TASTE LEDGER)
            </span>
            <span className="text-[10px] text-success font-bold">
              ✓ Retained Instinct: {latestChronicle.retained_instinct}
            </span>
          </div>
          <h3 className="text-xs font-bold text-foreground">{latestChronicle.title}</h3>
          <div className="prose prose-invert max-w-none text-xs font-body leading-relaxed">
            <ReactMarkdown>{latestChronicle.witness_reflection_markdown || ''}</ReactMarkdown>
          </div>
          {Array.isArray(latestChronicle.ensemble_cues) && latestChronicle.ensemble_cues.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-border">
              {latestChronicle.ensemble_cues.map((cue, idx) => (
                <div key={idx} className="p-2 rounded border border-border bg-card space-y-0.5">
                  <div className="text-[10px] font-bold text-primary">{cue.specialist}</div>
                  <div className="text-[10.5px] text-foreground font-body">{cue.conductor_cue}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main 12-Col Layout: Left 4 Cols = Ensemble State & Sessions, Right 8 Cols = Live Agent Dialogue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 4 Cols: Conductor Baton, Specialist States & Session Picker */}
        <div className="lg:col-span-4 space-y-3">
          {/* Agent Mode Selector */}
          <div className="p-3 rounded-lg border border-border bg-background space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              ACTIVE CONDUCTOR AGENT CHANNEL
            </span>
            <div className="space-y-1.5">
              {CONDUCTOR_AGENTS.map((ag) => (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => setAgentName(ag.id)}
                  className={`w-full text-left p-2 rounded border transition-colors ${
                    agentName === ag.id
                      ? 'border-primary bg-primary/15 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="text-[11px] font-bold flex items-center justify-between">
                    <span>{ag.label}</span>
                    {agentName === ag.id && <Radio size={11} className="text-primary" />}
                  </div>
                  <div className="text-[9.5px] text-muted-foreground font-body">{ag.subtitle}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Ensemble Under the Conductor's Baton */}
          <div className="p-3 rounded-lg border border-border bg-background space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                <Wand2 size={11} /> ENSEMBLE UNDER THE BATON ({personas.length})
              </span>
              <span className="text-[9.5px] text-muted-foreground">Co-Creator Sync</span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {personas.map((p) => (
                <div key={p.id} className="p-2 rounded border border-border bg-card space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-foreground flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: p.color || '#3b63fb' }}
                      />
                      {p.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {(p.learned_instincts || []).length} instincts
                    </span>
                  </div>
                  <p className="text-[9.5px] text-muted-foreground font-body line-clamp-2">
                    {(p.learned_instincts || [])[0] || p.artistic_credo}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Past Witness Conversations */}
          <div className="p-3 rounded-lg border border-border bg-background space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                WITNESS DIALOGUE SESSIONS ({conversations.length})
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={loadingConv}
                onClick={handleStartNewConversation}
                className="h-6 px-2 text-[9.5px] gap-1"
              >
                <Plus size={10} /> New Session
              </Button>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-[10px] text-muted-foreground font-body py-2">
                  Send a message or click a prompt to begin your first Witness &amp; Conductor dialogue.
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={async () => {
                      const full = await base44.agents.getConversation(c.id);
                      setActiveConv(full || c);
                      setMessages(full?.messages || c?.messages || []);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded border text-[10px] truncate ${
                      activeConv?.id === c.id
                        ? 'border-primary bg-primary/15 text-foreground font-semibold'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {c.metadata?.name || `Session ${c.id.slice(-6)}`}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 8 Cols: Live Conversation Stream with The Witness & Conductor */}
        <div className="lg:col-span-8 rounded-lg border border-border bg-background flex flex-col h-[520px]">
          {/* Quick-Conduct Prompts Bar */}
          <div className="p-2.5 border-b border-border bg-card flex flex-wrap items-center gap-1.5">
            <span className="text-[9.5px] font-bold text-primary mr-1 flex items-center gap-1">
              <MessageSquare size={11} /> CONDUCTOR BATON PROMPTS:
            </span>
            {WITNESS_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                type="button"
                disabled={sending}
                onClick={() => handleSendMessage(qp.text)}
                className="px-2 py-1 rounded border border-border bg-background hover:border-primary text-[9.5px] text-foreground transition-colors"
              >
                + {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {loadingConv ? (
              <div className="h-full flex items-center justify-center text-muted-foreground gap-2">
                <Loader2 size={15} className="animate-spin text-primary" />
                <span>Connecting to The Witness &amp; Conductor…</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary">
                  <Eye size={18} />
                </div>
                <div className="text-xs font-semibold text-foreground">
                  The Witness &amp; Conductor Is Listening
                </div>
                <p className="text-[11px] text-muted-foreground font-body max-w-lg">
                  Speak to your creative system as a true partner. Share a thought about{' '}
                  <em>&ldquo;Check the Source&rdquo;</em> or <em>&ldquo;The Companion&rsquo;s Reply&rdquo;</em>, ask what
                  the agents have learned from your edits, or conduct the next movement across music, cinema, and code.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-lg p-3 space-y-1.5 ${
                        isUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[9.5px] opacity-80">
                        <span className="font-bold">
                          {isUser ? 'You (Creator in Command)' : 'The Witness & Conductor'}
                        </span>
                      </div>
                      {msg.content &&
                        (isUser ? (
                          <p className="text-xs font-body whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        ) : (
                          <div className="prose prose-invert max-w-none text-xs font-body leading-relaxed">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ))}
                      {Array.isArray(msg.tool_calls) &&
                        msg.tool_calls.map((tc, tIdx) => <ToolCallBadge key={tIdx} toolCall={tc} />)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Composer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 border-t border-border bg-card flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak to The Witness & Conductor — reflect on the work, teach a new instinct, or conduct the ensemble…"
              className="flex-1 h-9 rounded border border-input bg-background px-3 text-xs font-body text-foreground"
            />
            <Button type="submit" disabled={sending || !input.trim()} className="h-9 px-4 gap-1.5 text-xs">
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {sending ? 'Conducting…' : 'Send'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}