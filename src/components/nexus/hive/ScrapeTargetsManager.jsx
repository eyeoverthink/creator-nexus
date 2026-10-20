import { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Check, Download, Loader2, Plus, RefreshCw, Save, Upload, X } from 'lucide-react';

const INITIAL_TARGETS = [
  { label: 'Wikipedia: Golden Ratio (φ)', url: 'https://en.wikipedia.org/wiki/Golden_ratio', source: 'Saved' },
  { label: 'Hacker News Frontpage', url: 'https://news.ycombinator.com', source: 'Saved' },
];

export default function ScrapeTargetsManager({ workspaceId, onPick, history = [], visitedUrls = [] }) {
  const [targets, setTargets] = useState(INITIAL_TARGETS);
  const [tags, setTags] = useState(['ai-agents', 'webgl', 'quantum', 'r/LocalLLaMA']);
  const [tagInput, setTagInput] = useState('');
  const [channels, setChannels] = useState('');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [suggested, setSuggested] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncBadge, setSyncBadge] = useState('');
  const fileInputRef = useRef(null);

  // Load persisted targets, tags, YouTube channels, and crawl state from server continuity
  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke('scrapeTargets', { action: 'load', ...(workspaceId ? { workspace_id: workspaceId } : {}) })
      .then(({ data }) => {
        if (cancelled || !data?.ok) return;
        if (Array.isArray(data.targets) && data.targets.length > 0) setTargets(data.targets);
        if (Array.isArray(data.tags) && data.tags.length > 0) setTags(data.tags);
        if (Array.isArray(data.youtubeChannels) && data.youtubeChannels.length > 0) {
          setChannels(data.youtubeChannels.join(', '));
        }
        setSyncBadge('Loaded from Continuity DB');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const persistToServer = async (nextTargets, nextTags, nextChannelsStr) => {
    setSaving(true);
    setSyncBadge('Syncing to DB + File + VPS…');
    const ytList = String(nextChannelsStr ?? channels)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const { data } = await base44.functions.invoke('scrapeTargets', {
        action: 'save',
        ...(workspaceId ? { workspace_id: workspaceId } : {}),
        targets: nextTargets ?? targets,
        tags: nextTags ?? tags,
        youtube_channels: ytList,
      });
      if (data?.ok) {
        setSyncBadge(
          data.vpsSynced
            ? 'Saved to DB + Library JSON + VPS'
            : 'Saved to DB + scrape-targets-continuity.json'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const addTarget = (t) => {
    const cleanUrl = String(t.url || '').trim();
    if (!/^https?:\/\//i.test(cleanUrl)) return;
    const next = targets.some((x) => x.url === cleanUrl)
      ? targets
      : [...targets, { label: t.label || cleanUrl, url: cleanUrl, source: t.source || 'Saved', reason: t.reason || '' }];
    setTargets(next);
    persistToServer(next, tags, channels);
  };

  const updateTarget = (i, field, v) => {
    const next = targets.map((t, j) => (j === i ? { ...t, [field]: v } : t));
    setTargets(next);
  };

  const removeTarget = (i) => {
    const next = targets.filter((_, j) => j !== i);
    setTargets(next);
    persistToServer(next, tags, channels);
  };

  const addTag = () => {
    const clean = tagInput.trim();
    if (!clean || tags.includes(clean)) return;
    const next = [...tags, clean];
    setTags(next);
    setTagInput('');
    persistToServer(targets, next, channels);
  };

  const removeTag = (tagToRemove) => {
    const next = tags.filter((t) => t !== tagToRemove);
    setTags(next);
    persistToServer(targets, next, channels);
  };

  const fetchSuggestions = async () => {
    setBusy(true);
    const ytList = channels.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      await persistToServer(targets, tags, channels);
      const { data } = await base44.functions.invoke('scrapeTargets', {
        action: 'suggest',
        ...(workspaceId ? { workspace_id: workspaceId } : {}),
        topic,
        tags,
        youtube_channels: ytList,
        history,
        visited_urls: visitedUrls,
      });
      setSuggested(data?.targets || []);
      setErrors(data?.errors || {});
    } finally {
      setBusy(false);
    }
  };

  const exportContinuityFile = () => {
    const payload = {
      protocol: 'NEXUS_SCRAPE_CONTINUITY_V2',
      exported_at: new Date().toISOString(),
      targets,
      tags,
      youtube_channels: channels.split(',').map((s) => s.trim()).filter(Boolean),
      visited_urls: visitedUrls,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scrape-targets-continuity.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importContinuityFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const nextTargets = Array.isArray(parsed.targets) ? parsed.targets : Array.isArray(parsed.scrape_targets) ? parsed.scrape_targets : targets;
      const nextTags = Array.isArray(parsed.tags) ? parsed.tags : Array.isArray(parsed.scrape_tags) ? parsed.scrape_tags : tags;
      const nextYt = Array.isArray(parsed.youtube_channels) ? parsed.youtube_channels.join(', ') : channels;
      setTargets(nextTargets);
      setTags(nextTags);
      setChannels(nextYt);
      await persistToServer(nextTargets, nextTags, nextYt);
    } catch {}
    e.target.value = '';
  };

  const sources = ['ALL', ...Array.from(new Set(suggested.map((s) => s.source)))];
  const visibleSuggested =
    sourceFilter === 'ALL' ? suggested : suggested.filter((s) => s.source === sourceFilter);

  return (
    <div className="space-y-2.5 p-3 rounded border border-border bg-secondary/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-foreground">
            PERSISTENT SCRAPE TARGETS &amp; CONTINUITY (DB + LIBRARY JSON + VPS)
          </span>
          {syncBadge && (
            <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9px] flex items-center gap-1">
              <Check size={10} /> {syncBadge}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            disabled={saving}
            onClick={() => persistToServer(targets, tags, channels)}
            className="h-6 px-2 text-[10px]"
          >
            <Save size={11} /> {saving ? 'Saving…' : 'Save Continuity'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportContinuityFile}
            className="h-6 px-2 text-[10px]"
          >
            <Download size={11} /> Export JSON
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-6 px-2 text-[10px]"
          >
            <Upload size={11} /> Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={importContinuityFile}
            className="hidden"
          />
        </div>
      </div>

      {/* Saved Editable Targets */}
      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
        {targets.map((t, i) => (
          <div key={`${t.url}-${i}`} className="flex gap-1.5 items-center">
            <button
              type="button"
              onClick={() => onPick(t)}
              className="px-2 py-1 rounded bg-primary/15 text-primary hover:bg-primary/25 text-[10px] shrink-0 font-semibold"
            >
              Use
            </button>
            <input
              value={t.label}
              onChange={(e) => updateTarget(i, 'label', e.target.value)}
              onBlur={() => persistToServer(targets, tags, channels)}
              className="w-1/3 rounded bg-background border border-input px-2 py-1 text-[11px]"
            />
            <input
              value={t.url}
              onChange={(e) => updateTarget(i, 'url', e.target.value)}
              onBlur={() => persistToServer(targets, tags, channels)}
              className="flex-1 min-w-0 rounded bg-background border border-input px-2 py-1 text-[11px]"
            />
            <button
              type="button"
              aria-label="Remove target"
              onClick={() => removeTarget(i)}
              className="text-muted-foreground hover:text-destructive p-1"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Target */}
      <div className="flex flex-wrap gap-1.5">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Target label"
          className="w-1/3 rounded bg-background border border-input px-2 py-1 text-[11px]"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="flex-1 min-w-40 rounded bg-background border border-input px-2 py-1 text-[11px]"
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={!/^https?:\/\//i.test(url.trim())}
          onClick={() => {
            addTarget({ label: label.trim() || url.trim(), url: url.trim() });
            setLabel('');
            setUrl('');
          }}
          className="h-7 text-[11px]"
        >
          <Plus size={12} /> Add Target
        </Button>
      </div>

      {/* Dynamic Tags & Live Discovery Controls */}
      <div className="pt-1.5 border-t border-border space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">ACTIVE TAGS / SUBREDDITS:</span>
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background border border-border text-[10px]"
            >
              {t}
              <button type="button" onClick={() => removeTag(t)} className="hover:text-destructive">
                <X size={10} />
              </button>
            </span>
          ))}
          <div className="inline-flex items-center gap-1">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="+ tag or r/subreddit"
              className="w-32 rounded bg-background border border-input px-2 py-0.5 text-[10px]"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px]"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic / current event query (e.g., local LLM agents, WebGPU, quantum)"
            className="flex-1 min-w-44 rounded bg-background border border-input px-2 py-1 text-[11px]"
          />
          <input
            value={channels}
            onChange={(e) => setChannels(e.target.value)}
            onBlur={() => persistToServer(targets, tags, channels)}
            placeholder="YouTube @handles or UC channel IDs (comma separated)"
            className="flex-1 min-w-44 rounded bg-background border border-input px-2 py-1 text-[11px]"
          />
          <Button size="sm" disabled={busy} onClick={fetchSuggestions} className="h-7 text-[11px]">
            {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Discover Live Targets (AI, Hive, News, Reddit, GitHub, YouTube, HN)
          </Button>
        </div>

        {Object.entries(errors).map(([s, e]) => (
          <p key={s} className="text-[10px] text-caution">
            {s}: {e}
          </p>
        ))}

        {suggested.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1">
              {sources.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSourceFilter(src)}
                  className={`px-2 py-0.5 rounded text-[10px] border ${
                    sourceFilter === src
                      ? 'border-primary bg-primary/15 text-primary font-semibold'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
              {visibleSuggested.map((t) => (
                <div
                  key={t.url}
                  className="flex items-center gap-1.5 text-[11px] p-1 rounded bg-background/70 border border-border/60"
                >
                  <span className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[9px] text-primary shrink-0">
                    {t.source}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPick(t)}
                    className="truncate text-left hover:text-primary flex-1"
                    title={t.reason || t.url}
                  >
                    {t.label}
                    {t.reason ? <span className="text-[10px] text-muted-foreground ml-1.5">— {t.reason}</span> : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPick(t)}
                    className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] shrink-0"
                  >
                    Use
                  </button>
                  <button
                    type="button"
                    onClick={() => addTarget(t)}
                    className="px-1.5 py-0.5 rounded bg-secondary border border-border text-foreground hover:text-primary text-[10px] shrink-0"
                  >
                    Save
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}