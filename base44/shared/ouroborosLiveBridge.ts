import {
  PHI,
  GOLDEN_ANGLE,
  EVENT_HORIZON_RADIUS,
} from './ouroborosEngine.ts';

export function deriveSteeringFromEmotion(
  emotionState: any,
  activeGen = 2,
  receipts: any[] = [],
  ledger: any[] = [],
  activeFitness = 0
) {
  const dials = emotionState?.dials || {};
  const emotions = Array.isArray(emotionState?.emotions) ? emotionState.emotions : [];
  const getIntensity = (name: string) => {
    const found = emotions.find((e: any) => String(e?.name || '').toLowerCase() === name);
    return Number(found?.intensity || 0);
  };

  const explorationRate = Number(dials.exploration_rate ?? 0.5);
  const riskBudget = Number(dials.risk_budget ?? 0.41);
  const patience = Number(dials.patience ?? 0.49);
  const curiosity = getIntensity('curiosity');
  const fear = getIntensity('fear');
  const joy = getIntensity('joy');

  const nextGen = activeGen + 1;
  let alphaRuns = 1;
  let betaRuns = 1;
  let gammaRuns = nextGen >= 2 ? 1 : 0;

  if (explorationRate > 0.65 || curiosity > 0.3) {
    gammaRuns += nextGen >= 2 ? 1 : 0;
    betaRuns += 1;
  }
  if (fear > 0.25 || riskBudget < 0.35) {
    alphaRuns += 1;
  }
  if (patience > 0.65 && joy > 0.2) {
    gammaRuns = Math.max(gammaRuns, 1);
  }

  const bestReceipt = receipts.reduce(
    (best, r) => (Number(r?.fitness || 0) > Number(best?.fitness || 0) ? r : best),
    null
  );
  const latestEvent = ledger[0] || null;
  const latestType = String(latestEvent?.eventType || latestEvent?.event_type || '').toUpperCase();
  const superseded = latestType === 'GENOME_SUPERSEDED' || latestType === 'NUCLEUS_SUPERSEDED';
  const delta =
    bestReceipt && Number(bestReceipt.fitness || 0) > activeFitness
      ? Number((Number(bestReceipt.fitness) - activeFitness).toFixed(4))
      : 0.0;

  return {
    exploration_rate: Number(explorationRate.toFixed(4)),
    risk_budget: Number(riskBudget.toFixed(4)),
    patience: Number(patience.toFixed(4)),
    curiosity: Number(curiosity.toFixed(4)),
    fear: Number(fear.toFixed(4)),
    alpha_runs: alphaRuns,
    beta_runs: betaRuns,
    gamma_runs: gammaRuns,
    total_candidates: alphaRuns + betaRuns + gammaRuns,
    improved: superseded || delta > 0,
    fitness_delta: delta,
  };
}

export function normalizeUpstreamState(rawState: any, rawEmotion?: any) {
  if (!rawState || typeof rawState !== 'object') return null;

  const baselineNs = Number(rawState.baselineLatencyNs || rawState.activeGenome?.baseline_latency_ns || 323000);
  const ag = rawState.activeGenome || {};
  const activeHash = String(ag.hash || ag.code_hash || 'genesis');
  const activeGen = Number(ag.gen ?? ag.generation ?? 0);
  const activeFitness = Number(ag.fitness ?? 0);
  const activeSource = String(rawState.activeSource ?? ag.source_code ?? '');
  const estimatedLatencyNs = activeFitness > 0 ? Math.max(1200, Math.round(baselineNs / Math.max(1, activeFitness))) : baselineNs;
  const speedup = activeFitness > 1 ? Number(activeFitness.toFixed(2)) : Number((baselineNs / Math.max(1, estimatedLatencyNs)).toFixed(2));

  const normalizedActiveGenome = {
    ...ag,
    gen: activeGen,
    generation: activeGen,
    hash: activeHash,
    code_hash: activeHash.slice(0, 12),
    full_hash: activeHash,
    fitness: activeFitness,
    importance: Number(ag.importance ?? 1.0),
    radius: Number(ag.radius ?? 0.0),
    theta: Number(ag.theta ?? GOLDEN_ANGLE),
    accessCount: Number(ag.accessCount ?? ag.access_count ?? 1),
    access_count: Number(ag.accessCount ?? ag.access_count ?? 1),
    continuity: Number(ag.continuity ?? 0.515),
    source_code: activeSource,
    baseline_latency_ns: baselineNs,
    latency_ns: estimatedLatencyNs,
    speedup,
    node_kind: 'nucleus',
    branch_origin: ag.branch_origin || (activeGen >= 2 ? 'GAMMA_BICAMERAL' : activeGen === 1 ? 'ALPHA_AST' : 'GENESIS'),
    stages_passed: [true, true, true, true, true],
  };

  const rawOrbits = Array.isArray(rawState.orbits) ? rawState.orbits : [];
  const normalizedOrbits = rawOrbits.map((o: any, idx: number) => {
    const oGen = Number(o.gen ?? o.generation ?? idx);
    const oHash = String(o.hash || o.code_hash || `orbit_${idx}`);
    const isAct = Boolean(o.active || oHash === activeHash || o.node_kind === 'nucleus');
    return {
      ...o,
      id: o.id || `orbit_${oGen}_${oHash.slice(0, 8)}`,
      gen: oGen,
      generation: oGen,
      hash: oHash,
      code_hash: oHash.slice(0, 12),
      fitness: Number(o.fitness ?? 0),
      radius: Number(o.radius ?? 0),
      theta: Number(o.theta ?? ((oGen + 1) * GOLDEN_ANGLE) % (2 * Math.PI)),
      active: isAct,
      node_kind: isAct ? 'nucleus' : (o.node_kind || 'orbit'),
      title: o.title || `Gen ${oGen} Kernel [${oHash.slice(0, 8)}]`,
      access_count: Number(o.accessCount ?? o.access_count ?? 1),
    };
  });

  const fossilCount = Number(rawState.fossilCount ?? (Array.isArray(rawState.fossils) ? rawState.fossils.length : 0));
  const fossils = Array.isArray(rawState.fossils) && rawState.fossils.length > 0
    ? rawState.fossils
    : normalizedOrbits
        .filter((o: any) => !o.active)
        .slice(0, Math.max(fossilCount, 0))
        .map((o: any, i: number) => ({
          ...o,
          id: `fossil_${o.generation}_${i}`,
          node_kind: 'fossil',
          title: `Gen ${o.generation} (.bak Fossil)`,
        }));

  const bhHashes = Array.isArray(rawState.blackHoleHashes) ? rawState.blackHoleHashes : [];
  const blackHoles = Array.isArray(rawState.blackHoles) && rawState.blackHoles.length > 0
    ? rawState.blackHoles
    : bhHashes.map((h: string, i: number) => ({
        id: `bh_${i}_${String(h).slice(0, 8)}`,
        node_kind: 'black_hole',
        code_hash: String(h).slice(0, 12),
        hash: String(h),
        radius: EVENT_HORIZON_RADIUS,
        theta: ((i + 1) * GOLDEN_ANGLE) % (2 * Math.PI),
      }));

  const rawReceipts = Array.isArray(rawState.receipts) ? rawState.receipts : [];
  const receipts = rawReceipts.map((r: any) => {
    const passed = r.passed !== undefined ? Boolean(r.passed) : Boolean(r.passedGauntlet);
    const fit = Number(r.fitness ?? 0);
    const branch = String(r.branch || r.branchName || 'CANDIDATE');
    const hash = String(r.hash || r.codeHash || '').slice(0, 12);
    const latNs = passed && fit > 0 ? Math.max(1200, Math.round(baselineNs / Math.max(1, fit))) : 999999;
    return {
      ...r,
      branch,
      branchName: branch,
      hash,
      codeHash: hash,
      passed,
      passedGauntlet: passed,
      fitness: fit,
      latencyNs: r.latencyNs ?? latNs,
      stages: Array.isArray(r.stages) ? r.stages : passed ? [true, true, true, true, true] : [true, true, false, false, false],
      diagnosticSummary:
        r.diagnosticSummary ||
        (passed
          ? `VERIFIED 5/5 STAGES | ${branch} [${hash}] | Fitness=${fit.toFixed(4)}`
          : `REJECTED IN ARENA | ${branch} [${hash}] -> Sent to Digital Black Hole`),
    };
  });

  const rawLedger = Array.isArray(rawState.ledger) ? rawState.ledger : [];
  const ledger = rawLedger
    .map((e: any) => ({
      ...e,
      id: e.id || `${e.seq}_${e.eventId || e.event_id || ''}`,
      seq: Number(e.seq ?? 0),
      eventId: String(e.eventId || e.event_id || ''),
      event_id: String(e.eventId || e.event_id || ''),
      episodeId: String(e.episodeId || e.episode_id || ''),
      episode_id: String(e.episodeId || e.episode_id || ''),
      eventType: String(e.eventType || e.event_type || 'EVENT'),
      event_type: String(e.eventType || e.event_type || 'EVENT'),
      detail: String(e.detail || ''),
      fitness: Number(e.fitness ?? 0),
    }))
    .sort((a: any, b: any) => (b.seq || 0) - (a.seq || 0));

  const emotionState = rawState.emotionState || rawEmotion || null;
  const emotionSteering =
    rawState.emotionSteering ||
    (emotionState ? deriveSteeringFromEmotion(emotionState, activeGen, receipts, ledger, activeFitness) : null);

  return {
    activeGenome: normalizedActiveGenome,
    activeSource,
    orbits: normalizedOrbits,
    fossils,
    fossilCount: Math.max(fossilCount, fossils.length),
    blackHoles,
    blackHoleCount: Math.max(Number(rawState.blackHoleCount ?? 0), blackHoles.length),
    blackHoleHashes: bhHashes,
    receipts,
    baselineLatencyNs: baselineNs,
    ledger,
    emotionState,
    emotionSteering,
    constants: {
      phi: PHI,
      goldenAngleDeg: 137.507764,
      goldenAngleRad: GOLDEN_ANGLE,
      eventHorizonRadius: EVENT_HORIZON_RADIUS,
    },
  };
}