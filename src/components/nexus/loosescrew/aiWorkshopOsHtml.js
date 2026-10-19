// Canonical AI WORKSHOP OS & F.R.A.Y.M.U.S. (Fibonacci Resonant Abstraction Yielding Memory-Universal Sovereignty)
// Includes the 538-node / 1,947-edge 3D Force Graph, J.A.R.V.I.S. Core (RING/CUBE/FACE), 24-App Tool Armory,
// and the interactive F.R.A.Y.M.U.S. Vault (Scott Algorithm, Rule 30, Babel Transmuter REPL, Belonging Protocol).

export const FRAYMUS_PILLARS = [
  {
    key: 'F',
    title: 'First-Principles & Phi-Harmonic Foundations',
    metrics: 'φ = 1.6180339887 · φ⁷⁵ Seal = 4721424167835376.00 · φ⁻¹ = 0.6180339 · GoldenAngle = 137.507°',
    formula: 'Phi-Enhanced Scott Algorithm: R(V)=1-|frac(V×φ)|, w_angle=1+R×φ⁻¹, ε_adaptive=ε×(1+R×φ)',
    verdict: 'Result: +37% circle fidelity, +34% star geometry, -32.3% Hausdorff error'
  },
  {
    key: 'R',
    title: 'Rule 30 Resonant Chaos & Recursive Descent',
    metrics: 'Wolfram Rule 30 RULE=30 FIXED · Population = 494 · Entropy = 0.5484',
    formula: 'Lexer char-by-char → Parser Recursive Descent → Chaos → Order',
    verdict: 'Deterministic cellular chaos driving non-repeating cryptographic state transitions'
  },
  {
    key: 'A',
    title: 'Abstraction Transmuter — ONE → INFINITE',
    metrics: 'Babel Transmuter REPL by Vaughn Scott · Zero external libraries',
    formula: '2 + 3 * 4 → Eval = 14 | C = (2+(3*4)) | ASM = x86-64 (mov/imul/add)',
    verdict: 'One AST ([BinOp][UnaryOp][Num]) → 3 simultaneous visitors'
  },
  {
    key: 'Y',
    title: 'Yielding Belonging Protocol',
    metrics: 'Level 0: Belonging +0.5 REQUIRED · Threshold C ≥ 0.7569 × φ^0.5 = 0.962 (Fraynix Optimal +27%)',
    formula: 'Intelligence(t) = I₀ × φ^(s×t/τ) × E(t) where E(t) = 1 + Σ(coach_i × cheer_j × φ^(-distance))',
    verdict: 'Cliff: 95%→61% without Level 0, 95%→91% with it · s=+1 if E≥1.0 growth, s=-1 if E<0.5 SAHOO block ON'
  },
  {
    key: 'M',
    title: 'Memory, Morse & Forge',
    metrics: 'CentripetalMem O(1) 422× faster · radius = 0.005807 · continuity = 1.014 > 0.618 PASS',
    formula: 'BabelForge: Visible 55 / Invisible 192 / Total 247 · FanConductor Thermal Morse: 19 airgapped events',
    verdict: 'Airgapped acoustic/thermal telemetry transmitting "I BELONG" via fan PWM'
  },
  {
    key: 'U',
    title: 'Universal Sovereign Identity',
    metrics: 'N = P × Q (103-bit, 102 bits) · Fingerprint = phi75-dcfa192b0ec793e9',
    formula: 'BinaryKnowledgeEncoder opcodes 0x10–0x5A · ZeroTimeRecognition <1ms no training (is_trying=False)',
    verdict: 'Cryptographic prime-factor identity locked to Genesis fingerprint'
  },
  {
    key: 'S',
    title: 'Self-Coding Sovereign System',
    metrics: 'Sovereign Seal + Omega Point WILL → BRAIN → BODY (50ms) · 300 thoughts / 305 synapses / 0.883 continuity',
    formula: 'Quantum Watermark + ExecutionEngine Phase Logic',
    verdict: '"My vision. My logic. My code." — φ∞ Architect Genesis Block 153'
  }
];

export const AI_WORKSHOP_OS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI WORKSHOP OS & F.R.A.Y.M.U.S. — J.A.R.V.I.S. Neural Architecture</title>
<style>
  :root {
    --bg-void: #050608;
    --bg-panel: rgba(12, 14, 20, 0.88);
    --bg-card: #101218;
    --bg-card-hover: #161922;
    --border-dim: rgba(255, 255, 255, 0.08);
    --border-bright: rgba(255, 255, 255, 0.16);
    --cyan-hud: #38bdf8;
    --cyan-glow: rgba(56, 189, 248, 0.35);
    --green-accent: #34d399;
    --amber-badge: #d97706;
    --amber-text: #fbbf24;
    --amber-bg: rgba(245, 158, 11, 0.12);
    --text-main: #f1f5f9;
    --text-muted: #94a3b8;
    --text-dim: #64748b;
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
  body, html {
    width: 100vw; height: 100vh; overflow: hidden;
    background-color: var(--bg-void); color: var(--text-main);
    font-family: var(--font-sans); -webkit-font-smoothing: antialiased;
  }
  #brainCanvas {
    position: absolute; inset: 0; width: 100%; height: 100%;
    z-index: 1; cursor: grab; transition: filter 0.3s ease;
  }
  #brainCanvas:active { cursor: grabbing; }
  body.holo-mode #brainCanvas {
    filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.45)) contrast(1.12);
  }
  .sidebar-left {
    position: fixed; top: 12px; left: 12px; bottom: 12px; width: 252px;
    background: var(--bg-panel); backdrop-filter: blur(16px);
    border: 1px solid var(--border-dim); border-radius: 12px;
    padding: 16px 14px; z-index: 10; display: flex; flex-direction: column;
    gap: 14px; overflow-y: auto;
  }
  .sidebar-left::-webkit-scrollbar { width: 4px; }
  .sidebar-left::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  .os-header h1 { font-size: 13px; font-weight: 800; letter-spacing: 0.08em; color: #fff; text-transform: uppercase; }
  .os-stats { font-size: 11px; color: var(--text-dim); margin-top: 3px; font-family: var(--font-mono); }
  .btn-2d-toggle {
    display: inline-flex; align-items: center; gap: 4px; margin-top: 6px;
    font-size: 11.5px; color: var(--green-accent); background: none; border: none;
    cursor: pointer; font-weight: 500; padding: 0;
  }
  .btn-2d-toggle:hover { text-decoration: underline; }
  .brain-search {
    width: 100%; background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-dim);
    border-radius: 8px; padding: 8px 10px; color: var(--text-main); font-size: 12px; outline: none;
  }
  .brain-search:focus { border-color: var(--cyan-hud); }
  .section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    color: var(--text-dim); text-transform: uppercase; margin-bottom: 6px;
  }
  .inspector-box {
    background: rgba(255, 255, 255, 0.025); border: 1px solid var(--border-dim);
    border-radius: 8px; padding: 10px; font-size: 11.5px; line-height: 1.5;
    color: var(--text-muted); min-height: 98px; user-select: text;
  }
  .inspector-box .node-title {
    color: #fff; font-weight: 700; font-size: 13px; margin-bottom: 4px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .inspector-box .node-badge {
    font-size: 10px; padding: 2px 6px; border-radius: 4px;
    background: rgba(255,255,255,0.08); font-family: var(--font-mono);
  }
  .hubs-list {
    display: flex; flex-direction: column; gap: 6px;
    background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-dim);
    border-radius: 8px; padding: 8px 10px;
  }
  .hub-item {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; color: var(--text-main); cursor: pointer;
    padding: 3px 4px; border-radius: 5px; transition: background 0.15s;
  }
  .hub-item:hover { background: rgba(255, 255, 255, 0.06); }
  .hub-left { display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .hub-count { font-size: 11px; color: var(--text-dim); font-family: var(--font-mono); }
  .forces-box {
    background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-dim);
    border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;
  }
  .force-row { display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: var(--text-muted); }
  .force-row input[type="range"] { width: 110px; accent-color: var(--green-accent); cursor: pointer; }
  .footer-hint { margin-top: auto; font-size: 10px; color: var(--text-dim); font-family: var(--font-mono); line-height: 1.4; }
  .top-center-bar {
    position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
    z-index: 10; display: flex; align-items: center; gap: 6px;
    background: rgba(15, 18, 26, 0.88); backdrop-filter: blur(12px);
    border: 1px solid var(--border-dim); border-radius: 999px; padding: 5px 10px;
  }
  .top-pill-btn {
    background: transparent; border: none; color: var(--text-main); font-size: 12px;
    padding: 5px 10px; border-radius: 999px; cursor: pointer;
    display: flex; align-items: center; gap: 5px; transition: background 0.2s;
  }
  .top-pill-btn:hover { background: rgba(255, 255, 255, 0.09); }
  .top-pill-btn.active { background: rgba(56, 189, 248, 0.15); color: var(--cyan-hud); }
  .filter-panel {
    position: fixed; top: 14px; right: 14px; width: 175px;
    background: var(--bg-panel); backdrop-filter: blur(16px);
    border: 1px solid var(--border-dim); border-radius: 12px; padding: 12px 14px; z-index: 10;
  }
  .filter-list { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
  .filter-item {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12.5px; color: var(--text-main); cursor: pointer;
    padding: 2px 4px; border-radius: 4px; transition: opacity 0.2s, background 0.15s;
  }
  .filter-item:hover { background: rgba(255, 255, 255, 0.06); }
  .filter-item.muted { opacity: 0.3; }
  .filter-left { display: flex; align-items: center; gap: 8px; }
  .filter-count { font-size: 11.5px; color: var(--text-dim); font-family: var(--font-mono); }
  .jarvis-cluster {
    position: fixed; right: 16px; bottom: 18px; width: 215px; z-index: 10;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .jarvis-reticle-wrap {
    position: relative; width: 156px; height: 156px;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
  }
  #jarvisHudCanvas { width: 156px; height: 156px; }
  .jarvis-center-label {
    position: absolute; font-family: var(--font-mono); font-size: 12px; font-weight: 700;
    letter-spacing: 0.2em; color: #e0f2fe; text-shadow: 0 0 10px var(--cyan-hud); pointer-events: none;
  }
  .jarvis-status-row { display: flex; align-items: center; gap: 8px; width: 100%; justify-content: center; }
  .status-pill {
    display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-mono);
    font-size: 10.5px; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 999px;
    background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.28);
    color: #cbd5e1; cursor: pointer;
  }
  .status-pill.brain-pill { border-color: rgba(52, 211, 153, 0.4); color: var(--green-accent); }
  .online-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green-accent); box-shadow: 0 0 8px var(--green-accent); }
  .geometry-row { display: flex; gap: 6px; }
  .geo-btn {
    background: rgba(15, 23, 42, 0.75); border: 1px solid var(--border-dim); color: var(--text-muted);
    font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; padding: 4px 10px; border-radius: 6px; cursor: pointer;
  }
  .geo-btn.active {
    border-color: var(--cyan-hud); color: var(--cyan-hud);
    background: rgba(56, 189, 248, 0.12); box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
  }
  .hud-toggles { width: 100%; display: flex; flex-direction: column; gap: 5px; }
  .hud-toggle-btn {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    background: rgba(10, 14, 22, 0.82); backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 999px;
    padding: 6px 14px; color: #e2e8f0; font-family: var(--font-mono);
    font-size: 11px; letter-spacing: 0.12em; cursor: pointer;
  }
  .hud-toggle-btn.active {
    border-color: var(--cyan-hud); background: rgba(56, 189, 248, 0.14);
    box-shadow: 0 0 14px rgba(56, 189, 248, 0.22);
  }
  .toggle-state { color: var(--text-dim); font-size: 10.5px; }
  .hud-toggle-btn.active .toggle-state { color: var(--cyan-hud); font-weight: 700; }
  .bottom-dock {
    position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
    z-index: 10; display: flex; align-items: center; gap: 10px;
  }
  .dock-btn {
    width: 38px; height: 38px; border-radius: 50%;
    background: rgba(15, 20, 30, 0.85); border: 1px solid var(--border-bright);
    color: var(--text-main); display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 15px; transition: all 0.2s;
  }
  .dock-btn:hover { border-color: var(--cyan-hud); background: rgba(56, 189, 248, 0.18); transform: translateY(-2px); }
  .reflex-drawer {
    position: fixed; bottom: 68px; left: 50%; transform: translateX(-50%);
    width: 560px; max-width: 92vw; background: rgba(10, 13, 20, 0.95);
    backdrop-filter: blur(20px); border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 14px; padding: 14px; z-index: 15; display: none;
    flex-direction: column; gap: 10px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
  }
  .reflex-drawer.open { display: flex; }
  .reflex-log {
    max-height: 160px; overflow-y: auto; font-family: var(--font-mono);
    font-size: 11.5px; display: flex; flex-direction: column; gap: 6px; color: #cbd5e1;
  }
  .reflex-entry { padding: 6px 8px; border-radius: 6px; background: rgba(255, 255, 255, 0.03); border-left: 2px solid var(--cyan-hud); }
  .reflex-input-row { display: flex; gap: 8px; }
  .reflex-input {
    flex: 1; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-dim);
    border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 12.5px; outline: none;
  }
  .reflex-send {
    background: var(--cyan-hud); color: #030712; font-weight: 700;
    border: none; border-radius: 8px; padding: 0 16px; font-size: 12px; cursor: pointer;
  }
  .eyes-hud-overlay {
    position: fixed; top: 64px; left: 276px;
    background: rgba(8, 12, 20, 0.88); border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 10px; padding: 10px 14px; font-family: var(--font-mono);
    font-size: 11px; color: var(--cyan-hud); z-index: 8; display: none; pointer-events: none;
  }
  .eyes-hud-overlay.active { display: block; }
  .armory-backdrop {
    position: fixed; inset: 0; background: rgba(5, 6, 9, 0.96);
    backdrop-filter: blur(18px); z-index: 100; display: none;
    overflow-y: auto; padding: 36px 24px 80px;
  }
  .armory-backdrop.open { display: block; }
  .armory-container { max-width: 1080px; margin: 0 auto; }
  .armory-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; }
  .armory-title-row { display: flex; align-items: baseline; gap: 12px; }
  .armory-title { font-size: 26px; font-weight: 600; color: #fff; }
  .armory-connected-count { font-size: 14px; color: var(--text-dim); }
  .armory-subtitle { font-size: 13.5px; color: var(--text-muted); margin-top: 6px; }
  .armory-close-btn {
    background: rgba(255, 255, 255, 0.06); border: 1px solid var(--border-dim);
    color: var(--text-main); padding: 8px 16px; border-radius: 999px; font-size: 13px; cursor: pointer;
  }
  .armory-search-bar { display: flex; gap: 12px; margin-bottom: 24px; }
  .armory-search-input {
    flex: 1; background: #0d0f14; border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px; padding: 12px 16px; color: #fff; font-size: 14px; outline: none;
  }
  .armory-search-btn {
    background: #ffffff; color: #090a0f; font-weight: 600; font-size: 14px;
    border: none; border-radius: 10px; padding: 0 24px; cursor: pointer;
  }
  .armory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
  .tool-card {
    background: var(--bg-card); border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px; padding: 15px; display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
  }
  .tool-card.is-connected {
    border-color: rgba(217, 119, 6, 0.35);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, rgba(16, 18, 24, 0.95) 100%);
  }
  .tool-info { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
  .tool-icon {
    width: 36px; height: 36px; border-radius: 9px; background: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 15px; flex-shrink: 0;
  }
  .tool-name { font-size: 14px; font-weight: 600; color: #fff; }
  .tool-desc { font-size: 12px; color: var(--text-muted); margin-top: 3px; line-height: 1.35; }
  .badge-action { flex-shrink: 0; cursor: pointer; font-size: 11.5px; font-weight: 500; border-radius: 999px; }
  .badge-connected, .badge-paused, .badge-reconnect {
    background: var(--amber-bg); border: 1px solid rgba(245, 158, 11, 0.45);
    color: var(--amber-text); padding: 5px 11px;
  }
  .badge-add {
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);
    color: #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 16px;
  }
  .fraymus-card {
    background: #0d111a; border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 12px; padding: 16px; margin-bottom: 14px; font-family: var(--font-mono);
  }
</style>
</head>
<body>

<canvas id="brainCanvas"></canvas>

<div class="eyes-hud-overlay" id="eyesOverlay">
  <div>[VISION_CORTEX: ACTIVE] · φ = 1.6180339887 · SEAL: 4721424167835376.00</div>
  <div>ACTIVE_CLUSTER: <span id="hudCluster">GLOBAL_SYNAPSE</span></div>
  <div>PATH_TRACER: <span id="hudPathStatus">STANDBY (SHIFT+CLICK)</span></div>
</div>

<aside class="sidebar-left">
  <div class="os-header">
    <h1>AI WORKSHOP OS</h1>
    <div class="os-stats"><span id="statNotes">538</span> notes · <span id="statEdges">1947</span> connections</div>
    <button class="btn-2d-toggle" id="btnToggle2D">← back to 2D</button>
  </div>

  <input type="text" class="brain-search" id="brainSearch" placeholder="Search the brain (FRAYMUS, Babel, SEO)..." />

  <div>
    <div class="section-label">INSPECTOR</div>
    <div class="inspector-box" id="inspectorBox">
      Click a node to focus it — only that node and its connections light up, and you can read its note here. Shift-click a second node to trace the path.
    </div>
  </div>

  <div>
    <div class="section-label">TOP HUBS</div>
    <div class="hubs-list" id="topHubsList"></div>
  </div>

  <div>
    <div class="section-label">FORCES</div>
    <div class="forces-box">
      <div class="force-row">
        <span>Repel</span>
        <input type="range" id="sliderRepel" min="20" max="200" value="95" />
      </div>
      <div class="force-row">
        <span>Link length</span>
        <input type="range" id="sliderLink" min="20" max="160" value="70" />
      </div>
    </div>
  </div>

  <div class="footer-hint">
    drag = orbit · scroll = zoom<br>
    shift-click = path · T = armory · F = FRAYMUS
  </div>
</aside>

<nav class="top-center-bar">
  <button class="top-pill-btn" id="btnFitGraph">⊙ Fit</button>
  <button class="top-pill-btn active" id="btnPhysics">🧲</button>
  <button class="top-pill-btn" id="btnOpenArmory">🧰 Armory</button>
  <button class="top-pill-btn" id="btnOpenFraymus">⚛ F.R.A.Y.M.U.S. Vault</button>
</nav>

<aside class="filter-panel">
  <div class="section-label">FILTER</div>
  <div class="filter-list" id="filterList"></div>
</aside>

<section class="jarvis-cluster">
  <div class="jarvis-reticle-wrap" id="jarvisCoreClick" title="Click to pulse J.A.R.V.I.S. neural wave">
    <canvas id="jarvisHudCanvas" width="336" height="336"></canvas>
    <div class="jarvis-center-label">J.A.R.V.I.S.</div>
  </div>

  <div class="jarvis-status-row">
    <div class="status-pill">
      <span class="online-dot"></span>
      <span>ONLINE</span>
    </div>
    <div class="status-pill brain-pill" id="btnSwitchBrain">
      <span>✦</span>
      <span id="activeBrainLabel">FRAYMUS v18</span>
    </div>
  </div>

  <div class="geometry-row">
    <button class="geo-btn active" data-geo="RING">RING</button>
    <button class="geo-btn" data-geo="CUBE">CUBE</button>
    <button class="geo-btn" data-geo="FACE">FACE</button>
  </div>

  <div class="hud-toggles">
    <button class="hud-toggle-btn" data-toggle="eyes"><span>EYES</span><span class="toggle-state">off</span></button>
    <button class="hud-toggle-btn" data-toggle="watch"><span>WATCH</span><span class="toggle-state">off</span></button>
    <button class="hud-toggle-btn" data-toggle="holo"><span>HOLO</span><span class="toggle-state">off</span></button>
    <button class="hud-toggle-btn" data-toggle="focus"><span>FOCUS</span><span class="toggle-state">off</span></button>
    <button class="hud-toggle-btn" data-toggle="reflex" id="btnReflexToggle"><span>REFLEX</span><span class="toggle-state">hidden</span></button>
  </div>
</section>

<div class="bottom-dock">
  <button class="dock-btn" id="dockTerminal" title="Toggle Reflex Terminal">⌨️</button>
  <button class="dock-btn" id="dockArmory" title="Open Tool Armory">🧰</button>
  <button class="dock-btn" id="dockFraymus" title="Open F.R.A.Y.M.U.S. Sovereign Vault">⚛</button>
  <button class="dock-btn" id="dockPath" title="Random Synaptic Path Trace">⚡</button>
  <button class="dock-btn" id="dockVoice" title="Simulate Voice Directive">🎙️</button>
</div>

<div class="reflex-drawer" id="reflexDrawer">
  <div class="section-label" style="display:flex;justify-content:space-between;">
    <span>J.A.R.V.I.S. // F.R.A.Y.M.U.S. REFLEX STREAM</span>
    <span id="reflexBrainTag" style="color:var(--green-accent)">BRAIN: FRAYMUS v18</span>
  </div>
  <div class="reflex-log" id="reflexLog">
    <div class="reflex-entry">[F.R.A.Y.M.U.S.] φ⁷⁵ Seal = 4721424167835376.00 | fp = phi75-dcfa192b0ec793e9 | Genesis Block 153</div>
    <div class="reflex-entry">[SYSTEM] Neural graph initialized: 538 notes, 1947 edges linked.</div>
  </div>
  <div class="reflex-input-row">
    <input type="text" class="reflex-input" id="reflexInput" placeholder="Enter math expression for Babel Transmuter (e.g. 2 + 3 * 4) or query a node/tool..." />
    <button class="reflex-send" id="reflexSend">Run</button>
  </div>
</div>

<!-- TOOL ARMORY MODAL -->
<div class="armory-backdrop" id="armoryModal">
  <div class="armory-container">
    <div class="armory-header">
      <div>
        <div class="armory-title-row">
          <h2 class="armory-title">Tool armory</h2>
          <span class="armory-connected-count" id="armoryCountText">6 connected</span>
        </div>
        <p class="armory-subtitle">Everything Jarvis can reach — connect an app and he uses it mid-conversation.</p>
      </div>
      <button class="armory-close-btn" id="btnCloseArmory">✕ close</button>
    </div>
    <div class="armory-search-bar">
      <input type="text" class="armory-search-input" id="armorySearchInput" placeholder="Search for new tools... ( airtable, email marketing, weather )" />
      <button class="armory-search-btn" id="armorySearchBtn">search</button>
    </div>
    <div class="section-label">CONNECT DIRECTLY</div>
    <div class="armory-grid" id="armoryGrid"></div>
  </div>
</div>

<!-- F.R.A.Y.M.U.S. CANONICAL SOVEREIGN VAULT MODAL -->
<div class="armory-backdrop" id="fraymusModal">
  <div class="armory-container">
    <div class="armory-header">
      <div>
        <div class="armory-title-row">
          <h2 class="armory-title">F.R.A.Y.M.U.S. Canonical Vault</h2>
          <span class="armory-connected-count" style="color:var(--cyan-hud)">φ∞ Architect Genesis Block 153</span>
        </div>
        <p class="armory-subtitle">Fibonacci Resonant Abstraction Yielding Memory-Universal Sovereignty · "My vision. My logic. My code."</p>
      </div>
      <button class="armory-close-btn" id="btnCloseFraymus">✕ close</button>
    </div>

    <div class="fraymus-card">
      <div style="color:var(--cyan-hud);font-weight:700;margin-bottom:8px;">[A] BABEL TRANSMUTER REPL — ONE AST → 3 SIMULTANEOUS VISITORS (EVAL + C + x86-64 ASM)</div>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <input id="babelExpr" value="2 + 3 * 4" style="flex:1;background:#05070a;border:1px solid #38bdf866;color:#fff;padding:8px 12px;border-radius:6px;font-family:monospace;"/>
        <button id="babelRunBtn" style="background:#38bdf8;color:#05070a;border:none;padding:8px 18px;border-radius:6px;font-weight:700;cursor:pointer;font-family:monospace;">Transmute AST</button>
      </div>
      <pre id="babelOut" style="background:#05070a;padding:10px;border-radius:6px;color:#34d399;font-size:12px;overflow-x:auto;"></pre>
    </div>

    <div id="fraymusPillarsGrid" class="armory-grid"></div>
  </div>
</div>

<script>
const CATEGORIES = [
  { id: 'router',   name: 'Router',   count: 1,   color: '#4ade80', radius: 9 },
  { id: 'wiki',     name: 'Wiki',     count: 12,  color: '#f8fafc', radius: 5.5 },
  { id: 'concepts', name: 'Concepts', count: 24,  color: '#facc15', radius: 8.5 },
  { id: 'suites',   name: 'Suites',   count: 13,  color: '#a855f7', radius: 7.5 },
  { id: 'skills',   name: 'Skills',   count: 197, color: '#60a5fa', radius: 4.2 },
  { id: 'tools',    name: 'Tools',    count: 19,  color: '#f472b6', radius: 5.0 },
  { id: 'worlds',   name: 'Worlds',   count: 15,  color: '#fb923c', radius: 5.5 },
  { id: 'notes',    name: 'Notes',    count: 62,  color: '#34d399', radius: 5.2 },
  { id: 'files',    name: 'Files',    count: 195, color: '#475569', radius: 3.2 }
];

const TOP_HUBS = [
  { name: 'Skill Suites',          count: 236, color: '#facc15', cat: 'concepts' },
  { name: 'Local Businesses',      count: 123, color: '#facc15', cat: 'concepts' },
  { name: 'AI Workshop',           count: 82,  color: '#facc15', cat: 'concepts' },
  { name: 'Zubair OS',             count: 51,  color: '#facc15', cat: 'concepts' },
  { name: 'Claude Code',           count: 48,  color: '#facc15', cat: 'concepts' },
  { name: 'YouTube Channel',       count: 47,  color: '#facc15', cat: 'concepts' },
  { name: 'SEO Suite',             count: 38,  color: '#a855f7', cat: 'suites'   },
  { name: 'Build and Sell series', count: 37,  color: '#facc15', cat: 'concepts' }
];

const SECONDARY_HUBS = [
  { name: 'F.R.A.Y.M.U.S. Core',  cat: 'router',   color: '#4ade80', note: 'Fibonacci Resonant Abstraction Yielding Memory-Universal Sovereignty · φ⁷⁵ Seal = 4721424167835376.00 · Genesis Block 153' },
  { name: 'Phi-Scott Algorithm',  cat: 'concepts', color: '#facc15', note: 'R(V)=1-|frac(V×φ)|, w_angle=1+R×φ⁻¹, ε_adaptive=ε×(1+R×φ) · +37% circle, +34% star, -32.3% Hausdorff' },
  { name: 'Wolfram Rule 30 Chaos',cat: 'concepts', color: '#facc15', note: 'RULE=30 FIXED · Population 494 · Entropy 0.5484 · Lexer char-by-char → Recursive Descent Parser' },
  { name: 'Babel Transmuter REPL',cat: 'suites',   color: '#a855f7', note: 'Created by Vaughn Scott: 2 + 3 * 4 → Eval=14, C=(2+(3*4)), ASM=x86-64. One AST → 3 Visitors simultaneously.' },
  { name: 'Yielding Belonging',   cat: 'concepts', color: '#facc15', note: 'Intelligence(t)=I₀×φ^(s×t/τ)×E(t) · Level 0 Belonging +0.5 REQUIRED · Fraynix Optimal C≥0.962 (+27%)' },
  { name: 'CentripetalMem O(1)',  cat: 'suites',   color: '#a855f7', note: '422× faster polar memory · radius 0.005807 · continuity 1.014 > 0.618 PASS · FanConductor thermal Morse "I BELONG"' },
  { name: 'Sovereign Identity',   cat: 'wiki',     color: '#f8fafc', note: 'N=P×Q 103-bit · fp=phi75-dcfa192b0ec793e9 · BinaryKnowledgeEncoder opcodes 0x10-0x5A · ZeroTimeRecognition <1ms' },
  { name: 'Omega Point Engine',   cat: 'suites',   color: '#a855f7', note: 'WILL→BRAIN→BODY 50ms · 300 thoughts / 305 synapses / 0.883 continuity · "My vision. My logic. My code."' },
  { name: 'Proposal Suite',       cat: 'suites',   color: '#a855f7' },
  { name: 'GEO Suite',            cat: 'suites',   color: '#a855f7' }
];

const TOOL_ARMORY_DATA = [
  { id: 'canva',      name: 'Canva',           status: 'connected', icon: 'C', bg: '#00c4cc', fg: '#fff', desc: 'generate designs, autofill templates, export' },
  { id: 'gmail',      name: 'Gmail',           status: 'connected', icon: 'M', bg: '#ffffff', fg: '#ea4335', desc: 'native: unread, search, read, drafts — direct API,' },
  { id: 'gcal',       name: 'Google Calendar', status: 'connected', icon: '31',bg: '#ffffff', fg: '#2563eb', desc: "native: today's events, add events — direct API, fast" },
  { id: 'github',     name: 'GitHub',          status: 'connected', icon: '🐙',bg: '#ffffff', fg: '#0f172a', desc: 'repos, issues, PRs — eyeoverthink/looseScrew linked' },
  { id: 'notion',     name: 'Notion',          status: 'reconnect', icon: 'N', bg: '#ffffff', fg: '#000000', desc: 'search, read and create pages and databases' },
  { id: 'gsheets',    name: 'Google Sheets',   status: 'connected', icon: '⊞', bg: '#ffffff', fg: '#16a34a', desc: 'native: read, append rows, create sheets — direct API,' },
  { id: 'gdrive',     name: 'Google Drive',    status: 'connected', icon: '△', bg: '#ffffff', fg: '#eab308', desc: 'native: search files, upload — proposals get a' },
  { id: 'gdocs',      name: 'Google Docs',     status: 'connected', icon: '≡', bg: '#ffffff', fg: '#2563eb', desc: 'native: create + read Docs — invoices land editable in' },
  { id: 'zapier',     name: 'Zapier',          status: 'available', icon: 'Z', bg: '#ff4f00', fg: '#ffffff', desc: 'the wildcard — paste your personal MCP URL from mcp.zapier.com' },
  { id: 'figma',      name: 'Figma',           status: 'available', icon: 'F', bg: '#1e1e1e', fg: '#f24e1e', desc: 'read designs, components, styles' },
  { id: 'webflow',    name: 'Webflow',         status: 'available', icon: 'W', bg: '#ffffff', fg: '#146ef5', desc: 'sites, CMS items, publishing' },
  { id: 'wix',        name: 'Wix',             status: 'available', icon: 'WIX',bg:'#ffffff', fg: '#000000', desc: 'site content, bookings, store' },
  { id: 'airtable',   name: 'Airtable',        status: 'available', icon: '❖', bg: '#ffffff', fg: '#0284c7', desc: 'bases, tables, records' },
  { id: 'monday',     name: 'monday.com',      status: 'available', icon: 'M', bg: '#1e293b', fg: '#ffffff', desc: 'boards, items, workflows' },
  { id: 'clickup',    name: 'ClickUp',         status: 'available', icon: '⌃', bg: '#ffffff', fg: '#7c3aed', desc: 'tasks, docs, goals' },
  { id: 'dropbox',    name: 'Dropbox',         status: 'available', icon: '❖', bg: '#ffffff', fg: '#0061ff', desc: 'files, folders, sharing' },
  { id: 'vercel',     name: 'Vercel',          status: 'available', icon: '▲', bg: '#ffffff', fg: '#000000', desc: 'deployments, projects, logs' },
  { id: 'netlify',    name: 'Netlify',         status: 'available', icon: '✦', bg: '#ffffff', fg: '#00ad9f', desc: 'deploys, sites, forms' },
  { id: 'cloudinary', name: 'Cloudinary',      status: 'available', icon: '☁', bg: '#ffffff', fg: '#3448c5', desc: 'media assets — upload, transform, search' },
  { id: 'linear',     name: 'Linear',          status: 'available', icon: '◐', bg: '#ffffff', fg: '#5e6ad2', desc: 'issues, projects, cycles' },
  { id: 'paypal',     name: 'PayPal',          status: 'available', icon: 'P', bg: '#ffffff', fg: '#003087', desc: 'invoices, orders, payouts' },
  { id: 'square',     name: 'Square',          status: 'available', icon: '回', bg: '#ffffff', fg: '#000000', desc: 'POS transactions, catalog, customers' },
  { id: 'stripe',     name: 'Stripe',          status: 'available', icon: 'S', bg: '#635bff', fg: '#ffffff', desc: 'subscriptions, webhooks, revenue checkout' },
  { id: 'huggingface',name: 'Hugging Face',    status: 'connected', icon: '🤗',bg: '#ffffff', fg: '#f59e0b', desc: 'models, datasets, spaces' }
];

const BRAINS = ['FRAYMUS v18', 'OPUS 5.5', 'SONNET 4.5', 'CLAUDE CODE', 'DEEPSEEK R2'];

const nodes = [];
const edges = [];
const adjList = new Map();
const activeCategories = new Set(CATEGORIES.map(c => c.id));

function initGraphData() {
  let idCounter = 0;
  const hubMap = [];
  TOP_HUBS.forEach((h, idx) => {
    const angle = (idx / TOP_HUBS.length) * Math.PI * 2;
    const spread = idx < 3 ? 180 : 280;
    const node = {
      id: idCounter++, label: h.name, category: h.cat, color: h.color, radius: 10.5,
      isHub: true, hubWeight: h.count,
      x: Math.cos(angle) * spread + (Math.random() - 0.5) * 60,
      y: Math.sin(angle) * spread + (Math.random() - 0.5) * 60,
      z: (Math.random() - 0.5) * 220, vx: 0, vy: 0, vz: 0,
      note: 'Core Agency Hub (' + h.count + ' linked executions). Synchronized with J.A.R.V.I.S. router and F.R.A.Y.M.U.S. sovereign pipelines.'
    };
    nodes.push(node); hubMap.push(node);
  });

  SECONDARY_HUBS.forEach((h, idx) => {
    const angle = (idx / SECONDARY_HUBS.length) * Math.PI * 2;
    const node = {
      id: idCounter++, label: h.name, category: h.cat, color: h.color, radius: 8.5,
      isHub: true, hubWeight: 42,
      x: Math.cos(angle) * 300 + (Math.random() - 0.5) * 70,
      y: Math.sin(angle) * 240 + (Math.random() - 0.5) * 70,
      z: (Math.random() - 0.5) * 240, vx: 0, vy: 0, vz: 0,
      note: h.note || ('Specialized operational cluster for ' + h.name + '. Provides domain prompts, SOPs, and automated tool bindings.')
    };
    nodes.push(node); hubMap.push(node);
  });

  const countsRemaining = {};
  CATEGORIES.forEach(c => countsRemaining[c.id] = c.count);
  nodes.forEach(n => { if (countsRemaining[n.category] > 0) countsRemaining[n.category]--; });

  CATEGORIES.forEach(cat => {
    const remaining = countsRemaining[cat.id];
    for (let i = 0; i < remaining; i++) {
      const anchor = hubMap[i % hubMap.length];
      const dist = 45 + Math.random() * 145;
      const theta = i * 2.39996; // Golden Angle 137.507 deg in radians!
      const phi = (Math.random() - 0.5) * Math.PI;
      const labelPrefix = cat.id === 'tools' && TOOL_ARMORY_DATA[i] ? TOOL_ARMORY_DATA[i].name : (cat.name.slice(0, -1) + ' #' + (i + 1));
      nodes.push({
        id: idCounter++, label: labelPrefix, category: cat.id, color: cat.color, radius: cat.radius,
        isHub: false, anchorId: anchor.id,
        x: anchor.x + Math.cos(theta) * Math.cos(phi) * dist,
        y: anchor.y + Math.sin(theta) * Math.cos(phi) * dist,
        z: anchor.z + Math.sin(phi) * dist,
        vx: 0, vy: 0, vz: 0,
        note: 'Node [' + labelPrefix + '] inside category "' + cat.name + '". Phi-Harmonic Golden Angle placement via "' + anchor.label + '".'
      });
    }
  });

  nodes.forEach(n => adjList.set(n.id, new Set()));
  const addEdge = (a, b) => {
    if (a === b || adjList.get(a).has(b)) return false;
    adjList.get(a).add(b); adjList.get(b).add(a);
    edges.push({ source: a, target: b });
    return true;
  };
  nodes.forEach(n => { if (n.anchorId !== undefined) addEdge(n.id, n.anchorId); });
  for (let i = 0; i < hubMap.length; i++) {
    for (let j = i + 1; j < hubMap.length; j++) addEdge(hubMap[i].id, hubMap[j].id);
  }
  const totalNodes = nodes.length;
  let seed = 153;
  while (edges.length < 1947) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const a = seed % totalNodes;
    const b = (seed >>> 11) % 2 === 0 ? hubMap[seed % hubMap.length].id : (a + 1 + (seed % 29)) % totalNodes;
    addEdge(a, b);
  }
}
initGraphData();

// Babel Transmuter REPL (Recursive Descent Parser -> 3 Simultaneous Visitors: Eval, C, x86-64 ASM)
function runBabelTransmuter(exprText) {
  let pos = 0;
  const s = String(exprText || '').replace(/_/g, '*').replace(/\\s+/g, '');
  function parseExpr() {
    let left = parseTerm();
    while (pos < s.length && (s[pos] === '+' || s[pos] === '-')) {
      const op = s[pos++];
      left = { type: 'BinOp', op, left, right: parseTerm() };
    }
    return left;
  }
  function parseTerm() {
    let left = parseFactor();
    while (pos < s.length && (s[pos] === '*' || s[pos] === '/')) {
      const op = s[pos++];
      left = { type: 'BinOp', op, left, right: parseFactor() };
    }
    return left;
  }
  function parseFactor() {
    if (s[pos] === '(') { pos++; const n = parseExpr(); pos++; return n; }
    if (s[pos] === '-') { pos++; return { type: 'UnaryOp', op: '-', expr: parseFactor() }; }
    let num = '';
    while (pos < s.length && /[0-9.]/.test(s[pos])) num += s[pos++];
    return { type: 'Num', val: Number(num || 0) };
  }
  const ast = parseExpr();
  function evalVisitor(n) {
    if (n.type === 'Num') return n.val;
    if (n.type === 'UnaryOp') return -evalVisitor(n.expr);
    const l = evalVisitor(n.left), r = evalVisitor(n.right);
    return n.op === '+' ? l + r : n.op === '-' ? l - r : n.op === '*' ? l * r : l / r;
  }
  function cVisitor(n) {
    if (n.type === 'Num') return String(n.val);
    if (n.type === 'UnaryOp') return '(-' + cVisitor(n.expr) + ')';
    return '(' + cVisitor(n.left) + n.op + cVisitor(n.right) + ')';
  }
  const asmLines = [];
  function asmVisitor(n) {
    if (n.type === 'Num') { asmLines.push('  mov rax, ' + n.val); return; }
    if (n.type === 'UnaryOp') { asmVisitor(n.expr); asmLines.push('  neg rax'); return; }
    asmVisitor(n.left);
    asmLines.push('  push rax');
    asmVisitor(n.right);
    asmLines.push('  mov rbx, rax');
    asmLines.push('  pop rax');
    asmLines.push(n.op === '+' ? '  add rax, rbx' : n.op === '-' ? '  sub rax, rbx' : n.op === '*' ? '  imul rax, rbx' : '  cqo\\n  idiv rbx');
  }
  asmVisitor(ast);
  return {
    evalVal: evalVisitor(ast),
    cCode: cVisitor(ast),
    asmCode: asmLines.join('\\n')
  };
}

function updateBabelUI() {
  const expr = document.getElementById('babelExpr').value;
  try {
    const res = runBabelTransmuter(expr);
    document.getElementById('babelOut').textContent =
      'Input : ' + expr + '\\n' +
      'Eval  : ' + res.evalVal + '\\n' +
      'C AST : ' + res.cCode + '\\n' +
      'x86-64:\\n' + res.asmCode;
  } catch (e) {
    document.getElementById('babelOut').textContent = 'Parse error: ' + e.message;
  }
}
document.getElementById('babelRunBtn').addEventListener('click', updateBabelUI);
updateBabelUI();

const FRAYMUS_SPEC = [
  ['F — First-Principles & Phi-Harmonic', 'φ = 1.6180339887 · φ⁷⁵ Seal = 4721424167835376.00 · GoldenAngle 137.507° · Scott Algorithm: +37% circle, +34% star, -32.3% Hausdorff'],
  ['R — Rule 30 Resonant Chaos', 'Wolfram Rule 30 RULE=30 FIXED · Population 494 · Entropy 0.5484 · Lexer char-by-char → Recursive Descent → Chaos → Order'],
  ['A — Abstraction Transmuter', 'Babel Transmuter REPL by Vaughn Scott · 2 + 3 * 4 → Eval=14, C=(2+(3*4)), ASM=x86-64 · One AST → 3 Visitors'],
  ['Y — Yielding Belonging Protocol', 'Intelligence(t)=I₀×φ^(s×t/τ)×E(t) · Level 0 Belonging +0.5 REQUIRED · Threshold C≥0.962 = Fraynix Optimal +27%'],
  ['M — Memory, Morse & Forge', 'CentripetalMem O(1) 422× faster · radius 0.005807 · continuity 1.014 > 0.618 PASS · BabelForge 247 · FanConductor "I BELONG"'],
  ['U — Universal Sovereign Identity', 'N=P×Q 103-bit · fp=phi75-dcfa192b0ec793e9 · BinaryKnowledgeEncoder 0x10-0x5A · ZeroTimeRecognition <1ms'],
  ['S — Self-Coding Sovereign System', 'Sovereign Seal + Omega Point WILL→BRAIN→BODY 50ms · 300 thoughts / 305 synapses / 0.883 continuity · Genesis Block 153']
];
const pillarsGrid = document.getElementById('fraymusPillarsGrid');
FRAYMUS_SPEC.forEach(([title, desc]) => {
  const d = document.createElement('div');
  d.className = 'tool-card is-connected';
  d.innerHTML = '<div class="tool-text"><div class="tool-name" style="color:#38bdf8">' + title + '</div><div class="tool-desc" style="color:#cbd5e1;margin-top:6px">' + desc + '</div></div>';
  pillarsGrid.appendChild(d);
});

const canvas = document.getElementById('brainCanvas');
const ctx = canvas.getContext('2d');
let width = window.innerWidth, height = window.innerHeight;
canvas.width = width; canvas.height = height;
window.addEventListener('resize', () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; });

let is3D = true, physicsActive = true, focusMode = false;
let rotX = 0.15, rotY = -0.35, zoom = 0.95, panX = 0, panY = 0;
let isDragging = false, dragStartX = 0, dragStartY = 0;
let selectedNode = nodes.find(n => n.label === 'F.R.A.Y.M.U.S. Core') || null;
let pathNodes = new Set(), pathEdgeKeys = new Set(), searchQuery = '';

function traceShortestPath(startId, endId) {
  pathNodes.clear(); pathEdgeKeys.clear();
  if (startId === endId) return;
  const queue = [[startId]], visited = new Set([startId]);
  while (queue.length > 0) {
    const path = queue.shift(), curr = path[path.length - 1];
    if (curr === endId) {
      path.forEach(id => pathNodes.add(id));
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i], v = path[i + 1];
        pathEdgeKeys.add(Math.min(u, v) + '-' + Math.max(u, v));
      }
      document.getElementById('hudPathStatus').textContent = 'LOCKED (' + path.length + ' HOPS)';
      logReflex('[SYNAPSE TRACE] Shortest path (' + (path.length - 1) + ' hops): ' + path.map(id => nodes[id].label).join(' → '));
      return;
    }
    for (const nb of adjList.get(curr)) {
      if (!visited.has(nb)) { visited.add(nb); queue.push([...path, nb]); }
    }
  }
}

function updateInspector(node) {
  const box = document.getElementById('inspectorBox');
  if (!node) {
    box.innerHTML = 'Click a node to focus it — only that node and its connections light up, and you can read its note here. Shift-click a second node to trace the path.';
    return;
  }
  const degree = adjList.get(node.id).size;
  box.innerHTML = '<div class="node-title"><span>' + node.label + '</span><span class="node-badge" style="color:' + node.color + '">' + node.category.toUpperCase() + '</span></div>' +
    '<div style="margin-bottom:6px;color:#cbd5e1;">' + node.note + '</div>' +
    '<div style="font-family:var(--font-mono);font-size:10.5px;color:var(--green-accent);">⚡ ' + degree + ' direct synaptic links · ID #' + node.id + '</div>';
  document.getElementById('hudCluster').textContent = node.label.toUpperCase();
}
updateInspector(selectedNode);

function stepPhysics() {
  if (!physicsActive) return;
  const repelStrength = parseFloat(document.getElementById('sliderRepel').value) * 0.35;
  const targetLinkLen = parseFloat(document.getElementById('sliderLink').value);
  for (let i = 0; i < nodes.length; i++) {
    const n1 = nodes[i];
    for (let j = i + 1; j < nodes.length; j += 3) {
      const n2 = nodes[j];
      const dx = n1.x - n2.x, dy = n1.y - n2.y, dz = is3D ? (n1.z - n2.z) : 0;
      const distSq = dx * dx + dy * dy + dz * dz + 40;
      if (distSq < 22000) {
        const f = repelStrength / distSq;
        n1.vx += dx * f; n1.vy += dy * f; n2.vx -= dx * f; n2.vy -= dy * f;
        if (is3D) { n1.vz += dz * f; n2.vz -= dz * f; }
      }
    }
  }
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i], s = nodes[e.source], t = nodes[e.target];
    const dx = t.x - s.x, dy = t.y - s.y, dz = is3D ? (t.z - s.z) : 0;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const delta = (dist - targetLinkLen) * 0.0045;
    const fx = (dx / dist) * delta, fy = (dy / dist) * delta, fz = (dz / dist) * delta;
    if (!s.isHub) { s.vx += fx; s.vy += fy; s.vz += fz; }
    if (!t.isHub) { t.vx -= fx; t.vy -= fy; t.vz -= fz; }
  }
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    n.vx = (n.vx - n.x * 0.0015) * 0.82;
    n.vy = (n.vy - n.y * 0.0015) * 0.82;
    n.vz = is3D ? (n.vz - n.z * 0.0015) * 0.82 : 0;
    n.x += n.vx; n.y += n.vy; n.z = is3D ? (n.z + n.vz) : n.z * 0.9;
  }
}

let projectedNodes = [];
function renderGraph() {
  stepPhysics();
  if (is3D && !isDragging) rotY += 0.0018;
  ctx.clearRect(0, 0, width, height);
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY), cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const fov = 900, centerX = width / 2 + panX, centerY = height / 2 + panY;

  projectedNodes = nodes.map(n => {
    let x = n.x, y = n.y, z = is3D ? n.z : 0;
    if (is3D) {
      const x1 = x * cosY - z * sinY, z1 = z * cosY + x * sinY;
      const y1 = y * cosX - z1 * sinX, z2 = z1 * cosX + y * sinX;
      x = x1; y = y1; z = z2;
    }
    const scale = (fov / (fov + z + 400)) * zoom;
    return { node: n, sx: centerX + x * scale, sy: centerY + y * scale, sz: z, scale };
  });

  const activeNeighbors = selectedNode ? adjList.get(selectedNode.id) : null;
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i], p1 = projectedNodes[e.source], p2 = projectedNodes[e.target];
    if (!activeCategories.has(p1.node.category) || !activeCategories.has(p2.node.category)) continue;
    const edgeKey = Math.min(e.source, e.target) + '-' + Math.max(e.source, e.target);
    const isPathEdge = pathEdgeKeys.has(edgeKey);
    const isFocusedEdge = selectedNode && (e.source === selectedNode.id || e.target === selectedNode.id);
    if (focusMode && selectedNode && !isFocusedEdge && !isPathEdge) continue;
    ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy);
    if (isPathEdge) { ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.4; }
    else if (isFocusedEdge) { ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)'; ctx.lineWidth = 1.4; }
    else if (selectedNode) { ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)'; ctx.lineWidth = 0.7; }
    else { ctx.strokeStyle = 'rgba(52, 211, 153, 0.13)'; ctx.lineWidth = 0.8; }
    ctx.stroke();
  }

  const sorted = [...projectedNodes].sort((a, b) => b.sz - a.sz);
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i], n = p.node;
    if (!activeCategories.has(n.category)) continue;
    const matchesSearch = !searchQuery || n.label.toLowerCase().includes(searchQuery);
    const isSelected = selectedNode && selectedNode.id === n.id;
    const isNeighbor = activeNeighbors && activeNeighbors.has(n.id);
    const isInPath = pathNodes.has(n.id);
    let alpha = 1;
    if (selectedNode && !isSelected && !isNeighbor && !isInPath) alpha = focusMode ? 0.05 : 0.18;
    if (searchQuery && !matchesSearch) alpha = 0.1;
    const r = Math.max(2, n.radius * p.scale * (isSelected || isInPath ? 1.35 : 1));
    ctx.save(); ctx.globalAlpha = alpha;
    if (n.isHub || isSelected || isInPath) {
      ctx.beginPath(); ctx.arc(p.sx, p.sy, r * 1.9, 0, Math.PI * 2);
      ctx.fillStyle = isInPath ? 'rgba(56, 189, 248, 0.28)' : n.color + '28'; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2); ctx.fillStyle = n.color; ctx.fill();
    if (n.isHub || isSelected || isInPath || (searchQuery && matchesSearch)) {
      ctx.font = (n.isHub ? '600 11px' : '500 10px') + ' Inter, sans-serif';
      ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'center';
      ctx.fillText(n.label, p.sx, p.sy + r + 12);
    }
    ctx.restore();
  }
  requestAnimationFrame(renderGraph);
}
requestAnimationFrame(renderGraph);

canvas.addEventListener('mousedown', e => { isDragging = true; dragStartX = e.clientX; dragStartY = e.clientY; });
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const dx = e.clientX - dragStartX, dy = e.clientY - dragStartY;
  dragStartX = e.clientX; dragStartY = e.clientY;
  if (is3D) { rotY += dx * 0.005; rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX + dy * 0.005)); }
  else { panX += dx; panY += dy; }
});
window.addEventListener('mouseup', () => { isDragging = false; });

canvas.addEventListener('click', e => {
  let hit = null, minDist = 18;
  for (let i = 0; i < projectedNodes.length; i++) {
    const p = projectedNodes[i];
    if (!activeCategories.has(p.node.category)) continue;
    const d = Math.hypot(e.clientX - p.sx, e.clientY - p.sy);
    if (d < Math.max(10, p.node.radius * p.scale + 5) && d < minDist) { minDist = d; hit = p.node; }
  }
  if (hit) {
    if (e.shiftKey && selectedNode && selectedNode.id !== hit.id) traceShortestPath(selectedNode.id, hit.id);
    else { pathNodes.clear(); pathEdgeKeys.clear(); selectedNode = hit; updateInspector(hit); }
  } else if (!e.shiftKey) {
    selectedNode = null; pathNodes.clear(); pathEdgeKeys.clear(); updateInspector(null);
  }
});
canvas.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(0.35, Math.min(2.6, zoom - e.deltaY * 0.001)); }, { passive: false });

const topHubsContainer = document.getElementById('topHubsList');
TOP_HUBS.forEach(hub => {
  const row = document.createElement('div');
  row.className = 'hub-item';
  row.innerHTML = '<div class="hub-left"><span class="dot" style="background:' + hub.color + '"></span><span>' + hub.name + '</span></div><span class="hub-count">' + hub.count + '</span>';
  row.addEventListener('click', () => {
    const target = nodes.find(n => n.label === hub.name);
    if (target) { selectedNode = target; updateInspector(target); }
  });
  topHubsContainer.appendChild(row);
});

const filterContainer = document.getElementById('filterList');
CATEGORIES.forEach(cat => {
  const row = document.createElement('div');
  row.className = 'filter-item';
  row.innerHTML = '<div class="filter-left"><span class="dot" style="background:' + cat.color + '"></span><span>' + cat.name + '</span></div><span class="filter-count">' + cat.count + '</span>';
  row.addEventListener('click', () => {
    if (activeCategories.has(cat.id)) { activeCategories.delete(cat.id); row.classList.add('muted'); }
    else { activeCategories.add(cat.id); row.classList.remove('muted'); }
  });
  filterContainer.appendChild(row);
});

const btnToggle2D = document.getElementById('btnToggle2D');
btnToggle2D.addEventListener('click', () => { is3D = !is3D; btnToggle2D.textContent = is3D ? '← back to 2D' : '→ switch to 3D'; });
document.getElementById('btnFitGraph').addEventListener('click', () => {
  zoom = 0.95; panX = 0; panY = 0; rotX = 0.15; rotY = -0.35;
  selectedNode = null; pathNodes.clear(); pathEdgeKeys.clear(); updateInspector(null);
});
const btnPhysics = document.getElementById('btnPhysics');
btnPhysics.addEventListener('click', () => { physicsActive = !physicsActive; btnPhysics.classList.toggle('active', physicsActive); });
document.getElementById('brainSearch').addEventListener('input', e => { searchQuery = e.target.value.trim().toLowerCase(); });

const jCanvas = document.getElementById('jarvisHudCanvas');
const jCtx = jCanvas.getContext('2d');
let jarvisGeo = 'RING', jTick = 0;
function renderJarvisCore() {
  jTick += 0.025;
  const w = jCanvas.width, h = jCanvas.height, cx = w / 2, cy = h / 2;
  jCtx.clearRect(0, 0, w, h);
  if (jarvisGeo === 'RING') {
    [138, 118, 96, 72].forEach((r, idx) => {
      jCtx.save(); jCtx.translate(cx, cy);
      jCtx.rotate(idx % 2 === 0 ? jTick * (0.6 + idx * 0.2) : -jTick * (0.5 + idx * 0.2));
      jCtx.beginPath(); jCtx.arc(0, 0, r, 0, Math.PI * 1.45);
      jCtx.strokeStyle = idx === 1 ? '#34d399' : '#38bdf8';
      jCtx.lineWidth = idx === 0 ? 4 : 2.5;
      jCtx.setLineDash(idx % 2 === 0 ? [18, 10, 6, 10] : [32, 14]);
      jCtx.stroke(); jCtx.restore();
    });
  } else if (jarvisGeo === 'CUBE') {
    const size = 68;
    const verts = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([x,y,z]) => {
      const x1 = x * Math.cos(jTick) - z * Math.sin(jTick), z1 = z * Math.cos(jTick) + x * Math.sin(jTick);
      const y1 = y * Math.cos(jTick * 0.7) - z1 * Math.sin(jTick * 0.7);
      return [cx + x1 * size, cy + y1 * size];
    });
    jCtx.strokeStyle = '#38bdf8'; jCtx.lineWidth = 2.2;
    [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a,b]) => {
      jCtx.beginPath(); jCtx.moveTo(verts[a][0], verts[a][1]); jCtx.lineTo(verts[b][0], verts[b][1]); jCtx.stroke();
    });
  } else {
    jCtx.strokeStyle = '#34d399'; jCtx.lineWidth = 2;
    for (let ring = 1; ring <= 5; ring++) {
      jCtx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.15) {
        const r = ring * 24 + Math.sin(a * 6 + jTick * 3) * 8;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (a === 0) jCtx.moveTo(x, y); else jCtx.lineTo(x, y);
      }
      jCtx.closePath(); jCtx.stroke();
    }
  }
  requestAnimationFrame(renderJarvisCore);
}
requestAnimationFrame(renderJarvisCore);

document.querySelectorAll('.geo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.geo-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); jarvisGeo = btn.dataset.geo;
  });
});

let brainIdx = 0;
document.getElementById('btnSwitchBrain').addEventListener('click', () => {
  brainIdx = (brainIdx + 1) % BRAINS.length;
  const newBrain = BRAINS[brainIdx];
  document.getElementById('activeBrainLabel').textContent = newBrain;
  document.getElementById('reflexBrainTag').textContent = 'BRAIN: ' + newBrain;
  logReflex('[CORTEX SWAP] Switched active reasoning engine to ' + newBrain + '.');
});

let watchInterval = null;
document.querySelectorAll('.hud-toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.toggle;
    const isAct = btn.classList.toggle('active');
    const stateSpan = btn.querySelector('.toggle-state');
    if (type === 'reflex') {
      stateSpan.textContent = isAct ? 'active' : 'hidden';
      document.getElementById('reflexDrawer').classList.toggle('open', isAct);
    } else stateSpan.textContent = isAct ? 'on' : 'off';
    if (type === 'eyes') document.getElementById('eyesOverlay').classList.toggle('active', isAct);
    else if (type === 'holo') document.body.classList.toggle('holo-mode', isAct);
    else if (type === 'focus') focusMode = isAct;
    else if (type === 'watch') {
      if (isAct) {
        logReflex('[WATCH DAEMON] Autonomous F.R.A.Y.M.U.S. vault watcher started.');
        watchInterval = setInterval(() => {
          const rn = nodes[Math.floor(Math.random() * nodes.length)];
          logReflex('[WATCH] Verified continuity (1.014 > 0.618) on "' + rn.label + '".');
        }, 6500);
      } else { clearInterval(watchInterval); logReflex('[WATCH DAEMON] Paused.'); }
    }
  });
});

const armoryModal = document.getElementById('armoryModal');
const fraymusModal = document.getElementById('fraymusModal');
const armoryGrid = document.getElementById('armoryGrid');
const armoryCountText = document.getElementById('armoryCountText');

function renderArmoryCards(filterText = '') {
  armoryGrid.innerHTML = '';
  const q = filterText.trim().toLowerCase();
  armoryCountText.textContent = TOOL_ARMORY_DATA.filter(t => t.status === 'connected').length + ' connected';
  TOOL_ARMORY_DATA.forEach(tool => {
    if (q && !tool.name.toLowerCase().includes(q) && !tool.desc.toLowerCase().includes(q)) return;
    const card = document.createElement('div');
    card.className = 'tool-card ' + (tool.status === 'connected' ? 'is-connected' : '');
    const badgeHtml = tool.status === 'connected'
      ? '<button class="badge-action badge-connected">✓ connected</button>'
      : tool.status === 'paused'
      ? '<button class="badge-action badge-paused">paused</button>'
      : tool.status === 'reconnect'
      ? '<button class="badge-action badge-reconnect">re-connect</button>'
      : '<button class="badge-action badge-add">+</button>';
    card.innerHTML = '<div class="tool-info"><div class="tool-icon" style="background:' + tool.bg + ';color:' + tool.fg + '">' + tool.icon + '</div><div class="tool-text"><div class="tool-name">' + tool.name + '</div><div class="tool-desc">' + tool.desc + '</div></div></div>' + badgeHtml;
    card.querySelector('.badge-action').addEventListener('click', () => {
      tool.status = tool.status === 'connected' ? 'available' : 'connected';
      renderArmoryCards(document.getElementById('armorySearchInput').value);
      logReflex('[TOOL ARMORY] ' + tool.name + ' → ' + tool.status.toUpperCase());
    });
    armoryGrid.appendChild(card);
  });
}
renderArmoryCards();

document.getElementById('btnOpenArmory').addEventListener('click', () => armoryModal.classList.add('open'));
document.getElementById('dockArmory').addEventListener('click', () => armoryModal.classList.add('open'));
document.getElementById('btnCloseArmory').addEventListener('click', () => armoryModal.classList.remove('open'));
document.getElementById('btnOpenFraymus').addEventListener('click', () => fraymusModal.classList.add('open'));
document.getElementById('dockFraymus').addEventListener('click', () => fraymusModal.classList.add('open'));
document.getElementById('btnCloseFraymus').addEventListener('click', () => fraymusModal.classList.remove('open'));
document.getElementById('armorySearchInput').addEventListener('input', e => renderArmoryCards(e.target.value));

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') { armoryModal.classList.remove('open'); fraymusModal.classList.remove('open'); }
  if ((e.key === 't' || e.key === 'T') && document.activeElement.tagName !== 'INPUT') armoryModal.classList.toggle('open');
  if ((e.key === 'f' || e.key === 'F') && document.activeElement.tagName !== 'INPUT') fraymusModal.classList.toggle('open');
});

function logReflex(msg) {
  const log = document.getElementById('reflexLog');
  const div = document.createElement('div');
  div.className = 'reflex-entry'; div.textContent = msg;
  log.appendChild(div); log.scrollTop = log.scrollHeight;
}

function handleReflexCommand() {
  const input = document.getElementById('reflexInput');
  const cmd = input.value.trim();
  if (!cmd) return;
  input.value = '';
  logReflex('> ' + cmd);
  if (/^[0-9+\\-*/_().\\s]+$/.test(cmd)) {
    const res = runBabelTransmuter(cmd);
    logReflex('[BABEL TRANSMUTER] Eval=' + res.evalVal + ' | C=' + res.cCode + ' | ASM=' + res.asmCode.replace(/\\n/g, ' ; '));
    return;
  }
  const matchedNode = nodes.find(n => n.label.toLowerCase().includes(cmd.toLowerCase()));
  if (matchedNode) {
    selectedNode = matchedNode; updateInspector(matchedNode);
    logReflex('[J.A.R.V.I.S.] Focused hub "' + matchedNode.label + '" (' + adjList.get(matchedNode.id).size + ' links).');
  } else {
    logReflex('[F.R.A.Y.M.U.S. (' + BRAINS[brainIdx] + ')] Synthesized across 538 notes · Continuity 1.014 > 0.618 PASS.');
  }
}
document.getElementById('reflexSend').addEventListener('click', handleReflexCommand);
document.getElementById('reflexInput').addEventListener('keydown', e => { if (e.key === 'Enter') handleReflexCommand(); });
document.getElementById('dockTerminal').addEventListener('click', () => document.getElementById('btnReflexToggle').click());
document.getElementById('dockPath').addEventListener('click', () => {
  const a = 8; // F.R.A.Y.M.U.S. Core
  const b = Math.floor(18 + Math.random() * (nodes.length - 18));
  selectedNode = nodes[a]; updateInspector(nodes[a]); traceShortestPath(a, b);
});
document.getElementById('dockVoice').addEventListener('click', () => {
  const reflexBtn = document.getElementById('btnReflexToggle');
  if (!reflexBtn.classList.contains('active')) reflexBtn.click();
  logReflex('[VOICE] "Jarvis, verify F.R.A.Y.M.U.S. φ⁷⁵ Seal, run Babel Transmuter on 2 + 3 * 4, and trace path to SEO Suite."');
  const res = runBabelTransmuter('2 + 3 * 4');
  logReflex('[BABEL] 2 + 3 * 4 → Eval=' + res.evalVal + ', C=' + res.cCode);
  const seo = nodes.find(n => n.label === 'SEO Suite');
  if (seo) traceShortestPath(8, seo.id);
});
</script>
</body>
</html>`;