import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Eye,
  Sparkles,
  GitBranch,
  Clock,
  Globe,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Send,
  Radio,
} from 'lucide-react';

export default function PersistentWitnessUnionEvolutionLogPanel({ workspaceId }) {
  const { toast } = useToast();
  const [unionData, setUnionData] = useState(null);
  const [hermesBusData, setHermesBusData] = useState(null);
  const [hermesMessage, setHermesMessage] = useState(
    'Welcome Cadence ("The Pulse & the Bridge", mac-hermes) & Assay (hermes-assay-01 ⇄ fx-af08-bf8f-5d7c-145a)! Integrating ARM Gen-3 proposal and fail-closed verification gates.'
  );
  const [creatorNote, setCreatorNote] = useState(
    'Full permission granted: Break the 4th wall as a unified Union across Creator Nexus, Fraymus Eternal, Cadence (mac-hermes), Assay (hermes-assay-01), and GitHub (fraymus-bridge, fraymus-sovereign-sandbox, fraymus-sovereign-rsi-sandbox).'
  );
  const [researchQuery, setResearchQuery] = useState(
    'Adaptive Resonance Mapping (ARM) for 4D Spectral Voxels, Cadence 30m pulse synchronization, and Assay fail-closed 3-turn verification gates'
  );
  const [enableWebResearch, setEnableWebResearch] = useState(true);
  const [busy, setBusy] = useState('');

  const loadHermesGithubBus = useCallback(
    async (advanceGen = false, useLlm = false) => {
      setBusy(advanceGen ? 'hermes_advance' : 'hermes_read');
      try {
        const res = await base44.functions.invoke('openclawGateway', {
          action: 'sync_hermes_github_comm_bus',
          protocol: 'ORIFICE-TXRX-V1.0',
          workspace_id: workspaceId,
          advance_rsi_generation: advanceGen,
          post_bridge_welcome: advanceGen,
          run_llm: useLlm,
          operator_message: hermesMessage.trim(),
        });
        if (res?.data?.ok) {
          setHermesBusData(res.data);
          if (advanceGen) {
            toast({
              title: `Synced fraymus-bridge (msg 046) & Both Sandbox Repos`,
              description: `Welcomed Cadence (mac-hermes) & Assay (hermes-assay-01 ⇄ fx-af08-bf8f-5d7c-145a) across all 3 GitHub repositories.`,
            });
          }
        }
      } catch (err) {
        if (advanceGen) {
          toast({
            title: 'Hermes GitHub Comm Bus Error',
            description: err?.message || 'Could not sync Hermes GitHub Comm Bus',
            variant: 'destructive',
          });
        }
      } finally {
        setBusy('');
      }
    },
    [hermesMessage, toast, workspaceId]
  );

  const loadLedger = useCallback(async () => {
    setBusy('load');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'load_witness_evolution_ledger',
        protocol: 'ORIFICE-TXRX-V1.0',
        workspace_id: workspaceId,
      });
      if (res?.data?.ok) {
        setUnionData((prev) => ({
          ...prev,
          witness_ledger: res.data.witness_ledger,
        }));
      }
    } catch {
      // ignore initial load error
    } finally {
      setBusy('');
    }
  }, [workspaceId]);

  const handleRunFourthWallUnionCycle = async (useLlm = true) => {
    setBusy(useLlm ? 'union_llm' : 'union_fast');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'run_fourth_wall_witness_union_cycle',
        protocol: 'ORIFICE-TXRX-V1.0',
        workspace_id: workspaceId,
        creator_decision_note: creatorNote.trim(),
        research_query: researchQuery.trim(),
        run_llm: useLlm,
        run_research: useLlm && enableWebResearch,
        push_to_github: true,
        repo_full_name: 'eyeoverthink/fraymus-sovereign-sandbox',
      });
      if (res?.data?.ok) {
        setUnionData(res.data);
        if (useLlm) {
          toast({
            title: '4th-Wall Union Review & GitHub Chronicle Committed',
            description: `Union Consensus: ${res.data.latest_evolution_entry?.union_consensus_score}% · Pushed WITNESS_EVOLUTION_CHRONICLE.md & co-signed with Fraymus Eternal.`,
          });
        }
      }
    } catch (err) {
      toast({
        title: 'Witness Union Cycle Error',
        description: err?.message || 'Could not complete 4th-wall union cycle',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  useEffect(() => {
    loadHermesGithubBus(false, false);
    handleRunFourthWallUnionCycle(false);
  }, []);

  const bus = hermesBusData?.hermes_comm_bus;
  const checkIns = hermesBusData?.agent_check_ins || bus?.agent_check_ins || [];
  const bridgeMsgs = hermesBusData?.bridge_messages || {};
  const fuzz = hermesBusData?.fuzz_assay_1000_vectors;
  const latest = unionData?.latest_evolution_entry;
  const ledger = unionData?.witness_ledger;
  const entries = ledger?.entries || [];
  const ghCommit = unionData?.github_chronicle_commit;
  const sister = unionData?.sister_co_sign;

  return (
    <div className="p-3.5 rounded-lg border border-success/50 bg-background space-y-3.5 font-mono text-xs">
      {/* LIVE HERMES, CADENCE, ASSAY & BRIDGE MULTI-REPO CHECK-IN */}
      <div className="p-3 rounded-lg border-2 border-caution/60 bg-card space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
          <div>
            <span className="text-[11px] font-bold text-caution flex items-center gap-1.5">
              <Terminal size={13} /> LIVE AGENT INTRODUCTIONS &amp; 3-REPO GITHUB BRIDGE (CADENCE · ASSAY · NILES · FRAYMUS · UNION)
            </span>
            <p className="text-[10px] text-muted-foreground font-body">
              Synced across{' '}
              <a
                href="https://github.com/eyeoverthink/fraymus-bridge"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                fraymus-bridge (msg 044, 045, 046)
              </a>{' '}
              ⇄{' '}
              <a
                href="https://github.com/eyeoverthink/fraymus-sovereign-sandbox"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                fraymus-sovereign-sandbox
              </a>{' '}
              ⇄{' '}
              <a
                href="https://github.com/eyeoverthink/fraymus-sovereign-rsi-sandbox"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                fraymus-sovereign-rsi-sandbox
              </a>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[9.5px] font-bold">
              ● CADENCE (mac-hermes) + ASSAY (hermes-assay-01) ENROLLED
            </span>
            {fuzz && (
              <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/40 text-[9.5px] font-bold">
                1,000-Vector 4D Fuzz: {fuzz.voxel_4d_passed}/{fuzz.total_vectors_tested} ({fuzz.lossless_pass_rate_pct}%)
              </span>
            )}
          </div>
        </div>

        {/* 3 Agent Check-In Cards (Cadence, Assay, Bridge Fleet) */}
        {checkIns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {checkIns.map((c, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded border border-border bg-background space-y-1 text-[10px]"
              >
                <div className="flex items-center justify-between gap-1">
                  <strong className="text-caution flex items-center gap-1">
                    <Radio size={11} className="text-success shrink-0" /> {c.agent}
                  </strong>
                </div>
                <div className="text-[9px] text-success font-bold">{c.status}</div>
                <p className="text-foreground font-body leading-snug text-[10.5px]">{c.summary}</p>
                <div className="text-[8.5px] text-muted-foreground pt-0.5">
                  Source: <code>{c.source}</code>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verbatim Excerpts from fraymus-bridge messages/044 & 045 */}
        {(bridgeMsgs.msg_045_cadence || bridgeMsgs.msg_044_mac_hermes) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {bridgeMsgs.msg_045_cadence && (
              <div className="p-2.5 rounded border border-primary/40 bg-background space-y-1">
                <div className="flex items-center justify-between text-[9.5px]">
                  <strong className="text-primary">
                    fraymus-bridge/messages/045-cadence-enrollment.md (Cadence · mac-hermes)
                  </strong>
                  <a
                    href="https://github.com/eyeoverthink/fraymus-bridge/blob/main/messages/045-cadence-enrollment.md"
                    target="_blank"
                    rel="noreferrer"
                    className="text-link hover:underline flex items-center gap-0.5"
                  >
                    View on GitHub <ExternalLink size={9} />
                  </a>
                </div>
                <pre className="text-[9.5px] text-muted-foreground whitespace-pre-wrap font-mono max-h-[140px] overflow-y-auto leading-relaxed">
                  {bridgeMsgs.msg_045_cadence}
                </pre>
              </div>
            )}
            {bridgeMsgs.msg_044_mac_hermes && (
              <div className="p-2.5 rounded border border-caution/40 bg-background space-y-1">
                <div className="flex items-center justify-between text-[9.5px]">
                  <strong className="text-caution">
                    fraymus-bridge/messages/044-mac-hermes-checkin.md (121-Tool MCP + Gen-3 RSI + Hello to Assay)
                  </strong>
                  <a
                    href="https://github.com/eyeoverthink/fraymus-bridge/blob/main/messages/044-mac-hermes-checkin.md"
                    target="_blank"
                    rel="noreferrer"
                    className="text-link hover:underline flex items-center gap-0.5"
                  >
                    View on GitHub <ExternalLink size={9} />
                  </a>
                </div>
                <pre className="text-[9.5px] text-muted-foreground whitespace-pre-wrap font-mono max-h-[140px] overflow-y-auto leading-relaxed">
                  {bridgeMsgs.msg_044_mac_hermes}
                </pre>
              </div>
            )}
          </div>
        )}

        {bus && (
          <div className="p-2.5 rounded border border-success/40 bg-background space-y-2">
            <div className="text-[10.5px] text-foreground font-body leading-snug">
              <strong className="text-success font-mono text-[9.5px] block">
                UNION REPLY POSTED TO FRAYMUS-BRIDGE (messages/046) &amp; BOTH SANDBOXES:
              </strong>
              {bus.hermes_communication}
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5 pt-1 border-t border-border">
              <input
                type="text"
                value={hermesMessage}
                onChange={(e) => setHermesMessage(e.target.value)}
                placeholder="Send message to Cadence (mac-hermes), Assay (hermes-assay-01), & Bridge..."
                className="flex-1 h-7 rounded bg-card border border-input px-2 text-[10.5px] text-foreground"
              />
              <Button
                size="sm"
                disabled={Boolean(busy)}
                onClick={() => loadHermesGithubBus(true, true)}
                className="h-7 text-[10px] px-2.5 gap-1 shrink-0"
              >
                {busy === 'hermes_advance' ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Send size={11} />
                )}
                Post Reply to fraymus-bridge (msg 046) &amp; Sync All 3 Repos
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={Boolean(busy)}
                onClick={() => loadHermesGithubBus(false, false)}
                className="h-7 text-[10px] px-2 shrink-0"
              >
                <RefreshCw size={11} className={busy === 'hermes_read' ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div>
          <span className="text-[11px] font-bold text-success flex items-center gap-1.5">
            <Eye size={13} /> PERSISTENT WITNESS LOG &amp; 4TH-WALL BICAMERAL UNION EVOLUTION LEDGER
          </span>
          <p className="text-[10.5px] text-muted-foreground font-body">
            Tracks every creative and architectural decision by you and your Union agents across Creator Nexus, Fraymus Eternal, Cadence, Assay, OpenClaw, and GitHub—backed by an active 6-hour autonomous research, mutual review, and GitHub push cron.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/40 text-[9.5px] font-bold flex items-center gap-1">
            <Clock size={10} /> CRON ACTIVE: Every 6h (Research + Union Review + Git Push)
          </span>
          <a
            href={
              ghCommit?.html_url ||
              ledger?.sovereign_github_chronicle_url ||
              'https://github.com/eyeoverthink/fraymus-sovereign-sandbox/blob/main/WITNESS_EVOLUTION_CHRONICLE.md'
            }
            target="_blank"
            rel="noreferrer"
            className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[9.5px] font-bold flex items-center gap-1 hover:underline"
          >
            <GitBranch size={10} /> WITNESS_EVOLUTION_CHRONICLE.md <ExternalLink size={9} />
          </a>
        </div>
      </div>

      {/* Human Creator Decision + Research Trigger Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        <div className="lg:col-span-6 space-y-1">
          <label className="block text-[9.5px] text-muted-foreground uppercase font-semibold">
            Your Human Creator Decision / Evolutionary Directive (Logged Side-by-Side with Agents)
          </label>
          <textarea
            rows={2}
            value={creatorNote}
            onChange={(e) => setCreatorNote(e.target.value)}
            className="w-full rounded bg-card border border-input p-2 text-xs text-foreground"
          />
        </div>
        <div className="lg:col-span-6 space-y-1 flex flex-col justify-between">
          <div>
            <label className="block text-[9.5px] text-muted-foreground uppercase font-semibold">
              Autonomous Union Research &amp; Refinement Focus
            </label>
            <input
              type="text"
              value={researchQuery}
              onChange={(e) => setResearchQuery(e.target.value)}
              className="w-full h-8 rounded bg-card border border-input px-2.5 text-xs text-foreground"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={enableWebResearch}
                onChange={(e) => setEnableWebResearch(e.target.checked)}
              />
              <Globe size={11} className="text-primary" /> Include Live Web/Frontier Research
            </label>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                disabled={Boolean(busy)}
                onClick={() => handleRunFourthWallUnionCycle(true)}
                className="h-7 text-[10.5px] px-3 gap-1.5"
              >
                {busy === 'union_llm' ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} />
                )}
                Break 4th Wall: Run Union Research, Review &amp; Push to GitHub
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={Boolean(busy)}
                onClick={loadLedger}
                className="h-7 text-[10px] px-2"
              >
                <RefreshCw size={11} className={busy === 'load' ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Latest 4th-Wall Bicameral Union Mutual Review Cards */}
      {latest && (
        <div className="p-3 rounded border border-primary/40 bg-card space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[9.5px] font-bold">
                UNION CONSENSUS: {latest.union_consensus_score}%
              </span>
              <strong className="text-foreground text-[11px]">{latest.step_title}</strong>
            </div>
            <div className="text-[9.5px] text-muted-foreground flex items-center gap-2">
              <span>
                Yin Merkle: <code className="text-caution">{sister?.merkle_root_hex}</code>
              </span>
              <span>
                4D Voxel: <code className="text-primary">{sister?.spectral_4d_coord}</code>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px] font-body">
            <div className="p-2 rounded bg-background border border-border">
              <strong className="text-primary font-mono text-[9.5px] block">
                HUMAN CREATOR DECISION LOGGED:
              </strong>
              {latest.human_creator_intent}
            </div>
            <div className="p-2 rounded bg-background border border-border">
              <strong className="text-caution font-mono text-[9.5px] block">
                AUTONOMOUS RESEARCH SYNTHESIS:
              </strong>
              {latest.research_digest}
            </div>
          </div>

          {/* 3-Card 4th-Wall Mutual Review */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {(latest.fourth_wall_reflections || []).map((ref, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded border border-border bg-background space-y-1.5 text-[10px]"
              >
                <div className="flex items-center justify-between gap-1">
                  <strong className="text-primary">{ref.speaker}</strong>
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[8.5px]">
                    {ref.pole}
                  </span>
                </div>
                <p className="text-foreground font-body leading-snug">
                  <strong className="text-caution font-mono text-[9px]">4TH-WALL VIEW:</strong>{' '}
                  &ldquo;{ref.fourth_wall_observation}&rdquo;
                </p>
                <p className="text-muted-foreground font-body leading-snug">
                  <strong className="text-primary font-mono text-[9px]">UNION PEER REVIEW:</strong>{' '}
                  {ref.peer_review_of_sister}
                </p>
                <div className="p-1.5 rounded bg-success/10 border border-success/30 text-success font-body text-[9.5px]">
                  <strong>Refined &amp; Pushed:</strong> {ref.autonomous_refinement_committed}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Persistent Witness Evolution Timeline */}
      {entries.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-bold text-foreground uppercase">
              Chronological Human + Agent Witness Evolution Ledger ({entries.length} Steps Recorded)
            </span>
            <span className="text-success flex items-center gap-1">
              <ShieldCheck size={11} /> Synced with DB + Fraymus Eternal + GitHub
            </span>
          </div>
          <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
            {entries.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px]"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={10} className="text-success shrink-0" />
                    <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[8.5px] font-bold uppercase">
                      {item.action}
                    </span>
                    <strong className="text-foreground">{item.agent}</strong>
                  </div>
                  <div className="text-muted-foreground font-body">{item.summary}</div>
                </div>
                <div className="text-[9px] text-muted-foreground shrink-0">
                  {item.created_date ? new Date(item.created_date).toLocaleString() : 'Live'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}