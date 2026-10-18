// Affective State & Workspace Collaboration Sentiment Engine (VAD + Epistemic Telemetry)

const POSITIVE_TOKENS = [
  'approved', 'passed', 'proven', 'promoted', 'winner', 'minted', 'published',
  'succeeded', 'completed', 'breakthrough', 'recalled', 'locked', 'online', 'spark', 'created'
];
const CHALLENGE_TOKENS = [
  'rejected', 'failed', 'error', 'denied', 'falsified', 'black_hole', 'warning', 'conflict', 'timeout'
];
const CURIOSITY_TOKENS = [
  'explore', 'idea', 'hypothesis', 'experiment', 'research', 'audit', 'quantum', 'synthesize', 'question', 'radar'
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
  const predictionError = clamp(0.18 + (cur * 0.14) + (neg * 0.12), 0.05, 0.95);
  const taskLoad = clamp(0.35 + (pos + neg + cur) * 0.08, 0.15, 0.95);
  const successRate = clamp(0.68 + (pos * 0.07) - (neg * 0.11), 0.15, 0.98);
  const conflictLevel = clamp(neg * 0.22, 0, 0.9);

  return { rewardDelta, predictionError, taskLoad, successRate, conflictLevel };
}

export function computeWorkspaceSentimentTelemetry({
  ledger = [],
  nexusEvents = [],
  chatTurns = [],
  learningLogs = [],
  stimulus = null,
}) {
  // Combine chronological signals across the workspace
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

  // Seed baseline trajectory if workspace has few events
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

  // Evolve VAD + Epistemic state using leaky differential integration:
  // A(t+1) = W_decay * A(t) + (I - W_decay) * tanh(W_stim * S(t))
  let valence = 0.22;
  let arousal = 0.35;
  let dominance = 0.62;
  let curiosity = 0.48;
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

  signals.forEach((sig, idx) => {
    const s = sig.override || scoreTextAffect(sig.text, sig.kind);
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

  // Cognitive Modulators derived from affective state
  const explorationSigma = Number(clamp(0.05 + 0.45 * curiosity + 0.25 * frustration - 0.15 * valence, 0.02, 0.85).toFixed(4));
  const stepSizeEta = Number(clamp(0.10 + 0.35 * arousal * dominance, 0.05, 0.50).toFixed(4));
  const attentionDepth = Math.round(clamp(3 + 8 * arousal + 4 * frustration - 3 * valence, 2, 16));
  const empatheticBias = Number(clamp(0.50 + 0.30 * valence - 0.20 * frustration, 0.10, 0.95).toFixed(4));

  let dominantAffect = 'CALM_HOMEOSTASIS';
  if (frustration > 0.45 && valence < -0.1) dominantAffect = 'FRUSTRATED_REPLANNING';
  else if (curiosity > 0.52 && arousal > 0.42) dominantAffect = 'EPISTEMIC_CURIOSITY_DRIVE';
  else if (valence > 0.32 && dominance > 0.62) dominantAffect = 'CONFIDENT_FLOW_STATE';
  else if (arousal > 0.65 && dominance < 0.4) dominantAffect = 'HIGH_ALERT_CAUTION';

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

  const latest = timeline[timeline.length - 1] || {
    valence: 0.28,
    arousal: 0.42,
    dominance: 0.68,
    curiosity: 0.55,
    frustration: 0.08,
    collaboration: 82,
    engagement: 78,
  };

  return {
    dominantAffect,
    current: latest,
    modulators: {
      explorationSigma,
      stepSizeEta,
      attentionDepth,
      empatheticBias,
    },
    timeline,
    agentBreakdown,
  };
}