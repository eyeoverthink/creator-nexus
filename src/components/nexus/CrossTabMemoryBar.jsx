import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  useCrossTabMemory,
  buildAgentCrossTabContext,
  publishCrossTabPatch,
} from '@/lib/crossTabMemory';
import {
  Braces,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
  Layers,
  Loader2,
  Radio,
  Sparkles,
  X,
} from 'lucide-react';

const QUICK_AGENTS = [
  { id: 'writer', name: 'Scribe (Editor)', role: 'Rewrite, expand, or sharpen the live selection/edit' },
  { id: 'researcher', name: 'Scout (Researcher)', role: 'Find angles & hooks from the live selection/edit' },
  { id: 'strategist', name: 'Pulse (Strategist)', role: 'Critique clarity, hook & audience fit of current work' },
  { id: 'twin', name: 'Bicameral Twin (Yin/Yang)', role: 'Debate dual perspectives on what you are working on' },
];

export default function CrossTabMemoryBar({ nexus, workspaceId }) {
  const { memory, windowId, clearSelection } = useCrossTabMemory({
    activePanel: nexus?.state?.context?.active,
    onRemoteDraftEdit: (remoteDraft) => {
      // If Studio is open and another window edited the draft, sync it into Studio
      if (nexus?.edit && nexus?.state?.draft?.id === remoteDraft.id) {
        if (
          remoteDraft.body !== nexus.state.draft.body ||
          remoteDraft.title !== nexus.state.draft.title
        ) {
          nexus.edit(remoteDraft.title, remoteDraft.body);
        }
      }
    },
  });

  const [expanded, setExpanded] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('writer');
  const [customInstruction, setCustomInstruction] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const windowsList = Object.values(memory.windows || {});
  const sel = memory.selection;
  const edit = memory.liveEdit;
  const reaction = memory.agentReaction;

  const effectiveWorkspaceId =
    workspaceId ||
    nexus?.workspace?.id ||
    memory.draft?.workspace_id ||
    '';

  const triggerAgentReaction = async (agentChoice = selectedAgent) => {
    const focusText = sel?.text || edit?.body || memory.draft?.body || '';
    if (!focusText.trim()) {
      setError('Select some text or make an edit in any window first so the agent has live context.');
      setExpanded(true);
      return;
    }

    setBusy(true);
    setError('');
    setExpanded(true);

    const crossCtx = buildAgentCrossTabContext();
    const sourceWindowLabel = sel
      ? `${sel.pageTitle} (${sel.field || 'selection'})`
      : edit
      ? `${edit.pageTitle} (${edit.field || 'live edit'})`
      : 'Active Workspace';

    const promptTask =
      customInstruction.trim() ||
      `React directly to what I am currently working on in ${sourceWindowLabel}:\n` +
        `Selected text: "${(sel?.text || '').slice(0, 800)}"\n` +
        `Live edit excerpt: "${(edit?.excerpt || '').slice(0, 600)}"`;

    try {
      // If we are inside Studio and the user chose a Studio agent + wants a Studio run
      if (agentChoice === 'twin' || !nexus?.state?.draft?.id) {
        const { data } = await base44.functions.invoke('nexusEvolution', {
          action: 'bicameral_twin',
          agent: agentChoice === 'writer' ? 'Scribe' : agentChoice === 'researcher' ? 'Scout' : agentChoice === 'strategist' ? 'Pulse' : 'Fraymus',
          mode: 'critic_creator',
          prompt:
            `${promptTask}\n\n[LIVE CROSS-WINDOW CONTEXT]\n` +
            `- Open Windows: ${windowsList.map((w) => `${w.pageTitle} (${w.route})`).join(', ')}\n` +
            `- Selection (${sel?.pageTitle || 'none'}): ${sel?.text || 'none'}\n` +
            `- Live Edit (${edit?.pageTitle || 'none'}): ${edit?.excerpt || 'none'}`,
          save: false,
          ...(effectiveWorkspaceId ? { workspace_id: effectiveWorkspaceId } : {}),
        });
        if (data?.error) throw new Error(data.error);
        publishCrossTabPatch({
          agentReaction: {
            id: `react_${Date.now()}`,
            agent: agentChoice,
            agentLabel: QUICK_AGENTS.find((a) => a.id === agentChoice)?.name || 'Fraymus Agent',
            sourceWindow: sourceWindowLabel,
            targetText: focusText.slice(0, 280),
            summary: data.synthesis || 'Agent analyzed your cross-window selection & edit.',
            steps: data.implementation || [],
            snippet: data.snippet || '',
            createdAt: Date.now(),
          },
        });
      } else {
        // Inside Studio with a live draft: also dispatch via nexusAgent or Twin
        const { data } = await base44.functions.invoke('nexusAgent', {
          operation: 'run',
          consent: true,
          use_approved_examples: true,
          agent: agentChoice,
          draft_id: nexus.state.draft.id,
          task: promptTask,
          context: {
            ...(nexus.state.context || {}),
            selection: sel || nexus.state.context?.selection || null,
            liveEdit: edit || null,
            windows: windowsList,
            crossTabMemory: crossCtx,
            draft: {
              title: nexus.state.draft.title,
              body: nexus.state.draft.body,
            },
            feed: (nexus.state.feed || []).slice(0, 5),
          },
        });
        if (data?.error) throw new Error(data.error);
        const r = data.result;
        if (nexus.send && r) {
          nexus.send({
            type: 'agent_result',
            agent: agentChoice,
            result: r,
            baseRevision: nexus.state.revision,
            baseDraft: { title: nexus.state.draft.title, body: nexus.state.draft.body },
            task: promptTask,
            provider: 'hosted',
            model: 'automatic',
          });
        }
        publishCrossTabPatch({
          agentReaction: {
            id: `react_${Date.now()}`,
            agent: agentChoice,
            agentLabel: QUICK_AGENTS.find((a) => a.id === agentChoice)?.name || agentChoice,
            sourceWindow: sourceWindowLabel,
            targetText: focusText.slice(0, 280),
            summary: r?.summary || 'Draft proposal & reaction broadcast across workspace.',
            body: r?.kind === 'note' ? r.body : '',
            steps: (r?.ideas || []).map((i) => `${i.title}: ${i.body}`),
            createdAt: Date.now(),
          },
        });
      }
      setCustomInstruction('');
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Agent reaction failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-border bg-card/95 px-4 py-1.5 font-mono text-[11px] text-foreground z-20">
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 text-[10px] font-semibold shrink-0">
            <Radio size={11} className="animate-pulse" />
            CROSS-TAB MEMORY ({windowsList.length} {windowsList.length === 1 ? 'WINDOW' : 'WINDOWS'})
          </span>

          {sel ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary border border-border text-[10px] max-w-xs sm:max-w-md truncate">
              <Braces size={10} className="text-primary shrink-0" />
              <span className="text-muted-foreground">{sel.pageTitle}:</span>
              <strong className="text-foreground truncate">&ldquo;{sel.text.slice(0, 70)}&rdquo;</strong>
              <button
                type="button"
                onClick={clearSelection}
                title="Clear shared selection"
                className="text-muted-foreground hover:text-foreground ml-1"
              >
                <X size={10} />
              </button>
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground hidden md:block min-w-0 truncate">
              Highlight text or edit in any tab/window to share live with all agents
            </span>
          )}

          {edit && (
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary/60 border border-border text-[10px] max-w-xs truncate">
              <Edit3 size={10} className="text-success shrink-0" />
              <span className="text-muted-foreground">Live edit ({edit.pageTitle}):</span>
              <span className="text-foreground truncate">{edit.excerpt || edit.title}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <select
            aria-label="Cross-tab agent"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="h-6 rounded bg-secondary border border-border px-1.5 text-[10px]"
          >
            {QUICK_AGENTS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="default"
            disabled={busy}
            onClick={() => triggerAgentReaction(selectedAgent)}
            className="h-6 px-2.5 text-[10px] font-mono"
          >
            {busy ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            Agent React Now
          </Button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[10px]"
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            <span className="hidden sm:inline">Inspector</span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-border grid grid-cols-1 lg:grid-cols-3 gap-2.5 text-[10px]">
          {/* Column 1: Active Windows & Tabs */}
          <div className="p-2 rounded bg-background border border-border space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <Layers size={11} className="text-primary" /> ACTIVE WORKSPACE WINDOWS ({windowsList.length})
              </span>
              <span>ID: {windowId}</span>
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {windowsList.map((w) => (
                <div
                  key={w.windowId}
                  className="p-1.5 rounded bg-secondary/50 border border-border flex items-center justify-between gap-2"
                >
                  <span className="truncate">
                    <strong className="text-foreground">{w.pageTitle}</strong>{' '}
                    <span className="text-muted-foreground">({w.route})</span>
                    {w.activePanel ? <span className="text-primary ml-1">· [{w.activePanel}]</span> : null}
                  </span>
                  <span className="text-[9px] text-success shrink-0">
                    {w.windowId === windowId ? '● THIS TAB' : '● LIVE'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Shared Selection & Live Edits */}
          <div className="p-2 rounded bg-background border border-border space-y-1.5">
            <div className="text-muted-foreground font-semibold">SHARED SELECTION &amp; LIVE EDIT</div>
            {sel ? (
              <div className="p-1.5 rounded bg-primary/10 border border-primary/30 space-y-0.5">
                <div className="flex justify-between text-[9px] text-primary">
                  <span>Selection from {sel.pageTitle} ({sel.field})</span>
                  <span>chars {sel.start}–{sel.end}</span>
                </div>
                <div className="text-foreground line-clamp-2 whitespace-pre-wrap">{sel.text}</div>
              </div>
            ) : (
              <div className="text-muted-foreground">No active text selection across windows.</div>
            )}
            {edit && (
              <div className="p-1.5 rounded bg-secondary/60 border border-border space-y-0.5">
                <div className="flex justify-between text-[9px] text-success">
                  <span>Latest Edit in {edit.pageTitle} ({edit.field})</span>
                  <span>{new Date(edit.updatedAt).toLocaleTimeString()}</span>
                </div>
                <div className="text-foreground line-clamp-2 whitespace-pre-wrap">
                  {edit.title ? `${edit.title}: ` : ''}
                  {edit.excerpt}
                </div>
              </div>
            )}
            <div className="flex gap-1.5 pt-1">
              <input
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), triggerAgentReaction(selectedAgent))}
                placeholder="Optional custom instruction for agent reaction..."
                className="flex-1 rounded bg-secondary border border-input px-2 py-1 text-[10px]"
              />
              <Button
                size="sm"
                disabled={busy}
                onClick={() => triggerAgentReaction(selectedAgent)}
                className="h-6 px-2 text-[10px]"
              >
                Send
              </Button>
            </div>
            {error && <div className="text-destructive text-[10px]">{error}</div>}
          </div>

          {/* Column 3: Latest Cross-Window Agent Reaction */}
          <div className="p-2 rounded bg-background border border-border space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground font-semibold">
              <span className="text-primary">LATEST CROSS-WINDOW AGENT REACTION</span>
              {reaction && (
                <span className="text-[9px]">
                  {new Date(reaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            {reaction ? (
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                <div className="text-[10px] font-semibold text-foreground">
                  {reaction.agentLabel} → <span className="text-muted-foreground">{reaction.sourceWindow}</span>
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{reaction.summary}</p>
                {Array.isArray(reaction.steps) && reaction.steps.length > 0 && (
                  <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                    {reaction.steps.slice(0, 4).map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">
                Select text or edit in any window and click &ldquo;Agent React Now&rdquo; to broadcast live agent feedback across all open tabs.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}