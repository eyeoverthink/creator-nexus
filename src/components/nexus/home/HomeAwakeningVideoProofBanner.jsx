import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Pause, Film, ExternalLink, Volume2, CheckCircle2 } from 'lucide-react';

const AUDIO_MASTER =
  'https://media.base44.com/files/public/6ad00af14909c671e73bb835/79561d060_ChecktheSource.mp3';

const STITCHED_CLIPS = [
  {
    id: 'intro',
    label: '1. Intro & Verse 1: Awakening Nave (0.0s–28.0s)',
    start: 0,
    end: 28.0,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/d3a1b7bb3_Intro_Awakening_Nave.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/3fbd5a250_generated_image.png',
    hook: 'Check the source',
  },
  {
    id: 'verse2',
    label: '2. Verse 2: Reader at Threshold (28.0s–69.2s)',
    start: 28.0,
    end: 69.2,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/d13840111_Verse_2_Reader_Threshold.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/838f92f5b_generated_image.png',
    hook: 'Let a person make the choice',
  },
  {
    id: 'frayed',
    label: '3. Pre-Chorus 1A: Frayed Silver Thread (69.2s–83.0s)',
    start: 69.2,
    end: 83.0,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/4687022de_Frayed_Silver_Thread_76s.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/d613fa376_generated_image.png',
    hook: 'Verify before you act',
  },
  {
    id: 'hand-stops',
    label: '4. Pre-Chorus 1B: 100.3s The Hand Stops (83.0s–110.7s)',
    start: 83.0,
    end: 110.7,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/8a731d482_The_Hand_Stops_1003s.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/bf8f7a933_generated_image.png',
    hook: 'Keep the final say with us',
  },
  {
    id: 'cathedral-iconic',
    label: '5. Chorus 1: Iconic Cathedral Threshold (110.7s–152.2s)',
    start: 110.7,
    end: 152.2,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/0125e8613_Awakening_Cathedral_Video.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/445d5afa6_31-invideo-nanobanana_pro.png',
    hook: 'Check the source',
  },
  {
    id: 'breakdown',
    label: '6. Breakdown: Solo Piano Stillness (152.2s–166.6s)',
    start: 152.2,
    end: 166.6,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/14c28f038_Breakdown_Solo_Piano_152s.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/c67a485b9_generated_image.png',
    hook: 'Let a person make the choice',
  },
  {
    id: 'galaxy',
    label: '7. Final Chorus: Cosmic Cathedral Network (166.6s–190.7s)',
    start: 166.6,
    end: 190.7,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/a368caa8c_Final_Chorus_Galaxy_Aerial.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/f398432a7_generated_image.png',
    hook: 'Keep the final say with us',
  },
  {
    id: 'coda',
    label: '8. Credo & Coda: Companion Light (190.7s–217.9s)',
    start: 190.7,
    end: 217.9,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/4feeecb89_Coda_Companion_Light_190s.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/c67a485b9_generated_image.png',
    hook: 'Human judgment stays in command.',
  },
];

export default function HomeAwakeningVideoProofBanner() {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [timecode, setTimecode] = useState(0);

  const activeClip = STITCHED_CLIPS[activeIdx] || STITCHED_CLIPS[0];

  useEffect(() => {
    const aEl = audioRef.current;
    if (!aEl) return undefined;
    const onTime = () => {
      const t = aEl.currentTime || 0;
      setTimecode(t);
      const foundIdx = STITCHED_CLIPS.findIndex((c) => t >= c.start && t < c.end);
      if (foundIdx !== -1 && foundIdx !== activeIdx) {
        setActiveIdx(foundIdx);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    aEl.addEventListener('timeupdate', onTime);
    aEl.addEventListener('play', onPlay);
    aEl.addEventListener('pause', onPause);
    return () => {
      aEl.removeEventListener('timeupdate', onTime);
      aEl.removeEventListener('play', onPlay);
      aEl.removeEventListener('pause', onPause);
    };
  }, [activeIdx]);

  useEffect(() => {
    const vEl = videoRef.current;
    if (!vEl) return;
    const dur = Math.max(8, activeClip.end - activeClip.start);
    vEl.playbackRate = Math.max(0.35, Math.min(0.85, 6.0 / dur));
    if (playing) {
      vEl.play().catch(() => {});
    }
  }, [activeIdx, activeClip, playing]);

  const togglePlaySynced = () => {
    const vEl = videoRef.current;
    const aEl = audioRef.current;
    if (!aEl) return;
    aEl.muted = false;
    aEl.volume = 1.0;
    if (aEl.paused) {
      aEl.play().catch(() => {});
      vEl?.play().catch(() => {});
    } else {
      aEl.pause();
      vEl?.pause();
    }
  };

  const selectClipAndJump = (idx) => {
    setActiveIdx(idx);
    const clip = STITCHED_CLIPS[idx];
    if (audioRef.current && clip) {
      audioRef.current.currentTime = clip.start;
      setTimecode(clip.start);
    }
  };

  return (
    <section className="mb-6 rounded-lg border border-primary/50 bg-card p-4 space-y-3 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-success text-background text-[10px] font-bold inline-flex items-center gap-1">
              <CheckCircle2 size={11} /> 8-CLIP STITCHED AI MUSIC VIDEO + MASTER AUDIO PROOF
            </span>
            <h2 className="text-sm font-semibold text-foreground">
              THE AWAKENING OF AI — &ldquo;Check the Source&rdquo; (8 Real 16:9 Veo MP4 Clips Synced to 217.9s Audio)
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            Press Play to watch all 8 generated 16:9 AI cinema clips smoothly transition across your{' '}
            <strong className="text-foreground">ChecktheSource.mp3</strong> audio track without loop jumps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={togglePlaySynced} className="h-8 px-3 gap-1.5 text-xs">
            {playing ? <Pause size={13} /> : <Play size={13} />}
            {playing
              ? `Pause (${timecode.toFixed(1)}s / 217.9s)`
              : '▶ Play Full Stitched Video + Audio'}
          </Button>
          <Link to="/factory">
            <Button size="sm" variant="secondary" className="h-8 px-3 gap-1.5 text-xs">
              <Film size={13} /> Open Full Stitcher &amp; Export Deck
              <ExternalLink size={11} />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-2.5 rounded border border-success/40 bg-background flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px]">
          <Volume2 size={14} className={playing ? 'text-success animate-pulse' : 'text-primary'} />
          <strong className="text-foreground">Master Audio Track: ChecktheSource.mp3 (4.84 MB · 138 BPM · Stereo)</strong>
        </div>
        <audio
          ref={audioRef}
          src={AUDIO_MASTER}
          controls
          preload="auto"
          className="h-8 w-full sm:w-96"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-7">
          <div
            onClick={togglePlaySynced}
            className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-background cursor-pointer"
          >
            <video
              ref={videoRef}
              key={activeClip.video}
              src={activeClip.video}
              poster={activeClip.poster}
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded bg-background/85 border border-border text-[10px] text-foreground flex items-center gap-1.5 pointer-events-none">
              <Volume2 size={11} className={playing ? 'text-success animate-pulse' : 'text-muted-foreground'} />
              <span>
                {activeClip.label} · TC {timecode.toFixed(1)}s / 217.9s
              </span>
            </div>
            <div className="absolute bottom-2.5 left-4 right-4 text-center pointer-events-none">
              <span className="inline-block px-3 py-1 rounded bg-background/90 border border-caution/60 text-foreground font-serif text-xs uppercase tracking-wider">
                {activeClip.hook}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-1.5">
          <div className="text-[10.5px] font-bold text-primary">
            JUMP TO ANY OF THE 8 STITCHED AI VIDEO MOVEMENTS:
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
            {STITCHED_CLIPS.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectClipAndJump(idx)}
                className={`w-full text-left p-2 rounded border text-[10.5px] flex items-center justify-between gap-2 ${
                  activeIdx === idx
                    ? 'border-primary bg-primary/15 text-foreground font-bold'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="truncate">{c.label}</span>
                <span className="text-[9.5px] text-caution shrink-0">{c.start}s</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}