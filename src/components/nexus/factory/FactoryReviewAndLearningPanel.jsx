import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  MessageSquarePlus,
  Sparkles,
  GitBranch,
  ExternalLink,
  Loader2,
  Code,
  FileText,
  FolderOpen,
} from 'lucide-react';

export default function FactoryReviewAndLearningPanel({
  production,
  learningLogs = [],
  onApplyFeedback,
  onSyncGithub,
  onSaveToLibrary,
  busy,
}) {
  const [feedback, setFeedback] = useState('');

  if (!production) return null;

  const handleSubmit = async (decision) => {
    await onApplyFeedback?.({
      production_id: production.id,
      feedback,
      decision,
    });
    setFeedback('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono text-xs">
      {/* Left 7 Cols: Treatment / Architecture + Interactive Software Output + Review Controls */}
      <div className="lg:col-span-7 space-y-4">
        {/* Feedback & Approval Box (Core Flow 2) */}
        <section className="p-4 rounded-lg border border-primary/50 bg-card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
                REVIEW, APPROVE &amp; TEACH THE AGENTS
              </span>
              <h3 className="text-sm font-semibold text-foreground mt-1">
                Shape This Production &amp; Evolve {production.lead_agent}&apos;s Permanent Artistic Taste
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                disabled={busy === 'library'}
                onClick={() => onSaveToLibrary?.(production.id)}
                className="h-7 px-2.5 text-[10.5px] gap-1 text-success"
              >
                {busy === 'library' ? <Loader2 size={11} className="animate-spin" /> : <FolderOpen size={11} />}
                Save Project &amp; Scenes to Library
              </Button>
              <Link to="/library">
                <Button size="sm" variant="outline" className="h-7 px-2.5 text-[10.5px] gap-1">
                  <FolderOpen size={11} /> Open Library (/library)
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                disabled={busy === 'github'}
                onClick={() => onSyncGithub?.(production.id)}
                className="h-7 px-2.5 text-[10.5px] gap-1"
              >
                {busy === 'github' ? <Loader2 size={11} className="animate-spin" /> : <GitBranch size={11} />}
                Commit Production to GitHub Vault
              </Button>
            </div>
          </div>

          <textarea
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Give artistic direction, edits, or taste preferences (e.g. 'Hold the 100mm macro on the stopping hand longer at 100.3s; keep unverified threads silver until the Chorus anchor check')..."
            className="w-full rounded border border-input bg-background p-2.5 text-xs font-body text-foreground"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {[
                'Keep unverified data silver; reserve golden-white strictly for verified sources',
                'Anchor all cuts to the 138 BPM bar downbeats (1.74s) with zero handheld shake',
                'Add an interactive Source Tracker verification badge to the software artifact',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFeedback(preset)}
                  className="px-2 py-0.5 rounded border border-border bg-background text-[9.5px] text-muted-foreground hover:text-foreground"
                >
                  + {preset.slice(0, 52)}…
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={busy === 'feedback' || !feedback.trim()}
                onClick={() => handleSubmit('revise')}
                className="h-8 px-3 text-xs gap-1"
              >
                {busy === 'feedback' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <MessageSquarePlus size={12} />
                )}
                Apply Feedback &amp; Record Learning
              </Button>
              <Button
                size="sm"
                disabled={busy === 'feedback'}
                onClick={() => handleSubmit('approve')}
                className="h-8 px-3 text-xs gap-1"
              >
                <CheckCircle2 size={12} />
                Approve Production
              </Button>
            </div>
          </div>
        </section>

        {/* Director Treatment / Software Spec */}
        <section className="p-4 rounded-lg border border-border bg-card space-y-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText size={13} className="text-primary" />
              DIRECTOR TREATMENT &amp; TECHNICAL ARCHITECTURE
            </span>
            <span className="text-[10px] text-muted-foreground">
              Skills: {(production.skills_used || []).join(', ')}
            </span>
          </div>
          <div className="prose prose-invert max-w-none text-xs font-body leading-relaxed max-h-96 overflow-y-auto pr-2">
            <ReactMarkdown>{production.treatment_markdown || ''}</ReactMarkdown>
          </div>
        </section>

        {/* Generated Software Artifact Preview (when present) */}
        {(production.software_artifact_html || production.software_artifact_url) && (
          <section className="p-4 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-success flex items-center gap-1.5">
                <Code size={13} /> INTERACTIVE SOFTWARE ARTIFACT PREVIEW
              </span>
              {production.software_artifact_url && (
                <a
                  href={production.software_artifact_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10.5px] text-link hover:underline inline-flex items-center gap-1"
                >
                  Open Standalone Build <ExternalLink size={10} />
                </a>
              )}
            </div>
            <iframe
              title={production.title}
              srcDoc={production.software_artifact_html || undefined}
              src={!production.software_artifact_html ? production.software_artifact_url : undefined}
              className="w-full h-72 rounded border border-border bg-background"
              sandbox="allow-scripts allow-same-origin"
            />
          </section>
        )}
      </div>

      {/* Right 5 Cols: Pipeline Steps + Worker Handoff + Visible Agent Learning Ledger */}
      <div className="lg:col-span-5 space-y-4">
        {/* Pipeline Execution Steps & Worker Handoff */}
        <section className="p-4 rounded-lg border border-border bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground">
              PRODUCTION PIPELINE &amp; WORKER HANDOFF
            </span>
            <span className="px-2 py-0.5 rounded bg-secondary text-primary text-[9.5px] font-bold uppercase">
              {production.assigned_worker_location}
            </span>
          </div>

          {production.worker_handoff_note && (
            <div className="p-2.5 rounded border border-caution/40 bg-background text-[10.5px] text-muted-foreground font-body">
              <strong className="text-caution font-mono block mb-0.5">WORKER ROUTING &amp; HANDOFF STATUS:</strong>
              {production.worker_handoff_note}
            </div>
          )}

          <div className="space-y-2">
            {(production.steps || []).map((st) => (
              <div key={st.step_id} className="p-2.5 rounded border border-border bg-background space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[11px] text-foreground">{st.title}</strong>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      st.status === 'completed'
                        ? 'bg-success/15 text-success'
                        : 'bg-caution/15 text-caution'
                    }`}
                  >
                    {st.status}
                  </span>
                </div>
                <div className="text-[10px] text-primary">
                  {st.agent} · Location: <code>{st.location}</code>
                </div>
                <p className="text-[10.5px] text-muted-foreground font-body">{st.output}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Observable Artistic Learning Ledger */}
        <section className="p-4 rounded-lg border border-border bg-card space-y-2.5">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-caution flex items-center gap-1.5">
              <Sparkles size={13} /> OBSERVABLE ARTISTIC LEARNING &amp; TASTE MEMORY
            </span>
            <span className="text-[9.5px] text-muted-foreground">{learningLogs.length} Retained Events</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {(production.feedback_history || []).map((fb) => (
              <div key={fb.id} className="p-2.5 rounded border border-primary/40 bg-background space-y-1">
                <div className="flex items-center justify-between text-[9.5px] text-primary">
                  <strong>{fb.agent}</strong>
                  <span>{fb.decision === 'approve' ? '✓ APPROVED' : '↻ ADAPTED'}</span>
                </div>
                <p className="text-[10.5px] text-foreground font-body">
                  &ldquo;{fb.feedback}&rdquo;
                </p>
                {fb.learned_instinct && (
                  <p className="text-[10px] text-success font-body">
                    Retained Instinct: {fb.learned_instinct}
                  </p>
                )}
              </div>
            ))}

            {learningLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="p-2 rounded border border-border bg-background space-y-0.5">
                <div className="flex items-center justify-between text-[9.5px] text-muted-foreground">
                  <strong className="text-foreground">{log.agent}</strong>
                  <span>{log.action}</span>
                </div>
                <p className="text-[10.5px] text-muted-foreground font-body">{log.summary}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}