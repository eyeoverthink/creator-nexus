import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Download,
  FolderOpen,
  ExternalLink,
  CheckCircle2,
  HardDrive,
  Cloud,
  Film,
  Clock,
  Volume2,
} from 'lucide-react';

const ALL_12_SECTION_CLIPS = [
  {
    id: 'sec-01-intro',
    section: '1. INTRO (0.0s–14.1s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/b9bdcbcbe_generated_video.mp4',
  },
  {
    id: 'sec-02-verse1',
    section: '2. VERSE 1 (14.1s–27.9s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/715cbb381_generated_video.mp4',
  },
  {
    id: 'sec-03-choir',
    section: '3. CHOIR INTERLUDE (27.9s–41.7s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/bfd5d4d22_generated_video.mp4',
  },
  {
    id: 'sec-04-verse2',
    section: '4. VERSE 2 (41.7s–69.2s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/7326ab4f9_generated_video.mp4',
  },
  {
    id: 'sec-05-prechorus1a',
    section: '5. PRE-CHORUS 1A · FRAYED THREAD (69.2s–83.0s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/de20c2592_generated_video.mp4',
  },
  {
    id: 'sec-06-prechorus1b',
    section: '6. PRE-CHORUS 1B · THE HAND STOPS (83.0s–110.7s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/e54ca34fe_generated_video.mp4',
  },
  {
    id: 'sec-07-chorus1',
    section: '7. CHORUS 1 · ICONIC FRAME (110.7s–124.5s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/efeb90b70_generated_video.mp4',
  },
  {
    id: 'sec-08-postchorus',
    section: '8. POST-CHORUS · GLASS PARTITIONS (124.5s–138.2s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/242d0a56d_generated_video.mp4',
  },
  {
    id: 'sec-09-bridge',
    section: '9. BRIDGE · SPHERE HANDOFF (138.2s–152.2s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/8a731d482_The_Hand_Stops_1003s.mp4',
  },
  {
    id: 'sec-10-breakdown',
    section: '10. BREAKDOWN & BUILD · SOLO PIANO (152.2s–177.0s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/d78ea4930_generated_video.mp4',
  },
  {
    id: 'sec-11-finalchorus',
    section: '11. FINAL CHORUS · GALAXY NETWORK (177.0s–190.7s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/a368caa8c_Final_Chorus_Galaxy_Aerial.mp4',
  },
  {
    id: 'sec-12-credo-coda',
    section: '12. CREDO & CODA · COMPANION LIGHT (190.7s–217.9s)',
    url: 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/4feeecb89_Coda_Companion_Light_190s.mp4',
  },
];

const MASTER_AUDIO_URL =
  'https://media.base44.com/files/public/6ad00af14909c671e73bb835/79561d060_ChecktheSource.mp3';

export default function FactoryDownloadHistoryAndLocations({
  production,
  localDownloadUrl,
  onTriggerExportHtmlPlayer,
  onTriggerExportFfmpeg,
}) {
  const [resolvedSignedUrl, setResolvedSignedUrl] = useState('');
  const stitchedFileUri = String(production?.track_meta?.stitched_file_uri || '');
  const rawStitchedUrl = String(production?.track_meta?.stitched_video_url || '');

  useEffect(() => {
    let active = true;
    if (stitchedFileUri) {
      base44.integrations.Core.CreateFileSignedUrl({
        file_uri: stitchedFileUri,
        expires_in: 86400,
      })
        .then((res) => {
          if (active && res?.signed_url) setResolvedSignedUrl(res.signed_url);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [stitchedFileUri]);

  const cleanCloudStitchedUrl =
    resolvedSignedUrl || (rawStitchedUrl.startsWith('blob:') ? '' : rawStitchedUrl);
  const downloadHistory = Array.isArray(production?.track_meta?.download_history)
    ? production.track_meta.download_history
    : [];

  return (
    <div className="p-3.5 rounded-lg border border-primary/40 bg-background space-y-3.5 font-mono text-xs">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div>
          <span className="text-[11px] font-bold text-success flex items-center gap-1.5">
            <HardDrive size={13} /> DOWNLOAD HISTORY &amp; PERMANENT SAVE LOCATIONS LEDGER
          </span>
          <p className="text-[10.5px] text-muted-foreground font-body">
            Every full-movie export is saved to your local <code className="text-foreground">~/Downloads</code> folder AND uploaded to permanent Base44 Cloud CDN (never temporary <code className="text-destructive">blob:</code> links), Library (<code className="text-foreground">/library</code>), and looseScrew Studio (<code className="text-foreground">/loose-screw</code>).
          </p>
        </div>
      </div>

      {/* 5 Save Locations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <div className="p-2.5 rounded border border-border bg-card space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-primary">
            <span className="inline-flex items-center gap-1">
              <Download size={11} /> 1. Local Disk
            </span>
            <span className="text-success">ACTIVE</span>
          </div>
          <div className="text-[10.5px] font-semibold text-foreground truncate">
            ~/Downloads Folder
          </div>
          <p className="text-[9.5px] text-muted-foreground font-body">
            Browser downloads <code className="text-foreground">.webm</code>, <code className="text-foreground">.html</code>, <code className="text-foreground">.py</code>, <code className="text-foreground">.json</code>, and <code className="text-foreground">.md</code> directly to your computer.
          </p>
          {localDownloadUrl && (
            <a
              href={localDownloadUrl}
              download="Check_The_Source_Full_12Clips_Master.webm"
              className="inline-flex items-center gap-1 text-[10px] text-success font-bold hover:underline pt-1"
            >
              <Download size={10} /> Re-Save Local .webm
            </a>
          )}
        </div>

        <div className="p-2.5 rounded border border-border bg-card space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-success">
            <span className="inline-flex items-center gap-1">
              <Cloud size={11} /> 2. Cloud Media CDN
            </span>
            <span>PERMANENT</span>
          </div>
          <div className="text-[10.5px] font-semibold text-foreground truncate">
            media.base44.com/videos/public
          </div>
          <p className="text-[9.5px] text-muted-foreground font-body">
            All 12 generated H.264 <code className="text-foreground">.mp4</code> clips + 4.84 MB <code className="text-foreground">.mp3</code> + cloud stitched master.
          </p>
          {cleanCloudStitchedUrl ? (
            <a
              href={cleanCloudStitchedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-success font-bold hover:underline pt-1"
            >
              <ExternalLink size={10} /> Open Cloud Master Video
            </a>
          ) : (
            <button
              type="button"
              onClick={onTriggerExportHtmlPlayer}
              className="inline-flex items-center gap-1 text-[10px] text-primary font-bold hover:underline pt-1"
            >
              <Download size={10} /> Get 12-Clip HTML5 Master
            </button>
          )}
        </div>

        <div className="p-2.5 rounded border border-border bg-card space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-caution">
            <span className="inline-flex items-center gap-1">
              <FolderOpen size={11} /> 3. Nexus Library
            </span>
            <span>INDEXED</span>
          </div>
          <div className="text-[10.5px] font-semibold text-foreground truncate">
            NexusAsset · /library
          </div>
          <p className="text-[9.5px] text-muted-foreground font-body">
            Saved under project <strong className="text-foreground">&ldquo;Production Factory&rdquo;</strong> for cross-agent reuse.
          </p>
          <Link
            to="/library"
            className="inline-flex items-center gap-1 text-[10px] text-caution font-bold hover:underline pt-1"
          >
            <ExternalLink size={10} /> Open Library (/library)
          </Link>
        </div>

        <div className="p-2.5 rounded border border-border bg-card space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-primary">
            <span className="inline-flex items-center gap-1">
              <Film size={11} /> 4. looseScrew Studio
            </span>
            <span>CLEANED</span>
          </div>
          <div className="text-[10.5px] font-semibold text-foreground truncate">
            LooseScrewItem · /loose-screw
          </div>
          <p className="text-[9.5px] text-muted-foreground font-body">
            All 12 section <code className="text-foreground">.mp4</code> clips + stitched master in the <code className="text-foreground">VIDEO</code> channel.
          </p>
          <Link
            to="/loose-screw"
            className="inline-flex items-center gap-1 text-[10px] text-primary font-bold hover:underline pt-1"
          >
            <ExternalLink size={10} /> Open looseScrew (/loose-screw)
          </Link>
        </div>

        <div className="p-2.5 rounded border border-border bg-card space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 size={11} className="text-success" /> 5. GitHub Vault
            </span>
            <span>SYNCED</span>
          </div>
          <div className="text-[10.5px] font-semibold text-foreground truncate">
            eyeoverthink/fraymus-continuity
          </div>
          <p className="text-[9.5px] text-muted-foreground font-body">
            Permanent markdown treatment, 12-clip EDL, and FFmpeg 1080p stitcher.
          </p>
          <a
            href={production?.github_url || 'https://github.com/eyeoverthink/fraymus-continuity'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-link font-bold hover:underline pt-1"
          >
            <ExternalLink size={10} /> Open GitHub Repo
          </a>
        </div>
      </div>

      {/* Download & Export History Table */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10.5px] font-bold text-foreground flex items-center gap-1.5">
            <Clock size={12} className="text-primary" /> RECENT FULL-VIDEO EXPORT &amp; DOWNLOAD HISTORY ({downloadHistory.length} RECORDED)
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onTriggerExportHtmlPlayer}
              className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center gap-1"
            >
              <Download size={10} /> Instant Download: Full 217.9s 12-Clip Video Player (.html)
            </button>
            <button
              type="button"
              onClick={onTriggerExportFfmpeg}
              className="px-2 py-1 rounded border border-border bg-card text-foreground text-[10px] font-bold inline-flex items-center gap-1 hover:border-primary"
            >
              <Download size={10} /> Download 12-Clip MP4 FFmpeg Stitcher (.py)
            </button>
          </div>
        </div>

        {downloadHistory.length > 0 ? (
          <div className="rounded border border-border bg-card divide-y divide-border max-h-44 overflow-y-auto">
            {downloadHistory.map((item) => (
              <div
                key={item.id}
                className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[10.5px]"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9px] font-bold">
                      {item.mode_label || 'FULL 12-CLIP VIDEO STITCH'}
                    </span>
                    <strong className="text-foreground">{item.filename}</strong>
                    <span className="text-muted-foreground">
                      ({item.clips_stitched || 12} MP4 Clips · {item.duration_label || 'Full Sequence'} ·{' '}
                      {item.size_mb ? `${item.size_mb} MB` : 'Muxed Audio'})
                    </span>
                  </div>
                  <div className="text-[9.5px] text-muted-foreground">
                    Saved to: <strong className="text-foreground">~/Downloads/{item.filename}</strong> ·{' '}
                    <strong className="text-foreground">Library (/library)</strong> ·{' '}
                    <strong className="text-foreground">looseScrew (/loose-screw)</strong> ·{' '}
                    {item.created_at ? new Date(item.created_at).toLocaleTimeString() : 'Just now'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.cloud_url && !String(item.cloud_url).startsWith('blob:') && (
                    <a
                      href={item.cloud_url}
                      target="_blank"
                      rel="noreferrer"
                      download={item.filename}
                      className="px-2.5 py-1 rounded bg-success text-background font-bold text-[10px] inline-flex items-center gap-1"
                    >
                      <Download size={10} /> Open / Download Cloud File
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2.5 rounded border border-border bg-card text-[10.5px] text-muted-foreground font-body">
            No live <code className="text-foreground">.webm</code> stitch recorded in this session yet — click{' '}
            <strong className="text-foreground">&ldquo;Stitch &amp; Export Entire 12-Clip Video Now&rdquo;</strong> above to record all 12 moving MP4 clips + master audio into one permanent cloud &amp; local video file, or click{' '}
            <strong className="text-foreground">&ldquo;Instant Download: Full 217.9s 12-Clip Video Player (.html)&rdquo;</strong> for immediate playback.
          </div>
        )}
      </div>

      {/* All 12 Permanent Section MP4 Clips + Master Audio Direct Download Grid */}
      <div className="space-y-1.5 pt-1 border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10.5px] font-bold text-foreground">
            ALL 12 PERMANENT SECTION MP4 VIDEO CLIPS (0.0s–217.9s) + MASTER STEREO AUDIO:
          </span>
          <a
            href={MASTER_AUDIO_URL}
            target="_blank"
            rel="noreferrer"
            download="ChecktheSource_Master_138BPM.mp3"
            className="px-2.5 py-1 rounded border border-caution/50 bg-caution/10 text-caution font-bold text-[10px] inline-flex items-center gap-1 hover:underline"
          >
            <Volume2 size={11} /> Download Master Audio: ChecktheSource.mp3 (4.84 MB · 217.9s)
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
          {ALL_12_SECTION_CLIPS.map((clip) => (
            <a
              key={clip.id}
              href={clip.url}
              target="_blank"
              rel="noreferrer"
              download={`${clip.id}.mp4`}
              className="px-2 py-1.5 rounded border border-border bg-card hover:border-primary text-[10px] text-foreground flex items-center justify-between gap-1.5"
            >
              <span className="truncate">{clip.section}</span>
              <Download size={10} className="text-primary shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}