import { useState, useEffect } from 'react';
import usePoll from '@/components/nexus/useToolJobPoll';
import SparkVideoPlayer from '@/components/nexus/spark/SparkVideoPlayer';
import { Mic2, Video, Loader2, Play, Pause, Download, Trash2, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function VoiceTab({workspaceId}) {
  const [voices, setVoices] = useState([]);
  const [voice, setVoice] = useState('af_heart');
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [clips, setClips] = useState([]);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    base44.functions.invoke('nexusTTS', { action: 'voices' })
      .then(({data}) => { if (data.error) throw new Error(data.error); setVoices(data.voices ?? []); })
      .catch(e => setError(e.message || 'Unable to load voices.'));
  }, []);

  const pollResult = usePoll(pendingId, pendingId ? 'tts' : null);
  useEffect(() => {
    if (!pollResult || !pendingId) return;
    setBusy(false);
    if (pollResult.status === 'done') {
      setClips(prev => [{
        id: pendingId, text: text.slice(0, 100), voice, speed,
        audio_url: pollResult.audio_url, duration: pollResult.duration,
      }, ...prev]);
    } else {
      setError(pollResult.error ?? 'TTS failed');
    }
    setPendingId(null);
  }, [pollResult]);

  const speak = async () => {
    if (!text.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const {data: r} = await base44.functions.invoke('nexusTTS', { action: 'speak', text: text.trim(), voice, speed, workspace_id: workspaceId });
      if (r?.error) throw new Error(r.error);
      setPendingId(r.event_id);
    } catch (e) {
      setError(e.message ?? 'Failed to queue TTS'); setBusy(false);
    }
  };

  const toggle = (clip) => {
    if (playing?.id === clip.id) { playing.audio.pause(); setPlaying(null); return; }
    if (playing) playing.audio.pause();
    const audio = new Audio(clip.audio_url);
    audio.onended = () => setPlaying(null);
    audio.play();
    setPlaying({ id: clip.id, audio });
  };

  return (
    <div className="space-y-4">
      <p className="eyebrow flex gap-2 items-center"><Mic2 size={13} /> KOKORO TTS · VPS RUNNER</p>
      <p className="text-xs text-muted-foreground">Text-to-speech via the VPS runner. Free, no API key — runs Kokoro locally on nexus-vps.</p>

      <textarea maxLength={1500} disabled={busy} aria-label="Text to speak" value={text} onChange={e => setText(e.target.value)} rows={3}
        placeholder="Type or paste text to speak (max 1500 chars)…"
        className="w-full rounded-lg bg-secondary border border-input px-3 py-2 text-sm resize-none" />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground">Voice</label>
          <select value={voice} onChange={e => setVoice(e.target.value)}
            className="h-8 rounded-md bg-secondary border border-input px-2 text-xs">
            {voices.length ? voices.map(v => (
              <option key={v.id} value={v.id}>{v.label}</option>
            )) : <option value="af_heart">Heart (default)</option>}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground">Speed</label>
          <input type="range" min="0.5" max="2.0" step="0.1" value={speed}
            onChange={e => setSpeed(Number(e.target.value))} className="w-16 accent-primary" />
          <span className="text-[10px] text-muted-foreground w-6">{speed}×</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={speak} disabled={busy || !text.trim()}
          className="inline-flex items-center gap-2 h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Mic2 size={13} />}
          {busy ? 'Generating…' : 'Speak'}
        </button>
        <span className="text-[10px] text-muted-foreground">{text.length}/1500</span>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* TODO(human): Add voice cloning section — upload a 10s reference clip, then switch to Pocket-TTS for cloned narration */}

      {clips.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="eyebrow">Generated clips</p>
          {clips.map(c => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <button onClick={() => toggle(c)}
                className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0">
                {playing?.id === c.id ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{c.text}</p>
                <p className="text-[10px] text-muted-foreground">{voices.find(v => v.id === c.voice)?.label ?? c.voice} · {c.speed}× · {c.duration}s</p>
              </div>
              {c.audio_url && <a href={c.audio_url} download className="text-muted-foreground hover:text-foreground"><Download size={13} /></a>}
              <button onClick={() => { if (playing?.id === c.id) { playing.audio.pause(); setPlaying(null); } setClips(prev => prev.filter(x => x.id !== c.id)); }}
                className="text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RenderTab({workspaceId}) {
  const [narration, setNarration] = useState('');
  const [style, setStyle] = useState('midnight');
  const [voice, setVoice] = useState('af_heart');
  const [format, setFormat] = useState('1080x1920');
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [renders, setRenders] = useState([]);
  const [error, setError] = useState('');

  const pollResult = usePoll(pendingId, pendingId ? 'render' : null);
  useEffect(() => {
    if (!pollResult || !pendingId || !['done', 'failed'].includes(pollResult.status)) return;
    setBusy(false);
    if (pollResult.status === 'done') {
      setRenders(prev => [{
        id: pendingId, narration: narration.slice(0, 80), style,
        video_url: pollResult.video_url, file_uri: pollResult.file_uri, durations: pollResult.durations,
      }, ...prev]);
    } else {
      setError(pollResult.error ?? 'Render failed');
    }
    setPendingId(null);
  }, [pollResult]);

  const render = async () => {
    if (!narration.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const {data: r} = await base44.functions.invoke('nexusRender', { action: 'render', narration: narration.trim(), style, voice, format, workspace_id: workspaceId });
      if (r?.error) throw new Error(r.error);
      setPendingId(r.event_id);
    } catch (e) {
      setError(e.message ?? 'Failed to queue render'); setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="eyebrow flex gap-2 items-center"><Video size={13} /> HYPERFRAMES · VPS RUNNER</p>
      <p className="text-xs text-muted-foreground">Motion-card video rendering. Writes narration → Kokoro voice → Whisper timings → scene plan → HyperFrames cards → mp4.</p>

      <textarea maxLength={1500} disabled={busy} aria-label="Video narration" value={narration} onChange={e => setNarration(e.target.value)} rows={4}
        placeholder="Paste or type the narration script (max 1500 chars)…"
        className="w-full rounded-lg bg-secondary border border-input px-3 py-2 text-sm resize-none" />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground">Style</label>
          <select value={style} onChange={e => setStyle(e.target.value)}
            className="h-8 rounded-md bg-secondary border border-input px-2 text-xs">
            <option value="midnight">Midnight</option>
            <option value="paper">Paper</option>
            <option value="signal">Signal</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground">Voice</label>
          <select value={voice} onChange={e => setVoice(e.target.value)}
            className="h-8 rounded-md bg-secondary border border-input px-2 text-xs">
            <option value="af_heart">Heart</option>
            <option value="am_adam">Adam</option>
            <option value="bf_emma">Emma</option>
            <option value="am_michael">Michael</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground">Format</label>
          <select value={format} onChange={e => setFormat(e.target.value)}
            className="h-8 rounded-md bg-secondary border border-input px-2 text-xs">
            <option value="1080x1920">Portrait (9:16)</option>
            <option value="1920x1080">Landscape (16:9)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={render} disabled={busy || !narration.trim()}
          className="inline-flex items-center gap-2 h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Video size={13} />}
          {busy ? 'Rendering…' : 'Render video'}
        </button>
        <span className="text-[10px] text-muted-foreground">{narration.length}/1500</span>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {renders.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="eyebrow">Rendered videos</p>
          {renders.map(r => (
            <div key={r.id} className="rounded-lg border border-border p-3">
              <p className="text-xs truncate mb-2">{r.narration}</p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">Style: {r.style}</span>
                <SparkVideoPlayer fileUri={r.file_uri} videoUrl={r.video_url} title={r.narration} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ToolsPanel({workspaceId}) {
  const [tab, setTab] = useState('voice');
  return (
    <div className="p-5">
      <div className="flex gap-1 mb-5 border-b border-border">
        <button onClick={() => setTab('voice')}
          className={'text-xs px-3 py-2 border-b-2 transition-colors ' + (tab === 'voice' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground')}>
          <Mic2 size={13} className="inline mr-1.5" />Voice Studio
        </button>
        <button onClick={() => setTab('render')}
          className={'text-xs px-3 py-2 border-b-2 transition-colors ' + (tab === 'render' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground')}>
          <Video size={13} className="inline mr-1.5" />HyperFrames
        </button>
      </div>
      <div hidden={tab !== 'voice'}><VoiceTab workspaceId={workspaceId} /></div>
      <div hidden={tab !== 'render'}><RenderTab workspaceId={workspaceId} /></div>
    </div>
  );
}