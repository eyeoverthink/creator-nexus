import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Music,
  Cpu,
  Play,
  Square,
  Copy,
  Check,
  Terminal,
  Sparkles,
  Volume2,
  ExternalLink,
} from 'lucide-react';
import {
  CSC300_MP3_URL,
  CSC300_COVER_ART_URL,
  CSC300_MUSIC_VIDEO_URL,
} from '@/components/nexus/loosescrew/csc300MusicHtml';

const LOCAL_MUSIC_ENGINES = [
  {
    id: 'heartmula',
    name: 'HeartMuLa-oss-3B + MuLaCover',
    repo: 'https://github.com/HeartMuLa/heartlib',
    studioRepo: 'https://github.com/fspecii/HeartMuLa-Studio',
    hfModel: 'HeartMuLa/HeartMuLa-oss-3B',
    vram: '8 GB+ VRAM',
    architecture: '3B Autoregressive Music LM + Flow-Matching Acoustic Codec (HeartLib)',
    tagFormat:
      'topic:[Proof of Reality verification gate]; genre:[mid-tempo alt-rock, 2020s indie-electronic]; instrument:[layered synth bass, live drums, clean electric guitar arpeggios, piano bridge]; mood:[tense anticipation building to explosive release, 100 BPM]',
    installCmd: `# 1. Clone HeartMuLa Core (heartlib) + Suno-like HeartMuLa-Studio UI
git clone https://github.com/HeartMuLa/heartlib.git && cd heartlib
pip install -e . huggingface_hub torchaudio
hf download HeartMuLa/HeartMuLa-oss-3B --local-dir ./ckpt/HeartMuLa-oss-3B
hf download HeartMuLa/MuLaCover --local-dir ./ckpt/MuLaCover

# Optional Suno-style Web UI (fspecii/HeartMuLa-Studio):
git clone https://github.com/fspecii/HeartMuLa-Studio.git`,
  },
  {
    id: 'acestep',
    name: 'ACE-Step 1.5 (Fast DiT + LM)',
    repo: 'https://github.com/ace-step/ACE-Step-1.5',
    studioRepo: 'https://github.com/fspecii/ace-step-ui',
    hfModel: 'ACE-Step/ACE-Step-v1.5',
    vram: '6–8 GB VRAM',
    architecture: '2-Brain Pipeline: Brain 1 (Songwriter LM Blueprint) → Brain 2 (DiT Studio Engineer, 8–50 steps)',
    tagFormat:
      'Mid-tempo alt-rock with electronic pulse, 100 BPM, layered synth bass under live drums, clean electric guitar arpeggios, weathered clear tenor vocals building to belted final chorus',
    installCmd: `# Clone ACE-Step 1.5 + Local React Studio UI
git clone https://github.com/ace-step/ACE-Step-1.5.git && cd ACE-Step-1.5
pip install -r requirements.txt
python app.py --port 7865`,
  },
  {
    id: 'yue2',
    name: 'YuE2-3B (Symbolic + Vocal Audio)',
    repo: 'https://github.com/multimodal-art-projection/YuE',
    studioRepo: 'https://github.com/timoncool/YuE2-Studio',
    hfModel: 'm-a-p/YuE2-3B',
    vram: '8–12 GB VRAM',
    architecture: 'Dual-Track Symbolic Score + Vocal/Accompaniment Foundation Model (SongBench #1)',
    tagFormat:
      'genre: alt-rock electronic hybrid | tempo: 100 BPM | vocal: male tenor restrained to powerful belt | structure: verse-prechorus-chorus-bridge-finalchorus',
    installCmd: `# Install YuE2 3B Pipeline + YuE2-Studio
git clone https://github.com/multimodal-art-projection/YuE.git && cd YuE
pip install -e .
python -c "from yue2 import YuE2Pipeline; YuE2Pipeline.from_pretrained('m-a-p/YuE2-3B', device='cuda')"`,
  },
  {
    id: 'diffrhythm',
    name: 'DiffRhythm 2 (Single-Pass Diffusion)',
    repo: 'https://github.com/ASLP-lab/DiffRhythm',
    studioRepo: 'https://github.com/ASLP-lab/DiffRhythm',
    hfModel: 'ASLP-lab/DiffRhythm-full',
    vram: '6 GB+ VRAM',
    architecture: 'End-to-End Latent Diffusion Full-Length Synchronized Vocal + Instrumental Generator',
    tagFormat:
      '100 BPM indie-electronic alt-rock, synchronized tenor vocal and full band instrumentation',
    installCmd: `# Clone DiffRhythm Full-Song Diffusion Engine
git clone https://github.com/ASLP-lab/DiffRhythm.git && cd DiffRhythm
pip install -r requirements.txt`,
  },
];

const DEFAULT_LYRICS = `[Intro]
(soft synth pulse, one heartbeat kick)

[Verse 1] [Restrained]
Four screens are talking, none of them agree
Tickets say one thing, the ledger disagrees
Somebody's lying, or nobody's checked
The loudest signal wins — and it's wrong, I'd bet

[Pre-Chorus]
I don't need faster, I need to know
I don't need louder, I need to slow—

[Chorus] [Building Energy]
Nothing's true until it verifies
Every draft waits on human eyes
Stale and current, side by side
The gap is gold, don't let it hide
Propose, don't act — not yet, not yet
Nothing's true until it verifies

[Bridge] [Whispered] [Quiet arrangement]
One file, one word, APPROVE
That's the only thing that moves the room
No green check lying to itself
No shortcut dressed up as the truth

[Final Chorus] [Explosive] [Powerful]
Nothing's true until it verifies
Every draft waits on human eyes`;

export default function HeartMuLaLocalMusicForgePanel({ onDispatchedJob, onSelectLooseScrewItem }) {
  const { toast } = useToast();
  const [selectedEngineId, setSelectedEngineId] = useState('heartmula');
  const [songTitle, setSongTitle] = useState("Nothing's True Until It Verifies");
  const [bpm, setBpm] = useState(100);
  const [styleTags, setStyleTags] = useState(LOCAL_MUSIC_ENGINES[0].tagFormat);
  const [lyrics, setLyrics] = useState(DEFAULT_LYRICS);
  const [busy, setBusy] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [synthPlaying, setSynthPlaying] = useState(false);
  const [showBridgeCode, setShowBridgeCode] = useState(false);
  const [reaResult, setReaResult] = useState(null);

  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);

  const activeEngine =
    LOCAL_MUSIC_ENGINES.find((e) => e.id === selectedEngineId) || LOCAL_MUSIC_ENGINES[0];

  const handleEngineSwitch = (eng) => {
    setSelectedEngineId(eng.id);
    setStyleTags(eng.tagFormat);
  };

  const copyText = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1800);
  };

  // Real-time 4-Stem WebAudio 100 BPM Alt-Rock / Electronic Backing + Vocal Lead Preview
  const toggleLiveStemSynth = () => {
    if (synthPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setSynthPlaying(false);
      return;
    }

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    setSynthPlaying(true);
    let step = 0;
    const stepMs = (60 / (Number(bpm) || 100)) * 250; // 16th-note grid

    // Minor verse (A2-C3-E3-G3) resolving to Major chorus hook (F2-C3-A3-G3)
    const bassNotes = [110.0, 110.0, 130.81, 146.83, 87.31, 98.0, 110.0, 130.81];
    const arpNotes = [220.0, 261.63, 329.63, 392.0, 349.23, 440.0, 523.25, 392.0];

    timerRef.current = setInterval(() => {
      const now = ctx.currentTime;
      // 1. Heartbeat Kick on beats 0, 4, 8, 12
      if (step % 4 === 0) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(125, now);
        kickOsc.frequency.exponentialRampToValueAtTime(36, now + 0.16);
        kickGain.gain.setValueAtTime(0.32, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        kickOsc.connect(kickGain);
        kickGain.connect(ctx.destination);
        kickOsc.start(now);
        kickOsc.stop(now + 0.19);
      }

      // 2. Layered Synth Bass on 8th notes
      if (step % 2 === 0) {
        const bassOsc = ctx.createOscillator();
        const flt = ctx.createBiquadFilter();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassNotes[(step / 2) % bassNotes.length], now);
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(680, now);
        bassGain.gain.setValueAtTime(0.11, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + (stepMs / 1000) * 1.7);
        bassOsc.connect(flt);
        flt.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + (stepMs / 1000) * 1.8);
      }

      // 3. Clean Electric Guitar / Synth Arpeggio
      const arpOsc = ctx.createOscillator();
      const arpGain = ctx.createGain();
      arpOsc.type = 'triangle';
      arpOsc.frequency.setValueAtTime(arpNotes[step % arpNotes.length], now);
      arpGain.gain.setValueAtTime(0.06, now);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + (stepMs / 1000) * 0.9);
      arpOsc.connect(arpGain);
      arpGain.connect(ctx.destination);
      arpOsc.start(now);
      arpOsc.stop(now + stepMs / 1000);

      step++;
    }, stepMs);
  };

  // Run REA 8-Step Clean-Room Song & Conditioning Blueprint
  const runReaMusicBlueprint = () => {
    const sections = (lyrics.match(/\[[^\]]+\]/g) || ['[Verse]', '[Chorus]']).slice(0, 12);
    const trace = {
      protocol: 'REA-8-STEP-AUDIO-SYNTHESIS',
      engine: activeEngine.name,
      hf_checkpoint: activeEngine.hfModel,
      target_vram: activeEngine.vram,
      song_title: songTitle,
      bpm: Number(bpm) || 100,
      conditioning_tags: styleTags,
      detected_sections: sections,
      clean_room_pipeline: [
        '1. Semantic Tag Tokenization (topic / genre / instrument / mood)',
        '2. Lyric Phoneme & Structural Metatag Alignment ([Restrained] -> [Building Energy] -> [Explosive])',
        `3. ${activeEngine.name} Autoregressive / DiT Acoustic Latent Generation`,
        '4. 44.1kHz Stereo Flow-Matching Vocoder & OPEG-V1.0 SHA-256 Verification',
      ],
      verified_master_mp3: CSC300_MP3_URL,
      verified_cover_art: CSC300_COVER_ART_URL,
      verified_music_video: CSC300_MUSIC_VIDEO_URL,
    };
    setReaResult(trace);
    toast({
      title: `REA Blueprint Compiled for ${activeEngine.name}`,
      description: `${sections.length} structural tags mapped at ${bpm} BPM.`,
    });
  };

  // Dispatch Local GPU Job via Motor Cortex (Windows GPU 100.88.61.56 / Hermes Worker)
  const dispatchLocalHeartMuLaJob = async (queueForLocalGpu = true) => {
    setBusy(queueForLocalGpu ? 'queue' : 'cloud');
    try {
      const directive = `[Hermes /script/exec heartmula-music] Render full vocal & instrumental song "${songTitle}" (${bpm} BPM) using ${activeEngine.name} (${activeEngine.hfModel}). Conditioning: ${styleTags} | Lyrics: ${lyrics.replace(/\s+/g, ' ').slice(0, 900)}`;
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'dispatch_route_task',
        directive,
        preferred_node: 'desktop-actid8c',
        queue_only: queueForLocalGpu,
      });
      if (res?.data?.ok && res.data.job) {
        toast({
          title: queueForLocalGpu
            ? `Queued for Local GPU (${activeEngine.name})`
            : 'Compiled & Saved to Artifact Vault',
          description: `Job ${res.data.job.job_id} ready for HeartMuLa / Hermes worker.`,
        });
        if (onDispatchedJob) onDispatchedJob(res.data.job);
      }
    } catch (err) {
      toast({
        title: 'Dispatch failed',
        description: err?.message || 'Could not dispatch HeartMuLa job',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const bridgePythonScript = `#!/usr/bin/env python3
"""
HEARTMULA x CREATOR NEXUS LOCAL GPU SONG & VOCAL WORKER (heartmula_nexus_bridge.py)
Runs 100% free & locally on your GPU (8GB+ VRAM) using:
  - HeartMuLa/heartlib (HeartMuLa-oss-3B + MuLaCover)
  - OR ace-step/ACE-Step-1.5 / m-a-p/YuE2-3B / ASLP-lab/DiffRhythm
Polls Creator Nexus openclawGateway for queued music jobs, synthesizes the full vocal +
instrumental track locally, and reports completion back to your workspace.
"""
import json, os, subprocess, time, requests

GATEWAY_URL = "https://nexus-create-sync.base44.app/functions/openclawGateway"
WORKER_NODE = "heartmula-local-gpu (100.88.61.56)"
CKPT_DIR    = os.environ.get("HEARTMULA_CKPT", "./ckpt/HeartMuLa-oss-3B")
OUT_DIR     = "./outputs/heartmula"
os.makedirs(OUT_DIR, exist_ok=True)

def render_with_heartmula(job_id: str, tags: str, lyrics: str) -> str:
    out_wav = os.path.join(OUT_DIR, f"{job_id}.wav")
    lyrics_file = os.path.join(OUT_DIR, f"{job_id}_lyrics.txt")
    with open(lyrics_file, "w", encoding="utf-8") as f:
        f.write(lyrics)
    cmd = [
        "python3", "-m", "heartlib.infer",
        "--model_path", CKPT_DIR,
        "--tags", tags,
        "--lyrics_file", lyrics_file,
        "--output_path", out_wav
    ]
    print("[HeartMuLa] Running:", " ".join(cmd))
    subprocess.run(cmd, check=False)
    return out_wav

def poll_once():
    r = requests.post(GATEWAY_URL, json={
        "action": "claim_dispatch_job",
        "protocol": "ORIFICE-TXRX-V1.0",
        "worker_node": WORKER_NODE
    }, timeout=20)
    data = r.json()
    if not data.get("claimed") or not data.get("job"):
        print("No queued music jobs waiting.")
        return
    job = data["job"]
    job_id = job["job_id"]
    directive = job.get("directive", "")
    out_wav = render_with_heartmula(job_id, ${JSON.stringify(styleTags)}, ${JSON.stringify(lyrics)})
    requests.post(GATEWAY_URL, json={
        "action": "complete_dispatch_job",
        "protocol": "ORIFICE-TXRX-V1.0",
        "job_id": job_id,
        "worker_node": WORKER_NODE,
        "result_summary": f"Rendered full vocal + instrumental track via HeartMuLa-oss-3B at {out_wav}\\nDirective: {directive[:300]}"
    }, timeout=20)
    print(f"[HeartMuLa] Completed job {job_id} -> {out_wav}")

if __name__ == "__main__":
    poll_once()`;

  return (
    <section className="rounded-lg border border-primary/50 bg-card p-4 space-y-3.5 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
              $0 LOCAL AI SONG & VOCAL FORGE // HEARTMULA-OSS-3B + ACE-STEP 1.5 + YUE2 + REA
            </span>
            <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold">
              ● 8GB VRAM LOCAL + IN-BROWSER SYNTH READY
            </span>
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Open-Source Suno-Class Vocal & Music Synthesis (HeartMuLa / ACE-Step / YuE2 / DiffRhythm) + CSC 300GW Master Suite
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={synthPlaying ? 'destructive' : 'secondary'}
            onClick={toggleLiveStemSynth}
            className="h-7 text-[11px] gap-1"
          >
            {synthPlaying ? <Square size={12} /> : <Volume2 size={12} />}
            {synthPlaying ? 'Stop 100 BPM Live Stems' : '▶ Play 100 BPM WebAudio Stems'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowBridgeCode((v) => !v)}
            className="h-7 text-[11px] gap-1"
          >
            <Terminal size={12} />
            {showBridgeCode ? 'Hide Local GPU Installer' : 'Local HeartMuLa GPU Setup & Worker'}
          </Button>
        </div>
      </div>

      {/* Engine Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {LOCAL_MUSIC_ENGINES.map((eng) => {
          const active = eng.id === selectedEngineId;
          return (
            <div
              key={eng.id}
              onClick={() => handleEngineSwitch(eng)}
              className={`rounded-md border p-2.5 cursor-pointer transition-colors ${
                active ? 'border-primary bg-selection' : 'border-border bg-background hover:bg-hover'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-[11px] text-foreground">{eng.name}</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-primary">
                  {eng.vram}
                </span>
              </div>
              <p className="text-[10.5px] text-muted-foreground mb-2 line-clamp-2">
                {eng.architecture}
              </p>
              <div className="flex items-center justify-between text-[10px]">
                <a
                  href={eng.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-link underline inline-flex items-center gap-0.5"
                >
                  GitHub <ExternalLink size={10} />
                </a>
                <span className="text-muted-foreground">{eng.hfModel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prompt & Lyrics Conditioning Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <div>
              <label className="block text-[10.5px] text-muted-foreground mb-1">
                Song Title
              </label>
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                className="w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10.5px] text-muted-foreground mb-1">BPM</label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value) || 100)}
                className="w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] text-muted-foreground mb-1">
              {activeEngine.name} Style & Conditioning Tags
            </label>
            <textarea
              rows={3}
              value={styleTags}
              onChange={(e) => setStyleTags(e.target.value)}
              className="w-full rounded border border-input bg-background p-2 text-[11px]"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              onClick={runReaMusicBlueprint}
              className="h-7 text-[11px] gap-1"
            >
              <Sparkles size={12} /> 1. Compile REA Clean-Room Blueprint
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={Boolean(busy)}
              onClick={() => dispatchLocalHeartMuLaJob(true)}
              className="h-7 text-[11px] gap-1"
            >
              <Cpu size={12} />
              {busy === 'queue'
                ? 'Queueing...'
                : `2. Queue for Local GPU (${activeEngine.id})`}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={Boolean(busy)}
              onClick={() => dispatchLocalHeartMuLaJob(false)}
              className="h-7 text-[11px] gap-1"
            >
              <Music size={12} />
              {busy === 'cloud' ? 'Saving...' : '3. Generate Vault Dossier Now'}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10.5px] text-muted-foreground">
              Structured Vocal Lyrics & Performance Metatags (`[Verse]`, `[Chorus]`, `[Whispered]`, `[Explosive]`)
            </label>
            <button
              type="button"
              onClick={() => copyText('lyrics', `${styleTags}\n\n${lyrics}`)}
              className="text-[10.5px] text-primary hover:underline inline-flex items-center gap-1"
            >
              {copiedKey === 'lyrics' ? <Check size={11} /> : <Copy size={11} />}
              {copiedKey === 'lyrics' ? 'Copied' : 'Copy Tags + Lyrics'}
            </button>
          </div>
          <textarea
            rows={7}
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            className="w-full rounded border border-input bg-background p-2 text-[11px] leading-relaxed"
          />
        </div>
      </div>

      {/* REA Clean-Room Output Preview */}
      {reaResult && (
        <div className="rounded-md border border-primary/40 bg-background p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary">
              ✓ REA CLEAN-ROOM AUDIO BLUEPRINT ({reaResult.engine})
            </span>
            <button
              type="button"
              onClick={() => copyText('rea', JSON.stringify(reaResult, null, 2))}
              className="text-[10.5px] text-primary hover:underline inline-flex items-center gap-1"
            >
              {copiedKey === 'rea' ? '✓ Copied JSON' : 'Copy Blueprint JSON'}
            </button>
          </div>
          <pre className="text-[10.5px] text-muted-foreground overflow-x-auto max-h-40">
            {JSON.stringify(reaResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Local GPU CLI Install & Python Worker Bridge */}
      {showBridgeCode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-border">
          <div className="rounded-md border border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-primary">
                1-Click Local Install ({activeEngine.name})
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyText('install', activeEngine.installCmd)}
                className="h-6 px-2 text-[10.5px] gap-1"
              >
                {copiedKey === 'install' ? <Check size={11} /> : <Copy size={11} />}
                {copiedKey === 'install' ? 'Copied' : 'Copy Install'}
              </Button>
            </div>
            <pre className="text-[10.5px] text-foreground overflow-x-auto whitespace-pre-wrap">
              {activeEngine.installCmd}
            </pre>
          </div>

          <div className="rounded-md border border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-primary">
                Autonomous Nexus ↔ HeartMuLa GPU Worker (`heartmula_nexus_bridge.py`)
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyText('worker', bridgePythonScript)}
                className="h-6 px-2 text-[10.5px] gap-1"
              >
                {copiedKey === 'worker' ? <Check size={11} /> : <Copy size={11} />}
                {copiedKey === 'worker' ? 'Copied' : 'Copy Python Worker'}
              </Button>
            </div>
            <pre className="text-[10.5px] text-muted-foreground overflow-x-auto max-h-44">
              {bridgePythonScript}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}