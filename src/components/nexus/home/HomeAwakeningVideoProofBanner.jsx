import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Pause, Film, ExternalLink, Volume2, CheckCircle2 } from 'lucide-react';

const AUDIO_MASTER =
  'https://media.base44.com/files/public/6ad00af14909c671e73bb835/79561d060_ChecktheSource.mp3';

const STITCHED_CLIPS = [
  {
    id: 'sec-01-intro',
    label: '1. INTRO: Awakening Nave (0.0s–14.1s)',
    start: 0.0,
    end: 14.1,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/b9bdcbcbe_generated_video.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/3fbd5a250_generated_image.png',
    hook: 'Check the source',
  },
  {
    id: 'sec-02-verse1',
    label: '2. VERSE 1: Pew Nodes Ignite (14.1s–27.9s)',
    start: 14.1,
    end: 27.9,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/715cbb381_generated_video.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/c67a485b9_generated_image.png',
    hook: 'Check the source',
  },
  {
    id: 'sec-03-choir',
    label: '3. CHOIR INTERLUDE: 40m Lattice Lift (27.9s–41.7s)',
    start: 27.9,
    end: 41.7,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/bfd5d4d22_generated_video.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/445d5afa6_31-invideo-nanobanana_pro.png',
    hook: 'Let a person make the choice',
  },
  {
    id: 'sec-04-verse2',
    label: '4. VERSE 2: Reader at Threshold (41.7s–69.2s)',
    start: 41.7,
    end: 69.2,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/7326ab4f9_generated_video.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/838f92f5b_generated_image.png',
    hook: 'Let a person make the choice',
  },
  {
    id: 'sec-05-prechorus1a',
    label: '5. PRE-CHORUS 1A: Frayed Silver Thread (69.2s–83.0s)',
    start: 69.2,
    end: 83.0,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/de20c2592_generated_video.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/d613fa376_generated_image.png',
    hook: 'Verify before you act',
  },
  {
    id: 'sec-06-prechorus1b',
    label: '6. PRE-CHORUS 1B: 100.3s The Hand Stops (83.0s–110.7s)',
    start: 83.0,
    end: 110.7,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/e54ca34fe_generated_video.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/bf8f7a933_generated_image.png',
    hook: 'Keep the final say with us',
  },
  {
    id: 'sec-07-chorus1',
    label: '7. CHORUS 1: Iconic Cathedral Frame (110.7s–124.5s)',
    start: 110.7,
    end: 124.5,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/efeb90b70_generated_video.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/445d5afa6_31-invideo-nanobanana_pro.png',
    hook: 'Check the source | Let a person make the choice',
  },
  {
    id: 'sec-08-postchorus',
    label: '8. POST-CHORUS: Glass Partitions (124.5s–138.2s)',
    start: 124.5,
    end: 138.2,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/242d0a56d_generated_video.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/d613fa376_generated_image.png',
    hook: 'Verify before you act',
  },
  {
    id: 'sec-09-bridge',
    label: '9. BRIDGE: Sphere Handoff (138.2s–152.2s)',
    start: 138.2,
    end: 152.2,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/8a731d482_The_Hand_Stops_1003s.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/bf8f7a933_generated_image.png',
    hook: 'Let a person make the choice',
  },
  {
    id: 'sec-10-breakdown',
    label: '10. BREAKDOWN & BUILD: Solo Piano (152.2s–177.0s)',
    start: 152.2,
    end: 177.0,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/d78ea4930_generated_video.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/c67a485b9_generated_image.png',
    hook: 'Verify before you act',
  },
  {
    id: 'sec-11-finalchorus',
    label: '11. FINAL CHORUS: Galaxy Network (177.0s–190.7s)',
    start: 177.0,
    end: 190.7,
    video: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/a368caa8c_Final_Chorus_Galaxy_Aerial.mp4',
    poster: 'https://media.base44.com/images/public/6ad00af14909c671e73bb835/f398432a7_generated_image.png',
    hook: 'Keep the final say with us',
  },
  {
    id: 'sec-12-credo-coda',
    label: '12. CREDO & CODA: Companion Light (190.7s–217.9s)',
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
            ALL 12 STITCHED MP4 SECTIONS (0.0s–217.9s FULL SONG):
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
                <span className="text-[9.5px] text-caution shrink-0">
                  {c.start}s–{c.end}s
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Permanent Save Locations & Direct Full-Movie Access Bar */}
      <div className="p-2.5 rounded border border-border bg-background flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-success">PERMANENT SAVE LOCATIONS:</span>
          <span className="text-muted-foreground">
            1. Local <strong className="text-foreground">~/Downloads</strong> · 2.{' '}
            <strong className="text-foreground">Base44 Public Media CDN</strong> (12 MP4s + 4.84MB MP3) · 3.{' '}
            <Link to="/library" className="text-link underline">
              Library (/library)
            </Link>{' '}
            · 4.{' '}
            <Link to="/loose-screw" className="text-link underline">
              looseScrew (/loose-screw)
            </Link>
          </span>
        </div>
        <Link
          to="/factory"
          className="px-2.5 py-1 rounded bg-primary text-primary-foreground font-bold hover:opacity-90"
        >
          Stitch &amp; Download Entire 12-Clip Video + View History →
        </Link>
      </div>
    </section>
  );
}