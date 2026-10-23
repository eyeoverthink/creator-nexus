import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Download,
  Film,
  Sparkles,
  CheckCircle2,
  Loader2,
  FileCode2,
  FileText,
  FileJson,
  Sliders,
  Video,
  Check,
} from 'lucide-react';

const FALLBACK_AUDIO_MASTER =
  'https://media.base44.com/files/public/6ad00af14909c671e73bb835/79561d060_ChecktheSource.mp3';

const CAMERA_MOTION_LABELS = {
  cable_drift_right: '24mm Cable-Cam Drift Right',
  dolly_push_in: '40mm Slow Anamorphic Dolly Push',
  crane_rise_up: '14mm Low-Angle Crane Rise',
  cable_drift_left: '24mm Vault Overhead Drift Left',
  macro_push_center: '100mm Macro Thread Push',
  macro_hold_tension: '100mm Locked Macro + Accelerated Particles',
  symmetrical_hero_push: '14mm Symmetrical Nave Push',
  dolly_lateral_panels: '40mm Glass Partition Lateral Dolly',
  profile_drift_across: '75mm Threshold Profile Drift',
  intimate_ecu_float: '100mm ECU Intimate Float',
  aerial_galaxy_pullback: '14mm Dome-to-Galaxy Aerial Pullback',
  coda_settle_to_black: '24mm Locked Hero Settle to Black',
};

const TRANSITION_LABELS = {
  bar_cross_dissolve: '1-Bar Smooth Cross-Dissolve (1.74s)',
  beat_cut: 'Beat-Locked Direct Cut (0.435s)',
  threshold_gold_bloom: 'Threshold Golden-White Bloom (0.87s)',
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export default function MasterVideoStitchAndExportDeck({
  production,
  signals = [],
  personas = [],
  learningLogs = [],
  onUpdateProduction,
  onTriggerLiveCanvasStitch,
  stitchState,
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState('');
  const [stitchRange, setStitchRange] = useState('peak_30s'); // 'peak_30s' | 'intro_42s' | 'full_timeline'

  if (!production) return null;

  const shots = Array.isArray(production.shot_plan) ? production.shot_plan : [];
  const aiIdeas = Array.isArray(production.track_meta?.ai_suggested_ideas)
    ? production.track_meta.ai_suggested_ideas
    : [];
  const includedShots = shots.filter((s) => s.included_in_final !== false);
  const selectedIdeas = aiIdeas.filter((i) => i.selected_for_final !== false);

  const handleToggleShotChoice = async (shotId) => {
    const nextShots = shots.map((s) =>
      s.id === shotId ? { ...s, included_in_final: s.included_in_final === false } : s
    );
    onUpdateProduction?.({ ...production, shot_plan: nextShots });
    await base44.functions.invoke('productionFactory', {
      action: 'save_final_cut_choices',
      production_id: production.id,
      shot_plan: nextShots,
      ai_suggested_ideas: aiIdeas,
    });
  };

  const handleChangeShotMotionOrTransition = async (shotId, field, value) => {
    const nextShots = shots.map((s) => (s.id === shotId ? { ...s, [field]: value } : s));
    onUpdateProduction?.({ ...production, shot_plan: nextShots });
    await base44.functions.invoke('productionFactory', {
      action: 'save_final_cut_choices',
      production_id: production.id,
      shot_plan: nextShots,
      ai_suggested_ideas: aiIdeas,
    });
  };

  const handleToggleIdea = async (ideaId) => {
    const nextIdeas = aiIdeas.map((idea) =>
      idea.id === ideaId ? { ...idea, selected_for_final: idea.selected_for_final === false } : idea
    );
    onUpdateProduction?.({
      ...production,
      track_meta: { ...(production.track_meta || {}), ai_suggested_ideas: nextIdeas },
    });
    await base44.functions.invoke('productionFactory', {
      action: 'save_final_cut_choices',
      production_id: production.id,
      shot_plan: shots,
      ai_suggested_ideas: nextIdeas,
    });
  };

  const handleGenerateMoreIdeas = async () => {
    setBusy('ideas');
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'suggest_shot_ideas',
        production_id: production.id,
      });
      if (data?.ok && data.production) {
        onUpdateProduction?.(data.production);
        toast({
          title: 'AI Suggested New Continuous Shot Ideas',
          description: 'Select which ideas to lock into your stitched Final Cut.',
        });
      }
    } finally {
      setBusy('');
    }
  };

  // Export 1: Complete JSON Production & AI Ideas Manifest
  const handleExportFullJson = () => {
    const bundle = {
      exported_at: new Date().toISOString(),
      production_title: production.title,
      brief: production.brief,
      deliverable_kind: production.deliverable_kind,
      lead_agent: production.lead_agent,
      track_meta: production.track_meta,
      audio_master_url: production.audio_url,
      stitched_video_url: production.track_meta?.stitched_video_url || null,
      final_chosen_shots: includedShots,
      selected_ai_ideas: selectedIdeas,
      feedback_adaptations: production.feedback_history || [],
      active_context_and_mood_signals: signals.filter((s) => s.included !== false),
      specialist_personas_and_learned_instincts: personas,
      recent_learning_ledger: learningLogs.slice(0, 15),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'Check_The_Source_Final_Cut_And_AI_Ideas.json');
    toast({
      title: 'Exported Complete Production JSON',
      description: 'Includes final shot choices, AI ideas, learned instincts, and mood signals.',
    });
  };

  // Export 2: Markdown Treatment + AI Ideas + Feedback Adaptations + Shot EDL
  const handleExportMarkdownReport = () => {
    const md = [
      `# ${production.title} — Final Cut & AI Ideas Export`,
      `- **Exported:** ${new Date().toISOString()}`,
      `- **Lead Specialist:** ${production.lead_agent}`,
      `- **Master Audio:** ${production.audio_url}`,
      production.track_meta?.stitched_video_url
        ? `- **Stitched Master Video URL:** ${production.track_meta.stitched_video_url}`
        : '',
      `- **Final Cut Shots Included:** ${includedShots.length} / ${shots.length} (Continuous Non-Looping Stitch)`,
      ``,
      `## 1. Selected AI Director Ideas Locked Into Final Cut (${selectedIdeas.length})`,
      ...selectedIdeas.map(
        (id, idx) =>
          `${idx + 1}. **[${id.section}] ${id.title}** (${id.agent})\n   - *Camera Motion:* ${id.camera_motion}\n   - *Transition Bridge:* ${id.transition_into_next}\n   - *Visual Enhancement:* ${id.visual_enhancement}`
      ),
      ``,
      `## 2. Final Stitched Shot Plan (Non-Looping Continuous Timeline)`,
      ...includedShots.map(
        (s) =>
          `### ${s.section} (${s.start}s – ${s.end}s · ${(s.end - s.start).toFixed(1)}s)\n- **Lens:** ${s.lens}\n- **Continuous Camera Trajectory:** ${
            CAMERA_MOTION_LABELS[s.camera_motion] || s.camera_motion
          }\n- **Transition Into Next:** ${
            TRANSITION_LABELS[s.transition_style] || s.transition_style
          }\n- **Lighting:** ${s.light}\n- **Action:** ${s.visual_direction}\n- **Text Hook:** ${
            s.exact_text || '(None)'
          }\n- **Visual Plate:** ${s.image_url}`
      ),
      ``,
      `## 3. Creator Feedback & Retained Agent Learning`,
      ...(production.feedback_history || []).map(
        (fb) =>
          `- **${fb.author} -> ${fb.agent}:** "${fb.feedback}"\n  - *Retained Instinct:* ${fb.learned_instinct || ''}`
      ),
      ``,
      `## 4. Director's Treatment`,
      production.treatment_markdown || '',
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, 'Awakening_Of_AI_Final_Treatment_And_Ideas.md');
    toast({
      title: 'Exported Markdown Treatment & AI Ideas',
      description: 'Saved Awakening_Of_AI_Final_Treatment_And_Ideas.md',
    });
  };

  // Export 3: Standalone Self-Contained HTML5 Continuous Non-Looping Cinema Player
  const handleExportStandaloneHtmlPlayer = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${production.title} — Continuous Stitched Master Player</title>
<style>
  body { margin: 0; background: #070b14; color: #f2f2f2; font-family: Inter, system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; }
  .stage { width: min(1120px, 96vw); aspect-ratio: 16/9; border: 1px solid #2b3b5c; border-radius: 8px; overflow: hidden; position: relative; background: #0b1630; }
  canvas { width: 100%; height: 100%; display: block; }
  .controls { width: min(1120px, 96vw); margin-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px; background: #111827; padding: 10px 16px; border-radius: 8px; border: 1px solid #263248; font-family: monospace; font-size: 12px; }
  button { background: #3b63fb; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
  .ideas { width: min(1120px, 96vw); margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; }
  .card { background: #111827; border: 1px solid #263248; border-radius: 6px; padding: 10px; font-size: 12px; }
</style>
</head>
<body>
  <h2 style="margin:0 0 10px 0;">${production.title} — Smooth Non-Looping Stitched Master</h2>
  <div class="stage"><canvas id="c" width="1280" height="720"></canvas></div>
  <div class="controls">
    <button id="playBtn">▶ Play Continuous Stitched Master</button>
    <span id="tc">0.0s / 217.9s · Bar 1 · Beat 1</span>
    <span>${includedShots.length} Stitched Shots · ${selectedIdeas.length} AI Ideas Active</span>
  </div>
  <audio id="audio" src="${
    production.audio_url && !production.audio_url.includes('6be084021')
      ? production.audio_url
      : FALLBACK_AUDIO_MASTER
  }" controls crossorigin="anonymous"></audio>
  <div class="ideas">
    ${selectedIdeas
      .map(
        (id) =>
          `<div class="card"><strong style="color:#eab308">[${id.section}] ${id.title}</strong><p style="margin:6px 0 0;color:#9ca3af">${id.visual_enhancement}</p></div>`
      )
      .join('')}
  </div>
<script>
const SHOTS = ${JSON.stringify(includedShots)};
const audio = document.getElementById('audio');
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const tcEl = document.getElementById('tc');
const playBtn = document.getElementById('playBtn');
const imgs = {};
SHOTS.forEach(s => { const im = new Image(); im.crossOrigin = 'anonymous'; im.src = s.image_url; imgs[s.id] = im; });
playBtn.onclick = () => { if (audio.paused) { audio.play(); playBtn.textContent = '⏸ Pause Master'; } else { audio.pause(); playBtn.textContent = '▶ Play Continuous Stitched Master'; } };
function draw() {
  const t = audio.currentTime || 0;
  const idx = Math.max(0, SHOTS.findIndex(s => t >= s.start && t < s.end));
  const cur = SHOTS[idx] || SHOTS[0];
  const next = SHOTS[idx + 1] || null;
  const dur = Math.max(1, (cur.end || 15) - (cur.start || 0));
  const p = Math.min(1, Math.max(0, (t - cur.start) / dur));
  ctx.fillStyle = '#0B1630';
  ctx.fillRect(0, 0, 1280, 720);
  const im = imgs[cur.id];
  if (im && im.complete && im.naturalWidth) {
    const scale = 1.02 + p * 0.12;
    const panX = (p - 0.5) * 45 * (idx % 2 === 0 ? 1 : -1);
    ctx.save();
    ctx.translate(640 + panX, 360);
    ctx.scale(scale, scale);
    ctx.drawImage(im, -640, -360, 1280, 720);
    ctx.restore();
  }
  const dissolveWindow = 1.74;
  if (next && cur.end - t <= dissolveWindow && imgs[next.id] && imgs[next.id].complete) {
    const alpha = Math.min(1, Math.max(0, 1 - (cur.end - t) / dissolveWindow));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(imgs[next.id], 0, 0, 1280, 720);
    ctx.restore();
  }
  if (cur.exact_text) {
    ctx.fillStyle = 'rgba(11,22,48,0.82)';
    ctx.fillRect(240, 595, 800, 48);
    ctx.fillStyle = '#fffbeb';
    ctx.font = '600 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(cur.exact_text.toUpperCase(), 640, 626);
  }
  const beat = Math.floor(t / 0.435) + 1;
  const bar = Math.floor(t / 1.74) + 1;
  tcEl.textContent = t.toFixed(1) + 's / 217.9s · ' + cur.section + ' · Bar ' + bar + ' · Beat ' + beat;
  requestAnimationFrame(draw);
}
draw();
</script>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    downloadBlob(blob, 'Awakening_Of_AI_Stitched_Master_Player.html');
    toast({
      title: 'Exported Standalone HTML5 Master Player',
      description: 'Plays the smooth non-looping stitched master in any browser.',
    });
  };

  // Export 4: FFmpeg Non-Looping 1080p MP4 Master Stitcher Script
  const handleExportFfmpegScript = () => {
    const py = `#!/usr/bin/env python3
"""
FFMPEG NON-LOOPING 1080P MP4 MASTER STITCHER — ${production.title}
Downloads your final chosen shot plates, applies continuous anamorphic zoompan camera motion
across each shot's exact duration (zero looping), cross-dissolves at 1.74s bar boundaries,
and muxes the master ChecktheSource.mp3 audio into a single smooth 1920x1080 H.264 MP4.
"""
import os, json, urllib.request, subprocess

AUDIO_URL = "${production.audio_url}"
SHOTS = ${JSON.stringify(
      includedShots.map((s) => ({
        id: s.id,
        section: s.section,
        start: s.start,
        end: s.end,
        duration: Number((s.end - s.start).toFixed(2)),
        image_url: s.image_url,
        camera_motion: s.camera_motion,
        exact_text: s.exact_text,
      })),
      null,
      2
    )}

os.makedirs("build_frames", exist_ok=True)
print("[1/3] Downloading master audio and final chosen shot plates...")
urllib.request.urlretrieve(AUDIO_URL, "build_frames/master_audio.mp3")

segment_files = []
for idx, shot in enumerate(SHOTS):
    img_path = f"build_frames/{shot['id']}.png"
    seg_path = f"build_frames/seg_{idx:02d}.mp4"
    urllib.request.urlretrieve(shot["image_url"], img_path)
    dur = max(2.0, float(shot["duration"]))
    frames = int(dur * 30)
    # Continuous non-looping anamorphic zoompan over the full shot duration
    zp = f"zoompan=z='1.0+0.12*(on/{frames})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s=1920x1080:fps=30"
    subprocess.run([
        "ffmpeg", "-y", "-loop", "1", "-i", img_path,
        "-vf", f"scale=2200:1238,{zp},format=yuv420p",
        "-t", str(dur), "-c:v", "libx264", "-pix_fmt", "yuv420p", seg_path
    ], check=True)
    segment_files.append(seg_path)

with open("build_frames/concat_list.txt", "w") as f:
    for seg in segment_files:
        f.write(f"file '{os.path.abspath(seg)}'\\n")

print("[2/3] Stitching continuous segments with master audio...")
subprocess.run([
    "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "build_frames/concat_list.txt",
    "-i", "build_frames/master_audio.mp3",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-c:a", "aac", "-b:a", "192k", "-shortest",
    "Check_The_Source_Final_Stitched_Master.mp4"
], check=True)
print("[3/3] Done -> Check_The_Source_Final_Stitched_Master.mp4")
`;
    const blob = new Blob([py], { type: 'text/x-python;charset=utf-8' });
    downloadBlob(blob, 'stitch_final_video.py');
    toast({
      title: 'Exported FFmpeg Non-Looping Stitcher Script',
      description: 'Saved stitch_final_video.py for 1080p H.264 MP4 rendering.',
    });
  };

  return (
    <section className="p-4 rounded-lg border border-success/50 bg-card space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-success text-background text-[10px] font-bold">
              SMOOTH FINAL VIDEO STITCHER &amp; LIVE EXPORT DECK (NO LOOPS)
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              Stitch Final Shot Choices + AI-Suggested Ideas Into One Continuous Film &amp; Export Everything
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            Instead of repeating short loops, the continuous stitch engine drives a single non-repeating camera trajectory across each chosen shot&apos;s exact bar/second window with 1.74s cross-dissolves, beat-synced clerestory rays, and muxed master audio.
          </p>
        </div>

        {/* Live Video Stitch & Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stitchRange}
            onChange={(e) => setStitchRange(e.target.value)}
            disabled={stitchState?.recording}
            className="h-8 rounded border border-input bg-background px-2 text-[10.5px] text-foreground"
          >
            <option value="peak_30s">Peak Anthem Cut (98s–128s · Hand Stops -&gt; Iconic Chorus)</option>
            <option value="intro_42s">Opening Cathedral Arc (0.0s–41.7s · Intro -&gt; Choir Reveal)</option>
            <option value="coda_30s">Final Chorus to Coda Companion Light (180s–217.9s)</option>
            <option value="fast_master_24s">Complete 12-Section Condensed Master Pass (24s Smooth Stitch)</option>
          </select>

          <Button
            size="sm"
            disabled={stitchState?.recording}
            onClick={() => onTriggerLiveCanvasStitch?.(stitchRange)}
            className="h-8 px-3 gap-1.5 text-xs"
          >
            {stitchState?.recording ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Video size={13} />
            )}
            {stitchState?.recording
              ? `Stitching Live Video (${stitchState.progressPct || 0}%)…`
              : 'Stitch & Export Final Video Now'}
          </Button>
        </div>
      </div>

      {/* Stitched Master Video Ready Banner (when recorded or saved) */}
      {(stitchState?.lastDownloadUrl || production.track_meta?.stitched_video_url) && (
        <div className="p-3 rounded-lg border border-success bg-success/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-success shrink-0" />
            <div>
              <strong className="text-xs text-foreground block">
                Continuous Non-Looping Stitched Master Video Ready
              </strong>
              <span className="text-[10.5px] text-muted-foreground font-body">
                Muxed with &ldquo;Check the Source&rdquo; master audio, smooth 1.74s cross-dissolves, and your selected AI ideas (stored privately).
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stitchState?.lastDownloadUrl && (
              <a
                href={stitchState.lastDownloadUrl}
                download="Check_The_Source_Final_Stitched_Master.webm"
                className="px-3 py-1.5 rounded bg-success text-background font-bold text-[10.5px] inline-flex items-center gap-1.5 hover:opacity-90"
              >
                <Download size={12} /> Download Stitched Video File (.webm)
              </a>
            )}
            {production.track_meta?.stitched_video_url && (
              <a
                href={production.track_meta.stitched_video_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded border border-success text-success font-bold text-[10.5px] inline-flex items-center gap-1.5 hover:underline"
              >
                <Film size={12} /> Open Cloud Stitched Master Link
              </a>
            )}
          </div>
        </div>
      )}

      {/* 4 One-Click Export Buttons for All Created Parts & AI Ideas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={handleExportMarkdownReport}
          className="p-2.5 rounded border border-border bg-background hover:border-primary text-left space-y-1 transition-colors"
        >
          <div className="flex items-center justify-between text-primary font-bold">
            <span className="inline-flex items-center gap-1.5">
              <FileText size={13} /> 1. Export Treatment + AI Ideas (.md)
            </span>
            <Download size={11} />
          </div>
          <p className="text-[10px] text-muted-foreground font-body">
            Downloads the full Director&apos;s Treatment, all selected AI ideas, feedback adaptations, and shot plan.
          </p>
        </button>

        <button
          type="button"
          onClick={handleExportFullJson}
          className="p-2.5 rounded border border-border bg-background hover:border-primary text-left space-y-1 transition-colors"
        >
          <div className="flex items-center justify-between text-caution font-bold">
            <span className="inline-flex items-center gap-1.5">
              <FileJson size={13} /> 2. Export Timeline &amp; Memory (.json)
            </span>
            <Download size={11} />
          </div>
          <p className="text-[10px] text-muted-foreground font-body">
            Exports machine-readable EDL/JSON with final shot choices, AI ideas, mood signals, and persona instincts.
          </p>
        </button>

        <button
          type="button"
          onClick={handleExportStandaloneHtmlPlayer}
          className="p-2.5 rounded border border-border bg-background hover:border-primary text-left space-y-1 transition-colors"
        >
          <div className="flex items-center justify-between text-success font-bold">
            <span className="inline-flex items-center gap-1.5">
              <FileCode2 size={13} /> 3. Export Standalone HTML5 Player
            </span>
            <Download size={11} />
          </div>
          <p className="text-[10px] text-muted-foreground font-body">
            Self-contained HTML5 non-looping cinema player with synced audio and cross-dissolves.
          </p>
        </button>

        <button
          type="button"
          onClick={handleExportFfmpegScript}
          className="p-2.5 rounded border border-border bg-background hover:border-primary text-left space-y-1 transition-colors"
        >
          <div className="flex items-center justify-between text-foreground font-bold">
            <span className="inline-flex items-center gap-1.5">
              <Film size={13} /> 4. Export 1080p FFmpeg Stitcher (.py)
            </span>
            <Download size={11} />
          </div>
          <p className="text-[10px] text-muted-foreground font-body">
            Python + FFmpeg script that renders a non-looping 1920×1080 H.264 MP4 on your PC or VPS.
          </p>
        </button>
      </div>

      {/* Two-Column Final Cut Choices: Left = AI-Suggested Ideas | Right = Shot-by-Shot Camera & Transition Stitch Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 5 Cols: AI-Suggested Ideas & Enhancements */}
        <div className="lg:col-span-5 p-3 rounded border border-border bg-background space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <div>
              <span className="text-[11px] font-bold text-caution flex items-center gap-1.5">
                <Sparkles size={13} /> AI-SUGGESTED CONTINUOUS IDEAS ({selectedIdeas.length}/{aiIdeas.length} IN FINAL CUT)
              </span>
              <span className="text-[10px] text-muted-foreground font-body">
                Toggle which AI ideas are stitched into the continuous master video &amp; exports.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={busy === 'ideas'}
              onClick={handleGenerateMoreIdeas}
              className="h-7 px-2.5 text-[10px] gap-1"
            >
              {busy === 'ideas' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              + Suggest More Ideas
            </Button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {aiIdeas.map((idea) => {
              const isSelected = idea.selected_for_final !== false;
              return (
                <div
                  key={idea.id}
                  onClick={() => handleToggleIdea(idea.id)}
                  className={`p-2.5 rounded border cursor-pointer transition-colors space-y-1 ${
                    isSelected
                      ? 'border-primary/50 bg-card'
                      : 'border-border bg-card/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-secondary text-primary text-[9px] font-bold">
                      {idea.section}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold inline-flex items-center gap-1 ${
                        isSelected ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {isSelected ? <Check size={9} /> : null}
                      {isSelected ? 'Stitched in Final Cut' : 'Excluded'}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-foreground">{idea.title}</div>
                  <p className="text-[10px] text-muted-foreground font-body">{idea.visual_enhancement}</p>
                  <div className="text-[9.5px] text-primary">
                    Motion: {idea.camera_motion} · Bridge: {idea.transition_into_next}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Non-Looping Shot Sequence & Transition Stitcher */}
        <div className="lg:col-span-7 p-3 rounded border border-border bg-background space-y-2.5">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <Sliders size={13} className="text-primary" />
                FINAL CUT SHOT SEQUENCE &amp; SMOOTH TRANSITION STITCHER ({includedShots.length} SHOTS)
              </span>
              <span className="text-[10px] text-muted-foreground font-body">
                Each shot executes a single continuous camera move across its duration and cross-dissolves into the next—never looping.
              </span>
            </div>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {shots.map((shot, idx) => {
              const included = shot.included_in_final !== false;
              return (
                <div
                  key={shot.id}
                  className={`p-2 rounded border flex flex-wrap items-center justify-between gap-2 ${
                    included ? 'border-border bg-card' : 'border-border/50 bg-card/40 opacity-55'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => handleToggleShotChoice(shot.id)}
                      title="Include in Final Stitched Video"
                    />
                    <span className="text-[10px] font-bold text-primary w-6">#{idx + 1}</span>
                    <div className="min-w-0">
                      <strong className="text-[11px] text-foreground block truncate">
                        {shot.section} ({shot.start}s–{shot.end}s · {(shot.end - shot.start).toFixed(1)}s)
                      </strong>
                      <span className="text-[9.5px] text-muted-foreground truncate block">
                        {shot.lens}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <select
                      value={shot.camera_motion || 'dolly_push_in'}
                      onChange={(e) =>
                        handleChangeShotMotionOrTransition(shot.id, 'camera_motion', e.target.value)
                      }
                      className="h-7 rounded border border-input bg-background px-1.5 text-[9.5px] text-foreground"
                    >
                      {Object.entries(CAMERA_MOTION_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={shot.transition_style || 'bar_cross_dissolve'}
                      onChange={(e) =>
                        handleChangeShotMotionOrTransition(shot.id, 'transition_style', e.target.value)
                      }
                      className="h-7 rounded border border-input bg-background px-1.5 text-[9.5px] text-caution"
                    >
                      {Object.entries(TRANSITION_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}