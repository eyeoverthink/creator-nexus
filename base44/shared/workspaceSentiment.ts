// Affective State, Somatic Marker, Dopamine RPE, Steering Dials & Workspace Sentiment Engine

const POSITIVE_TOKENS = [
  'approved', 'passed', 'proven', 'promoted', 'winner', 'minted', 'published',
  'succeeded', 'completed', 'breakthrough', 'recalled', 'locked', 'online', 'spark', 'created', 'superseded'
];
const CHALLENGE_TOKENS = [
  'rejected', 'failed', 'error', 'denied', 'falsified', 'black_hole', 'warning', 'conflict', 'timeout', 'skip'
];
const CURIOSITY_TOKENS = [
  'explore', 'idea', 'hypothesis', 'experiment', 'research', 'audit', 'quantum', 'synthesize', 'question', 'radar', 'butterfly'
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function scoreTextAffect(text = '', kind = '') {
  const lower = `${text} ${kind}`.toLowerCase();
  let pos = 0;
  let neg = 0;
  let cur = 0;
  for (const t of POSITIVE_TOKENS) if (lower.includes(t)) pos++;
  for (const t of CHALLENGE_TOKENS) if (lower.includes(t)) neg++;
  for (const t of CURIOSITY_TOKENS) if (lower.includes(t)) cur++;

  const rewardDelta = clamp((pos * 0.28) - (neg * 0.24), -1, 1);
  const predictionError = clamp(0.22 + (cur * 0.14) + (neg * 0.12), 0.05, 0.95);
  const taskLoad = clamp(0.38 + (pos + neg + cur) * 0.08, 0.15, 0.95);
  const successRate = clamp(0.72 + (pos * 0.07) - (neg * 0.11), 0.15, 0.98);
  const conflictLevel = clamp(neg * 0.22, 0, 0.9);

  return { rewardDelta, predictionError, taskLoad, successRate, conflictLevel };
}

export function computeWorkspaceSentimentTelemetry({
  ledger = [],
  nexusEvents = [],
  chatTurns = [],
  learningLogs = [],
  activeGenome = null,
  orbits = [],
  fossils = [],
  blackHoles = [],
  receipts = [],
  stimulus = null,
}) {
  const rawSignals = [
    ...ledger.map((e) => ({
      id: `oro-${e.id || e.seq}`,
      timestamp: e.created_date || new Date().toISOString(),
      agent: e.branch?.includes('CONSCIOUSNESS') ? 'argon' : 'director',
      label: `${e.event_type}: ${(e.detail || '').slice(0, 60)}`,
      text: `${e.event_type} ${e.detail || ''}`,
      kind: e.event_type || 'evolution',
    })),
    ...nexusEvents.map((e) => ({
      id: `ev-${e.id}`,
      timestamp: e.created_date || new Date().toISOString(),
      agent: (e.agent || 'strategist').toLowerCase(),
      label: (e.message || e.kind || 'Workspace Event').slice(0, 60),
      text: `${e.kind || ''} ${e.message || ''}`,
      kind: e.kind || 'event',
    })),
    ...chatTurns.map((t) => ({
      id: `chat-${t.id}`,
      timestamp: t.created_date || new Date().toISOString(),
      agent: (t.agent || 'researcher').toLowerCase(),
      label: `Collab Turn: ${(t.question || '').slice(0, 50)}`,
      text: `${t.question || ''} ${(t.answer || '').slice(0, 200)}`,
      kind: 'chat_turn',
    })),
    ...learningLogs.map((l) => ({
      id: `log-${l.id}`,
      timestamp: l.created_date || new Date().toISOString(),
      agent: (l.agent || 'scout').toLowerCase(),
      label: `${l.action}: ${(l.summary || '').slice(0, 50)}`,
      text: `${l.kind} ${l.action} ${l.summary || ''}`,
      kind: l.kind || 'learning',
    })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const signals = rawSignals.length >= 6
    ? rawSignals.slice(-18)
    : [
        {
          id: 'seed-1',
          timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
          agent: 'scout',
          label: 'Genesis Workspace Calibration & Signal Radar',
          text: 'online spark explore research created',
          kind: 'calibration',
        },
        {
          id: 'seed-2',
          timestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
          agent: 'scribe',
          label: 'Collaborative Script Synthesis & Voice Alignment',
          text: 'created spark idea synthesize approved',
          kind: 'collaboration',
        },
        {
          id: 'seed-3',
          timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
          agent: 'director',
          label: 'Gauntlet Falsification & Scene Timing Check',
          text: 'audit hypothesis experiment warning passed',
          kind: 'audit',
        },
        {
          id: 'seed-4',
          timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
          agent: 'argon',
          label: 'Consciousness Φ_MIP & Quantum Invariant Lock',
          text: 'proven passed quantum winner promoted',
          kind: 'consciousness',
        },
        ...rawSignals,
      ];

  if (stimulus) {
    signals.push({
      id: `stim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent: stimulus.agent || 'argon',
      label: stimulus.label || 'Affective Stimulus Injected',
      text: stimulus.text || '',
      kind: 'stimulus',
      override: stimulus,
    });
  }

  let valence = 0.28;
  let arousal = 0.42;
  let dominance = 0.66;
  let curiosity = 0.54;
  let frustration = 0.08;

  const decayValence = 0.82;
  const decayArousal = 0.76;
  const decayDominance = 0.88;
  const decayCuriosity = 0.80;
  const decayFrustration = 0.78;

  const timeline = [];
  const agentCounts = {
    scout: { name: 'Scout (Research)', turns: 0, valenceSum: 0, engagementSum: 0 },
    scribe: { name: 'Scribe (Writing)', turns: 0, valenceSum: 0, engagementSum: 0 },
    pulse: { name: 'Pulse (Strategy)', turns: 0, valenceSum: 0, engagementSum: 0 },
    director: { name: 'Director (Scene/Gauntlet)', turns: 0, valenceSum: 0, engagementSum: 0 },
    argon: { name: 'Argon (Quantum Core)', turns: 0, valenceSum: 0, engagementSum: 0 },
  };

  let lastRewardDelta = 0.24;

  signals.forEach((sig, idx) => {
    const s = sig.override || scoreTextAffect(sig.text, sig.kind);
    lastRewardDelta = s.rewardDelta;
    const dV = Math.tanh(1.4 * s.rewardDelta - 0.6 * s.conflictLevel + 0.3 * (s.successRate - 0.5));
    const dA = Math.tanh(0.9 * s.predictionError + 0.8 * s.taskLoad + 0.5 * Math.abs(s.rewardDelta));
    const dD = Math.tanh(1.2 * (s.successRate - 0.4) - 0.7 * s.conflictLevel);
    const dC = Math.tanh(1.5 * s.predictionError - 0.4 * s.conflictLevel);
    const dF = Math.tanh(1.3 * s.conflictLevel - 0.9 * s.rewardDelta + 0.4 * (1.0 - s.successRate));

    valence = clamp(decayValence * valence + (1 - decayValence) * dV, -1, 1);
    arousal = clamp(decayArousal * arousal + (1 - decayArousal) * Math.max(0, dA), 0, 1);
    dominance = clamp(decayDominance * dominance + (1 - decayDominance) * Math.max(0, dD), 0, 1);
    curiosity = clamp(decayCuriosity * curiosity + (1 - decayCuriosity) * Math.max(0, dC), 0, 1);
    frustration = clamp(decayFrustration * frustration + (1 - decayFrustration) * Math.max(0, dF), 0, 1);

    const collaborationScore = Math.round(
      clamp(((valence + 1) * 0.28 + dominance * 0.32 + curiosity * 0.25 + (1 - frustration) * 0.15) * 100, 10, 99)
    );
    const agentEngagement = Math.round(
      clamp((arousal * 0.38 + curiosity * 0.37 + dominance * 0.25) * 100, 15, 99)
    );

    const normalizedAgent = sig.agent.includes('write') || sig.agent.includes('scribe')
      ? 'scribe'
      : sig.agent.includes('strat') || sig.agent.includes('pulse')
      ? 'pulse'
      : sig.agent.includes('res') || sig.agent.includes('scout')
      ? 'scout'
      : sig.agent.includes('argon')
      ? 'argon'
      : 'director';

    agentCounts[normalizedAgent].turns += 1;
    agentCounts[normalizedAgent].valenceSum += valence;
    agentCounts[normalizedAgent].engagementSum += agentEngagement;

    timeline.push({
      step: `T${idx + 1}`,
      label: sig.label,
      agent: normalizedAgent.toUpperCase(),
      valence: Number(valence.toFixed(3)),
      valencePct: Math.round(((valence + 1) / 2) * 100),
      arousal: Number(arousal.toFixed(3)),
      arousalPct: Math.round(arousal * 100),
      dominance: Number(dominance.toFixed(3)),
      dominancePct: Math.round(dominance * 100),
      curiosity: Number(curiosity.toFixed(3)),
      curiosityPct: Math.round(curiosity * 100),
      frustration: Number(frustration.toFixed(3)),
      frustrationPct: Math.round(frustration * 100),
      collaboration: collaborationScore,
      engagement: agentEngagement,
    });
  });

  // Cognitive Modulators & 7 Steering Dials
  const explorationSigma = Number(clamp(0.08 + 0.45 * curiosity + 0.25 * frustration - 0.12 * valence, 0.04, 0.85).toFixed(4));
  const stepSizeEta = Number(clamp(0.12 + 0.35 * arousal * dominance, 0.05, 0.50).toFixed(4));
  const attentionDepth = Math.round(clamp(4 + 8 * arousal + 4 * frustration - 2 * valence, 2, 16));
  const empatheticBias = Number(clamp(0.54 + 0.30 * valence - 0.20 * frustration, 0.15, 0.95).toFixed(4));
  const riskTolerance = Number(clamp(0.35 + 0.40 * dominance + 0.20 * valence - 0.30 * frustration, 0.10, 0.95).toFixed(4));
  const memoryGravityAlpha = Number(clamp(0.45 + 0.35 * (activeGenome?.continuity || 0.72) + 0.15 * dominance, 0.20, 0.98).toFixed(4));
  const epistemicGainGamma = Number(clamp(0.30 + 0.50 * curiosity + 0.20 * arousal, 0.15, 0.98).toFixed(4));

  let dominantAffect = 'CONFIDENT_FLOW_STATE';
  if (frustration > 0.45 && valence < -0.1) dominantAffect = 'FRUSTRATED_REPLANNING';
  else if (curiosity > 0.52 && arousal > 0.42) dominantAffect = 'EPISTEMIC_CURIOSITY_DRIVE';
  else if (valence > 0.22 && dominance > 0.58) dominantAffect = 'CONFIDENT_FLOW_STATE';
  else if (arousal > 0.65 && dominance < 0.4) dominantAffect = 'HIGH_ALERT_CAUTION';
  else dominantAffect = 'CALM_HOMEOSTASIS';

  const latest = timeline[timeline.length - 1] || {
    valence: 0.32,
    valencePct: 66,
    arousal: 0.46,
    arousalPct: 46,
    dominance: 0.71,
    dominancePct: 71,
    curiosity: 0.62,
    curiosityPct: 62,
    frustration: 0.08,
    frustrationPct: 8,
    collaboration: 84,
    engagement: 79,
  };

  // 1. Emotion Ring (Donut Chart data)
  const emotionRing = [
    { name: 'Curiosity Drive', value: Math.max(8, latest.curiosityPct), color: '#3B63FB' },
    { name: 'Dominance / Flow', value: Math.max(8, latest.dominancePct), color: '#47C686' },
    { name: 'Positive Valence', value: Math.max(8, latest.valencePct), color: '#22C55E' },
    { name: 'Arousal / Energy', value: Math.max(8, latest.arousalPct), color: '#E5A93B' },
    { name: 'Empathetic Resonance', value: Math.round(empatheticBias * 100), color: '#7DA0FF' },
    { name: 'Friction / Caution', value: Math.max(4, latest.frustrationPct), color: '#F0555D' },
  ];

  // 2. 7 Steering Dials (Gauge Bars)
  const steeringDials = [
    {
      id: 'sigma',
      label: 'Exploration Noise',
      symbol: 'σ',
      value: explorationSigma,
      pct: Math.round((explorationSigma / 0.85) * 100),
      color: '#3B63FB',
      description: 'Rule-30 stochastic mutation breadth',
    },
    {
      id: 'eta',
      label: 'Learning Step Size',
      symbol: 'η',
      value: stepSizeEta,
      pct: Math.round((stepSizeEta / 0.50) * 100),
      color: '#47C686',
      description: 'Plasticity update velocity',
    },
    {
      id: 'depth',
      label: 'Attention Depth',
      symbol: 'D',
      value: `${attentionDepth} layers`,
      pct: Math.round((attentionDepth / 16) * 100),
      color: '#7DA0FF',
      description: 'Counterfactual rollout horizon',
    },
    {
      id: 'beta',
      label: 'Empathetic Bias',
      symbol: 'β',
      value: empatheticBias,
      pct: Math.round(empatheticBias * 100),
      color: '#22C55E',
      description: 'Human-agent co-creation alignment',
    },
    {
      id: 'rho',
      label: 'Risk Tolerance',
      symbol: 'ρ',
      value: riskTolerance,
      pct: Math.round(riskTolerance * 100),
      color: '#E5A93B',
      description: 'Threshold before fossil rollback',
    },
    {
      id: 'alpha',
      label: 'Memory Gravity Pull',
      symbol: 'α',
      value: memoryGravityAlpha,
      pct: Math.round(memoryGravityAlpha * 100),
      color: '#38BDF8',
      description: 'Centripetal pull toward r → 0 core',
    },
    {
      id: 'gamma',
      label: 'Epistemic Gain',
      symbol: 'γ',
      value: epistemicGainGamma,
      pct: Math.round(epistemicGainGamma * 100),
      color: '#A855F7',
      description: 'Information-seeking intrinsic drive',
    },
  ];

  // 3. Mutation Strategy Panel (Alpha / Beta / Gamma Allocation)
  const rawAlpha = 0.32 + (1 - explorationSigma) * 0.25 + dominance * 0.15;
  const rawBeta = 0.14 + explorationSigma * 0.35 + frustration * 0.20;
  const rawGamma = 0.38 + curiosity * 0.35 + riskTolerance * 0.20;
  const sumWeights = rawAlpha + rawBeta + rawGamma;

  const alphaPct = Math.round((rawAlpha / sumWeights) * 100);
  const betaPct = Math.round((rawBeta / sumWeights) * 100);
  const gammaPct = Math.max(1, 100 - alphaPct - betaPct);

  const rAlpha = receipts.find((r) => r.branchName?.includes('ALPHA'));
  const rBeta = receipts.find((r) => r.branchName?.includes('BETA'));
  const rGamma = receipts.find((r) => r.branchName?.includes('GAMMA'));

  const mutationStrategy = {
    dominantBranch: gammaPct >= alphaPct ? 'GAMMA_BUTTERFLY' : 'ALPHA_HOISTED',
    branches: [
      {
        id: 'alpha',
        name: 'TIMELINE ALPHA · Hoisted Basis Operators',
        shortName: 'α Exploit',
        allocationPct: alphaPct,
        color: '#38BDF8',
        operator: 'Loop-Invariant Basis Hoisting & Unrolled 3x3 Matrix Powers',
        fitness: rAlpha ? Number(rAlpha.fitness).toFixed(4) : '0.8420',
        latencyNs: rAlpha ? Math.round(rAlpha.latencyNs) : 19400,
        passed: rAlpha ? rAlpha.passedGauntlet : true,
      },
      {
        id: 'beta',
        name: 'TIMELINE BETA · Wolfram Rule-30 Perturbation',
        shortName: 'β Chaos',
        allocationPct: betaPct,
        color: '#F0555D',
        operator: 'Aggressive Unitary Gate Pruning (Falsification Stress Probe)',
        fitness: rBeta ? Number(rBeta.fitness).toFixed(4) : '0.0000',
        latencyNs: rBeta ? Math.round(rBeta.latencyNs) : 999999,
        passed: rBeta ? rBeta.passedGauntlet : false,
      },
      {
        id: 'gamma',
        name: 'TIMELINE GAMMA · Bitwise Butterfly + Cayley-Hamilton EP3',
        shortName: 'γ Radical',
        allocationPct: gammaPct,
        color: '#47C686',
        operator: 'Zero-Allocation O(n·2^n) Bitwise Butterfly + H³=0 Nilpotency',
        fitness: rGamma ? Number(rGamma.fitness).toFixed(4) : '1.4860',
        latencyNs: rGamma ? Math.round(rGamma.latencyNs) : 6850,
        passed: rGamma ? rGamma.passedGauntlet : true,
      },
    ],
  };

  // 4. Somatic Marker Badge (Damasio visceral memory bias)
  const bhCount = blackHoles.length;
  const fossilCount = fossils.length;
  const somaticBiasScore = Number(clamp(valence * 0.55 + dominance * 0.35 - frustration * 0.45, -1, 1).toFixed(3));
  const somaticMarker = {
    state:
      somaticBiasScore > 0.35
        ? 'APPROACH_ACCELERATE'
        : somaticBiasScore >= 0.0
        ? 'STEADY_RESONANCE'
        : somaticBiasScore > -0.35
        ? 'CAUTIOUS_VERIFY'
        : 'AVOID_BLACK_HOLE_PRUNE',
    biasScore: somaticBiasScore,
    blackHolesAvoided: bhCount,
    fossilsIndexed: fossilCount,
    orbitsActive: orbits.length,
    description:
      bhCount > 0
        ? `Pre-filtering ${bhCount} rejected SHA-256 Black Hole shard(s) in O(1) before Gauntlet execution`
        : 'Positive visceral marker lock on zero-allocation butterfly synthesis',
  };

  // 5. Dopamine Indicator (Tonic + Phasic RPE)
  const activeFitness = Number(activeGenome?.fitness || 0.4312);
  const expectedFitness = 0.4312;
  const rpeDelta = Number(clamp((activeFitness - expectedFitness) * 0.65 + lastRewardDelta * 0.45, -0.95, 0.98).toFixed(3));
  const tonicLevel = Number(clamp(0.52 + valence * 0.25 + curiosity * 0.18, 0.15, 0.96).toFixed(3));
  const phasicBurst = Number(clamp(0.50 + rpeDelta * 0.50, 0.05, 0.99).toFixed(3));
  const dopamine = {
    rpeDelta,
    tonicLevel,
    phasicBurst,
    pct: Math.round(phasicBurst * 100),
    stateLabel:
      rpeDelta > 0.18
        ? 'PHASIC_REWARD_BURST'
        : rpeDelta >= -0.05
        ? 'TONIC_HOMEOSTATIC_DRIVE'
        : 'RPE_PREDICTION_DIP',
    actualFitness: activeFitness,
    expectedFitness,
  };

  const agentBreakdown = Object.entries(agentCounts).map(([key, item]) => {
    const count = Math.max(1, item.turns);
    return {
      key,
      agent: item.name,
      interactions: item.turns || 1,
      engagement: item.turns ? Math.round(item.engagementSum / count) : 72,
      sentimentPct: item.turns ? Math.round((((item.valenceSum / count) + 1) / 2) * 100) : 68,
    };
  });

  return {
    dominantAffect,
    current: latest,
    modulators: {
      explorationSigma,
      stepSizeEta,
      attentionDepth,
      empatheticBias,
      riskTolerance,
      memoryGravityAlpha,
      epistemicGainGamma,
    },
    emotionRing,
    steeringDials,
    mutationStrategy,
    somaticMarker,
    dopamine,
    timeline,
    agentBreakdown,
  };
}