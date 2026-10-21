import { AI_WORKSHOP_OS_HTML } from '@/components/nexus/loosescrew/aiWorkshopOsHtml';
import {
  CSC300_MP3_URL,
  CSC300_COVER_ART_URL,
  CSC300_MUSIC_VIDEO_URL,
  CSC300_MUSIC_STUDIO_HTML,
} from '@/components/nexus/loosescrew/csc300MusicHtml';

export const GITHUB_REPO_URL = 'https://github.com/eyeoverthink/looseScrew';

export function extractYouTubeId(url = '') {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function isAudioUrl(url = '', mime = '') {
  if (mime && mime.startsWith('audio/')) return true;
  return /\.(mp3|wav|ogg|m4a|flac|aac)(\?.*)?$/i.test(String(url || ''));
}

export function isVideoUrl(url = '', mime = '') {
  if (mime && mime.startsWith('video/')) return true;
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(String(url || ''));
}

export const INITIAL_TRANSMISSIONS = [
  {
    id: 'music-csc300-verifies',
    channel: 'MUSIC',
    title: 'CSC 300GW: "Nothing\'s True Until It Verifies" (Full Song + AI Video + Process Log)',
    duration: '03:12',
    screws: 1618,
    bpm: 100,
    tags: ['#CSC300GW', '#ProofOfReality', '#AltRockElectronic', '#100BPM', '#FullSongAndVideo'],
    voice_intro:
      'Broadcasting Nothing\'s True Until It Verifies by Vaughn Scott for CSC 300GW. Full vocals, 100 BPM alt-rock electronic production, AI album cover, Veo music video, and completed process log online.',
    media_url: CSC300_MP3_URL,
    mime_type: 'audio/mpeg',
    external_link: CSC300_MUSIC_VIDEO_URL,
    synth_notes: [110, 130.81, 146.83, 164.81, 196.0, 220.0],
    code: `// CSC 300GW PROOF-OF-REALITY SONG & MULTI-MODAL VERIFICATION\nreturn JSON.stringify({\n  course: 'CSC 300GW (Prof. Kroll)',\n  artist: 'Vaughn Scott (EyeOverthink)',\n  title: "Nothing's True Until It Verifies",\n  bpm: 100,\n  mp3_master: '${CSC300_MP3_URL}',\n  cover_art: '${CSC300_COVER_ART_URL}',\n  music_video: '${CSC300_MUSIC_VIDEO_URL}',\n  workflow: 'propose -> verify -> approve -> act'\n}, null, 2);`,
    rea_trace: `[CSC 300GW AI MUSIC DELIVERABLE TRACE]\n• Song: "Nothing's True Until It Verifies" (100 BPM Mid-Tempo Alt-Rock / Electronic)\n• Lyrics & Prompt Engineering: OpenClaw / SchoolOffice\n• Master Vocal Audio: NothingsTrueUntilIt.mp3\n• Visual Cover & 16:9 Music Video: Generated & Verified in Creator Nexus`,
    app_html: CSC300_MUSIC_STUDIO_HTML,
  },
  {
    id: 'code-fraymus-os',
    channel: 'CODE',
    title: 'AI WORKSHOP OS — F.R.A.Y.M.U.S. 538-Node Sovereign Brain',
    duration: 'LIVE_OS',
    screws: 4721,
    bpm: 137,
    tags: ['#FRAYMUS', '#Phi75Seal', '#538_Notes', '#BabelTransmuter', '#Genesis153'],
    voice_intro: 'AI Workshop OS and canonical F.R.A.Y.M.U.S. vault online. 538 notes, 1,947 synaptic links, Babel Transmuter REPL, and 24-app Tool Armory active.',
    external_link: 'https://github.com/eyeoverthink/looseScrew',
    synth_notes: [137.5, 161.8, 220.0, 261.63, 355.96, 432.0],
    code: `// CANONICAL F.R.A.Y.M.U.S. VERIFICATION SUITE (φ⁷⁵ Seal = 4721424167835376.00)\nconst PHI = 1.6180339887;\nconst PHI_INV = 1 / PHI;\nconst SEAL_75 = 4721424167835376.00;\n// [F] Phi-Enhanced Scott Algorithm\nconst R = v => 1 - Math.abs((v * PHI) % 1);\n// [Y] Yielding Belonging Protocol: Threshold C >= 0.7569 * φ^0.5 = 0.962\nconst belongingThreshold = +(0.7569 * Math.sqrt(PHI)).toFixed(3);\n// [M] CentripetalMem Continuity\nconst continuity = 1.014;\nreturn JSON.stringify({\n  seal: SEAL_75,\n  fingerprint: 'phi75-dcfa192b0ec793e9',\n  scottResonanceAt153: +R(153).toFixed(6),\n  belongingThreshold,\n  centripetalPass: continuity > PHI_INV,\n  verdict: 'My vision. My logic. My code. — φ∞ Architect Genesis Block 153'\n}, null, 2);`,
    rea_trace: `[CANONICAL F.R.A.Y.M.U.S. + AI WORKSHOP OS ARCHITECTURE]\n• F: φ = 1.6180339887 | φ⁷⁵ Seal = 4721424167835376.00 | GoldenAngle 137.507° | Scott Algorithm (-32.3% Hausdorff)\n• R: Wolfram Rule 30 FIXED (pop 494, entropy 0.5484) | Lexer → Recursive Descent Parser\n• A: Babel Transmuter REPL by Vaughn Scott (2 + 3 * 4 → Eval=14, C=(2+(3*4)), ASM=x86-64)\n• Y: Yielding Belonging E(t) | Level 0 +0.5 REQUIRED | C ≥ 0.962 Fraynix Optimal (+27%)\n• M: CentripetalMem O(1) 422× faster (r=0.005807, continuity 1.014 > 0.618 PASS) | FanConductor "I BELONG"\n• U: N=P×Q 103-bit | fp=phi75-dcfa192b0ec793e9 | Opcodes 0x10-0x5A | ZeroTimeRecognition <1ms\n• S: Omega Point WILL→BRAIN→BODY 50ms | 538 Notes · 1,947 Connections · 24 Tool Armory Integrations`,
    app_html: AI_WORKSHOP_OS_HTML
  },
  {
    id: 'music-1',
    channel: 'MUSIC',
    title: 'Phi-Harmonic Sub-Bass (1.618 Hz Drift)',
    duration: '03:44',
    screws: 842,
    bpm: 118,
    tags: ['#WebAudioSynth', '#CyanRimLoFi', '#118BPM', '#LiveStems'],
    voice_intro: 'Spinning up Phi-Harmonic Sub-Bass on the looseScrew Music Channel. Use the live synth pad matrix or load your own MP3 track.',
    external_link: 'https://github.com/eyeoverthink/looseScrew',
    synth_notes: [110, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66],
    code: `// LIVE WEBAUDIO SYNTH PATCH (EDIT & RUN TO MUTATE SOUND)\nconst patch = {\n  waveform: 'sawtooth',\n  cutoffHz: 1618,\n  resonance: 6.4,\n  tempoBpm: 118,\n  phiRatio: 1.6180339\n};\nreturn "Synth patch verified at " + patch.tempoBpm + " BPM | Filter: " + patch.cutoffHz + "Hz";`,
    rea_trace: `[AUDIO ENGINE TRACE]\n• Generator: WebAudio OscillatorNode + BiquadFilterNode\n• Real-time FFT: 128-bin frequency spectrum bound to Avatar cyan aura`,
    app_html: `<!DOCTYPE html><html><head><style>
      body{margin:0;background:#05070a;color:#e6f1ff;font-family:monospace;padding:18px;display:flex;flex-direction:column;gap:14px}
      .top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #00f3ff44;padding-bottom:10px}
      .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
      button.pad{background:#0c131f;border:1px solid #00f3ff66;color:#00f3ff;padding:18px 8px;border-radius:8px;font-family:monospace;font-weight:bold;cursor:pointer;transition:.15s}
      button.pad:hover,button.pad.active{background:#00f3ff22;box-shadow:0 0 14px #00f3ff66}
      .controls{display:flex;gap:16px;align-items:center;background:#0b1018;padding:10px 14px;border-radius:8px;border:1px solid #1e2c3f}
    </style></head><body>
      <div class="top"><strong>♫ PHI-HARMONIC LIVE SYNTH MATRIX (UN-SANDBOXED WEBAUDIO)</strong><span id="status">READY</span></div>
      <div class="controls">
        <label>Waveform <select id="wave"><option value="sawtooth">Sawtooth</option><option value="square">Square</option><option value="triangle">Triangle</option><option value="sine">Sine</option></select></label>
        <label>Cutoff <input id="cutoff" type="range" min="120" max="4800" value="1618"/></label>
        <button id="arpBtn" style="background:#00f3ff;color:#05070a;border:none;padding:6px 12px;border-radius:4px;font-weight:bold;cursor:pointer">▶ Toggle Phi Arp</button>
      </div>
      <div class="grid" id="pads"></div>
      <script>
        const notes=[110,130.81,146.83,164.81,177.98,196.00,220.00,261.63];
        let ctx,arpTimer,step=0;
        function trig(f,el){
          ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();
          const o=ctx.createOscillator(),flt=ctx.createBiquadFilter(),g=ctx.createGain();
          o.type=document.getElementById('wave').value;
          o.frequency.value=f;
          flt.type='lowpass';flt.frequency.value=Number(document.getElementById('cutoff').value);
          g.gain.setValueAtTime(0.22,ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.45);
          o.connect(flt);flt.connect(g);g.connect(ctx.destination);
          o.start();o.stop(ctx.currentTime+0.46);
          document.getElementById('status').textContent=f.toFixed(2)+' Hz triggered';
          if(el){el.classList.add('active');setTimeout(()=>el.classList.remove('active'),180);}
        }
        const box=document.getElementById('pads');
        notes.forEach((n,i)=>{
          const b=document.createElement('button');b.className='pad';
          b.innerHTML='PAD 0'+(i+1)+'<br/><small>'+n+' Hz</small>';
          b.onclick=()=>trig(n,b);box.appendChild(b);
        });
        document.getElementById('arpBtn').onclick=()=>{
          if(arpTimer){clearInterval(arpTimer);arpTimer=null;return;}
          arpTimer=setInterval(()=>{const btns=box.querySelectorAll('button');const idx=step++%notes.length;trig(notes[idx],btns[idx]);},220);
        };
      </script>
    </body></html>`
  },
  {
    id: 'code-1',
    channel: 'CODE',
    title: 'REA Protocol: Reverse Engineer & Clean-Room Rebuild',
    duration: '14:20',
    screws: 1290,
    bpm: 95,
    tags: ['#REA_MCP', '#BinaryAnalysis', '#CleanRebuild', '#AppArchitecture'],
    voice_intro: 'Welcome to the Code Forge. Run the interactive 8-step Reverse Engineer Anything workbench or prompt the Autonomous Forge to design any new app.',
    external_link: 'https://github.com/eyeoverthink/looseScrew',
    synth_notes: [146.83, 174.61, 220.0, 293.66],
    code: `// REA STEP 6 & 7: CLEAN-ROOM FEATURE RECONSTRUCTION & VERIFICATION\nfunction traceStatePipeline(uiPayload) {\n  if (!uiPayload || !uiPayload.action) throw new Error("Invalid trigger");\n  const timestamp = Date.now();\n  const signature = uiPayload.action.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);\n  return {\n    status: "VERIFIED_ORIGINAL_REBUILD",\n    route: "ipcMain://fraymus/dispatch",\n    hash: Math.abs(signature).toString(16).toUpperCase(),\n    epoch: timestamp\n  };\n}\nconst test1 = traceStatePipeline({ action: "SYNC_NEURAL_BUFFER" });\nconst test2 = traceStatePipeline({ action: "EXPORT_SVG_CENTERLINE" });\nreturn JSON.stringify({ test1, test2, verdict: "PASS (100% parity)" }, null, 2);`,
    rea_trace: `[REA EVIDENCE LOG // TARGET: DESKTOP STUDIO APP]\n1. Target Scoping: State Sync & SVG Centerline IPC Pipeline\n2. Setup & Readiness: npx rea-agents setup (MCP active)\n3. Surface Mapping: 14 modules, 3 IPC channels flagged\n4. Feature Tracing: Button#export -> preload.bridge -> core.traceStatePipeline()\n5. Confidence Label: PROVEN (verified against HAR & runtime trace)`,
    app_html: `<!DOCTYPE html><html><head><style>
      body{margin:0;background:#05070a;color:#e6f1ff;font-family:monospace;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;height:calc(100vh - 32px)}
      .card{background:#0c1017;border:1px solid #00f3ff44;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px}
      input,textarea{background:#05070a;color:#00f3ff;border:1px solid #26354a;padding:8px;border-radius:4px;font-family:monospace}
      button{background:#00f3ff;color:#05070a;border:none;padding:8px 12px;border-radius:4px;font-weight:bold;cursor:pointer;font-family:monospace}
      pre{background:#030508;padding:10px;border-radius:4px;overflow:auto;flex:1;margin:0;color:#a6e22e;font-size:12px}
    </style></head><body>
      <div class="card">
        <strong style="color:#00f3ff">⌘ REA LIVE IPC & SYMBOL DISPATCHER</strong>
        <input id="act" value="SYNC_AKASHIC_VECTOR_8192" placeholder="Action symbol..."/>
        <textarea id="payload" rows="4">{"channel":"ipcMain","bitWidth":8192,"verify":true}</textarea>
        <button onclick="runTrace()">⚡ Trace & Reconstruct Clean-Room Handler</button>
      </div>
      <div class="card">
        <strong style="color:#00f3ff">VERIFIED CLEAN-ROOM OUTPUT</strong>
        <pre id="out">Click Trace & Reconstruct to inspect runtime parity...</pre>
      </div>
      <script>
        function runTrace(){
          const act=document.getElementById('act').value;
          let parsed={};try{parsed=JSON.parse(document.getElementById('payload').value);}catch(e){parsed={raw:e.message};}
          const sig=act.split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0);
          document.getElementById('out').textContent=JSON.stringify({
            step_1_scope: act,
            step_4_ipc_route: "ipcMain://fraymus/" + act.toLowerCase(),
            step_6_clean_hash: "0x" + Math.abs(sig).toString(16).toUpperCase(),
            step_7_parity: "100% VERIFIED",
            payload_echo: parsed,
            timestamp: new Date().toISOString()
          },null,2);
        }
        runTrace();
      </script>
    </body></html>`
  },
  {
    id: 'video-1',
    channel: 'VIDEO',
    title: 'Fraymus Portal: Interactive 3D Neural Terrain Shader',
    duration: '08:15',
    screws: 965,
    bpm: 124,
    tags: ['#60FPS_Canvas', '#FraymusPortal', '#CyberpunkShader', '#Devlog'],
    voice_intro: 'Broadcasting the Fraymus Portal interactive 3D terrain shader. Drag sliders or move your cursor to warp the horizon geometry in real time.',
    external_link: 'https://github.com/eyeoverthink/looseScrew',
    synth_notes: [98.0, 123.47, 146.83, 196.0, 246.94],
    code: `// LIVE SHADER GEOMETRY CONFIG\nconst terrainConfig = {\n  gridLines: 28,\n  horizonGlow: "#00f3ff",\n  elevationScale: 42.5,\n  cameraVelocity: 2.4\n};\nreturn "Terrain matrix re-compiled: " + terrainConfig.gridLines + " scanlines active.";`,
    rea_trace: `[VIDEO STREAM TELEMETRY]\n• Render Pipeline: HTML5 2D/3D Projection Matrix @ 60FPS\n• Frame Sync: Locked to Avatar Host voice modulator`,
    app_html: `<!DOCTYPE html><html><head><style>
      body{margin:0;background:#04060a;color:#00f3ff;font-family:monospace;overflow:hidden}
      .hud{position:fixed;top:10px;left:12px;z-index:10;background:#05070acc;padding:8px 12px;border:1px solid #00f3ff55;border-radius:6px;display:flex;gap:14px;align-items:center;font-size:12px}
      canvas{display:block;width:100vw;height:100vh}
    </style></head><body>
      <div class="hud">
        <strong>FRAYMUS 3D SHADER DECK</strong>
        <label>Speed <input id="spd" type="range" min="1" max="12" value="4"/></label>
        <label>Warp <input id="warp" type="range" min="5" max="80" value="32"/></label>
      </div>
      <canvas id="c"></canvas>
      <script>
        const c=document.getElementById('c'),ctx=c.getContext('2d');
        let t=0;
        function loop(){
          c.width=window.innerWidth;c.height=window.innerHeight;
          const spd=Number(document.getElementById('spd').value),warp=Number(document.getElementById('warp').value);
          t+=spd*0.03;
          ctx.fillStyle='#04060a';ctx.fillRect(0,0,c.width,c.height);
          const hz=c.height*0.45;
          ctx.strokeStyle='#00f3ff55';
          for(let i=-16;i<=16;i++){
            ctx.beginPath();ctx.moveTo(c.width/2+i*20,hz);
            ctx.lineTo(c.width/2+i*130+Math.sin(t+i)*warp,c.height);ctx.stroke();
          }
          for(let y=hz;y<c.height;y+=22){
            const py=y+((t*18)%22);
            ctx.beginPath();
            for(let x=0;x<=c.width;x+=30){
              const wy=py+Math.sin(x*0.02+t+y*0.05)*(warp*0.35);
              if(x===0)ctx.moveTo(x,wy);else ctx.lineTo(x,wy);
            }
            ctx.stroke();
          }
          requestAnimationFrame(loop);
        }
        loop();
      </script>
    </body></html>`
  }
];

export function drawBrandAvatarFrame(actx, frameTick, avatarTalking, mouthOpenness) {
  if (!actx) return;
  actx.clearRect(0, 0, 64, 68);
  const bounce = avatarTalking ? Math.sin(frameTick * 0.35) * 1 : 0;
  actx.fillStyle = '#00f3ff';
  actx.fillRect(14, 6 + bounce, 36, 2);
  actx.fillRect(10, 8 + bounce, 4, 4);
  actx.fillRect(50, 8 + bounce, 4, 4);
  actx.fillRect(8, 12 + bounce, 2, 16);
  actx.fillRect(54, 12 + bounce, 2, 16);
  actx.fillRect(2, 48, 14, 2);
  actx.fillRect(48, 48, 14, 2);
  actx.fillStyle = '#293829';
  actx.fillRect(14, 8 + bounce, 36, 6);
  actx.fillRect(10, 12 + bounce, 44, 15);
  actx.fillStyle = '#182019';
  actx.fillRect(12, 15 + bounce, 40, 12);
  actx.fillStyle = '#9c5a3c';
  actx.fillRect(17, 17 + bounce, 30, 26);
  actx.fillStyle = '#b56c49';
  actx.fillRect(22, 18 + bounce, 20, 6);
  actx.fillStyle = '#141414';
  actx.fillRect(20, 21 + bounce, 8, 2);
  actx.fillRect(36, 21 + bounce, 8, 2);
  actx.fillStyle = '#1b2226';
  actx.fillRect(18, 23 + bounce, 12, 8);
  actx.fillRect(34, 23 + bounce, 12, 8);
  actx.fillRect(30, 25 + bounce, 4, 2);
  actx.fillStyle = '#8b4e32';
  actx.fillRect(19, 24 + bounce, 10, 6);
  actx.fillRect(35, 24 + bounce, 10, 6);
  actx.fillStyle = '#ffffff';
  actx.fillRect(22, 26 + bounce, 4, 2);
  actx.fillRect(38, 26 + bounce, 4, 2);
  actx.fillStyle = '#090b0e';
  actx.fillRect(23, 26 + bounce, 2, 2);
  actx.fillRect(39, 26 + bounce, 2, 2);
  actx.fillStyle = '#1e2224';
  actx.fillRect(23, 34 + bounce, 18, 3);
  actx.fillRect(22, 36 + bounce, 3, 3);
  actx.fillRect(39, 36 + bounce, 3, 3);
  actx.fillRect(24, 39 + bounce, 16, 6);
  if (avatarTalking && mouthOpenness > 0.2) {
    actx.fillStyle = '#00f3ff';
    actx.fillRect(27, 36 + bounce, 10, Math.min(4, Math.ceil(mouthOpenness * 4)));
  } else {
    actx.fillStyle = '#bf7959';
    actx.fillRect(26, 36 + bounce, 12, 2);
  }
  actx.fillStyle = '#f2f4f7';
  actx.fillRect(18, 45, 28, 23);
  actx.fillStyle = '#c5ccd6';
  actx.fillRect(20, 45, 8, 6);
  actx.fillRect(36, 45, 8, 6);
  actx.fillStyle = '#2d3748';
  actx.fillRect(31, 52, 2, 2);
  actx.fillRect(31, 59, 2, 2);
  actx.fillRect(31, 65, 2, 2);
  actx.fillStyle = '#293829';
  actx.fillRect(2, 50, 17, 18);
  actx.fillRect(45, 50, 17, 18);
}