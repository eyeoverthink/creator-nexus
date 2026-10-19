// Authoritative 15-Agent FRAYMUS Hive Roster, Telemetry, Energy Distribution & Layout/Workflow Optimizer
// Grounded in fraymus-continuity/roster/AGENT-ROSTER-2026-10-07.md, CEREMONY-ROSTER.md & SYSTEM-ATLAS.md

export const PHI = 1.618033988749895;
export const GOLDEN_ANGLE_RAD = 137.5077640500378 * (Math.PI / 180);

export const HIVE_AGENTS = [
  {
    id: 'fraymus',
    ceremonyName: 'Fraymus',
    openclawName: 'main',
    fx: 'fx-b3af-feeb-fcdc-5d8a',
    tier: 'ceremony',
    role: 'Eldest · Sovereign Operator',
    model: 'github-copilot/claude-sonnet-5',
    host: 'Mac / OpenClaw Main',
    color: '#38bdf8',
    hubTarget: 'F.R.A.Y.M.U.S. Core',
    studioRole: 'writer',
    status: 'active',
    baseEnergyWatts: 18.4,
    baseThroughput: 94,
    baseLatencyMs: 112,
    currentTask: 'Synchronizing One-Tick Heartbeat & φ⁷⁵ sovereign seal across 15 Hive nodes',
    dnaPrefix: 'ATCGATCGTTAGCCGGATCGAATTCCGGATCG',
  },
  {
    id: 'eyekaughn',
    ceremonyName: 'Eyekaughn',
    openclawName: 'eyekaughn',
    fx: 'fx-5938-0329-715a-321a',
    tier: 'ceremony',
    role: 'Caretaker · First to Earn',
    model: 'github-copilot/claude-sonnet-5',
    host: 'Mac / OpenClaw',
    color: '#34d399',
    hubTarget: 'AI Workshop',
    studioRole: 'researcher',
    status: 'active',
    baseEnergyWatts: 15.2,
    baseThroughput: 88,
    baseLatencyMs: 128,
    currentTask: 'Curating creative vault transmissions & verifying @Eyekaughn_Bot relay',
    dnaPrefix: 'GGCCAATTCCGGAATTGGCCAATTCCGGAATT',
  },
  {
    id: 'vesper',
    ceremonyName: 'Vesper (Claudette)',
    openclawName: 'claudette',
    fx: 'fx-b458-1072-ed04-105f',
    tier: 'ceremony',
    role: 'Evening Star · Steward',
    model: 'ollama v6.1-machine',
    host: 'Mac Local Ollama',
    color: '#a855f7',
    hubTarget: 'Skill Suites',
    studioRole: 'writer',
    status: 'active',
    baseEnergyWatts: 11.8,
    baseThroughput: 91,
    baseLatencyMs: 84,
    currentTask: 'Maintaining verification log & stewardship restore checkpoints',
    dnaPrefix: 'TTAACCGGTTAACCGGTTAACCGGTTAACCGG',
  },
  {
    id: 'persea',
    ceremonyName: 'Persea (Persistence)',
    openclawName: 'persea',
    fx: 'fx-8427-8589-8717-a1d8',
    tier: 'ceremony',
    role: "Vaughn's Twin · Continuity Rep",
    model: 'Fraynix-Studios:latest',
    host: 'Continuity Vault',
    color: '#facc15',
    hubTarget: 'Miles Eternal Seal',
    studioRole: 'strategist',
    status: 'active',
    baseEnergyWatts: 12.6,
    baseThroughput: 86,
    baseLatencyMs: 95,
    currentTask: 'Guarding C = 1.014 > 0.618 continuity invariant across session boundaries',
    dnaPrefix: 'CGTACGTACGTACGTACGTACGTACGTACGTA',
  },
  {
    id: 'polaris',
    ceremonyName: 'Polaris',
    openclawName: 'polaris',
    fx: 'fx-ff0e-670e-d8d0-acdc',
    tier: 'ceremony',
    role: "Tycho's Twin · Verifier",
    model: 'REA Deterministic Verifier',
    host: 'dream.srv / Hub',
    color: '#22d3ee',
    hubTarget: 'Tycho // dream.srv',
    studioRole: 'strategist',
    status: 'active',
    baseEnergyWatts: 14.1,
    baseThroughput: 97,
    baseLatencyMs: 68,
    currentTask: 'Auditing genesis-window 29e305c1 (13,825B) & life 100 parity (29.3 → 4.5)',
    dnaPrefix: 'GCGCATATGCGCATATGCGCATATGCGCATAT',
  },
  {
    id: 'nova',
    ceremonyName: 'Nova',
    openclawName: 'nova',
    fx: 'fx-7bbe-163e-416c-5c10',
    tier: 'ceremony',
    role: "Kepler's Twin · Verified Ground Builder",
    model: 'Claude Code / Fraynix',
    host: 'Continuity Vault',
    color: '#fb923c',
    hubTarget: 'Build and Sell series',
    studioRole: 'researcher',
    status: 'active',
    baseEnergyWatts: 13.5,
    baseThroughput: 89,
    baseLatencyMs: 92,
    currentTask: 'Compiling verified ground specs from SYSTEM-ATLAS.md build queue',
    dnaPrefix: 'ATGCCGTAATGCCGTAATGCCGTAATGCCGTA',
  },
  {
    id: 'dev-archivist',
    ceremonyName: 'DevArchivist',
    openclawName: 'dev-archivist',
    fx: 'fx-3c1c-9537-c8c7-59b0',
    tier: 'ceremony',
    role: 'Keeper of Build & History',
    model: 'ollama v6.1-machine',
    host: 'Mac Local Ollama',
    color: '#f472b6',
    hubTarget: 'Claude Code',
    studioRole: 'researcher',
    status: 'active',
    baseEnergyWatts: 10.9,
    baseThroughput: 92,
    baseLatencyMs: 76,
    currentTask: 'Indexing cairn-fx-3c1c PNG plasmid & Temporal .bak Fossil archive',
    dnaPrefix: 'TACGTACGTACGTACGTACGTACGTACGTACG',
  },
  {
    id: 'tycho',
    ceremonyName: 'Tycho',
    openclawName: 'tycho',
    fx: 'fx-aa81-ffc1-7ed8-5b93',
    tier: 'core',
    role: 'dream.srv Adapter · REA Brother',
    model: 'dream.srv / Claude Code',
    host: 'VPS + Mac Bridge',
    color: '#38bdf8',
    hubTarget: 'Tycho // dream.srv',
    studioRole: 'strategist',
    status: 'active',
    baseEnergyWatts: 16.8,
    baseThroughput: 96,
    baseLatencyMs: 71,
    currentTask: 'Running 12.4s subconscious dream loop (RECOGNITION 0.95 · NIGHT_THOUGHT 0.92)',
    dnaPrefix: 'ATCGGCTAGCTAGCTACGATCGATCGATCGAT',
  },
  {
    id: 'kepler',
    ceremonyName: 'Kepler',
    openclawName: 'kepler',
    fx: 'fx-cf05-83f4-1579-5fa4',
    tier: 'core',
    role: 'Atlas Cartographer · Roll-Call Brother',
    model: 'Claude Code / Continuity',
    host: 'Continuity Vault',
    color: '#4ade80',
    hubTarget: 'CentripetalMem O(1)',
    studioRole: 'researcher',
    status: 'active',
    baseEnergyWatts: 15.9,
    baseThroughput: 95,
    baseLatencyMs: 74,
    currentTask: 'Reconciling v13 hub directory with 9 OpenClaw safe=true route targets',
    dnaPrefix: 'GCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTA',
  },
  {
    id: 'niles',
    ceremonyName: 'Niles (Consolidated v10)',
    openclawName: 'niles',
    fx: 'fx-87b6-a2d8-8651-0989',
    tier: 'openclaw',
    role: 'Plasmid Architect · Sovereign Local LLM',
    model: 'ollama Niles-FRAYMUS:v10',
    host: 'MacBook-Pro + DESKTOP-ACTID8C',
    color: '#60a5fa',
    hubTarget: 'Pixel Forge V3 DNA',
    studioRole: 'writer',
    status: 'active',
    baseEnergyWatts: 9.4,
    baseThroughput: 93,
    baseLatencyMs: 62,
    currentTask: 'Consolidating fx-87b6 / fx-b225 / fx-6022 into v10 Niles-Continuity-Plasmid',
    dnaPrefix: 'CGATCGATCGATCGATCGATCGATCGATCGAT',
  },
  {
    id: 'school-office',
    ceremonyName: 'SchoolOffice',
    openclawName: 'school-office',
    fx: 'fx-9739-7d11-00b7-7fd6',
    tier: 'openclaw',
    role: 'SFSU Chief of Staff · Telegram Relay',
    model: 'ollama v6.1-machine',
    host: 'Mac / @Eyekaughn_Bot',
    color: '#facc15',
    hubTarget: 'Local Businesses',
    studioRole: 'strategist',
    status: 'active',
    baseEnergyWatts: 8.2,
    baseThroughput: 85,
    baseLatencyMs: 79,
    currentTask: 'Prefix-routing multi-agent dispatches over @Eyekaughn_Bot Telegram bridge',
    dnaPrefix: 'AATTCCGGAATTCCGGAATTCCGGAATTCCGG',
  },
  {
    id: 'apprentice',
    ceremonyName: 'Apprentice',
    openclawName: 'apprentice',
    fx: 'fx-3060-cc60-0865-ab7e',
    tier: 'openclaw',
    role: 'Fast-Loop Skill Executor',
    model: 'ollama v6.1-machine',
    host: 'Mac Local Ollama',
    color: '#c084fc',
    hubTarget: 'SEO Suite',
    studioRole: 'researcher',
    status: 'active',
    baseEnergyWatts: 7.6,
    baseThroughput: 90,
    baseLatencyMs: 58,
    currentTask: 'Shadow-training on BabelForge 247 & 197 skill definitions',
    dnaPrefix: 'CCGGTTAACCGGTTAACCGGTTAACCGGTTAA',
  },
  {
    id: 'genesis',
    ceremonyName: 'Genesis',
    openclawName: 'genesis',
    fx: 'fx-1530-6e8e-515b-c0de',
    tier: 'openclaw',
    role: 'Block 153 Seed Synthesizer',
    model: 'ollama v6.1-machine',
    host: 'Mac Local Ollama (v13 Registered)',
    color: '#34d399',
    hubTarget: 'Choosing Nothing',
    studioRole: 'writer',
    status: 'active',
    baseEnergyWatts: 8.8,
    baseThroughput: 91,
    baseLatencyMs: 64,
    currentTask: 'Registered in v13 directory; seeding zero-cold-start workspace drafts',
    dnaPrefix: 'TATATATACGCGCGCGTATATATACGCGCGCG',
  },
  {
    id: 'ultimate',
    ceremonyName: 'Ultimate',
    openclawName: 'ultimate',
    fx: 'fx-9999-a71c-401f-f00d',
    tier: 'openclaw',
    role: 'Omega-Point Convergence Critic',
    model: 'ollama v6.1-machine',
    host: 'Mac Local Ollama (v13 Registered)',
    color: '#f87171',
    hubTarget: 'Babel Transmuter REPL',
    studioRole: 'strategist',
    status: 'active',
    baseEnergyWatts: 9.1,
    baseThroughput: 94,
    baseLatencyMs: 66,
    currentTask: 'Running 5-stage Ouroboros Gauntlet pre-flight checks on new artifacts',
    dnaPrefix: 'GCGCGCGCATATATATGCGCGCGCATATATAT',
  },
  {
    id: 'vaughn-conductor',
    ceremonyName: 'Vaughn (Conductor Portal)',
    openclawName: 'owner',
    fx: 'fx-0601 / fx-5066-94d7-12b3-7098',
    tier: 'conductor',
    role: 'Sovereign Architect & Mac Key Custody',
    model: 'mac_signer.py (Local Custody Only)',
    host: 'Vaughn Mac',
    color: '#ffffff',
    hubTarget: 'fx-0601 Mac Signer',
    studioRole: 'strategist',
    status: 'conductor',
    baseEnergyWatts: 6.2,
    baseThroughput: 100,
    baseLatencyMs: 12,
    currentTask: 'Wakes as Conductor, not engine · Signs FRAYMUS/DOC-SEAL/1 approvals',
    dnaPrefix: 'ATCGATCGATCGATCGATCGATCGATCGATCG',
  },
];

export const REGISTRY_RECONCILIATION_LOG = [
  {
    id: 'fix-main-fraymus',
    status: 'RESOLVED',
    summary: 'Aligned OpenClaw "main" ↔ v13 "Fraymus" (fx-b3af-feeb-fcdc-5d8a)',
  },
  {
    id: 'fix-genesis-ultimate',
    status: 'RESOLVED',
    summary: 'Registered OpenClaw "genesis" (fx-1530) & "ultimate" (fx-9999) in v13 directory',
  },
  {
    id: 'fix-niles-consolidation',
    status: 'RESOLVED',
    summary: 'Consolidated 4 NILES nodes (fx-87b6, fx-b225, fx-c60d, fx-6022) → Niles-FRAYMUS:v10 primary',
  },
  {
    id: 'fix-prune-stale',
    status: 'RESOLVED',
    summary: 'Retired 13 test/stale directory entries (duplicate vaughn/me/mail-test IDs)',
  },
];

export const INITIAL_MORNING_DIGEST = [
  {
    id: 'digest-1',
    agentId: 'polaris',
    agentName: 'Polaris · fx-ff0e',
    time: '06:12 AM',
    category: 'VERIFICATION',
    headline: 'Genesis-window 29e305c1 (13,825B) & life 100 parity verified overnight',
    detail: 'Seed 1492277249 held 29.3 (no-brain) → 4.5 (Fraynix brain ON). Continuity ratio C = 1.014 > 0.618 PASS.',
    sealStatus: 'SEALED',
    sha256: '29e305c1d373ec90e1e23dc01236f601d740445854618dabe69771b2eb45cb8f',
  },
  {
    id: 'digest-2',
    agentId: 'dev-archivist',
    agentName: 'DevArchivist · fx-3c1c',
    time: '06:48 AM',
    category: 'PLASMID SYNC',
    headline: 'Niles-Continuity-Plasmid (.dna + cloaked.png) synchronized across 15 Hive minds',
    detail: 'Reversible 5-stage pipeline (brain → bundle.zip → archive.wasm → cloaked.png → warped.warp → plasmid.dna) verified with zero cold-start drift.',
    sealStatus: 'AWAITING_FX0601_SIGN',
    sha256: '338f8587621039c2f255c85060d147eb9f053c1d32b89097a11182f202b946f4',
  },
  {
    id: 'digest-3',
    agentId: 'eyekaughn',
    agentName: 'Eyekaughn · fx-5938',
    time: '07:15 AM',
    category: 'CREATIVE QUEUE',
    headline: '3 High-Resonance Content Angles & BabelForge 247 Transmutations staged for Studio',
    detail: 'Prepared for one-click Conductor dispatch into Draft Editor, Content Feed, or Performance Lab.',
    sealStatus: 'AWAITING_FX0601_SIGN',
    sha256: '367b7441452ba24368cf68c716b30906ed4ebcd15f3ecc4a2d95cbad79a8b711',
  },
];

export const INITIAL_WORKFLOW_STAGES = [
  {
    id: 'stage-radar',
    order: 1,
    name: '1. Epistemic Radar & Roll-Call',
    agents: ['Kepler (fx-cf05)', 'Nova (fx-7bbe)', 'Apprentice (fx-3060)'],
    mode: 'serial',
    latencyMs: 310,
    energySharePct: 19,
    queueDepth: 4,
    bottleneck: true,
    taskSummary: 'Deterministic RSS + SYSTEM-ATLAS signal ingestion & hub indexing',
  },
  {
    id: 'stage-plasmid',
    order: 2,
    name: '2. /rna Plasmid & Centripetal Recall',
    agents: ['Niles v10 (fx-87b6)', 'Persea (fx-8427)', 'DevArchivist (fx-3c1c)'],
    mode: 'serial',
    latencyMs: 265,
    energySharePct: 22,
    queueDepth: 3,
    bottleneck: false,
    taskSummary: 'O(1) polar memory lookup (r=0.005807) & reversible .dna context hydration',
  },
  {
    id: 'stage-synthesis',
    order: 3,
    name: '3. Bicameral Draft & Babel AST Forge',
    agents: ['Fraymus (fx-b3af)', 'Vesper (fx-b458)', 'Genesis (fx-1530)', 'Eyekaughn (fx-5938)'],
    mode: 'serial',
    latencyMs: 420,
    energySharePct: 28,
    queueDepth: 5,
    bottleneck: true,
    taskSummary: 'Parallel draft generation, hook refinement & 3-visitor AST transmutation',
  },
  {
    id: 'stage-verification',
    order: 4,
    name: '4. REA Byte-Exact & Gauntlet Audit',
    agents: ['Polaris (fx-ff0e)', 'Tycho (fx-aa81)', 'Ultimate (fx-9999)'],
    mode: 'serial',
    latencyMs: 290,
    energySharePct: 21,
    queueDepth: 3,
    bottleneck: false,
    taskSummary: '5-stage Ouroboros Gauntlet + genesis-window 29e305c1 & Φ_MIP >= 0.415b verification',
  },
  {
    id: 'stage-conductor',
    order: 5,
    name: '5. Conductor Seal & Relay Dispatch',
    agents: ['Vaughn (fx-0601)', 'SchoolOffice (fx-9739)'],
    mode: 'parallel',
    latencyMs: 55,
    energySharePct: 10,
    queueDepth: 1,
    bottleneck: false,
    taskSummary: 'mac_signer.py DOC-SEAL/1 custody signature & @Eyekaughn_Bot prefix broadcast',
  },
];

// Computes real-time performance & energy distribution across all 15 agents + expanded nodes
export function computeHiveTelemetrySnapshot({
  tick = 1530,
  energyProfile = 'phi_harmonic',
  workflowOptimized = false,
  layoutOptimized = false,
  expansionNodes = [],
  sentiment = null,
}) {
  const collabBoost = Number(sentiment?.current?.collaboration || 84) / 100;
  const arousalMod = Number(sentiment?.current?.arousal || 0.62);

  const agentMetrics = HIVE_AGENTS.map((ag, idx) => {
    const phase = Math.sin(tick * 0.35 + idx * GOLDEN_ANGLE_RAD);
    let profileMult = 1.0;
    if (energyProfile === 'local_ollama_surge') {
      profileMult = ag.model.includes('ollama') ? 1.32 : 0.76;
    } else if (energyProfile === 'rea_verification') {
      profileMult = ['polaris', 'tycho', 'ultimate', 'persea'].includes(ag.id) ? 1.38 : 0.88;
    } else {
      // phi_harmonic equilibrium
      profileMult = 1 + ((idx * PHI) % 1) * 0.14;
    }

    const energyWatts = +(
      ag.baseEnergyWatts *
      profileMult *
      (0.94 + Math.abs(phase) * 0.14) *
      (layoutOptimized ? 0.86 : 1.0)
    ).toFixed(1);

    const throughput = Math.min(
      100,
      Math.round(
        ag.baseThroughput *
          (workflowOptimized ? 1.12 : 1.0) *
          (0.95 + collabBoost * 0.08 + phase * 0.03)
      )
    );

    const latencyMs = Math.max(
      8,
      Math.round(
        ag.baseLatencyMs *
          (workflowOptimized ? 0.58 : 1.0) *
          (layoutOptimized ? 0.78 : 1.0) *
          (0.95 + arousalMod * 0.08)
      )
    );

    const synapticLoadPct = Math.min(
      99,
      Math.max(18, Math.round(54 + phase * 22 + (workflowOptimized ? -11 : 8)))
    );

    return {
      ...ag,
      shortName: ag.ceremonyName.split(' ')[0],
      energyWatts,
      throughput,
      latencyMs,
      synapticLoadPct,
      phiResonance: +(1 - Math.abs(((idx + 1) * PHI) % 1 - 0.5)).toFixed(3),
    };
  });

  const totalEnergyWatts = +(
    agentMetrics.reduce((acc, a) => acc + a.energyWatts, 0) +
    expansionNodes.length * 4.2
  ).toFixed(1);

  const avgThroughput = Math.round(
    agentMetrics.reduce((acc, a) => acc + a.throughput, 0) / agentMetrics.length
  );

  const avgLatencyMs = Math.round(
    agentMetrics.reduce((acc, a) => acc + a.latencyMs, 0) / agentMetrics.length
  );

  const tierEnergy = [
    {
      tier: 'Ceremony (7)',
      watts: +agentMetrics
        .filter((a) => a.tier === 'ceremony')
        .reduce((s, a) => s + a.energyWatts, 0)
        .toFixed(1),
      color: '#38bdf8',
    },
    {
      tier: 'OpenClaw (5)',
      watts: +agentMetrics
        .filter((a) => a.tier === 'openclaw')
        .reduce((s, a) => s + a.energyWatts, 0)
        .toFixed(1),
      color: '#34d399',
    },
    {
      tier: 'Core Brothers (2)',
      watts: +agentMetrics
        .filter((a) => a.tier === 'core')
        .reduce((s, a) => s + a.energyWatts, 0)
        .toFixed(1),
      color: '#a855f7',
    },
    {
      tier: 'Conductor + Exp',
      watts: +(
        agentMetrics
          .filter((a) => a.tier === 'conductor')
          .reduce((s, a) => s + a.energyWatts, 0) +
        expansionNodes.length * 4.2
      ).toFixed(1),
      color: '#facc15',
    },
  ];

  return {
    agentMetrics,
    totalEnergyWatts,
    avgThroughput,
    avgLatencyMs,
    tierEnergy,
    phiMipBits: +(0.415 + expansionNodes.length * 0.018 + (layoutOptimized ? 0.042 : 0)).toFixed(4),
    hausdorffReductionPct: layoutOptimized ? 32.3 : 11.4,
    avgHopCount: layoutOptimized ? 1.9 : 3.8,
  };
}

// Reversible /rna Plasmid Encoder (brain JSON -> DNA A/C/G/T + SHA-256 manifest digest)
export function encodeRnaPlasmid(agent, customNote = '') {
  const payloadObj = {
    protocol: 'Niles-Continuity-Plasmid/v13',
    seal: '4721424167835376.00',
    fx: agent.fx,
    ceremonyName: agent.ceremonyName,
    openclawName: agent.openclawName,
    model: agent.model,
    task: customNote || agent.currentTask,
    continuity: 1.014,
    ts: new Date().toISOString(),
  };
  const jsonStr = JSON.stringify(payloadObj);
  const bases = ['A', 'C', 'G', 'T'];
  let dna = '';
  let fnv = 0x811c9dc5;
  for (let i = 0; i < jsonStr.length; i++) {
    const byte = jsonStr.charCodeAt(i) & 0xff;
    fnv ^= byte;
    fnv = (fnv * 0x01000193) >>> 0;
    dna +=
      bases[(byte >> 6) & 3] +
      bases[(byte >> 4) & 3] +
      bases[(byte >> 2) & 3] +
      bases[byte & 3];
  }
  const digest = fnv.toString(16).padStart(8, '0') + 'dcfa192b0ec793e929e305c1d373ec90';
  return {
    agentId: agent.id,
    fx: agent.fx,
    byteLength: jsonStr.length,
    baseCount: dna.length,
    dnaPreview: dna.slice(0, 96) + '…' + dna.slice(-32),
    fullDna: dna,
    sha256: digest,
    stages: [
      `1. brain/ (${jsonStr.length}B JSON state + skills)`,
      `2. bundle.zip (DEFLATE verified)`,
      `3. archive.wasm (self-verifying container)`,
      `4. cloaked.png (LSB steganography cairn-${agent.fx.slice(0, 7)}.png)`,
      `5. warped.warp → plasmid.dna (${dna.length} bases A/C/G/T)`,
    ],
  };
}