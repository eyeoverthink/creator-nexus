export const GITHUB_REPO_URL = 'https://github.com/eyeoverthink/looseScrew';

export const INITIAL_TRANSMISSIONS = [
  {
    id: 'music-1',
    channel: 'MUSIC',
    title: 'Phi-Harmonic Sub-Bass (1.618 Hz Drift)',
    duration: '03:44',
    screws: 842,
    bpm: 118,
    tags: ['#WebAudioSynth', '#CyanRimLoFi', '#118BPM', '#LiveStems'],
    voiceIntro: 'Spinning up Phi-Harmonic Sub-Bass on the looseScrew Music Channel. Watch the 64-band cyan FFT spectrum lock to 118 BPM.',
    synthNotes: [110, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66],
    code: `// LIVE WEBAUDIO SYNTH PATCH (EDIT & RUN TO MUTATE SOUND)\nconst patch = {\n  waveform: 'sawtooth',\n  cutoffHz: 1618,\n  resonance: 6.4,\n  tempoBpm: 118,\n  phiRatio: 1.6180339\n};\nreturn "Synth patch verified at " + patch.tempoBpm + " BPM | Filter: " + patch.cutoffHz + "Hz";`,
    reaTrace: `[AUDIO ENGINE TRACE]\n• Generator: WebAudio OscillatorNode + BiquadFilterNode\n• Real-time FFT: 128-bin frequency spectrum bound to Avatar cyan aura`
  },
  {
    id: 'code-1',
    channel: 'CODE',
    title: 'REA Protocol: Reverse Engineer & Clean-Room Rebuild',
    duration: '14:20',
    screws: 1290,
    bpm: 95,
    tags: ['#REA_MCP', '#BinaryAnalysis', '#CleanRebuild', '#AppArchitecture'],
    voiceIntro: 'Welcome to the Code Forge. In this session we run the 8-step Reverse Engineer Anything protocol: mapping surface symbols, tracing UI triggers to core logic, and verifying our clean-room rebuild.',
    synthNotes: [146.83, 174.61, 220.0, 293.66],
    code: `// REA STEP 6 & 7: CLEAN-ROOM FEATURE RECONSTRUCTION & VERIFICATION\nfunction traceStatePipeline(uiPayload) {\n  if (!uiPayload || !uiPayload.action) throw new Error("Invalid trigger");\n  const timestamp = 1760896620;\n  const signature = uiPayload.action.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);\n  return {\n    status: "VERIFIED_ORIGINAL_REBUILD",\n    route: "ipcMain://fraymus/dispatch",\n    hash: Math.abs(signature).toString(16).toUpperCase(),\n    epoch: timestamp\n  };\n}\n\nconst test1 = traceStatePipeline({ action: "SYNC_NEURAL_BUFFER" });\nconst test2 = traceStatePipeline({ action: "EXPORT_SVG_CENTERLINE" });\nreturn JSON.stringify({ test1, test2, verdict: "PASS (100% parity)" }, null, 2);`,
    reaTrace: `[REA EVIDENCE LOG // TARGET: DESKTOP STUDIO APP]\n1. Target Scoping: State Sync & SVG Centerline IPC Pipeline\n2. Setup & Readiness: npx rea-agents setup (MCP active)\n3. Surface Mapping: 14 modules, 3 IPC channels flagged\n4. Feature Tracing: Button#export -> preload.bridge -> core.traceStatePipeline()\n5. Confidence Label: PROVEN (verified against HAR & runtime trace)`
  },
  {
    id: 'video-1',
    channel: 'VIDEO',
    title: 'Fraymus Portal: Infinite 3D Neural Terrain Broadcast',
    duration: '08:15',
    screws: 965,
    bpm: 124,
    tags: ['#60FPS_Canvas', '#FraymusPortal', '#CyberpunkShader', '#Devlog'],
    voiceIntro: 'Broadcasting the Fraymus Portal infinite frame buffer. Every ridge in this wireframe horizon reacts to our audio bus and thermal core.',
    synthNotes: [98.0, 123.47, 146.83, 196.0, 246.94],
    code: `// LIVE SHADER GEOMETRY CONFIG\nconst terrainConfig = {\n  gridLines: 28,\n  horizonGlow: "#00f3ff",\n  elevationScale: 42.5,\n  cameraVelocity: 2.4\n};\nreturn "Terrain matrix re-compiled: " + terrainConfig.gridLines + " scanlines active.";`,
    reaTrace: `[VIDEO STREAM TELEMETRY]\n• Render Pipeline: HTML5 2D/3D Projection Matrix @ 60FPS\n• Frame Sync: Locked to Avatar Host voice modulator`
  },
  {
    id: 'music-2',
    channel: 'MUSIC',
    title: 'Lazarus Thermal Injection (Cyber-Electro Dub)',
    duration: '04:12',
    screws: 619,
    bpm: 132,
    tags: ['#ElectroDub', '#Bassline', '#LazarusEngine', '#HardwareJam'],
    voiceIntro: 'Dropping Lazarus Thermal Injection at 132 BPM. Heavy sawtooth basslines engineered right here in the looseScrew lab.',
    synthNotes: [82.41, 98.0, 110.0, 123.47, 164.81, 196.0],
    code: `// BASSLINE ARPEGGIATOR MUTATION\nconst arp = [82.41, 110.0, 164.81, 220.0].map(f => (f * 1.618).toFixed(2));\nreturn "Harmonic frequencies injected: " + arp.join("Hz, ") + "Hz";`,
    reaTrace: `[AUDIO STREAM TELEMETRY]\n• Synthesis: Dual-oscillator detuned sub-bass + white-noise snare burst`
  },
  {
    id: 'code-2',
    channel: 'CODE',
    title: 'SignCraft 3D: Neon Centerline Skeletonization Engine',
    duration: '11:08',
    screws: 1120,
    bpm: 105,
    tags: ['#AppDesign', '#SVGPaths', '#OpenSCAD', '#AlgorithmWalkthrough'],
    voiceIntro: 'Breaking down the SignCraft 3D centerline tracing algorithm—turning raw typography into 3D-printable neon LED channels.',
    synthNotes: [130.81, 164.81, 196.0, 261.63],
    code: `// MEDIAL AXIS SKELETONIZER GENERATOR\nfunction generateNeonCenterline(points) {\n  return points.map((pt, idx) => ({\n    step: idx,\n    svgCmd: idx === 0 ? \`M \${pt[0]} \${pt[1]}\` : \`L \${pt[0]} \${pt[1]}\`,\n    glowClipMount: idx % 2 === 0\n  }));\n}\nconst samplePath = generateNeonCenterline([[10,20], [45,80], [90,80], [130,20]]);\nreturn JSON.stringify(samplePath, null, 2);`,
    reaTrace: `[APP DESIGN BLUEPRINT]\n• Output: Parametric SVG centerline + 80mm Spin-Elevator mount specs\n• Verification: Zero self-intersecting bezier nodes`
  },
  {
    id: 'video-2',
    channel: 'VIDEO',
    title: 'Bare-Metal AGI Kernel: 22-Phase Boot Sequence Live',
    duration: '19:50',
    screws: 1540,
    bpm: 110,
    tags: ['#BareMetal', '#Java21', '#TesseractSynapse', '#SystemDesign'],
    voiceIntro: 'Full visual breakdown of the 22-phase boot sequence—from raw opcode lexing to hyper-dimensional swarm consensus.',
    synthNotes: [110.0, 138.59, 164.81, 220.0],
    code: `// BARE-METAL BOOT VERIFIER\nconst phases = ["BIOS_HANDOFF", "HDC_8192_ALLOC", "LAZARUS_THREAD", "AKASHIC_MOUNT"];\nreturn phases.map((p, i) => \`Phase 0\${i+1}: [\${p}] -> ONLINE\`).join("\\n");`,
    reaTrace: `[KERNEL STREAM]\n• Memory Graph: SQLite + AkashicRecord Fossil Persistence`
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