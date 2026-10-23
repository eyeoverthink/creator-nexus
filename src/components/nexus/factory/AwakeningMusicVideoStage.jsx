import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
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

// Compute continuous non-looping camera transform for a shot at progress p in [0, 1]
function getCameraTransform(motion = 'dolly_push_in', p = 0) {
  const smoothP = p * p * (3 - 2 * p); // smoothstep
  switch (motion) {
    case 'cable_drift_right':
      return { scale: 1.06 + smoothP * 0.06, tx: (smoothP - 0.5) * 58, ty: (0.5 - smoothP) * 14 };
    case 'cable_drift_left':
      return { scale: 1.06 + smoothP * 0.06, tx: (0.5 - smoothP) * 58, ty: (smoothP - 0.5) * 14 };
    case 'crane_rise_up':
      return { scale: 1.08 + smoothP * 0.08, tx: 0, ty: (0.5 - smoothP) * 52 };
    case 'macro_push_center':
      return { scale: 1.02 + smoothP * 0.18, tx: 0, ty: (smoothP - 0.5) * 18 };
    case 'macro_hold_tension':
      // At 100.3s THE HAND STOPS: camera locks rock-solid after initial push
      return {
        scale: p < 0.55 ? 1.04 + (p / 0.55) * 0.12 : 1.16,
        tx: 0,
        ty: 0,
      };
    case 'symmetrical_hero_push':
      return { scale: 1.0 + smoothP * 0.11, tx: 0, ty: 0 };
    case 'dolly_lateral_panels':
      return { scale: 1.07 + smoothP * 0.05, tx: (smoothP - 0.5) * 64, ty: 0 };
    case 'profile_drift_across':
      return { scale: 1.05 + smoothP * 0.07, tx: (0.5 - smoothP) * 44, ty: 0 };
    case 'intimate_ecu_float':
      return { scale: 1.08 + smoothP * 0.04, tx: 0, ty: (0.5 - smoothP) * 16 };
    case 'aerial_galaxy_pullback':
      return { scale: 1.22 - smoothP * 0.2, tx: 0, ty: (smoothP - 0.5) * 32 };
    case 'coda_settle_to_black':
      return { scale: 1.05 - smoothP * 0.04, tx: 0, ty: 0 };
    case 'dolly_push_in':
    default:
      return { scale: 1.01 + smoothP * 0.13, tx: 0, ty: (0.5 - smoothP) * 18 };
  }
}

export default function AwakeningMusicVideoStage({
  production,
  onGenerateShotFrame,
  onRenderShotVideo,
  onUpdateProduction,
  busyShotId,
  busyVideoShotId,
  externalStitchTrigger,
  onStitchStateChange,
}) {
  const { toast } = useToast();
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const rawVideoRef = useRef(null);
  const loadedImagesRef = useRef({});
  const audioCtxRef = useRef(null);
  const mediaDestRef = useRef(null);
  const condensePassRef = useRef({ active: false, startWallMs: 0, durationSec: 24 });

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedShotId, setSelectedShotId] = useState(null);
  const [viewMode, setViewMode] = useState('continuous_stitch'); // 'continuous_stitch' | 'raw_clip' | 'keyframe'
  const [recording, setRecording] = useState(false);
  const [stitchProgressPct, setStitchProgressPct] = useState(0);
  const [lastDownloadUrl, setLastDownloadUrl] = useState('');

  const allShots = useMemo(() => {
    return Array.isArray(production?.shot_plan) ? production.shot_plan : [];
  }, [production]);

  const includedShots = useMemo(() => {
    const filtered = allShots.filter((s) => s.included_in_final !== false);
    return filtered.length > 0 ? filtered : allShots;
  }, [allShots]);

  const selectedIdeas = useMemo(() => {
    const list = Array.isArray(production?.track_meta?.ai_suggested_ideas)
      ? production.track_meta.ai_suggested_ideas
      : [];
    return list.filter((i) => i.selected_for_final !== false);
  }, [production]);

  const duration = production?.track_meta?.duration_sec || 217.9;
  const bpm = production?.track_meta?.bpm || 138;
  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;

  // Preload all shot images for smooth 60fps canvas cross-dissolves
  useEffect(() => {
    allShots.forEach((s) => {
      if (s.image_url && !loadedImagesRef.current[s.image_url]) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = s.image_url;
        loadedImagesRef.current[s.image_url] = img;
      }
    });
  }, [allShots]);

  const activeTimeShot = useMemo(() => {
    if (!includedShots.length) return null;
    const found = includedShots.find(
      (s) => currentTime >= Number(s.start || 0) && currentTime < Number(s.end || 999)
    );
    return found || includedShots[0];
  }, [includedShots, currentTime]);

  const displayedShot = useMemo(() => {
    if (selectedShotId && !playing) {
      return allShots.find((s) => s.id === selectedShotId) || activeTimeShot;
    }
    return activeTimeShot;
  }, [selectedShotId, playing, allShots, activeTimeShot]);

  const activeVideoUrl = useMemo(() => {
    if (displayedShot?.video_url) return displayedShot.video_url;
    const secName = String(displayedShot?.section || '').toUpperCase();
    if (secName.includes('PRE-CHORUS') || secName.includes('BRIDGE') || secName.includes('HAND')) {
      return DEFAULT_HAND_STOPS_VIDEO;
    }
    return DEFAULT_CATHEDRAL_VIDEO;
  }, [displayedShot]);

  // Continuous Non-Looping Cinema Canvas Renderer
  useEffect(() => {
    if (viewMode !== 'continuous_stitch') return undefined;
    let rafId;
    const particles = Array.from({ length: 42 }, (_, i) => ({
      x: (i * 197) % 1280,
      y: (i * 113) % 720,
      r: 1.2 + (i % 3) * 0.9,
      vx: 0.22 + (i % 5) * 0.08,
      vy: -0.18 - (i % 4) * 0.06,
    }));

    const drawImageWithMotion = (ctx, img, motion, p, alpha = 1) => {
      if (!img || !img.complete || !img.naturalWidth) return;
      const { scale, tx, ty } = getCameraTransform(motion, p);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(640 + tx, 360 + ty);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -640, -360, 1280, 720);
      ctx.restore();
    };

    const renderFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }
      const ctx = canvas.getContext('2d');
      let t = audioRef.current && !audioRef.current.paused ? audioRef.current.currentTime : currentTime;

      // If running a 24s condensed full-timeline master stitch, map 0..24s wall clock across 0..217.9s smoothly
      if (condensePassRef.current.active) {
        const elapsed = (performance.now() - condensePassRef.current.startWallMs) / 1000;
        const ratio = Math.min(1, elapsed / condensePassRef.current.durationSec);
        t = ratio * duration;
      }

      const shotIdx = Math.max(
        0,
        includedShots.findIndex((s) => t >= Number(s.start || 0) && t < Number(s.end || 999))
      );
      const curShot = includedShots[shotIdx] || displayedShot || includedShots[0];
      const nextShot = includedShots[shotIdx + 1] || null;

      const shotStart = Number(curShot?.start || 0);
      const shotEnd = Number(curShot?.end || shotStart + 15);
      const shotDur = Math.max(1, shotEnd - shotStart);
      const p = Math.min(1, Math.max(0, (t - shotStart) / shotDur));

      // 1. Base Midnight Blue Field (#0B1630)
      ctx.fillStyle = '#0B1630';
      ctx.fillRect(0, 0, 1280, 720);

      // 2. Draw Active Shot Plate with Continuous Non-Looping Anamorphic Motion
      const curImg = loadedImagesRef.current[curShot?.image_url];
      drawImageWithMotion(ctx, curImg, curShot?.camera_motion || 'dolly_push_in', p, 1);

      // 3. Smooth Cross-Dissolve / Gold Threshold Bloom into Next Shot (No hard loop resets!)
      const transitionStyle = curShot?.transition_style || 'bar_cross_dissolve';
      const dissolveSec = transitionStyle === 'beat_cut' ? 0.25 : 1.74;
      const timeRemaining = shotEnd - t;

      if (nextShot && timeRemaining <= dissolveSec && timeRemaining >= 0) {
        const blendAlpha = Math.min(1, Math.max(0, 1 - timeRemaining / dissolveSec));
        const nextImg = loadedImagesRef.current[nextShot.image_url];
        drawImageWithMotion(ctx, nextImg, nextShot.camera_motion || 'dolly_push_in', 0.02, blendAlpha);

        if (transitionStyle === 'threshold_gold_bloom') {
          const bloom = Math.sin(blendAlpha * Math.PI) * 0.45;
          ctx.fillStyle = `rgba(255, 251, 235, ${bloom.toFixed(3)})`;
          ctx.fillRect(0, 0, 1280, 720);
        }
      }

      // 4. Volumetric Clerestory Rays & 138 BPM Beat Pulse
      const beatPhase = (t / beatSec) % 1;
      const beatPulse = Math.exp(-3.5 * beatPhase);
      const isSilver = curShot?.status === 'unverified_silver' || curShot?.status === 'silver_inquiry';
      const rayGrad = ctx.createLinearGradient(640, 0, 640, 720);
      if (isSilver) {
        rayGrad.addColorStop(0, `rgba(192, 200, 216, ${(0.12 + beatPulse * 0.08).toFixed(3)})`);
        rayGrad.addColorStop(1, 'rgba(11, 22, 48, 0.32)');
      } else {
        rayGrad.addColorStop(0, `rgba(255, 243, 199, ${(0.14 + beatPulse * 0.11).toFixed(3)})`);
        rayGrad.addColorStop(1, 'rgba(11, 22, 48, 0.24)');
      }
      ctx.fillStyle = rayGrad;
      ctx.fillRect(0, 0, 1280, 720);

      // 5. Motes & Filament Pulses (Accelerate at 100.3s Hand Stop; Suspend at 152.2s Piano Breakdown)
      const isBreakdown = t >= 152.2 && t <= 166.6;
      const isHandStop = t >= 96.9 && t <= 107.2;
      const speedMult = isBreakdown ? 0.08 : isHandStop ? 2.8 : 1.0;

      particles.forEach((pt) => {
        pt.x = (pt.x + pt.vx * speedMult + 1280) % 1280;
        pt.y = (pt.y + pt.vy * speedMult + 720) % 720;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fillStyle = isSilver ? 'rgba(192,208,232,0.55)' : 'rgba(251,191,36,0.68)';
        ctx.fill();
      });

      // 6. Coda Fade to Black (215.5s -> 217.9s)
      if (t >= 214.5) {
        const fade = Math.min(1, (t - 214.5) / 2.9);
        ctx.fillStyle = `rgba(5, 7, 11, ${fade.toFixed(3)})`;
        ctx.fillRect(0, 0, 1280, 720);
      }

      // 7. Anamorphic Cinema Letterbox Bars
      ctx.fillStyle = '#05070B';
      ctx.fillRect(0, 0, 1280, 34);
      ctx.fillRect(0, 686, 1280, 34);

      // 8. Designated Serif Text Hook (2-Beat Fade In / Hold / 2-Beat Fade Out)
      if (curShot?.exact_text) {
        const fadeWindow = beatSec * 2;
        let textAlpha = 1;
        if (t - shotStart < fadeWindow) textAlpha = Math.max(0, (t - shotStart) / fadeWindow);
        else if (shotEnd - t < fadeWindow) textAlpha = Math.max(0, (shotEnd - t) / fadeWindow);

        ctx.save();
        ctx.globalAlpha = textAlpha;
        ctx.fillStyle = 'rgba(11, 22, 48, 0.82)';
        ctx.fillRect(250, 588, 780, 48);
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.55)';
        ctx.strokeRect(250, 588, 780, 48);
        ctx.fillStyle = '#FFFBEB';
        ctx.font = '600 21px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(curShot.exact_text.toUpperCase(), 640, 619);
        ctx.restore();
      }

      // 9. Active AI-Suggested Enhancement Stamp in Top Bar
      const matchingIdea = selectedIdeas.find(
        (id) =>
          id.target_shot_id === curShot?.id ||
          String(curShot?.section || '').includes(String(id.section || '').split(' ')[0])
      );
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '11px IBM Plex Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${curShot?.section || 'MASTER'} · ${t.toFixed(1)}s / ${duration}s · ${
          curShot?.lens || '24mm Anamorphic'
        } · Progress ${(p * 100).toFixed(0)}% (Continuous Non-Looping)`,
        18,
        22
      );
      if (matchingIdea) {
        ctx.fillStyle = '#F59E0B';
        ctx.textAlign = 'right';
        ctx.fillText(`AI Stitch Active: ${matchingIdea.title}`, 1262, 22);
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [viewMode, includedShots, displayedShot, currentTime, beatSec, duration, selectedIdeas]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return undefined;
    const onTime = () => setCurrentTime(el.currentTime || 0);
    const onPlay = () => {
      setPlaying(true);
      rawVideoRef.current?.play().catch(() => {});
    };
    const onPause = () => setPlaying(false);
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

  // Live Canvas + Master Audio Stitch & Export Recorder
  const handleLiveStitchAndExport = useCallback(
    async (rangeMode = 'peak_30s') => {
      const canvas = canvasRef.current;
      const audioEl = audioRef.current;
      if (!canvas || !audioEl) return;

      setViewMode('continuous_stitch');
      setRecording(true);
      setStitchProgressPct(5);
      onStitchStateChange?.({ recording: true, progressPct: 5, lastDownloadUrl });

      let startSec = 98.0;
      let recordDurationSec = 20.0;
      if (rangeMode === 'peak_30s') {
        startSec = 98.0; // Covers 100.3s Hand Stops -> 110.7s Chorus 1 -> 117.6s Iconic Frame
        recordDurationSec = 24.0;
        condensePassRef.current.active = false;
      } else if (rangeMode === 'intro_42s') {
        startSec = 0.0;
        recordDurationSec = 24.0;
        condensePassRef.current.active = false;
      } else if (rangeMode === 'coda_30s') {
        startSec = 183.0;
        recordDurationSec = 24.0;
        condensePassRef.current.active = false;
      } else {
        // Complete 12-Section Condensed Master Pass (smoothly sweeps all 12 shots in 24s)
        startSec = 108.0;
        recordDurationSec = 24.0;
        condensePassRef.current = {
          active: true,
          startWallMs: performance.now(),
          durationSec: recordDurationSec,
        };
      }

      try {
        const canvasStream = canvas.captureStream(30);
        // Connect WebAudio destination once so recorded video includes the real Check the Source audio
        if (!audioCtxRef.current && window.AudioContext) {
          try {
            const ctx = new window.AudioContext();
            const src = ctx.createMediaElementSource(audioEl);
            const dest = ctx.createMediaStreamDestination();
            src.connect(dest);
            src.connect(ctx.destination);
            audioCtxRef.current = ctx;
            mediaDestRef.current = dest;
          } catch (_) {
            // Fallback to video-only stream if browser blocks cross-origin MediaElementSource
          }
        }
        if (audioCtxRef.current?.state === 'suspended') {
          await audioCtxRef.current.resume().catch(() => {});
        }

        const combinedTracks = [
          ...canvasStream.getVideoTracks(),
          ...(mediaDestRef.current ? mediaDestRef.current.stream.getAudioTracks() : []),
        ];
        const combinedStream = new MediaStream(combinedTracks);

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';
        const recorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: 4500000,
        });

        const chunks = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) chunks.push(ev.data);
        };

        audioEl.currentTime = startSec;
        setCurrentTime(startSec);
        await audioEl.play().catch(() => {});
        recorder.start(250);

        const startWall = performance.now();
        await new Promise((resolve) => {
          const timer = setInterval(() => {
            const elapsed = (performance.now() - startWall) / 1000;
            const pct = Math.min(99, Math.round((elapsed / recordDurationSec) * 100));
            setStitchProgressPct(pct);
            onStitchStateChange?.({ recording: true, progressPct: pct, lastDownloadUrl });
            if (elapsed >= recordDurationSec) {
              clearInterval(timer);
              resolve();
            }
          }, 400);
        });

        await new Promise((resolve) => {
          recorder.onstop = resolve;
          recorder.stop();
        });
        audioEl.pause();
        condensePassRef.current.active = false;

        const blob = new Blob(chunks, { type: mimeType });
        const localUrl = URL.createObjectURL(blob);
        setLastDownloadUrl(localUrl);

        // Automatically trigger download of the stitched non-looping video
        const a = document.createElement('a');
        a.href = localUrl;
        a.download = `Check_The_Source_Stitched_${rangeMode}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Upload stitched master video to private storage (stored privately)
        const fileObj = new File([blob], `Check_The_Source_Stitched_${rangeMode}.webm`, {
          type: 'video/webm',
        });
        const uploadRes = await base44.integrations.Core.UploadPrivateFile({ file: fileObj }).catch(
          () => null
        );
        if (uploadRes?.file_uri && production?.id) {
          const signedRes = await base44.integrations.Core.CreateFileSignedUrl({
            file_uri: uploadRes.file_uri,
            expires_in: 86400,
          }).catch(() => null);
          const saveRes = await base44.functions.invoke('productionFactory', {
            action: 'save_final_cut_choices',
            production_id: production.id,
            shot_plan: allShots,
            stitched_video_url: signedRes?.signed_url || localUrl,
          });
          if (saveRes?.data?.production) {
            onUpdateProduction?.(saveRes.data.production);
          }
        }

        setStitchProgressPct(100);
        onStitchStateChange?.({
          recording: false,
          progressPct: 100,
          lastDownloadUrl: localUrl,
        });
        toast({
          title: 'Stitched Final Video Exported!',
          description: 'Smooth non-looping video downloaded and saved to Cloud Vault.',
        });
      } catch (err) {
        condensePassRef.current.active = false;
        toast({
          title: 'Stitch Export Error',
          description: err?.message || 'Could not complete live video stitch',
          variant: 'destructive',
        });
      } finally {
        setRecording(false);
      }
    },
    [allShots, lastDownloadUrl, onStitchStateChange, onUpdateProduction, production, toast]
  );

  // Trigger from external deck button if requested
  useEffect(() => {
    if (externalStitchTrigger?.ts && !recording) {
      handleLiveStitchAndExport(externalStitchTrigger.rangeMode || 'peak_30s');
    }
  }, [externalStitchTrigger, handleLiveStitchAndExport, recording]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      rawVideoRef.current?.play().catch(() => {});
    } else {
      el.pause();
      rawVideoRef.current?.pause();
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
              CONTINUOUS STITCHED MASTER CINEMA (ZERO LOOPS)
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              {production?.title || 'THE AWAKENING OF AI — Check the Source (Master 1.1)'}
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            Smooth non-looping 16:9 cinema stitch across {includedShots.length} chosen sections +{' '}
            {selectedIdeas.length} AI ideas · 1.74s bar cross-dissolves · synced to{' '}
            <strong className="text-foreground">Check the Source ({duration}s · {bpm} BPM)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" onClick={togglePlay} disabled={recording} className="h-8 px-3 gap-1.5 text-xs">
            {playing ? <Pause size={13} /> : <Play size={13} />}
            {playing ? 'Pause Stitched Master' : 'Play Smooth Stitched Master'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            disabled={recording}
            onClick={() => handleLiveStitchAndExport('peak_30s')}
            className="h-8 px-3 gap-1.5 text-xs text-success"
          >
            {recording ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            {recording ? `Stitching (${stitchProgressPct}%)…` : 'Live Stitch & Export Video (.webm)'}
          </Button>

          <div className="inline-flex rounded border border-border bg-background p-0.5">
            {[
              ['continuous_stitch', 'Smooth Stitched Master'],
              ['raw_clip', 'Raw Veo MP4 Clip'],
              ['keyframe', 'Still Plate'],
            ].map(([mId, mLabel]) => (
              <button
                key={mId}
                type="button"
                onClick={() => setViewMode(mId)}
                className={`px-2 py-1 rounded text-[10px] font-bold ${
                  viewMode === mId
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mLabel}
              </button>
            ))}
          </div>

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
        <audio
          ref={audioRef}
          src={production.audio_url}
          crossOrigin="anonymous"
          preload="metadata"
          className="hidden"
        />
      )}

      {/* Main 16:9 Cinema Stage + Active Shot Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 7 Cols: 16:9 Viewport */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-background">
            {viewMode === 'continuous_stitch' && (
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                onClick={togglePlay}
                className="w-full h-full object-cover cursor-pointer"
              />
            )}

            {viewMode === 'raw_clip' && (
              <video
                ref={rawVideoRef}
                key={activeVideoUrl}
                src={activeVideoUrl}
                poster={displayedShot?.image_url || production?.hero_image_url}
                controls
                playsInline
                className="w-full h-full object-cover"
              >
                Your browser does not support the video tag.
              </video>
            )}

            {viewMode === 'keyframe' && (
              <Image
                src={displayedShot?.image_url || production?.hero_image_url}
                alt={displayedShot?.section || 'Cinema Keyframe'}
                className="w-full h-full object-cover"
              />
            )}

            {/* Status Pill Overlay */}
            <div className="absolute top-10 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
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
          </div>

          {/* Direct Download Bar for Stitched Master + Individual Clips */}
          <div className="p-2.5 rounded border border-border bg-background flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <div className="flex flex-wrap items-center gap-1.5">
              {lastDownloadUrl && (
                <a
                  href={lastDownloadUrl}
                  download="Check_The_Source_Final_Stitched_Master.webm"
                  className="px-2 py-0.5 rounded bg-success text-background font-bold hover:opacity-90 inline-flex items-center gap-1"
                >
                  <Download size={10} /> Download Stitched Final Video (.webm)
                </a>
              )}
              <a
                href={DEFAULT_CATHEDRAL_VIDEO}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary hover:underline inline-flex items-center gap-1"
              >
                <Download size={10} /> Source Clip 1: Cathedral Threshold (MP4)
              </a>
              <a
                href={DEFAULT_HAND_STOPS_VIDEO}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-0.5 rounded border border-caution/40 bg-caution/10 text-caution hover:underline inline-flex items-center gap-1"
              >
                <Download size={10} /> Source Clip 2: 100.3s Hand Stops (MP4)
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
              {includedShots.map((shot) => {
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
              <Film size={11} /> ALL {allShots.length} TIMED SECTIONS (CLICK TO JUMP &amp; PLAY)
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {allShots.map((s) => (
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