import { useState, useRef, useEffect, useMemo } from 'react';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  RotateCcw,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Loader2,
  Film,
  Video,
  Download,
} from 'lucide-react';

const DEFAULT_CATHEDRAL_VIDEO =
  'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/0125e8613_Awakening_Cathedral_Video.mp4';
const DEFAULT_HAND_STOPS_VIDEO =
  'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/8a731d482_The_Hand_Stops_1003s.mp4';

export default function AwakeningMusicVideoStage({
  production,
  onGenerateShotFrame,
  onRenderShotVideo,
  busyShotId,
  busyVideoShotId,
}) {
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedShotId, setSelectedShotId] = useState(null);
  const [viewMode, setViewMode] = useState('video_sync'); // 'video_sync' | 'keyframe'

  const shots = useMemo(() => {
    return Array.isArray(production?.shot_plan) ? production.shot_plan : [];
  }, [production]);

  const duration = production?.track_meta?.duration_sec || 217.9;
  const bpm = production?.track_meta?.bpm || 138;
  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;

  const activeTimeShot = useMemo(() => {
    if (!shots.length) return null;
    const found = shots.find(
      (s) => currentTime >= Number(s.start || 0) && currentTime < Number(s.end || 999)
    );
    return found || shots[0];
  }, [shots, currentTime]);

  const displayedShot = useMemo(() => {
    if (selectedShotId && !playing) {
      return shots.find((s) => s.id === selectedShotId) || activeTimeShot;
    }
    return activeTimeShot;
  }, [selectedShotId, playing, shots, activeTimeShot]);

  // Select the right generated MP4 clip for the active shot
  const activeVideoUrl = useMemo(() => {
    if (displayedShot?.video_url) return displayedShot.video_url;
    const secName = String(displayedShot?.section || '').toUpperCase();
    if (secName.includes('PRE-CHORUS') || secName.includes('BRIDGE') || secName.includes('HAND')) {
      return DEFAULT_HAND_STOPS_VIDEO;
    }
    return DEFAULT_CATHEDRAL_VIDEO;
  }, [displayedShot]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return undefined;
    const onTime = () => setCurrentTime(el.currentTime || 0);
    const onPlay = () => {
      setPlaying(true);
      videoRef.current?.play().catch(() => {});
    };
    const onPause = () => {
      setPlaying(false);
    };
    const onEnded = () => setPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
    };
  }, [production?.audio_url]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      videoRef.current?.play().catch(() => {});
    } else {
      el.pause();
      videoRef.current?.pause();
    }
  };

  const seekToShot = (shot) => {
    setSelectedShotId(shot.id);
    const target = Number(shot.start || 0);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const currentBeat = Math.floor(currentTime / beatSec) + 1;
  const currentBar = Math.floor(currentTime / barSec) + 1;
  const isVerifiedGold = displayedShot?.status !== 'unverified_silver';

  return (
    <div className="rounded-lg border border-primary/50 bg-card p-4 space-y-4 font-mono text-xs">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-success text-background text-[10px] font-bold">
              GENERATED 16:9 VIDEO + MASTER AUDIO PROOF
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              {production?.title || 'THE AWAKENING OF AI — Check the Source (Master 1.1)'}
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            Master Track: <strong className="text-foreground">{production?.track_meta?.title || 'Check the Source (Master 1.1)'}</strong> ·{' '}
            {duration}s · {production?.track_meta?.key || 'E minor'} · {bpm} BPM (beat ≈ {beatSec.toFixed(3)}s, bar ≈{' '}
            {barSec.toFixed(2)}s) · 2 AI-Rendered MP4 Clips + 5 Section Keyframes Mounted
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" onClick={togglePlay} className="h-8 px-3 gap-1.5 text-xs">
            {playing ? <Pause size={13} /> : <Play size={13} />}
            {playing ? 'Pause Music Video' : 'Play Full Music Video + Master Audio'}
          </Button>

          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'video_sync' ? 'keyframe' : 'video_sync'))}
            className="h-8 px-2.5 rounded border border-border bg-background text-[10.5px] font-semibold text-foreground hover:border-primary inline-flex items-center gap-1"
          >
            <Video size={12} className="text-primary" />
            {viewMode === 'video_sync' ? 'Mode: Live MP4 Video' : 'Mode: Still Keyframe'}
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 100.3;
                setCurrentTime(100.3);
              }
            }}
            className="h-8 px-2 text-[10.5px]"
          >
            100.3s (Hand Stops)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 117.6;
                setCurrentTime(117.6);
              }
            }}
            className="h-8 px-2 text-[10.5px]"
          >
            117.6s (Iconic Frame)
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
              setCurrentTime(0);
            }}
            className="h-8 px-2 text-[11px]"
          >
            <RotateCcw size={12} />
          </Button>
        </div>
      </div>

      {/* Master Audio Element */}
      {production?.audio_url && (
        <audio ref={audioRef} src={production.audio_url} preload="metadata" className="hidden" />
      )}

      {/* Main 16:9 Cinema Stage + Active Shot Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 7 Cols: 16:9 Viewport */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-background">
            {viewMode === 'video_sync' ? (
              <video
                ref={videoRef}
                key={activeVideoUrl}
                src={activeVideoUrl}
                poster={displayedShot?.image_url || production?.hero_image_url}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full h-full object-cover"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <Image
                src={displayedShot?.image_url || production?.hero_image_url}
                alt={displayedShot?.section || 'Cinema Keyframe'}
                className="w-full h-full object-cover"
              />
            )}

            {/* Top Overlay: Timecode, Bar/Beat & Lensing */}
            <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="px-2.5 py-1 rounded bg-background/85 border border-border text-[10.5px] text-foreground flex items-center gap-2">
                <Volume2 size={12} className={playing ? 'text-success animate-pulse' : 'text-muted-foreground'} />
                <span>
                  TC: <strong>{currentTime.toFixed(1)}s</strong> / {duration}s
                </span>
                <span className="text-muted-foreground">|</span>
                <span>
                  Bar <strong>{currentBar}</strong> · Beat <strong>{currentBeat}</strong>
                </span>
              </div>

              <div
                className={`px-2.5 py-1 rounded border text-[10px] font-bold flex items-center gap-1.5 ${
                  isVerifiedGold
                    ? 'bg-background/85 border-caution text-caution'
                    : 'bg-background/85 border-border text-muted-foreground'
                }`}
              >
                {isVerifiedGold ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                {isVerifiedGold ? 'VERIFIED TRUTH · GOLDEN-WHITE' : 'UNVERIFIED THREAD · SILVER'}
              </div>
            </div>

            {/* Designated Serif Hook Overlay (Only when exact_text is present in shot) */}
            {displayedShot?.exact_text && (
              <div className="absolute inset-x-6 bottom-14 text-center pointer-events-none">
                <div className="inline-block px-4 py-1.5 rounded bg-background/85 border border-caution/60 text-foreground font-serif tracking-widest uppercase text-xs md:text-sm">
                  {displayedShot.exact_text}
                </div>
              </div>
            )}
          </div>

          {/* Direct Generated Video Clip Switcher & Download Bar */}
          <div className="p-2.5 rounded border border-border bg-background flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground font-semibold">GENERATED MP4 REELS:</span>
              <a
                href={DEFAULT_CATHEDRAL_VIDEO}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary hover:underline inline-flex items-center gap-1"
              >
                <Download size={10} /> Clip 1: Cathedral Iconic Threshold (MP4)
              </a>
              <a
                href={DEFAULT_HAND_STOPS_VIDEO}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-0.5 rounded border border-caution/40 bg-caution/10 text-caution hover:underline inline-flex items-center gap-1"
              >
                <Download size={10} /> Clip 2: 100.3s The Hand Stops (MP4)
              </a>
            </div>
            {production?.audio_url && (
              <a
                href={production.audio_url}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground underline inline-flex items-center gap-1"
              >
                <Download size={10} /> Master Audio (ChecktheSource.mp3)
              </a>
            )}
          </div>

          {/* Interactive Timeline Strip */}
          <div className="space-y-1">
            <div className="flex h-7 w-full gap-0.5 rounded overflow-hidden border border-border bg-background p-0.5">
              {shots.map((shot) => {
                const isActive = displayedShot?.id === shot.id;
                const span = Math.max(4, Number(shot.end || 10) - Number(shot.start || 0));
                return (
                  <button
                    key={shot.id}
                    type="button"
                    onClick={() => seekToShot(shot)}
                    style={{ flexGrow: span, flexBasis: 0 }}
                    title={`${shot.section} (${shot.start}s - ${shot.end}s)`}
                    className={`h-full rounded-sm transition-colors text-[8.5px] font-bold truncate px-1 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : shot.status === 'unverified_silver'
                        ? 'bg-secondary text-muted-foreground hover:bg-hover'
                        : 'bg-secondary/60 text-foreground/80 hover:bg-hover'
                    }`}
                  >
                    {shot.section}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[9.5px] text-muted-foreground">
              <span>0.0s · INTRO</span>
              <span>76.1s · FRAYED THREAD (SILVER)</span>
              <span>100.3s · THE HAND STOPS</span>
              <span>117.6s · ICONIC FRAME</span>
              <span>183.9s · ESCALATION</span>
              <span>217.9s · CODA</span>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Active Shot Camera, Light & Direction Inspector */}
        <div className="lg:col-span-5 p-3.5 rounded-lg border border-border bg-background space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <div>
              <span className="text-[10px] text-muted-foreground block">ACTIVE SHOT SPECIFICATION</span>
              <h4 className="text-xs font-bold text-foreground">
                {displayedShot?.section} · {displayedShot?.start}s to {displayedShot?.end}s
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {displayedShot && onGenerateShotFrame && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyShotId === displayedShot.id}
                  onClick={() => onGenerateShotFrame(displayedShot.id)}
                  className="h-7 px-2 text-[10px] gap-1"
                >
                  {busyShotId === displayedShot.id ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Sparkles size={10} />
                  )}
                  New Keyframe
                </Button>
              )}
              {displayedShot && onRenderShotVideo && (
                <Button
                  size="sm"
                  disabled={busyVideoShotId === displayedShot.id}
                  onClick={() => onRenderShotVideo(displayedShot.id)}
                  className="h-7 px-2.5 text-[10px] gap-1"
                >
                  {busyVideoShotId === displayedShot.id ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Video size={10} />
                  )}
                  Render 6s AI Video
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2 text-[11px] font-body">
            <div className="p-2 rounded bg-card border border-border">
              <span className="text-[9.5px] font-mono text-muted-foreground block">MUSICAL JOB</span>
              <p className="text-foreground">{displayedShot?.musical_job}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2 rounded bg-card border border-border">
                <span className="text-[9.5px] font-mono text-muted-foreground block">CAMERA / ANAMORPHIC LENS</span>
                <p className="text-primary font-medium">{displayedShot?.lens}</p>
              </div>
              <div className="p-2 rounded bg-card border border-border">
                <span className="text-[9.5px] font-mono text-muted-foreground block">VOLUMETRIC LIGHTING</span>
                <p className="text-caution font-medium">{displayedShot?.light}</p>
              </div>
            </div>

            <div className="p-2.5 rounded bg-card border border-border space-y-1">
              <span className="text-[9.5px] font-mono text-muted-foreground block">
                DIRECTOR VISUAL &amp; PERFORMANCE ACTION
              </span>
              <p className="text-foreground leading-relaxed">{displayedShot?.visual_direction}</p>
            </div>

            {displayedShot?.exact_text && (
              <div className="p-2 rounded border border-caution/50 bg-caution/10 text-caution font-mono text-[10.5px]">
                DESIGNATED ON-SCREEN SERIF TEXT: &ldquo;{displayedShot.exact_text}&rdquo;
              </div>
            )}
          </div>

          {/* All Shots Quick Selector */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
              <Film size={11} /> ALL {shots.length} TIMED SECTIONS (CLICK TO JUMP &amp; PLAY)
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {shots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => seekToShot(s)}
                  className={`w-full text-left px-2.5 py-1.5 rounded border text-[10.5px] flex items-center justify-between gap-2 ${
                    displayedShot?.id === s.id
                      ? 'border-primary bg-primary/15 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="truncate font-semibold">{s.section}</span>
                  <span className="shrink-0 text-[9.5px]">
                    {s.start}s–{s.end}s
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}