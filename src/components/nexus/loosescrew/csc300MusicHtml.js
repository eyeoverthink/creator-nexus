// CSC 300GW — AI Music & Video Production Suite ("Nothing's True Until It Verifies")
// Combines the real full-vocal MP3 track, AI Album Cover Art, AI Music Video (Veo 3.x),
// synchronized Lyric Stage, and the completed CSC 300GW Process Log for Prof. Kroll.

export const CSC300_MP3_URL =
  'https://media.base44.com/files/public/6ad00af14909c671e73bb835/d15e6280a_NothingsTrueUntilIt.mp3';
export const CSC300_COVER_ART_URL =
  'https://media.base44.com/images/public/6ad00af14909c671e73bb835/43b82dea4_generated_image.png';
export const CSC300_MUSIC_VIDEO_URL =
  'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/967b04e1f_Music_Video_Loop.mp4';

export const CSC300_MUSIC_STUDIO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#070a10;color:#f0f4ff;font-family:'IBM Plex Mono',ui-monospace,monospace;padding:14px;display:flex;flex-direction:column;gap:12px}
  .header{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;background:#0d1320;border:1px solid #3b63fb88;border-radius:8px}
  .badge{background:#3b63fb;color:#fff;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:.05em}
  .grid{display:grid;grid-template-columns:1.15fr 1fr;gap:12px}
  @media(max-width:820px){.grid{grid-template-columns:1fr}}
  .card{background:#0d1320;border:1px solid #24324c;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:10px}
  .media-row{display:grid;grid-template-columns:130px 1fr;gap:10px;align-items:stretch}
  .cover{width:130px;height:130px;object-fit:cover;border-radius:6px;border:1px solid #00f3ff66}
  .vid{width:100%;height:130px;object-fit:cover;border-radius:6px;border:1px solid #3b63fb88;background:#000}
  .btn{background:#3b63fb;color:#fff;border:none;padding:7px 12px;border-radius:6px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer}
  .btn.alt{background:#131d31;border:1px solid #00f3ff66;color:#00f3ff}
  .lyrics{max-height:255px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-right:4px}
  .stanza{padding:8px 10px;border-radius:6px;background:#070b13;border:1px solid #1b263b;cursor:pointer;transition:.15s}
  .stanza.active,.stanza:hover{border-color:#00f3ff;background:#0c1829}
  .stanza-tag{color:#00f3ff;font-size:10px;font-weight:700;margin-bottom:3px}
  .stanza-text{font-size:11.5px;line-height:1.5;color:#e2e8f0;white-space:pre-line}
  pre.dossier{margin:0;background:#06090f;border:1px solid #1e293b;border-radius:6px;padding:10px;font-size:10.5px;line-height:1.45;color:#cbd5e1;max-height:255px;overflow-y:auto;white-space:pre-wrap}
  canvas#viz{width:100%;height:46px;background:#05080e;border-radius:6px;border:1px solid #1e293b}
</style>
</head>
<body>
  <div class="header">
    <div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span class="badge">CSC 300GW // PROF. KROLL AI MUSIC DELIVERABLE</span>
        <span style="color:#00f3ff;font-size:11px;font-weight:700">100 BPM · ALT-ROCK / ELECTRONIC HYBRID</span>
      </div>
      <div style="font-size:15px;font-weight:700">"Nothing's True Until It Verifies" — Vaughn Scott (EyeOverthink / Proof of Reality)</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" id="playBtn" onclick="togglePlay()">▶ Play Song + Music Video</button>
      <a class="btn alt" href="${CSC300_MP3_URL}" target="_blank" download="NothingsTrueUntilItVerifies.mp3" style="text-decoration:none">⬇ Download MP3</a>
      <button class="btn alt" onclick="copyDossier()" id="copyBtn">📋 Copy Final CSC 300GW Write-Up</button>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="media-row">
        <img class="cover" src="${CSC300_COVER_ART_URL}" alt="Album Cover Art"/>
        <video class="vid" id="mv" src="${CSC300_MUSIC_VIDEO_URL}" loop muted playsinline controls></video>
      </div>
      <audio id="song" src="${CSC300_MP3_URL}" preload="metadata" controls style="width:100%;height:34px"></audio>
      <canvas id="viz" width="520" height="46"></canvas>

      <div style="font-size:11px;font-weight:700;color:#00f3ff">SYNCHRONIZED LYRIC TELEPROMPTER (CLICK ANY SECTION TO HIGHLIGHT)</div>
      <div class="lyrics" id="lyricsBox"></div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px;font-weight:700;color:#00f3ff">COMPLETED CSC 300GW PROCESS LOG & SUBMISSION WRITE-UP</span>
        <span style="font-size:10px;color:#4ade80">● OPEG-V1.0 VERIFIED</span>
      </div>
      <pre class="dossier" id="dossierText">Vaughn Scott
CSC 300GW — AI Music Assignment (Prof. Kroll)
Song Title: "Nothing's True Until It Verifies"
Genre & Tempo: Mid-Tempo Alt-Rock / Electronic Hybrid · 100 BPM

1. Concept Selection:
Built directly around our team's "Proof of Reality" architecture ("propose → verify → approve → act" — agents propose, humans approve, nothing is trusted until it verifies) so the music assignment reinforces our engineering thesis.

2. Lyric Drafting (AI — OpenClaw / SchoolOffice):
Structured in a Verse / Pre-Chorus / Chorus / Bridge / Explosive Final Chorus arc ("whisper to roar to whisper"), mirroring the verification gate itself: restrained tension while unverified, releasing into full band power once approved.

3. Prompt Engineering (AI — Suno/Udio Formula):
Engineered using Genre + Mood + Era + Instruments + Vocal Style + Production + Dynamics ("Mid-tempo alt-rock with electronic pulse, 2020s indie-electronic production, weathered clear tenor building to belted final chorus, 100 BPM") with inline [Restrained], [Building Energy], [Whispered], and [Explosive] metatags.

4. Audio, Vocal, Cover Art & Music Video Generation (Human + Creator Nexus Multi-Modal Pipeline):
- Vocal & Music Track (NothingsTrueUntilIt.mp3): Generated from the engineered prompt and lyrics, audited by human ears to verify that structural tags ([Verse], [Chorus], [Bridge]) were performed as dynamics rather than spoken aloud.
- Album Cover Art & 16:9 Music Video: Generated inside Creator Nexus using AI image synthesis and Veo 3.x video generation, then mounted alongside the MP3 and synchronized lyric stage in looseScrew Studio.

5. Division of Labor (AI Proposes → Human Verifies & Approves):
- AI Contributed: Concept alignment, full lyrics, dynamic metatag structure, Suno style prompt, album cover visual synthesis, and 16:9 visual loop.
- Human Contributed: Executing the audio generation, auditioning takes, verifying vocal phrasing, and approving the final master in Creator Nexus.</pre>
    </div>
  </div>

<script>
  const STANZAS = [
    { tag: '[Intro · 0:00]', time: 0, text: '(soft synth pulse, one heartbeat kick)' },
    { tag: '[Verse 1 · Restrained]', time: 10, text: "Four screens are talking, none of them agree\\nTickets say one thing, the ledger disagrees\\nSomebody's lying, or nobody's checked\\nThe loudest signal wins — and it's wrong, I'd bet" },
    { tag: '[Pre-Chorus]', time: 28, text: "I don't need faster, I need to know\\nI don't need louder, I need to slow—" },
    { tag: '[Chorus · Building Energy]', time: 38, text: "Nothing's true until it verifies\\nEvery draft waits on human eyes\\nStale and current, side by side\\nThe gap is gold, don't let it hide\\nPropose, don't act — not yet, not yet\\nNothing's true until it verifies" },
    { tag: '[Verse 2]', time: 62, text: "The agent's hungry, it wants to move\\nRefund the charge, don't wait, don't prove\\nBut the gate is patient, the gate don't care\\nHow fast you ran to get nowhere" },
    { tag: '[Pre-Chorus]', time: 80, text: "I don't need faster, I need to know\\nI don't need louder, I need to slow—" },
    { tag: '[Chorus · Building Energy]', time: 90, text: "Nothing's true until it verifies\\nEvery draft waits on human eyes\\nStale and current, side by side\\nThe gap is gold, don't let it hide\\nPropose, don't act — not yet, not yet\\nNothing's true until it verifies" },
    { tag: '[Bridge · Stripped Back Vocal + Piano]', time: 114, text: "One file, one word, APPROVE\\nThat's the only thing that moves the room\\nNo green check lying to itself\\nNo shortcut dressed up as the truth" },
    { tag: '[Final Chorus · Explosive Full Band]', time: 134, text: "Nothing's true until it verifies\\nEvery draft waits on human eyes\\nStale and current, side by side\\nThe gap is gold, don't let it hide\\nPropose, don't act — not yet, not yet\\nNothing's true until it verifies" },
    { tag: '[Outro]', time: 160, text: '(fading synth pulse, one last heartbeat kick, silence)' }
  ];

  const box = document.getElementById('lyricsBox');
  const song = document.getElementById('song');
  const mv = document.getElementById('mv');
  const playBtn = document.getElementById('playBtn');

  STANZAS.forEach((s, idx) => {
    const div = document.createElement('div');
    div.className = 'stanza' + (idx === 0 ? ' active' : '');
    div.id = 'stanza-' + idx;
    div.innerHTML = '<div class="stanza-tag">' + s.tag + '</div><div class="stanza-text">' + s.text + '</div>';
    div.onclick = () => {
      song.currentTime = s.time;
      song.play();
      mv.play();
    };
    box.appendChild(div);
  });

  function togglePlay() {
    if (song.paused) {
      song.play();
      mv.play();
    } else {
      song.pause();
      mv.pause();
    }
  }

  song.onplay = () => { playBtn.textContent = '⏸ Pause Song + Video'; mv.play(); };
  song.onpause = () => { playBtn.textContent = '▶ Play Song + Music Video'; mv.pause(); };
  song.ontimeupdate = () => {
    const t = song.currentTime;
    let activeIdx = 0;
    for (let i = 0; i < STANZAS.length; i++) {
      if (t >= STANZAS[i].time) activeIdx = i;
    }
    STANZAS.forEach((_, i) => {
      const el = document.getElementById('stanza-' + i);
      if (el) el.className = 'stanza' + (i === activeIdx ? ' active' : '');
    });
  };

  function copyDossier() {
    const txt = document.getElementById('dossierText').textContent;
    navigator.clipboard.writeText(txt);
    const b = document.getElementById('copyBtn');
    b.textContent = '✓ Copied Write-Up!';
    setTimeout(() => { b.textContent = '📋 Copy Final CSC 300GW Write-Up'; }, 1800);
  }

  // Animated spectrum bar
  const c = document.getElementById('viz'), ctx = c.getContext('2d');
  let tick = 0;
  function drawViz() {
    tick++;
    ctx.fillStyle = '#05080e';
    ctx.fillRect(0, 0, c.width, c.height);
    const playing = !song.paused;
    const bars = 44;
    const bw = c.width / bars;
    for (let i = 0; i < bars; i++) {
      const h = playing ? (Math.sin(tick * 0.14 + i * 0.45) + 1) * 18 + 6 : 5;
      ctx.fillStyle = i % 2 === 0 ? '#00f3ff' : '#3b63fb';
      ctx.fillRect(i * bw + 2, c.height - h, bw - 3, h);
    }
    requestAnimationFrame(drawViz);
  }
  drawViz();
</script>
</body>
</html>`;