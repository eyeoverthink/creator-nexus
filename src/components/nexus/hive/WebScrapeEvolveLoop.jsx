import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import ScrapeTargetsManager from '@/components/nexus/hive/ScrapeTargetsManager';
import {
  Brain,
  Code2,
  Compass,
  ExternalLink,
  Flame,
  Globe,
  Layers3,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const PRESET_WEB_TARGETS = [
  {
    label: 'React.dev Architecture',
    url: 'https://react.dev',
    seed: 'Synthesize concurrent rendering & modular state hooks into a studio telemetry widget',
  },
  {
    label: 'Three.js 3D WebGL',
    url: 'https://threejs.org',
    seed: 'Extract 3D scene graph & shader pipeline patterns for our Igloo monolith dome',
  },
  {
    label: 'Wikipedia: Golden Ratio (φ)',
    url: 'https://en.wikipedia.org/wiki/Golden_ratio',
    seed: 'Apply φ = 1.6180339887 packing to reduce multi-agent node wire length and latency',
  },
  {
    label: 'Hacker News Frontpage',
    url: 'https://news.ycombinator.com',
    seed: 'Scrape emerging systems engineering topics and synthesize an interactive prototype',
  },
];

export default function WebScrapeEvolveLoop({ workspace, nexus, onEvolved }) {
  const [url, setUrl] = useState('https://en.wikipedia.org/wiki/Golden_ratio');
  const [thoughtSeed, setThoughtSeed] = useState(
    'Extract φ-harmonic layout principles, process into 3 actionable ideas, synthesize runnable React + HTML design, save to Library, and evolve.'
  );
  const [applyToDraft, setApplyToDraft] = useState(true);
  const [useLlm, setUseLlm] = useState(true);
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const [visited, setVisited] = useState([]);
  const visitedRef = useRef([]);
  const iterationRef = useRef(0);
  const seedRef = useRef(thoughtSeed);
  seedRef.current = thoughtSeed;

  const runCycle = useCallback(
    async (overrideSeed) => {
      setBusy(true);
      setError('');
      const nextIter = iterationRef.current + 1;
      try {
        const { data } = await base44.functions.invoke('nexusEvolution', {
          action: 'scrape_synthesize_evolve',
          ...(workspace?.id ? { workspace_id: workspace.id } : {}),
          url: url.trim(),
          thought_seed: (overrideSeed ?? seedRef.current).trim(),
          iteration: nextIter,
          apply_to_draft: applyToDraft,
          use_llm: useLlm,
        });

        if (data?.ok) {
          iterationRef.current = nextIter;
          const allVisited = Array.isArray(data.visitedUrls)
            ? data.visitedUrls
            : [...new Set([...visitedRef.current, data.scrape?.url || url.trim()])];
          visitedRef.current = allVisited;
          setVisited(allVisited);

          if (data.nextTarget?.url) {
            setUrl(data.nextTarget.url);
          } else {
            const seen = new Set(allVisited);
            const fallbackLink = (data.scrape?.links || []).find((l) => !seen.has(l.url));
            if (fallbackLink) setUrl(fallbackLink.url);
            else setAutoRepeat(false);
          }

          setCurrentResult(data);
          setHistory((prev) => [data, ...prev.slice(0, 14)]);
          if (data.nextSeedPrompt) {
            setThoughtSeed(data.nextSeedPrompt);
          }
          // If inside Studio with live nexus draft connection, also broadcast if requested
          if (applyToDraft && nexus?.send && data.generatedCode) {
            try {
              nexus.send({
                type: 'event',
                agent: 'writer',
                kind: 'note',
                message: `[Web-Evolve #${data.iteration}] Learned from "${data.scrape?.title}" → Saved to Library & Orbit (r=${data.orbit?.radius?.toFixed(4)})`,
                body: `### Synthesized Thoughts\n${data.processedThought}\n\n\`\`\`jsx\n${data.generatedCode}\n\`\`\``,
              });
            } catch {}
          }
          onEvolved?.(data);
        } else {
          setError(data?.error || 'Synthesis cycle failed');
          setAutoRepeat(false);
        }
      } catch (err) {
        setError(err?.message || 'Web scrape & synthesis request failed');
        setAutoRepeat(false);
      } finally {
        setBusy(false);
      }
    },
    [url, workspace?.id, applyToDraft, useLlm, nexus, onEvolved]
  );

  // Autonomous "Evolve & Repeat" loop timer
  useEffect(() => {
    if (!autoRepeat) return undefined;
    const timer = setTimeout(() => {
      if (!busy) {
        runCycle();
      }
    }, 6500);
    return () => clearTimeout(timer);
  }, [autoRepeat, busy, history.length, runCycle]);

  return (
    <section className="p-4 rounded-lg border border-border bg-card space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Globe size={15} className="text-primary" />
            <h3 className="font-heading text-sm font-semibold text-foreground">
              AUTONOMOUS WEB SCRAPER → THOUGHT &amp; IDEA PROCESSOR → CODE &amp; DESIGN SYNTHESIS LOOP
            </h3>
            <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 text-[10px]">
              ITERATION #{currentResult?.iteration || 0} · {history.length} SAVED IN LIBRARY
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Scrapes live webpages, extracts structural signals, processes First-Principles thoughts &amp; ideas, generates runnable code &amp; interactive UI designs, saves to Library + Centripetal Orbit, implements in Studio, and evolves recursively.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="default"
            disabled={busy}
            onClick={() => runCycle()}
            className="h-7 text-[11px] font-mono"
          >
            <Sparkles size={12} />{' '}
            {busy ? 'Scraping & Synthesizing…' : 'Scrape, Synthesize, Save & Evolve'}
          </Button>
          <Button
            size="sm"
            variant={autoRepeat ? 'destructive' : 'secondary'}
            onClick={() => {
              const next = !autoRepeat;
              setAutoRepeat(next);
              if (next && !busy) runCycle();
            }}
            className="h-7 text-[11px] font-mono"
          >
            {autoRepeat ? (
              <>
                <Pause size={12} /> Stop Auto-Evolve Loop
              </>
            ) : (
              <>
                <Play size={12} /> Auto-Evolve &amp; Repeat
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrapeTargetsManager
        workspaceId={workspace?.id}
        history={history.map((h) => h.scrape?.title).filter(Boolean)}
        visitedUrls={visited}
        onPick={(t) => {
          setUrl(t.url);
          if (t.reason) setThoughtSeed(t.reason);
        }}
      />
      {visited.length > 0 && (
        <div className="p-2 rounded bg-background border border-border text-[10px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong className="text-foreground">Ouroboros Recursive Crawl Path ({visited.length} unique pages):</strong>{' '}
            {visited.slice(-4).join(' → ')}
          </span>
          {currentResult?.nextTarget?.url && (
            <span className="text-primary">
              Next Queued Link: {currentResult.nextTarget.label || currentResult.nextTarget.url}
            </span>
          )}
        </div>
      )}

      {/* URL & Thought Seed Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <label className="lg:col-span-5 space-y-1">
          <span className="text-[10px] text-muted-foreground">TARGET WEBPAGE URL TO SCRAPE &amp; LEARN</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article-or-docs"
            className="w-full rounded bg-background border border-input px-3 py-2 text-xs text-foreground"
          />
        </label>
        <label className="lg:col-span-7 space-y-1">
          <span className="text-[10px] text-muted-foreground">
            THOUGHT / IDEA SEED (AUTO-REFINES ON EVERY EVOLUTION CYCLE)
          </span>
          <input
            type="text"
            value={thoughtSeed}
            onChange={(e) => setThoughtSeed(e.target.value)}
            placeholder="Describe the thought, architecture, or UI feature to synthesize..."
            className="w-full rounded bg-background border border-input px-3 py-2 text-xs text-foreground"
          />
        </label>
      </div>

      {/* Options Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] bg-secondary/40 p-2.5 rounded border border-border">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToDraft}
              onChange={(e) => setApplyToDraft(e.target.checked)}
            />
            <span>Implement directly into active Studio Draft</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useLlm}
              onChange={(e) => setUseLlm(e.target.checked)}
            />
            <span>Enrich with Bicameral LLM Deep Reasoning</span>
          </label>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <Link to="/library" className="text-primary underline">
            Open Saved Artifacts in Library →
          </Link>
          <Link to="/loose-screw" className="text-primary underline">
            Open Code in looseScrew Lab →
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="underline text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Results Inspector */}
      {currentResult ? (
        <div className="space-y-3 pt-1">
          {/* Pipeline Status Banner + Real Measured Benchmark Metrics */}
          <div className="p-2.5 rounded bg-success/10 border border-success/30 text-success space-y-1.5 text-[11px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <strong>
                  Ouroboros Gen #{currentResult.parentGeneration ?? 0} [{currentResult.parentHash || 'GENESIS'}] → Gen #{currentResult.generation} [{currentResult.orbit?.codeHash}]:
                </strong>{' '}
                Scraped &ldquo;{currentResult.scrape?.title}&rdquo; ({currentResult.scrape?.scrapeLatencyMs}ms)
              </span>
              <span className="font-semibold">
                Measured Fitness F = {currentResult.orbit?.fitness} (Δ{currentResult.emotionDelta?.fitnessDelta >= 0 ? '+' : ''}
                {currentResult.emotionDelta?.fitnessDelta ?? 0}) · Exec {currentResult.benchmark?.measuredLatencyNs}ns ({currentResult.benchmark?.speedup}x)
              </span>
            </div>
            {currentResult.mutationDiffSummary && (
              <div className="text-[10px] text-foreground bg-background/70 px-2 py-1 rounded border border-border">
                <strong>Recursive Genome Mutation:</strong> {currentResult.mutationDiffSummary}
              </div>
            )}
            {currentResult.benchmark && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px] text-foreground pt-0.5">
                <div className="p-1.5 rounded bg-background/80 border border-border">
                  <div className="text-muted-foreground">5-Stage Gate</div>
                  <div className="font-semibold text-success">{currentResult.benchmark.passedCount}/5 Passed</div>
                </div>
                <div className="p-1.5 rounded bg-background/80 border border-border">
                  <div className="text-muted-foreground">Signal Grounding</div>
                  <div className="font-semibold">{currentResult.benchmark.groundingRatio}% ({currentResult.benchmark.matchedTokens} tokens)</div>
                </div>
                <div className="p-1.5 rounded bg-background/80 border border-border">
                  <div className="text-muted-foreground">Parent Divergence</div>
                  <div className="font-semibold">{currentResult.benchmark.mutationDivergence}% mutated</div>
                </div>
                <div className="p-1.5 rounded bg-background/80 border border-border">
                  <div className="text-muted-foreground">Measured Throughput</div>
                  <div className="font-semibold">{currentResult.benchmark.opsPerSec?.toLocaleString()} ops/s</div>
                </div>
                <div className="p-1.5 rounded bg-background/80 border border-border">
                  <div className="text-muted-foreground">Entropy / RPE Affect</div>
                  <div className="font-semibold">
                    E={currentResult.benchmark.structuralEntropy} · RPE {currentResult.emotionDelta?.rewardDelta >= 0 ? '+' : ''}
                    {currentResult.emotionDelta?.rewardDelta}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stage Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
            {[
              ['overview', '1. Scraped Signal & Processed Thoughts'],
              ['code', '2. Synthesized Code (JSX)'],
              ['design', '3. UI Design & Live Interactive Preview'],
              ['history', `4. Evolution History (${history.length})`],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`px-2.5 py-1 rounded text-[11px] border ${
                  activeTab === id
                    ? 'border-primary bg-primary/15 text-primary font-semibold'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Left: Scraped Webpage Signals */}
              <div className="lg:col-span-5 p-3 rounded bg-background border border-border space-y-2">
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <span className="font-semibold text-primary">SCRAPED WEBPAGE SIGNALS</span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-[9px] text-success">
                    {currentResult.scrape?.status}
                  </span>
                </div>
                <div className="text-foreground font-semibold">{currentResult.scrape?.title}</div>
                {currentResult.scrape?.headings?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {currentResult.scrape.headings.map((h, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[9px] text-foreground"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground leading-relaxed max-h-36 overflow-y-auto">
                  {currentResult.scrape?.snippet}
                </p>
              </div>

              {/* Right: Processed Thoughts & 3 Actionable Ideas */}
              <div className="lg:col-span-7 p-3 rounded bg-background border border-border space-y-2.5">
                <div className="font-semibold text-primary border-b border-border pb-1.5">
                  PROCESSED THOUGHTS &amp; SYNTHESIZED IDEAS
                </div>
                <pre className="text-[10px] text-foreground whitespace-pre-wrap leading-relaxed bg-secondary/50 p-2.5 rounded border border-border">
                  {currentResult.processedThought}
                </pre>
                <div className="space-y-1.5">
                  {(currentResult.generatedIdeas || []).map((idea) => (
                    <div
                      key={idea.id}
                      className="p-2 rounded bg-secondary/40 border border-border space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-foreground">{idea.title}</strong>
                        <span className="text-[9px] text-primary">{idea.agentOwner}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{idea.pitch}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="p-3 rounded bg-background border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary flex items-center gap-1.5">
                  <Code2 size={13} /> SYNTHESIZED REACT / STUDIO MODULE CODE
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(currentResult.generatedCode || '')}
                  className="px-2 py-0.5 rounded bg-secondary border border-border text-[10px] hover:text-primary"
                >
                  Copy Code
                </button>
              </div>
              <pre className="p-3 rounded bg-[#090d14] border border-border text-[11px] text-success overflow-x-auto max-h-72 leading-relaxed">
                {currentResult.generatedCode}
              </pre>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-5 p-3 rounded bg-background border border-border space-y-2">
                <div className="font-semibold text-primary border-b border-border pb-1.5">
                  GENERATED DESIGN SPECIFICATION
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Theme:</span>{' '}
                    <span className="text-foreground">{currentResult.generatedDesign?.theme}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Geometry:</span>{' '}
                    <span className="text-success">{currentResult.generatedDesign?.geometry}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Typography:</span>{' '}
                    <span className="text-foreground">{currentResult.generatedDesign?.typography}</span>
                  </div>
                  <div className="pt-1 space-y-1">
                    {(currentResult.generatedDesign?.components || []).map((c, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-secondary border border-border text-[10px]">
                        • {c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 p-3 rounded bg-background border border-border space-y-2">
                <div className="font-semibold text-primary border-b border-border pb-1.5">
                  LIVE INTERACTIVE DESIGN SANDBOX PREVIEW
                </div>
                <iframe
                  title="Synthesized Design Preview"
                  srcDoc={currentResult.interactivePreviewHtml}
                  className="w-full h-56 rounded border border-border bg-[#0d1117]"
                />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((item) => (
                <div
                  key={`${item.iteration}-${item.orbit?.codeHash}`}
                  className="p-2.5 rounded bg-background border border-border flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-foreground">
                      Iteration #{item.iteration} (Gen #{item.generation}) — {item.scrape?.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Saved Asset: {item.saved?.assetTitle} · Orbit r={Number(item.orbit?.radius || 0.25).toFixed(4)} · Fitness F={item.orbit?.fitness}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentResult(item);
                      setActiveTab('overview');
                    }}
                    className="h-7 text-[10px]"
                  >
                    Inspect
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded bg-background/60 border border-dashed border-border text-center text-muted-foreground">
          Enter any webpage URL or pick a preset above, then click{' '}
          <strong className="text-foreground">Scrape, Synthesize, Save &amp; Evolve</strong> to start the recursive learning loop.
        </div>
      )}
    </section>
  );
}