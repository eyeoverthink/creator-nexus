import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Radio,
  Sparkles,
  CheckCircle2,
  EyeOff,
  Plus,
  Edit3,
  Check,
  Loader2,
  Globe,
} from 'lucide-react';

export default function FactorySignalSensoriumPanel({
  signals = [],
  onToggleOrEditSignal,
  onAddSignal,
  onScanLiveTrends,
  busy,
}) {
  const [newTitle, setNewTitle] = useState('');
  const [newMood, setNewMood] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newKind, setNewKind] = useState('user_mood');
  const [scanTopic, setScanTopic] = useState('AI music videos, cinematic storytelling, and open-source agent tools');
  const [editingId, setEditingId] = useState(null);
  const [editSummary, setEditSummary] = useState('');
  const [editMood, setEditMood] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() && !newSummary.trim()) return;
    await onAddSignal?.({
      signal_kind: newKind,
      title: newTitle.trim() || 'Creator Mood & Experience Signal',
      mood_energy: newMood.trim() || 'Receptive · Inspired',
      summary: newSummary.trim() || newTitle.trim(),
      provenance: 'Direct Creator Input · Verified',
    });
    setNewTitle('');
    setNewMood('');
    setNewSummary('');
  };

  const includedCount = signals.filter((s) => s.included !== false).length;

  return (
    <section className="p-4 rounded-lg border border-border bg-card space-y-4 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
              RECEPTIVE SENSORIUM // MOOD, ENERGY, MUSIC &amp; WORLD TRENDS
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              Sourced Context &amp; Emotional Climate Signals ({includedCount} Active / {signals.length} Total)
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            Agents observe your mood, project activity, musical tonality, and live cultural/news trends with timestamps and provenance. Inspect, edit, or exclude any signal before it shapes creative direction.
          </p>
        </div>

        {/* Live Web/Trend Scanner */}
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            type="text"
            value={scanTopic}
            onChange={(e) => setScanTopic(e.target.value)}
            placeholder="Topic to scan..."
            className="h-7 w-56 rounded border border-input bg-background px-2 text-[10.5px] text-foreground"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={busy === 'scan'}
            onClick={() => onScanLiveTrends?.(scanTopic)}
            className="h-7 px-2.5 text-[10.5px] gap-1"
          >
            {busy === 'scan' ? <Loader2 size={11} className="animate-spin" /> : <Globe size={11} />}
            Scan Live World &amp; Cultural Pulse
          </Button>
        </div>
      </div>

      {/* Add User Mood / Energy / Experience Signal */}
      <form onSubmit={handleCreate} className="p-3 rounded border border-border bg-background space-y-2">
        <div className="text-[10.5px] font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles size={12} className="text-primary" />
          SHARE YOUR CURRENT MOOD, ENERGY, MUSICAL FEELING OR CONTEXT WITH THE AGENTS
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value)}
            className="md:col-span-2 h-8 rounded border border-input bg-card px-2 text-[10.5px]"
          >
            <option value="user_mood">User Mood / Energy</option>
            <option value="music_tonality">Musical Feeling</option>
            <option value="world_trend">Cultural / News Pulse</option>
            <option value="source_verification">Source Rule</option>
          </select>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Signal headline (e.g., 'Late-night cathedral atmosphere, awe mixed with restraint')"
            className="md:col-span-4 h-8 rounded border border-input bg-card px-2.5 text-[11px]"
          />
          <input
            type="text"
            value={newMood}
            onChange={(e) => setNewMood(e.target.value)}
            placeholder="Mood / Energy (e.g., 'Electric · Focused · 138 BPM')"
            className="md:col-span-3 h-8 rounded border border-input bg-card px-2.5 text-[11px]"
          />
          <input
            type="text"
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            placeholder="Details or creative nuance..."
            className="md:col-span-2 h-8 rounded border border-input bg-card px-2.5 text-[11px]"
          />
          <Button type="submit" size="sm" disabled={Boolean(busy)} className="md:col-span-1 h-8 px-2 gap-1 text-[10.5px]">
            <Plus size={12} /> Add
          </Button>
        </div>
      </form>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {signals.map((sig) => {
          const isIncluded = sig.included !== false;
          const isEditing = editingId === sig.id;
          return (
            <div
              key={sig.id}
              className={`p-3 rounded border transition-colors space-y-2 ${
                isIncluded
                  ? 'border-primary/40 bg-background'
                  : 'border-border bg-background/50 opacity-60'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[9.5px] uppercase font-bold">
                    {sig.signal_kind}
                  </span>
                  <span className="text-[10px] text-primary font-semibold">{sig.mood_energy}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditing) {
                        onToggleOrEditSignal?.({
                          signal_id: sig.id,
                          summary: editSummary,
                          mood_energy: editMood,
                        });
                        setEditingId(null);
                      } else {
                        setEditingId(sig.id);
                        setEditSummary(sig.summary || '');
                        setEditMood(sig.mood_energy || '');
                      }
                    }}
                    className="px-2 py-0.5 rounded border border-border bg-card text-[9.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    {isEditing ? <Check size={10} /> : <Edit3 size={10} />}
                    {isEditing ? 'Save' : 'Edit'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onToggleOrEditSignal?.({
                        signal_id: sig.id,
                        included: !isIncluded,
                      })
                    }
                    className={`px-2 py-0.5 rounded border text-[9.5px] font-bold inline-flex items-center gap-1 ${
                      isIncluded
                        ? 'border-success/50 bg-success/15 text-success'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    {isIncluded ? <CheckCircle2 size={10} /> : <EyeOff size={10} />}
                    {isIncluded ? 'Included in Direction' : 'Excluded'}
                  </button>
                </div>
              </div>

              <div className="text-xs font-semibold text-foreground">{sig.title}</div>

              {isEditing ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={editMood}
                    onChange={(e) => setEditMood(e.target.value)}
                    className="w-full h-7 rounded border border-input bg-card px-2 text-[10.5px]"
                    placeholder="Mood / Energy"
                  />
                  <textarea
                    rows={2}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full rounded border border-input bg-card p-2 text-[10.5px] font-body"
                  />
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground font-body leading-relaxed">{sig.summary}</p>
              )}

              <div className="pt-1 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-muted-foreground">
                <span>
                  Observer: <strong className="text-foreground">{sig.agent_observer || 'Sera'}</strong> · Source:{' '}
                  {sig.provenance}
                </span>
                <span>{sig.observed_at ? new Date(sig.observed_at).toLocaleString() : 'Live'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}