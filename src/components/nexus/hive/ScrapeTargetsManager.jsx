import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, RefreshCw, X } from 'lucide-react';

const KEY = 'nexus.scrapeTargets', YT = 'nexus.youtubeChannels';
const DEFAULTS = [
  { label: 'Golden ratio (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Golden_ratio', source: 'Saved' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com', source: 'Saved' },
];
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };

export default function ScrapeTargetsManager({ onPick, history = [] }) {
  const [targets, setTargets] = useState(() => load(KEY, DEFAULTS));
  const [channels, setChannels] = useState(() => load(YT, []).join(', '));
  const [label, setLabel] = useState(''), [url, setUrl] = useState(''), [topic, setTopic] = useState('');
  const [suggested, setSuggested] = useState([]), [errors, setErrors] = useState({}), [busy, setBusy] = useState(false);

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(targets)), [targets]);
  const add = (t) => setTargets((p) => (p.some((x) => x.url === t.url) ? p : [...p, { ...t, source: t.source || 'Saved' }]));
  const update = (i, field, v) => setTargets((p) => p.map((t, j) => (j === i ? { ...t, [field]: v } : t)));

  const suggest = async () => {
    setBusy(true);
    const ids = channels.split(',').map((s) => s.trim()).filter(Boolean);
    localStorage.setItem(YT, JSON.stringify(ids));
    const { data } = await base44.functions.invoke('scrapeTargets', { topic, youtube_channels: ids, history }).finally(() => setBusy(false));
    setSuggested(data.targets || []); setErrors(data.errors || {});
  };

  return (
    <div className="space-y-2 p-2.5 rounded border border-border bg-secondary/30">
      <div className="text-[10px] text-muted-foreground">MY SCRAPE TARGETS (click to use, edit inline)</div>
      {targets.map((t, i) => (
        <div key={i} className="flex gap-1.5 items-center">
          <button type="button" onClick={() => onPick(t)} className="px-2 py-1 rounded bg-primary/15 text-primary text-[10px] shrink-0">Use</button>
          <input value={t.label} onChange={(e) => update(i, 'label', e.target.value)} className="w-1/3 rounded bg-background border border-input px-2 py-1 text-[11px]" />
          <input value={t.url} onChange={(e) => update(i, 'url', e.target.value)} className="flex-1 min-w-0 rounded bg-background border border-input px-2 py-1 text-[11px]" />
          <button type="button" aria-label="Remove target" onClick={() => setTargets((p) => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X size={13} /></button>
        </div>
      ))}
      <div className="flex gap-1.5">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name" className="w-1/3 rounded bg-background border border-input px-2 py-1 text-[11px]" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="flex-1 min-w-0 rounded bg-background border border-input px-2 py-1 text-[11px]" />
        <Button size="sm" variant="secondary" disabled={!/^https?:\/\//.test(url)} onClick={() => { add({ label: label || url, url }); setLabel(''); setUrl(''); }} className="h-7"><Plus size={12} />Add</Button>
      </div>
      <div className="text-[10px] text-muted-foreground pt-1">LIVE SUGGESTIONS: news, Reddit, Hacker News, GitHub trending, YouTube alerts, AI + Hive</div>
      <div className="flex flex-wrap gap-1.5">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic or tag (optional)" className="flex-1 min-w-32 rounded bg-background border border-input px-2 py-1 text-[11px]" />
        <input value={channels} onChange={(e) => setChannels(e.target.value)} placeholder="YouTube channel IDs (UC…), comma separated" className="flex-1 min-w-40 rounded bg-background border border-input px-2 py-1 text-[11px]" />
        <Button size="sm" disabled={busy} onClick={suggest} className="h-7">{busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}Get suggestions</Button>
      </div>
      {Object.entries(errors).map(([s, e]) => <p key={s} className="text-[10px] text-caution">{s} unavailable: {e}</p>)}
      <div className="max-h-48 overflow-y-auto space-y-1">
        {suggested.map((t) => (
          <div key={t.url} className="flex items-center gap-1.5 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[9px] shrink-0">{t.source}</span>
            <button type="button" onClick={() => onPick(t)} className="truncate text-left hover:text-primary" title={t.reason || t.url}>{t.label}</button>
            <button type="button" onClick={() => add(t)} className="ml-auto text-primary text-[10px] shrink-0">Save</button>
          </div>
        ))}
      </div>
    </div>
  );
}