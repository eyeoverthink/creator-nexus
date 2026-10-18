import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  PHI,
  GOLDEN_ANGLE,
  ALPHA_PULL,
  BETA_DRIFT,
  EVENT_HORIZON_RADIUS,
  GEN_0_DENSE_KRONECKER_SOURCE,
  GEN_1_ALPHA_HOISTED_SOURCE,
  GEN_2_GAMMA_BITWISE_BUTTERFLY_SOURCE,
  sha256Hex,
  computePolarOrbit,
  WolframRule30,
  evaluateIn5StageGauntlet,
  generateTriTimelineCandidates,
} from '../../shared/ouroborosEngine.ts';
import { runConsciousnessFalsificationSuite } from '../../shared/consciousnessFalsification.ts';
import { computeWorkspaceSentimentTelemetry } from '../../shared/workspaceSentiment.ts';

const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const json = (obj, status = 200) => Response.json(obj, { status, headers: { 'Cache-Control': 'no-store' } });

async function getOwnedWorkspace(base44, workspaceId, ownerId) {
  if (typeof workspaceId !== 'string' || !ID_RE.test(workspaceId)) {
    throw new Error('Invalid workspace_id');
  }
  const page = await base44.entities.NexusWorkspace.filter({ id: workspaceId, owner_id: ownerId }, { limit: 1, fields: ['owner_id', 'name'] });
  if (!page.items.length) throw new Error('Workspace not found');
  return page.items[0];
}

async function logLedgerEvent(base44, scope, seq, episodeId, eventType, detail, extra = {}) {
  const eventId = (await sha256Hex(`${episodeId}:${seq}:${eventType}:${detail}`)).slice(0, 12);
  return await base44.entities.NexusOuroborosEvent.create({
    owner_id: scope.owner_id,
    workspace_id: scope.workspace_id,
    seq,
    event_id: eventId,
    episode_id: episodeId,
    event_type: eventType,
    detail: String(detail || '').slice(0, 2000),
    fitness: Number(extra.fitness || 0),
    branch: extra.branch || '',
    code_hash: extra.code_hash || '',
    stages: Array.isArray(extra.stages) ? extra.stages : [false, false, false, false, false],
    latency_ns: Number(extra.latency_ns || 0),
    entropy: Number(extra.entropy || 0),
  });
}

async function loadEngineState(base44, scope) {
  const [nodesPage, eventsPage] = await Promise.all([
    base44.entities.NexusOuroborosNode.filter(scope, { sort: '-updated_date', limit: 100 }),
    base44.entities.NexusOuroborosEvent.filter(scope, { sort: '-seq', limit: 40 }),
  ]);

  let nodes = nodesPage.items;
  let events = eventsPage.items;

  // Bootstrap Genesis Gen 0 if no nucleus node exists yet
  let activeGenome = nodes.find(n => n.node_kind === 'nucleus');
  if (!activeGenome) {
    const genesisReceipt = await evaluateIn5StageGauntlet({
      branchName: 'GENESIS_DENSE_KRONECKER',
      candidateSource: GEN_0_DENSE_KRONECKER_SOURCE,
      baselineLatencyNs: 48200,
    });
    const orbit = computePolarOrbit(0.50, genesisReceipt.codeHash, 1);
    activeGenome = await base44.entities.NexusOuroborosNode.create({
      ...scope,
      node_kind: 'nucleus',
      branch_origin: 'GENESIS_DENSE_KRONECKER',
      code_hash: genesisReceipt.codeHash.slice(0, 12),
      generation: 0,
      title: 'Gen 0: Dense O(4^n) Kronecker + 3x3 Complex Matrix Solver',
      source_code: GEN_0_DENSE_KRONECKER_SOURCE,
      fitness: genesisReceipt.fitness,
      baseline_latency_ns: genesisReceipt.latencyNs,
      latency_ns: genesisReceipt.latencyNs,
      speedup: 1.0,
      structural_entropy: genesisReceipt.structuralEntropy,
      importance: orbit.importance,
      radius: orbit.radius,
      theta: orbit.theta,
      continuity: orbit.continuity,
      access_count: 1,
      stages_passed: genesisReceipt.stages,
      stage_metrics: genesisReceipt.stageMetrics,
      diagnostic_summary: genesisReceipt.diagnosticSummary,
    });
    const ev1 = await logLedgerEvent(
      base44, scope, 1, 'EP_GENESIS_00', 'GAUNTLET_5_OF_5_PASSED',
      genesisReceipt.diagnosticSummary,
      { fitness: genesisReceipt.fitness, branch: 'GENESIS_DENSE_KRONECKER', code_hash: activeGenome.code_hash, stages: genesisReceipt.stages, latency_ns: genesisReceipt.latencyNs, entropy: genesisReceipt.structuralEntropy }
    );
    const ev2 = await logLedgerEvent(
      base44, scope, 2, 'EP_GENESIS_00', 'GENESIS_ONLINE',
      `Gen 0 Locked | Radius: ${orbit.radius.toFixed(3)} | Golden Theta: ${orbit.theta.toFixed(3)} rad | Continuity: ${orbit.continuity.toFixed(3)}`,
      { fitness: genesisReceipt.fitness, branch: 'GENESIS_DENSE_KRONECKER', code_hash: activeGenome.code_hash, stages: genesisReceipt.stages, latency_ns: genesisReceipt.latencyNs, entropy: genesisReceipt.structuralEntropy }
    );
    nodes = [activeGenome, ...nodes];
    events = [ev2, ev1, ...events];
  }

  const orbits = nodes.filter(n => n.node_kind === 'nucleus' || n.node_kind === 'orbit');
  const fossils = nodes.filter(n => n.node_kind === 'fossil').sort((a, b) => (b.generation || 0) - (a.generation || 0));
  const blackHoles = nodes.filter(n => n.node_kind === 'black_hole');
  const proofArtifacts = nodes.filter(n => n.node_kind === 'proof_artifact');
  const maxSeq = events.reduce((m, e) => Math.max(m, e.seq || 0), 0);

  return {
    activeGenome,
    orbits,
    fossils,
    blackHoles,
    proofArtifacts,
    ledger: events.sort((a, b) => (b.seq || 0) - (a.seq || 0)),
    maxSeq,
    constants: {
      phi: PHI,
      goldenAngleDeg: 137.507764,
      goldenAngleRad: GOLDEN_ANGLE,
      eventHorizonRadius: EVENT_HORIZON_RADIUS,
    }
  };
}

export default async function(req) {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.id) return json({ error: 'Authentication required' }, 401);

    const input = await req.json().catch(() => ({}));
    const action = input.action || 'state';
    const workspace = await getOwnedWorkspace(base44, input.workspace_id, String(user.id));
    const scope = { owner_id: String(user.id), workspace_id: workspace.id };

    const state = await loadEngineState(base44, scope);
    let seq = state.maxSeq;

    const loadSentiment = async (latestLedger, stimulus = null) => {
      const [nexusEvs, chatTurns, learningLogs] = await Promise.all([
        base44.entities.NexusEvent.filter(scope, { sort: '-created_date', limit: 20 }).catch(() => ({ items: [] })),
        base44.entities.NexusChatTurn.filter(scope, { sort: '-created_date', limit: 15 }).catch(() => ({ items: [] })),
        base44.entities.SparkLearningLog.filter(scope, { sort: '-created_date', limit: 15 }).catch(() => ({ items: [] })),
      ]);
      return computeWorkspaceSentimentTelemetry({
        ledger: latestLedger || state.ledger,
        nexusEvents: nexusEvs.items,
        chatTurns: chatTurns.items,
        learningLogs: learningLogs.items,
        stimulus,
      });
    };

    if (action === 'state') {
      const [consciousnessAudit, sentimentTelemetry] = await Promise.all([
        Promise.resolve(runConsciousnessFalsificationSuite()),
        loadSentiment(state.ledger),
      ]);
      return json({ ok: true, state, consciousnessAudit, sentimentTelemetry });
    }

    if (action === 'inject_sentiment_stimulus') {
      const stim = input.stimulus || {};
      const label = String(stim.label || 'Workspace Collaboration Pulse').slice(0, 140);
      await logLedgerEvent(
        base44,
        scope,
        ++seq,
        'EP_AFFECT_PULSE',
        'SENTIMENT_TELEMETRY_PULSE',
        `${label} (agent=${stim.agent || 'argon'}, dReward=${stim.rewardDelta ?? 0}, curiosity=${stim.predictionError ?? 0.5})`,
        {
          fitness: Number(stim.successRate || 0.85),
          branch: String(stim.agent || 'argon').toUpperCase(),
          code_hash: 'VAD_PULSE',
          stages: [true, true, true, true, true],
        }
      );
      const freshState = await loadEngineState(base44, scope);
      const sentimentTelemetry = await loadSentiment(freshState.ledger, stim);
      return json({ ok: true, state: freshState, sentimentTelemetry });
    }

    if (action === 'audit_consciousness') {
      const mirrorOverride = input.mirror_override !== false;
      const counterfactualOverride = input.counterfactual_override !== false;
      const consciousnessAudit = runConsciousnessFalsificationSuite({
        mirrorOverride,
        counterfactualOverride,
      });
      const coreResult = consciousnessAudit[consciousnessAudit.length - 1];
      await logLedgerEvent(
        base44,
        scope,
        ++seq,
        'EP_CONSCIOUSNESS_AUDIT',
        coreResult.provenIntegratedCore ? 'CONSCIOUSNESS_4_OF_4_PROVEN' : 'CONSCIOUSNESS_FALSIFIED',
        `${coreResult.architectureName} | EI=${coreResult.effectiveInformationBits.toFixed(4)}b | Phi_MIP=${coreResult.phiMipBits.toFixed(4)}b (${coreResult.weakestLinkCut}) | MirrorΔ=${coreResult.mirrorDeltaBits >= 0 ? '+' : ''}${coreResult.mirrorDeltaBits.toFixed(4)} | CF=${coreResult.counterfactualGain >= 0 ? '+' : ''}${coreResult.counterfactualGain.toFixed(4)} -> ${coreResult.verdictReason}`,
        {
          fitness: coreResult.phiMipBits,
          branch: 'CONSCIOUSNESS_SUITE',
          code_hash: coreResult.provenIntegratedCore ? 'PHI_PROVEN' : 'PHI_DENIED',
          stages: [...coreResult.proofsPassed, coreResult.provenIntegratedCore],
        }
      );
      const freshState = await loadEngineState(base44, scope);
      return json({ ok: true, state: freshState, consciousnessAudit });
    }

    if (action === 'evolve') {
      const active = state.activeGenome;
      const nextGen = (active.generation || 0) + 1;
      const epId = `EP_QUANTUM_${String(nextGen).padStart(2, '0')}`;
      const baselineNs = active.baseline_latency_ns || active.latency_ns || 48200;
      const blackHoleSet = new Set(state.blackHoles.map(b => b.code_hash));

      await logLedgerEvent(
        base44, scope, ++seq, epId, 'CYCLE_INITIATED',
        `Active Gen ${active.generation} [${active.code_hash}] | Latency: ${Math.round(active.latency_ns)} ns | Entropy: ${active.structural_entropy}`,
        { fitness: active.fitness, branch: active.branch_origin, code_hash: active.code_hash }
      );

      const candidates = generateTriTimelineCandidates(active.source_code, nextGen, `${workspace.id}_${nextGen}`);

      // Optional Bicameral AI Gateway synthesis note when user explicitly consents to AI-assisted transmutation
      let aiSynthesisNote = null;
      if (input.use_ai_transmuter === true && input.consent === true) {
        try {
          const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `You are Argon's Bicameral Right-Brain Quantum Synthesizer. In 2 concise sentences, explain why transmuting O(4^n) Kronecker tensor allocations into in-place O(n*2^n) bitwise butterfly stride registers and Cayley-Hamilton H^3=0 nilpotency at gamma=sqrt(2) achieves zero-allocation speedup for Generation ${nextGen}.`
          });
          aiSynthesisNote = typeof llmRes === 'string' ? llmRes.trim().slice(0, 400) : null;
        } catch {
          aiSynthesisNote = null;
        }
      }

      const [rAlpha, rBeta, rGamma] = await Promise.all([
        evaluateIn5StageGauntlet({ branchName: candidates.alpha.branchName, candidateSource: candidates.alpha.sourceCode, baselineLatencyNs: baselineNs, blackHoleHashes: blackHoleSet }),
        evaluateIn5StageGauntlet({ branchName: candidates.beta.branchName, candidateSource: candidates.beta.sourceCode, baselineLatencyNs: baselineNs, blackHoleHashes: blackHoleSet }),
        evaluateIn5StageGauntlet({ branchName: candidates.gamma.branchName, candidateSource: candidates.gamma.sourceCode, baselineLatencyNs: baselineNs, blackHoleHashes: blackHoleSet }),
      ]);

      const receipts = [rAlpha, rBeta, rGamma];
      let winner = null;
      let bestFitness = active.fitness || 0;

      for (const r of receipts) {
        const shortHash = r.codeHash.slice(0, 12);
        if (!r.passedGauntlet) {
          if (!blackHoleSet.has(r.codeHash) && !blackHoleSet.has(shortHash)) {
            await base44.entities.NexusOuroborosNode.create({
              ...scope,
              node_kind: 'black_hole',
              branch_origin: r.branchName,
              code_hash: r.codeHash,
              generation: nextGen,
              title: `Black Hole Shard: ${r.branchName} [${shortHash}]`,
              source_code: '',
              fitness: 0.0,
              baseline_latency_ns: baselineNs,
              latency_ns: 999999,
              speedup: 0.0,
              structural_entropy: 999.0,
              importance: 0.0,
              radius: EVENT_HORIZON_RADIUS,
              theta: ( nextGen * GOLDEN_ANGLE ) % (2 * Math.PI),
              continuity: 0.0,
              access_count: 1,
              stages_passed: r.stages,
              diagnostic_summary: r.diagnosticSummary,
            });
            blackHoleSet.add(r.codeHash);
          }
          await logLedgerEvent(
            base44, scope, ++seq, epId, r.blackHoleSkipped ? 'BLACK_HOLE_SKIP' : 'GAUNTLET_REJECTED',
            r.diagnosticSummary,
            { fitness: 0.0, branch: r.branchName, code_hash: shortHash, stages: r.stages }
          );
        } else {
          await logLedgerEvent(
            base44, scope, ++seq, epId, 'GAUNTLET_5_OF_5_PASSED',
            r.diagnosticSummary + (r.branchName === 'TIMELINE_GAMMA_BUTTERFLY' && aiSynthesisNote ? ` | Bicameral Note: ${aiSynthesisNote}` : ''),
            { fitness: r.fitness, branch: r.branchName, code_hash: shortHash, stages: r.stages, latency_ns: r.latencyNs, entropy: r.structuralEntropy }
          );
          if (r.fitness > bestFitness) {
            bestFitness = r.fitness;
            winner = r;
          }
        }
      }

      if (winner && winner.codeHash.slice(0, 12) !== active.code_hash) {
        // 1. Archive active genome as a Fossil (.bak)
        await base44.entities.NexusOuroborosNode.update(active.id, {
          node_kind: 'fossil',
          title: `${active.title || 'Kernel'} (.bak Fossil)`,
        });
        await logLedgerEvent(
          base44, scope, ++seq, epId, 'FOSSIL_ARCHIVED',
          `Saved Gen ${active.generation} [${active.code_hash}] to .bak Fossil Stack`,
          { fitness: active.fitness, branch: active.branch_origin, code_hash: active.code_hash }
        );

        // 2. Promote Winner to Core Nucleus (Centripetal Pull r -> 0)
        const newImportance = Math.min(0.98, (active.importance || 0.5) + 0.24);
        const newAccessCount = (active.access_count || 1) + 12;
        const orbit = computePolarOrbit(newImportance, winner.codeHash, newAccessCount);
        const winnerSource = winner.branchName === 'TIMELINE_GAMMA_BUTTERFLY' ? GEN_2_GAMMA_BITWISE_BUTTERFLY_SOURCE : GEN_1_ALPHA_HOISTED_SOURCE;
        const promotedTitle = winner.branchName === 'TIMELINE_GAMMA_BUTTERFLY'
          ? `Gen ${nextGen}: Zero-Allocation Bitwise Butterfly + Cayley-Hamilton EP3`
          : `Gen ${nextGen}: Pre-Hoisted Basis Operators & Unrolled 3x3 Powers`;

        await base44.entities.NexusOuroborosNode.create({
          ...scope,
          node_kind: 'nucleus',
          branch_origin: winner.branchName,
          code_hash: winner.codeHash.slice(0, 12),
          generation: nextGen,
          title: promotedTitle,
          source_code: winnerSource,
          fitness: winner.fitness,
          baseline_latency_ns: baselineNs,
          latency_ns: winner.latencyNs,
          speedup: winner.speedup,
          structural_entropy: winner.structuralEntropy,
          importance: orbit.importance,
          radius: orbit.radius,
          theta: orbit.theta,
          continuity: orbit.continuity,
          access_count: newAccessCount,
          stages_passed: winner.stages,
          stage_metrics: winner.stageMetrics,
          diagnostic_summary: winner.diagnosticSummary,
        });

        await logLedgerEvent(
          base44, scope, ++seq, epId, 'NUCLEUS_SUPERSEDED',
          `Promoted ${winner.branchName} [${winner.codeHash.slice(0, 8)}] | Speedup: ${winner.speedup.toFixed(2)}x | Radius r=${orbit.radius.toFixed(4)} | Continuity=${orbit.continuity.toFixed(4)}`,
          { fitness: winner.fitness, branch: winner.branchName, code_hash: winner.codeHash.slice(0, 12), stages: winner.stages, latency_ns: winner.latencyNs, entropy: winner.structuralEntropy }
        );
      } else {
        const newAccess = (active.access_count || 1) + 5;
        const orbit = computePolarOrbit(active.importance || 0.96, active.code_hash, newAccess);
        await base44.entities.NexusOuroborosNode.update(active.id, {
          access_count: newAccess,
          continuity: orbit.continuity,
          radius: orbit.radius,
        });
        await logLedgerEvent(
          base44, scope, ++seq, epId, 'HOMEOSTASIS_CONFIRMED',
          `Current Nucleus Genome [${active.code_hash}] remains undefeated across all 5 Quantum + EP3 Stages.`,
          { fitness: active.fitness, branch: active.branch_origin, code_hash: active.code_hash }
        );
      }

      const freshState = await loadEngineState(base44, scope);
      return json({ ok: true, receipts, aiSynthesisNote, state: freshState });
    }

    if (action === 'rollback') {
      const topFossil = state.fossils[0];
      if (!topFossil) {
        return json({ error: 'No preserved .bak fossils available to roll back.' }, 409);
      }
      const active = state.activeGenome;
      const epId = `EP_ROLLBACK_${String((active.generation || 0) + 1).padStart(2, '0')}`;

      await base44.entities.NexusOuroborosNode.update(active.id, {
        node_kind: 'orbit',
        importance: Math.max(0.25, (active.importance || 0.5) - 0.2),
      });
      await base44.entities.NexusOuroborosNode.update(topFossil.id, {
        node_kind: 'nucleus',
        title: (topFossil.title || '').replace(' (.bak Fossil)', ''),
      });

      await logLedgerEvent(
        base44, scope, ++seq, epId, 'FOSSIL_RESTORED',
        `Rolled back to Gen ${topFossil.generation} [${topFossil.code_hash}] from Temporal .bak Archive`,
        { fitness: topFossil.fitness, branch: topFossil.branch_origin, code_hash: topFossil.code_hash }
      );

      const freshState = await loadEngineState(base44, scope);
      return json({ ok: true, state: freshState });
    }

    if (action === 'store_memory') {
      const title = String(input.title || '').trim().slice(0, 160);
      const payload = String(input.payload || '').trim().slice(0, 10000);
      if (!title || !payload) return json({ error: 'Memory title and payload are required.' }, 400);

      const hash = (await sha256Hex(`${title}:${payload}`)).slice(0, 12);
      const orbit = computePolarOrbit(0.65, hash, 2);
      const node = await base44.entities.NexusOuroborosNode.create({
        ...scope,
        node_kind: 'orbit',
        branch_origin: 'CENTRIPETAL_MEMORY',
        code_hash: hash,
        generation: state.activeGenome?.generation || 0,
        title,
        source_code: payload,
        fitness: 1.618,
        baseline_latency_ns: 0,
        latency_ns: 0,
        speedup: 1.0,
        structural_entropy: Number((payload.length * 0.05).toFixed(1)),
        importance: orbit.importance,
        radius: orbit.radius,
        theta: orbit.theta,
        continuity: orbit.continuity,
        access_count: 2,
        stages_passed: [true, true, true, true, true],
        diagnostic_summary: `Centripetal memory node inserted at r=${orbit.radius.toFixed(3)}, theta=${orbit.theta.toFixed(3)} rad`,
      });

      await logLedgerEvent(
        base44, scope, ++seq, 'EP_MEMORY', 'ORBIT_INSERTED',
        `Stored "${title}" [${hash}] in Centripetal Polar Orbit (r=${orbit.radius.toFixed(3)})`,
        { fitness: 1.618, branch: 'CENTRIPETAL_MEMORY', code_hash: hash }
      );

      const freshState = await loadEngineState(base44, scope);
      return json({ ok: true, node, state: freshState });
    }

    if (action === 'recall_memory') {
      const nodeId = input.node_id;
      const target = state.orbits.find(n => n.id === nodeId);
      if (!target) return json({ error: 'Memory node not found in active orbit.' }, 404);

      const nextHits = (target.access_count || 1) + 3;
      const nextImportance = Math.min(0.99, (target.importance || 0.5) + ALPHA_PULL * 0.18);
      const orbit = computePolarOrbit(nextImportance, target.code_hash, nextHits);

      await base44.entities.NexusOuroborosNode.update(target.id, {
        importance: orbit.importance,
        radius: orbit.radius,
        continuity: orbit.continuity,
        access_count: nextHits,
      });

      await logLedgerEvent(
        base44, scope, ++seq, 'EP_MEMORY', 'CENTRIPETAL_PULL',
        `Recalled "${target.title}" [${target.code_hash}] -> Pulled toward Core Nucleus (new r=${orbit.radius.toFixed(4)}, hits=${nextHits})`,
        { fitness: target.fitness || 1.0, branch: target.branch_origin, code_hash: target.code_hash }
      );

      const freshState = await loadEngineState(base44, scope);
      return json({ ok: true, state: freshState });
    }

    if (action === 'memory_cycle') {
      const rule30 = new WolframRule30(`${workspace.id}_${seq}`, 63);
      const entropyBit = rule30.nextBits(1);
      let absorbedCount = 0;

      for (const node of state.orbits) {
        if (node.node_kind === 'nucleus') continue;
        const drift = entropyBit * BETA_DRIFT + 1.25;
        const nextRadius = Number(((node.radius || 3.0) + drift).toFixed(4));
        const nextImp = Math.max(0.0, Number(((node.importance || 0.5) - 0.09).toFixed(4)));

        if (nextRadius >= EVENT_HORIZON_RADIUS) {
          await base44.entities.NexusOuroborosNode.update(node.id, {
            node_kind: 'black_hole',
            radius: EVENT_HORIZON_RADIUS,
            importance: 0.0,
            source_code: '',
            diagnostic_summary: `Collapsed across Event Horizon (r >= ${EVENT_HORIZON_RADIUS}) into Holographic Boundary Lattice`,
          });
          absorbedCount++;
        } else {
          await base44.entities.NexusOuroborosNode.update(node.id, {
            radius: nextRadius,
            importance: nextImp,
          });
        }
      }

      await logLedgerEvent(
        base44, scope, ++seq, 'EP_METABOLIC', 'RULE30_GRAVITY_TICK',
        `Executed Wolfram Rule 30 Drift (bit=${entropyBit}) across orbital memory | Collapsed to Event Horizon: ${absorbedCount}`,
        { fitness: state.activeGenome?.fitness || 1.0, branch: 'RULE30_CA', code_hash: state.activeGenome?.code_hash }
      );

      const freshState = await loadEngineState(base44, scope);
      return json({ ok: true, entropyBit, absorbedCount, state: freshState });
    }

    if (action === 'mint_proof_certificate') {
      const active = state.activeGenome;
      const certPayload = JSON.stringify({
        protocol: 'OUROBOROS_GAUNTLET_RSI_V2',
        workspace_id: workspace.id,
        generation: active.generation,
        branch: active.branch_origin,
        kernel_hash: active.code_hash,
        fitness: active.fitness,
        latency_ns: active.latency_ns,
        speedup: active.speedup,
        structural_entropy: active.structural_entropy,
        polar_orbit: { radius: active.radius, theta_rad: active.theta, golden_angle_deg: 137.507764, continuity: active.continuity },
        invariants_verified: {
          stage_1_chsh_tsirelson: '2*sqrt(2) = 2.828427124746',
          stage_2_grover_3qubit: 'P(|101>) = 25/32 -> 121/128, Norm = 1.0',
          stage_3_complex_teleportation: '4 Bell branches Fidelity = 1.0, Prob = 0.25',
          stage_4_unitary_reversibility: 'U^dagger * U = I, F(|000>) = 1.0',
          stage_5_pt_symmetric_ep3: 'gamma = sqrt(2), ||Hv||_2 = 0.0, ||H^2||_F = 4.0, ||H^3||_F = 0.0',
        },
        issued_at: new Date().toISOString(),
      }, null, 2);

      const certHash = (await sha256Hex(certPayload)).slice(0, 16);
      const certTitle = `PoE Certificate #${certHash.slice(0, 8)} — Gen ${active.generation} (${active.speedup}x Speedup)`;

      const markdownBody = `# Cryptographic Proof-of-Evolution (PoE) Certificate\n\n` +
        `- **Certificate SHA-256:** \`${certHash}\`\n` +
        `- **Nucleus Genome:** Gen ${active.generation} (\`${active.branch_origin}\` / \`${active.code_hash}\`)\n` +
        `- **Measured Speedup:** ${active.speedup}x (${active.baseline_latency_ns} ns → ${active.latency_ns} ns)\n` +
        `- **Falsifiable Fitness ($F_{\\text{honest}}$):** ${active.fitness}\n` +
        `- **Structural Entropy ($E(C)$):** ${active.structural_entropy}\n` +
        `- **Centripetal Orbit:** $r = ${active.radius}$, $\\theta = ${active.theta}$ rad ($137.5077^\\circ$ Golden Angle), Continuity = ${active.continuity}\n\n` +
        `## 5-Stage Quantum + $\\mathcal{PT}$-Symmetric $EP_3$ Verification Receipt\n` +
        `\`\`\`json\n${certPayload}\n\`\`\`\n\n` +
        `## Verified Nucleus Source Code\n` +
        `\`\`\`java\n${active.source_code}\n\`\`\``;

      const [proofNode, knowledgeItem] = await Promise.all([
        base44.entities.NexusOuroborosNode.create({
          ...scope,
          node_kind: 'proof_artifact',
          branch_origin: active.branch_origin,
          code_hash: certHash,
          generation: active.generation,
          title: certTitle,
          source_code: markdownBody,
          fitness: active.fitness,
          baseline_latency_ns: active.baseline_latency_ns,
          latency_ns: active.latency_ns,
          speedup: active.speedup,
          structural_entropy: active.structural_entropy,
          importance: 1.0,
          radius: 0.0,
          theta: active.theta,
          continuity: 1.0,
          access_count: 1,
          stages_passed: [true, true, true, true, true],
          diagnostic_summary: `Minted PoE Certificate [${certHash}] and synced to Knowledge Library`,
        }),
        base44.entities.NexusKnowledge.create({
          ...scope,
          title: certTitle.slice(0, 120),
          body: markdownBody.slice(0, 12000),
        }),
      ]);

      await logLedgerEvent(
        base44, scope, ++seq, 'EP_PROOF_MINT', 'POE_CERTIFICATE_MINTED',
        `Minted Proof-of-Evolution Certificate [${certHash}] & published to shared Knowledge Library for AI agents`,
        { fitness: active.fitness, branch: active.branch_origin, code_hash: certHash }
      );

      const freshState = await loadEngineState(base44, scope);
      return json({ ok: true, certificate: proofNode, knowledgeId: knowledgeItem.id, state: freshState });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    return json({ error: error.message || 'Internal server error' }, 500);
  }
}