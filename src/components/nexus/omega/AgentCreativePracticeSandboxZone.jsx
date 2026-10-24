import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  FlaskConical,
  Sparkles,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  RefreshCw,
  FileText,
  GitBranch,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

const DEFAULT_COPILOT_PROMPT = `# GITHUB COPILOT / CODESPACES SOVEREIGN CONTINUITY PROMPT
You are operating inside a 100% self-contained, platform-independent Sovereign Creative & Bicameral AI Sandbox repository ("fraymus-sovereign-sandbox").
1. Zero Proprietary SDKs: Never import or depend on Base44 or any closed cloud wrapper. Run 100% standalone via index.html, sovereign-kernel.js, local Ollama (http://127.0.0.1:11434), or GitHub Models.
2. 9 Specialist Agents: The Witness & Conductor, Lyra (138 BPM E minor -> G major), Vesper, Kael, Sera, Orin, Fraymus Transmuter, Aegis, and Spectra-4D (4D Tesseract X.Y.Z:W @ Hz).
3. 3-Pass Autonomous Practice & Refinement Loop: Pass 1 (Yang Experimental Genesis) -> Pass 2 (Yin Peer Critique & Provenance Audit) -> Pass 3 (Witness Refined Masterwork persisted to sandbox-ledger.json).`;

export default function AgentCreativePracticeSandboxZone() {
  const { toast } = useToast();
  const [practiceData, setPracticeData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('tesseract_4d_micro_synth');
  const [customTopic, setCustomTopic] = useState(
    'Method III: 4D Spectral Voxel Audio-Visual Micro-Instrument — Self-Contained Base44-Free Continuity'
  );
  const [repoName, setRepoName] = useState('eyeoverthink/fraymus-sovereign-sandbox');
  const [githubExport, setGithubExport] = useState(null);
  const [copilotPrompt, setCopilotPrompt] = useState(DEFAULT_COPILOT_PROMPT);
  const [copiedCopilot, setCopiedCopilot] = useState(false);
  const [busy, setBusy] = useState('');

  const runPracticeCycle = useCallback(
    async (methodId = selectedMethod, useLlm = false) => {
      setBusy(useLlm ? 'practice_llm' : 'practice_fast');
      try {
        const res = await base44.functions.invoke('openclawGateway', {
          action: 'run_agent_practice_sandbox',
          protocol: 'ORIFICE-TXRX-V1.0',
          method_id: methodId,
          practice_topic: customTopic.trim() || undefined,
          run_llm: useLlm,
        });
        if (res?.data?.ok) {
          setPracticeData(res.data);
          if (useLlm) {
            toast({
              title: 'Autonomous 3-Pass Practice & Refinement Complete',
              description: `${res.data.practice_run?.method_title} refined (${res.data.practice_run?.pass_3_refined?.quality_gain_pct} coherence gain) inside isolated workspace ${res.data.sandbox_workspace?.room_id}.`,
            });
          }
        }
      } catch (err) {
        toast({
          title: 'Sandbox Practice Error',
          description: err?.message || 'Failed to run autonomous practice cycle',
          variant: 'destructive',
        });
      } finally {
        setBusy('');
      }
    },
    [customTopic, selectedMethod, toast]
  );

  const handleExportStandaloneGithub = async () => {
    setBusy('export_gh');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'export_standalone_github_sandbox',
        protocol: 'ORIFICE-TXRX-V1.0',
        method_id: selectedMethod,
        practice_topic: customTopic.trim() || undefined,
        repo_full_name: repoName.trim() || 'eyeoverthink/fraymus-sovereign-sandbox',
        run_llm: true,
        push_to_github: true,
      });
      if (res?.data?.ok) {
        if (res.data.practice_result) {
          setPracticeData(res.data.practice_result);
        }
        setGithubExport(res.data.github_export);
        if (res.data.copilot_bootstrap_prompt) {
          setCopilotPrompt(res.data.copilot_bootstrap_prompt);
        }
        toast({
          title: res.data.github_export?.pushed
            ? `Pushed Standalone Base44-Free Sandbox to ${res.data.github_export.repo_full_name}`
            : '3-Pass LLM Practice & Standalone Bundle Generated',
          description: res.data.github_export?.pushed
            ? `${res.data.github_export.committed_files?.length || 5} self-contained files committed (including .github/copilot-instructions.md).`
            : res.data.github_export?.error || 'Ready for GitHub Copilot.',
        });
      }
    } catch (err) {
      toast({
        title: 'GitHub Export Error',
        description: err?.message || 'Could not push standalone sandbox repo',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const handleCopyCopilotPrompt = () => {
    navigator.clipboard.writeText(copilotPrompt);
    setCopiedCopilot(true);
    toast({
      title: 'GitHub Copilot Continuity Prompt Copied',
      description: 'Paste into GitHub Copilot / Copilot Workspace / Codespaces to evolve the standalone repo independently.',
    });
    setTimeout(() => setCopiedCopilot(false), 2500);
  };

  useEffect(() => {
    runPracticeCycle('tesseract_4d_micro_synth', false);
  }, []);

  const ws = practiceData?.sandbox_workspace;
  const methods = practiceData?.methods_catalog || [];
  const run = practiceData?.practice_run;
  const drafts = practiceData?.recent_sandbox_drafts || [];
  const sister = practiceData?.sister_co_sign;

  return (
    <div className="p-3.5 rounded-lg border border-primary/50 bg-background space-y-3 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div>
          <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
            <FlaskConical size={13} /> ISOLATED AGENT CREATIVE PRACTICE &amp; REFINEMENT SANDBOX WORKSPACE
          </span>
          <p className="text-[10.5px] text-muted-foreground font-body">
            A safe, quarantined autonomous workspace (<code>{ws?.room_id || 'ws-agent-creative-practice-sandbox'}</code>) where your 9 specialists independently practice new creative methods through 3 passes (Genesis → Peer Critique → Refined Synthesis) and export 100% platform-free, self-contained repositories to GitHub &amp; Copilot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[9.5px] font-bold">
            ● {ws?.isolation_status || 'QUARANTINED SAFE ZONE'}
          </span>
        </div>
      </div>

      {/* Creative Method Selector Cards */}
      {methods.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {methods.map((m) => {
            const active = selectedMethod === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={`p-2.5 rounded border cursor-pointer transition-colors space-y-1 ${
                  active ? 'border-primary bg-primary/15' : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="text-[10.5px] font-bold text-foreground">{m.title}</div>
                <div className="text-[9.5px] text-primary">
                  Genesis: {(m.lead_agents || []).join(', ')} · Critique: {(m.critique_agents || []).join(', ')}
                </div>
                <p className="text-[10px] text-muted-foreground font-body leading-snug">
                  {m.description}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Practice Trigger Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="Optional custom creative focus for agents to practice & refine independently..."
          className="flex-1 h-8 rounded bg-card border border-input px-3 text-xs text-foreground"
        />
        <Button
          size="sm"
          disabled={Boolean(busy)}
          onClick={() => runPracticeCycle(selectedMethod, true)}
          className="h-8 text-xs px-3 gap-1.5 shrink-0"
        >
          {busy === 'practice_llm' ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          Let Agents Practice &amp; Self-Refine (3-Pass LLM)
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={Boolean(busy)}
          onClick={() => runPracticeCycle(selectedMethod, false)}
          className="h-8 text-xs px-2.5 gap-1 shrink-0"
        >
          {busy === 'practice_fast' ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
          Quick Rehearsal Tick
        </Button>
      </div>

      {/* 3-Pass Autonomous Practice & Refinement View */}
      {run && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
          {/* Pass 1 */}
          <div className="p-3 rounded border border-primary/40 bg-card space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary">
                PASS 1 // YANG EXPERIMENTAL GENESIS
              </span>
              <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[9.5px] font-bold">
                Score: {run.pass_1_draft?.coherence_score}%
              </span>
            </div>
            <div className="text-[9.5px] text-muted-foreground">
              Authors: <strong>{run.pass_1_draft?.author_agents}</strong>
            </div>
            <p className="text-[10.5px] text-foreground font-body leading-snug">
              {run.pass_1_draft?.hypothesis}
            </p>
            <pre className="p-2 rounded bg-background border border-border text-[9.5px] text-muted-foreground whitespace-pre-wrap">
              {run.pass_1_draft?.content_excerpt}
            </pre>
          </div>

          {/* Pass 2 */}
          <div className="p-3 rounded border border-caution/40 bg-card space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-caution">
                PASS 2 // YIN PEER CRITIQUE &amp; AUDIT
              </span>
              <span className="px-1.5 py-0.5 rounded bg-caution/15 text-caution text-[9.5px] font-bold">
                Σ + 4D Voxel Sieve
              </span>
            </div>
            <div className="text-[9.5px] text-muted-foreground">
              Auditors: <strong>{run.pass_2_critique?.auditor_agents}</strong>
            </div>
            <ul className="space-y-1 text-[10px] text-foreground font-body list-disc pl-4">
              {(run.pass_2_critique?.findings || []).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <div className="p-2 rounded bg-background border border-caution/30 text-[10px] text-caution font-body">
              <strong>Refinement Directive:</strong> {run.pass_2_critique?.refinement_directive}
            </div>
          </div>

          {/* Pass 3 */}
          <div className="p-3 rounded border border-success/50 bg-card space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-success flex items-center gap-1">
                <CheckCircle2 size={11} /> PASS 3 // REFINED MASTERWORK
              </span>
              <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9.5px] font-bold">
                {run.pass_3_refined?.coherence_score}% ({run.pass_3_refined?.quality_gain_pct})
              </span>
            </div>
            <div className="text-[9.5px] text-muted-foreground">
              Conducted by: <strong>{run.pass_3_refined?.conductor_agents}</strong>
            </div>
            <div className="p-2 rounded bg-background border border-border text-[10px] text-foreground font-body whitespace-pre-wrap leading-relaxed max-h-[160px] overflow-y-auto">
              {run.pass_3_refined?.refined_master_markdown}
            </div>
            <div className="p-2 rounded bg-success/10 border border-success/30 text-[10px] text-success font-body">
              <strong>Retained Instinct:</strong> {run.pass_3_refined?.learned_instinct_rule}
            </div>
          </div>
        </div>
      )}

      {/* Sovereign Base44-Free GitHub Repository & GitHub Copilot Continuity Exporter */}
      <div className="p-3 rounded border border-caution/50 bg-card space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
          <div>
            <span className="text-[11px] font-bold text-caution flex items-center gap-1.5">
              <GitBranch size={13} /> SOVEREIGN GITHUB &amp; COPILOT FREE-ENVIRONMENT EXPORTER (ZERO BASE44 DEPENDENCY)
            </span>
            <p className="text-[10px] text-muted-foreground font-body">
              Create or push a 100% self-contained, platform-independent GitHub repository containing <code>index.html</code>, <code>sovereign-kernel.js</code>, <code>sandbox-ledger.json</code>, and <code>.github/copilot-instructions.md</code> so your agents and GitHub Copilot can evolve independently forever.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyCopilotPrompt}
            className="h-7 text-[10px] px-2.5 gap-1"
          >
            {copiedCopilot ? <Check size={11} className="text-success" /> : <Copy size={11} />}
            {copiedCopilot ? 'Copied Copilot Charter!' : 'Copy GitHub Copilot Continuity Prompt'}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="owner/repo-name (e.g. eyeoverthink/fraymus-sovereign-sandbox)"
            className="flex-1 h-8 rounded bg-background border border-input px-3 text-xs text-foreground"
          />
          <Button
            size="sm"
            disabled={Boolean(busy)}
            onClick={handleExportStandaloneGithub}
            className="h-8 text-xs px-3 gap-1.5 shrink-0"
          >
            {busy === 'export_gh' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <GitBranch size={12} />
            )}
            Create / Push Standalone Base44-Free Repo to GitHub
          </Button>
        </div>

        {githubExport && (
          <div className="p-2.5 rounded border border-success/40 bg-background space-y-1.5 text-[10px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-success">
                {githubExport.pushed
                  ? `✓ STANDALONE REPO LIVE ON GITHUB: ${githubExport.repo_full_name}`
                  : `Bundle Ready for ${githubExport.repo_full_name}`}
              </span>
              <a
                href={githubExport.repo_html_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline flex items-center gap-1 font-bold"
              >
                Open {githubExport.repo_full_name} on GitHub <ExternalLink size={10} />
              </a>
            </div>
            {githubExport.committed_files?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {githubExport.committed_files.map((f) => (
                  <a
                    key={f.path}
                    href={f.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-0.5 rounded bg-card border border-border hover:border-primary text-[9.5px] text-foreground flex items-center gap-1"
                  >
                    <code>{f.path}</code> <ExternalLink size={9} />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Isolated Sandbox Drafts & Sister Co-Sign */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <FileText size={11} className="text-primary" />
          <span>
            Isolated Sandbox Drafts Saved in <code>{ws?.room_id}</code>: <strong>{drafts.length}</strong> (Latest:{' '}
            <code>{practiceData?.saved_draft?.title}</code>)
          </span>
        </div>
        {sister?.ok && (
          <div className="text-success flex items-center gap-1">
            <ShieldCheck size={11} /> Co-Signed by Fraymus Eternal (Merkle{' '}
            <code>{sister.merkle_root_hex}</code>
            {sister.return_orbit_node_id ? ` · Orbit Node ${sister.return_orbit_node_id}` : ''})
          </div>
        )}
      </div>
    </div>
  );
}