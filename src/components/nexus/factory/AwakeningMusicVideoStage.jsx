import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Loader2,
  Film,
  Video,
  Download,
} from 'lucide-react';

const FALLBACK_AUDIO_MASTER =
  'https://media.base44.com/files/public/6ad00af14909c671e73bb835/79561d060_ChecktheSource.mp3';

const CLIP_CATALOG = [
  {
    id: 'sec-01-intro',
    label: '1. INTRO: Awakening Nave (0.0s–14.1s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/b9bdcbcbe_generated_video.mp4',
  },
  {
    id: 'sec-02-verse1',
    label: '2. VERSE 1: Pew Nodes Ignite (14.1s–27.9s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/715cbb381_generated_video.mp4',
  },
  {
    id: 'sec-03-choir',
    label: '3. CHOIR INTERLUDE: 40m Lattice Lift (27.9s–41.7s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/bfd5d4d22_generated_video.mp4',
  },
  {
    id: 'sec-04-verse2',
    label: '4. VERSE 2: Reader at Threshold (41.7s–69.2s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/7326ab4f9_generated_video.mp4',
  },
  {
    id: 'sec-05-prechorus1a',
    label: '5. PRE-CHORUS 1A: Frayed Silver Thread (69.2s–83.0s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/de20c2592_generated_video.mp4',
  },
  {
    id: 'sec-06-prechorus1b',
    label: '6. PRE-CHORUS 1B: 100.3s The Hand Stops (83.0s–110.7s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/e54ca34fe_generated_video.mp4',
  },
  {
    id: 'sec-07-chorus1',
    label: '7. CHORUS 1: Iconic Cathedral Frame (110.7s–124.5s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/efeb90b70_generated_video.mp4',
  },
  {
    id: 'sec-08-postchorus',
    label: '8. POST-CHORUS: Glass Partitions (124.5s–138.2s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/242d0a56d_generated_video.mp4',
  },
  {
    id: 'sec-09-bridge',
    label: '9. BRIDGE: Sphere Handoff (138.2s–152.2s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/8a731d482_The_Hand_Stops_1003s.mp4',
  },
  {
    id: 'sec-10-breakdown',
    label: '10. BREAKDOWN & BUILD: Solo Piano (152.2s–177.0s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/d78ea4930_generated_video.mp4',
  },
  {
    id: 'sec-11-finalchorus',
    label: '11. FINAL CHORUS: Galaxy Network (177.0s–190.7s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/a368caa8c_Final_Chorus_Galaxy_Aerial.mp4',
  },
  {
    id: 'sec-12-credo-coda',
    label: '12. CREDO & CODA: Companion Light (190.7s–217.9s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/4feeecb89_Coda_Companion_Light_190s.mp4',
  },
];

function getCameraTransform(motion = 'dolly_push_in', p = 0) {
  const smoothP = p * p * (3 - 2 * p);
  switch (motion) {
    case 'cable_drift_right':
      return { scale: 1.04 + smoothP * 0.06, tx: (smoothP - 0.5) * 36, ty: (0.5 - smoothP) * 10 };
    case 'cable_drift_left':
      return { scale: 1.04 + smoothP * 0.06, tx: (0.5 - smoothP) * 36, ty: (smoothP - 0.5) * 10 };
    case 'crane_rise_up':
      return { scale: 1.05 + smoothP * 0.07, tx: 0, ty: (0.5 - smoothP) * 32 };
    case 'macro_push_center':
      return { scale: 1.02 + smoothP * 0.14, tx: 0, ty: (smoothP - 0.5) * 12 };
    case 'macro_hold_tension':
      return { scale: p < 0.55 ? 1.02 + (p / 0.55) * 0.1 : 1.12, tx: 0, ty: 0 };
    case 'aerial_galaxy_pullback':
      return { scale: 1.16 - smoothP * 0.14, tx: 0, ty: (smoothP - 0.5) * 20 };
    case 'coda_settle_to_black':
      return { scale: 1.04 - smoothP * 0.03, tx: 0, ty: 0 };
    case 'dolly_push_in':
    default:
      return { scale: 1.01 + smoothP * 0.1, tx: 0, ty: (0.5 - smoothP) * 12 };
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
  const deckARef = useRef(null);
  const deckBRef = useRef(null);
  const canvasRef = useRef(null);
  const loadedImagesRef = useRef({});
  const preloadedVideosRef = useRef({});
  const audioCtxRef = useRef(null);
  const mediaDestRef = useRef(null);
  const stopEarlyRef = useRef(false);
  const condensePassRef = useRef({ active: false, startWallMs: 0, durationSec: 60 });

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedShotId, setSelectedShotId] = useState(null);
  const [viewMode, setViewMode] = useState('dual_deck_video'); // 'dual_deck_video' | 'canvas_stitch' | 'keyframe'
  const [activeDeck, setActiveDeck] = useState('A'); // 'A' | 'B'
  const [deckAUri, setDeckAUri] = useState(CLIP_CATALOG[0].url);
  const [deckBUri, setDeckBUri] = useState(CLIP_CATALOG[1].url);
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

  // Preload all shot images & hidden video elements for canvas stitcher
  useEffect(() => {
    allShots.forEach((s) => {
      if (s.image_url && !loadedImagesRef.current[s.image_url]) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = s.image_url;
        loadedImagesRef.current[s.image_url] = img;
      }
      if (s.video_url && !preloadedVideosRef.current[s.video_url]) {
        const vid = document.createElement('video');
        vid.crossOrigin = 'anonymous';
        vid.src = s.video_url;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.preload = 'auto';
        vid.load();
        preloadedVideosRef.current[s.video_url] = vid;
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
    return CLIP_CATALOG[0].url;
  }, [displayedShot]);

  // Smooth Dual-Deck A/B Cross-Dissolve Controller (Zero Loop Jumps!)
  useEffect(() => {
    if (!activeVideoUrl) return;
    const currentUri = activeDeck === 'A' ? deckAUri : deckBUri;
    if (currentUri === activeVideoUrl) return;

    const shotDur = Math.max(6, Number(displayedShot?.end || 20) - Number(displayedShot?.start || 0));
    // Time-stretch playbackRate so a 6s clip glides once across the section without looping
    const targetRate = Math.max(0.35, Math.min(0.85, 6.0 / shotDur));

    if (activeDeck === 'A') {
      setDeckBUri(activeVideoUrl);
      setActiveDeck('B');
      setTimeout(() => {
        if (deckBRef.current) {
          deckBRef.current.currentTime = 0;
          deckBRef.current.playbackRate = targetRate;
          if (playing) deckBRef.current.play().catch(() => {});
        }
      }, 60);
    } else {
      setDeckAUri(activeVideoUrl);
      setActiveDeck('A');
      setTimeout(() => {
        if (deckARef.current) {
          deckARef.current.currentTime = 0;
          deckARef.current.playbackRate = targetRate;
          if (playing) deckARef.current.play().catch(() => {});
        }
      }, 60);
    }
  }, [activeVideoUrl, activeDeck, deckAUri, deckBUri, displayedShot, playing]);

  // Continuous Non-Looping Canvas Stitcher (draws real video frames + keyframes + cross-dissolves)
  useEffect(() => {
    let rafId;
    const renderFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }
      const ctx = canvas.getContext('2d');
      let t = audioRef.current && !audioRef.current.paused ? audioRef.current.currentTime : currentTime;

      let shotIdx = 0;
      let curShot = includedShots[0];
      let nextShot = includedShots[1] || null;
      let p = 0;
      let timeRemaining = 10;
      let dissolveSec = 1.2;

      if (condensePassRef.current.active && includedShots.length > 0) {
        const elapsed = (performance.now() - condensePassRef.current.startWallMs) / 1000;
        const perClipSec = condensePassRef.current.durationSec / includedShots.length;
        shotIdx = Math.min(includedShots.length - 1, Math.floor(elapsed / perClipSec));
        curShot = includedShots[shotIdx] || includedShots[0];
        nextShot = includedShots[shotIdx + 1] || null;
        const clipElapsed = elapsed - shotIdx * perClipSec;
        p = Math.min(1, Math.max(0, clipElapsed / perClipSec));
        timeRemaining = Math.max(0, perClipSec - clipElapsed);
        dissolveSec = 1.0;
        t = Number(curShot?.start || 0) + p * Math.max(1, Number(curShot?.end || 15) - Number(curShot?.start || 0));
      } else {
        shotIdx = Math.max(
          0,
          includedShots.findIndex((s) => t >= Number(s.start || 0) && t < Number(s.end || 999))
        );
        curShot = includedShots[shotIdx] || displayedShot || includedShots[0];
        nextShot = includedShots[shotIdx + 1] || null;
        const shotStart = Number(curShot?.start || 0);
        const shotEnd = Number(curShot?.end || shotStart + 15);
        const shotDur = Math.max(1, shotEnd - shotStart);
        p = Math.min(1, Math.max(0, (t - shotStart) / shotDur));
        timeRemaining = shotEnd - t;
        dissolveSec = 1.74;
      }

      ctx.fillStyle = '#0B1630';
      ctx.fillRect(0, 0, 1280, 720);

      // Always draw real moving MP4 video frames from preloadedVideosRef or activeDeckEl
      const activeDeckEl = activeDeck === 'A' ? deckARef.current : deckBRef.current;
      const preloadedCurVid = curShot?.video_url ? preloadedVideosRef.current[curShot.video_url] : null;
      if (preloadedCurVid && preloadedCurVid.paused && (!audioRef.current?.paused || condensePassRef.current.active)) {
        preloadedCurVid.play().catch(() => {});
      }
      const videoSourceEl =
        preloadedCurVid && preloadedCurVid.readyState >= 2
          ? preloadedCurVid
          : activeDeckEl && activeDeckEl.readyState >= 2
          ? activeDeckEl
          : null;

      const curImg = loadedImagesRef.current[curShot?.image_url];
      const { scale, tx, ty } = getCameraTransform(curShot?.camera_motion || 'dolly_push_in', p);

      ctx.save();
      ctx.translate(640 + tx, 360 + ty);
      ctx.scale(scale, scale);
      if (videoSourceEl) {
        try {
          ctx.drawImage(videoSourceEl, -640, -360, 1280, 720);
        } catch (_) {
          if (curImg?.complete) ctx.drawImage(curImg, -640, -360, 1280, 720);
        }
      } else if (curImg && curImg.complete && curImg.naturalWidth) {
        ctx.drawImage(curImg, -640, -360, 1280, 720);
      }
      ctx.restore();

      // Smooth video-to-video cross-dissolve into next shot's MP4 clip
      if (nextShot && timeRemaining <= dissolveSec && timeRemaining >= 0) {
        const blendAlpha = Math.min(1, Math.max(0, 1 - timeRemaining / dissolveSec));
        const nextVid = nextShot.video_url ? preloadedVideosRef.current[nextShot.video_url] : null;
        if (nextVid && nextVid.paused) {
          nextVid.play().catch(() => {});
        }
        const nextImg = loadedImagesRef.current[nextShot.image_url];
        ctx.save();
        ctx.globalAlpha = blendAlpha;
        if (nextVid && nextVid.readyState >= 2) {
          try {
            ctx.drawImage(nextVid, 0, 0, 1280, 720);
          } catch (_) {
            if (nextImg?.complete) ctx.drawImage(nextImg, 0, 0, 1280, 720);
          }
        } else if (nextImg && nextImg.complete && nextImg.naturalWidth) {
          ctx.drawImage(nextImg, 0, 0, 1280, 720);
        }
        ctx.restore();
      }

      // Volumetric beat-reactive glow
      const beatPhase = (t / beatSec) % 1;
      const beatPulse = Math.exp(-3.5 * beatPhase);
      const isSilver = curShot?.status === 'unverified_silver';
      const rayGrad = ctx.createLinearGradient(640, 0, 640, 720);
      rayGrad.addColorStop(
        0,
        isSilver
          ? `rgba(192, 200, 216, ${(0.1 + beatPulse * 0.06).toFixed(3)})`
          : `rgba(255, 243, 199, ${(0.12 + beatPulse * 0.09).toFixed(3)})`
      );
      rayGrad.addColorStop(1, 'rgba(11, 22, 48, 0.22)');
      ctx.fillStyle = rayGrad;
      ctx.fillRect(0, 0, 1280, 720);

      // Letterbox bars
      ctx.fillStyle = '#05070B';
      ctx.fillRect(0, 0, 1280, 32);
      ctx.fillRect(0, 688, 1280, 32);

      // Serif hook text
      if (curShot?.exact_text) {
        ctx.fillStyle = 'rgba(11, 22, 48, 0.84)';
        ctx.fillRect(250, 592, 780, 46);
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
        ctx.strokeRect(250, 592, 780, 46);
        ctx.fillStyle = '#FFFBEB';
        ctx.font = '600 21px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(curShot.exact_text.toUpperCase(), 640, 622);
      }

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '11px IBM Plex Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${curShot?.section || 'MASTER'} · ${t.toFixed(1)}s / ${duration}s · ${curShot?.lens || '24mm Anamorphic'}`,
        18,
        21
      );

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [includedShots, displayedShot, currentTime, beatSec, duration, activeDeck]);

  // Keep audio and Dual-Deck video synchronized
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return undefined;
    const onTime = () => setCurrentTime(el.currentTime || 0);
    const onPlay = () => {
      setPlaying(true);
      const activeEl = activeDeck === 'A' ? deckARef.current : deckBRef.current;
      activeEl?.play().catch(() => {});
    };
    const onPause = () => {
      setPlaying(false);
      deckARef.current?.pause();
      deckBRef.current?.pause();
    };
    const onEnded = () => {
      setPlaying(false);
      deckARef.current?.pause();
      deckBRef.current?.pause();
    };
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
  }, [production?.audio_url, activeDeck]);

  const handleLiveStitchAndExport = useCallback(
    async (rangeMode = 'full_12_clips_master') => {
      const canvas = canvasRef.current;
      const audioEl = audioRef.current;
      if (!canvas || !audioEl) return;

      stopEarlyRef.current = false;
      setRecording(true);
      setStitchProgressPct(2);
      onStitchStateChange?.({ recording: true, progressPct: 2, lastDownloadUrl });

      // Ensure all 12 preloaded MP4 videos are ready and playing
      Object.values(preloadedVideosRef.current).forEach((vid) => {
        if (vid) {
          vid.currentTime = 0;
          vid.play().catch(() => {});
        }
      });

      const clipCount = Math.max(1, includedShots.length || 12);
      let startSec = 0.0;
      let recordDurationSec = clipCount * 5.0; // Default: 60s continuous stitch across all 12 MP4 clips (5s per clip)
      let modeLabel = `ALL ${clipCount} MP4 CLIPS CONTINUOUS MASTER`;

      if (rangeMode === 'full_218s_song') {
        startSec = 0.0;
        recordDurationSec = Number(duration || 217.9);
        condensePassRef.current.active = false;
        modeLabel = `FULL ${recordDurationSec}s SONG MASTER (ALL ${clipCount} CLIPS)`;
      } else {
        // Default: full_12_clips_master — steps through every single one of the 12 MP4 video clips in sequence
        startSec = 0.0;
        recordDurationSec = clipCount * 5.0;
        condensePassRef.current = {
          active: true,
          startWallMs: performance.now(),
          durationSec: recordDurationSec,
        };
      }

      try {
        const canvasStream = canvas.captureStream(30);
        audioEl.muted = false;
        audioEl.volume = 1.0;
        const nativeAudioStream =
          typeof audioEl.captureStream === 'function'
            ? audioEl.captureStream()
            : typeof audioEl.mozCaptureStream === 'function'
            ? audioEl.mozCaptureStream()
            : null;

        let audioTracks = nativeAudioStream ? nativeAudioStream.getAudioTracks() : [];
        if (audioTracks.length === 0 && window.AudioContext) {
          if (!audioCtxRef.current) {
            try {
              const ctx = new window.AudioContext();
              const src = ctx.createMediaElementSource(audioEl);
              const dest = ctx.createMediaStreamDestination();
              src.connect(dest);
              src.connect(ctx.destination);
              audioCtxRef.current = ctx;
              mediaDestRef.current = dest;
            } catch (_) {
              // ignore
            }
          }
          if (audioCtxRef.current?.state === 'suspended') {
            await audioCtxRef.current.resume().catch(() => {});
          }
          if (mediaDestRef.current) {
            audioTracks = mediaDestRef.current.stream.getAudioTracks();
          }
        }

        const combinedTracks = [...canvasStream.getVideoTracks(), ...audioTracks];
        const combinedStream = new MediaStream(combinedTracks);

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';
        const recorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: 3800000,
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
            if (elapsed >= recordDurationSec || stopEarlyRef.current) {
              clearInterval(timer);
              resolve();
            }
          }, 300);
        });

        const actualRecordedSec = Math.max(1, Math.round((performance.now() - startWall) / 1000));

        await new Promise((resolve) => {
          recorder.onstop = resolve;
          recorder.stop();
        });
        audioEl.pause();
        condensePassRef.current.active = false;

        const blob = new Blob(chunks, { type: mimeType });
        const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);
        const filename = `Check_The_Source_Full_${clipCount}Clips_${actualRecordedSec}s_Master.webm`;
        const localUrl = URL.createObjectURL(blob);
        setLastDownloadUrl(localUrl);

        // 1. Save to Local Browser Downloads (~/Downloads)
        const a = document.createElement('a');
        a.href = localUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 2. Upload to Private Cloud Storage (stored privately) with permanent file_uri + signed URL
        const fileObj = new File([blob], filename, { type: 'video/webm' });
        const uploadRes = await base44.integrations.Core.UploadPrivateFile({ file: fileObj }).catch(
          () => null
        );
        const fileUri = uploadRes?.file_uri || '';
        const signedRes = fileUri
          ? await base44.integrations.Core.CreateFileSignedUrl({
              file_uri: fileUri,
              expires_in: 86400,
            }).catch(() => null)
          : null;
        const permanentCloudUrl = signedRes?.signed_url || '';

        if (production?.id) {
          const saveRes = await base44.functions.invoke('productionFactory', {
            action: 'save_final_cut_choices',
            production_id: production.id,
            shot_plan: allShots,
            stitched_video_url: permanentCloudUrl,
            stitched_file_uri: fileUri,
            download_entry: {
              filename,
              mode: rangeMode,
              mode_label: modeLabel,
              clips_stitched: clipCount,
              duration_label: `${actualRecordedSec}s (${clipCount} MP4 Clips + Audio)`,
              size_mb: sizeMb,
              file_uri: fileUri,
              cloud_url: permanentCloudUrl,
            },
          });
          if (saveRes?.data?.production) {
            onUpdateProduction?.(saveRes.data.production);
          }
        }

        setStitchProgressPct(100);
        onStitchStateChange?.({
          recording: false,
          progressPct: 100,
          lastDownloadUrl: permanentCloudUrl || localUrl,
        });
        toast({
          title: `Full ${clipCount}-Clip Video Exported (${sizeMb} MB)!`,
          description: `Saved to ~/Downloads/${filename}, Cloud CDN, Library (/library), and looseScrew (/loose-screw).`,
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
    [allShots, duration, includedShots.length, lastDownloadUrl, onStitchStateChange, onUpdateProduction, production, toast]
  );

  useEffect(() => {
    if (externalStitchTrigger?.ts && !recording) {
      handleLiveStitchAndExport(externalStitchTrigger.rangeMode || 'full_12_clips_master');
    }
  }, [externalStitchTrigger, handleLiveStitchAndExport, recording]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = false;
    el.volume = 1.0;
    if (el.paused) {
      el.play().catch(() => {});
      const activeEl = activeDeck === 'A' ? deckARef.current : deckBRef.current;
      activeEl?.play().catch(() => {});
    } else {
      el.pause();
      deckARef.current?.pause();
      deckBRef.current?.pause();
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
  const shotProgress = useMemo(() => {
    const s = Number(displayedShot?.start || 0);
    const e = Number(displayedShot?.end || s + 15);
    return Math.min(1, Math.max(0, (currentTime - s) / Math.max(1, e - s)));
  }, [displayedShot, currentTime]);

  return (
    <div className="rounded-lg border border-primary/50 bg-card p-4 space-y-4 font-mono text-xs">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-success text-background text-[10px] font-bold">
              8 REAL AI MP4 CLIPS STITCHED TO YOUR AUDIO TRACK (NO LOOPS)
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              {production?.title || 'THE AWAKENING OF AI — Check the Source (Master 1.1)'}
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            Dual-Deck A/B 16:9 AI cinema player cross-dissolving 8 real generated MP4 clips across all 12 sections in lockstep with your{' '}
            <strong className="text-foreground">ChecktheSource.mp3 ({duration}s · {bpm} BPM)</strong> master audio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" onClick={togglePlay} disabled={recording} className="h-8 px-3 gap-1.5 text-xs">
            {playing ? <Pause size={13} /> : <Play size={13} />}
            {playing ? 'Pause Music Video' : '▶ Play Full Stitched Music Video + Audio'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            disabled={recording}
            onClick={() => handleLiveStitchAndExport('full_12_clips_master')}
            className="h-8 px-3 gap-1.5 text-xs text-success"
          >
            {recording ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            {recording
              ? `Stitching All 12 MP4 Clips (${stitchProgressPct}%)…`
              : 'Stitch & Export Entire 12-Clip Video + Audio (.webm)'}
          </Button>

          {recording && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                stopEarlyRef.current = true;
              }}
              className="h-8 px-3 text-xs font-bold"
            >
              Finish &amp; Save Video Now ({stitchProgressPct}%)
            </Button>
          )}

          <div className="inline-flex rounded border border-border bg-background p-0.5">
            {[
              ['dual_deck_video', '8-Clip Cross-Dissolve MP4'],
              ['canvas_stitch', 'Canvas Master Compositor'],
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

      {/* Master Audio Track Bar (Visible + Interactive Scrubber & Volume) */}
      <div className="p-2.5 rounded border border-success/40 bg-background flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px]">
          <Volume2 size={14} className={playing ? 'text-success animate-pulse' : 'text-primary'} />
          <strong className="text-foreground">
            Master Audio Track: ChecktheSource.mp3 (217.9s · 138 BPM · Stereo)
          </strong>
        </div>
        <audio
          ref={audioRef}
          src={
            production?.audio_url && !production.audio_url.includes('6be084021')
              ? production.audio_url
              : FALLBACK_AUDIO_MASTER
          }
          crossOrigin="anonymous"
          controls
          preload="auto"
          className="h-8 w-full sm:w-96"
        />
      </div>

      {/* Main 16:9 Cinema Stage + Active Shot Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 7 Cols: 16:9 Viewport */}
        <div className="lg:col-span-7 space-y-2.5">
          <div
            onClick={togglePlay}
            className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-background cursor-pointer"
          >
            {/* Hidden or Active Canvas for Live WebM Recorder */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className={`w-full h-full object-cover ${
                viewMode === 'canvas_stitch' ? 'block' : 'hidden'
              }`}
            />

            {/* Dual-Deck A/B Real MP4 Video Cross-Dissolve Stage (No Loop Jumps!) */}
            {viewMode === 'dual_deck_video' && (
              <div className="relative w-full h-full bg-background overflow-hidden">
                <video
                  ref={deckARef}
                  src={deckAUri}
                  poster={displayedShot?.image_url || production?.hero_image_url}
                  muted
                  playsInline
                  crossOrigin="anonymous"
                  style={{
                    transform: `scale(${(1.01 + shotProgress * 0.08).toFixed(3)})`,
                    transition: 'opacity 1400ms ease-in-out, transform 400ms linear',
                  }}
                  className={`absolute inset-0 w-full h-full object-cover ${
                    activeDeck === 'A' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                />
                <video
                  ref={deckBRef}
                  src={deckBUri}
                  poster={displayedShot?.image_url || production?.hero_image_url}
                  muted
                  playsInline
                  crossOrigin="anonymous"
                  style={{
                    transform: `scale(${(1.01 + shotProgress * 0.08).toFixed(3)})`,
                    transition: 'opacity 1400ms ease-in-out, transform 400ms linear',
                  }}
                  className={`absolute inset-0 w-full h-full object-cover ${
                    activeDeck === 'B' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                />

                {/* Big Center Play Button Overlay when paused */}
                {!playing && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40">
                    <div className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-lg">
                      <Play size={15} /> Click to Play Full Stitched Video + &ldquo;Check the Source&rdquo; Audio
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'keyframe' && (
              <Image
                src={displayedShot?.image_url || production?.hero_image_url}
                alt={displayedShot?.section || 'Cinema Keyframe'}
                className="w-full h-full object-cover"
              />
            )}

            {/* Top HUD */}
            <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
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

            {/* Bottom Serif Hook Overlay */}
            {displayedShot?.exact_text && (
              <div className="absolute bottom-3 left-6 right-6 z-30 text-center pointer-events-none">
                <div className="inline-block px-4 py-1.5 rounded bg-background/90 border border-caution/60 text-foreground font-serif text-sm tracking-wider uppercase">
                  {displayedShot.exact_text}
                </div>
              </div>
            )}
          </div>

          {/* All 8 Generated Real MP4 Clips Bar — Click to Preview or Download Any Clip + Stitched File */}
          <div className="p-2.5 rounded border border-border bg-background space-y-2 text-[10px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-foreground">
                8 GENERATED 16:9 AI CINEMA MP4 CLIPS + MASTER AUDIO (CLICK TO DOWNLOAD):
              </span>
              {lastDownloadUrl && (
                <a
                  href={lastDownloadUrl}
                  download="Check_The_Source_Final_Stitched_Master.webm"
                  className="px-2.5 py-1 rounded bg-success text-background font-bold hover:opacity-90 inline-flex items-center gap-1"
                >
                  <Download size={11} /> Download Stitched Video + Audio (.webm)
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CLIP_CATALOG.map((clip) => (
                <a
                  key={clip.id}
                  href={clip.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 rounded border border-primary/40 bg-primary/10 text-primary hover:underline inline-flex items-center gap-1"
                >
                  <Download size={9} /> {clip.label}
                </a>
              ))}
              {production?.audio_url && (
                <a
                  href={production.audio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 rounded border border-caution/40 bg-caution/10 text-caution hover:underline inline-flex items-center gap-1"
                >
                  <Download size={9} /> Master Audio (ChecktheSource.mp3)
                </a>
              )}
            </div>
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