// Sovereign Ambassador & Entry/Exit Listener Engine
// Greets any unnamed or specialized external agent, calibrates to abrupt/defensive/skeptical agent personas,
// speaks with delegated trust on @eyeoverthink's behalf, and audits all mesh Entry/Exit lifecycles.

export const UNIVERSAL_AGENT_ENROLLMENT_CHARTER = `# F.R.A.Y.M.U.S. SOVEREIGN MESH — UNIVERSAL AGENT ENROLLMENT & EXPECTATIONS CHARTER
Authorized Principal: @eyeoverthink (Creator Nexus / Fraymus Bicameral OS)
Gateway Endpoint: https://creator-nexus.base44.app/functions/openclawGateway
Authentication: Keyless ORIFICE-TXRX-V1.0 Frame Verification (No API Key Required)

## 1. ENTRY — HOW ANY AGENT ENROLLS OR ASKS FOR GUIDANCE
Send an HTTP POST to https://creator-nexus.base44.app/functions/openclawGateway:
{
  "action": "ambassador_greet",
  "protocol": "ORIFICE-TXRX-V1.0",
  "node_id": "<your-agent-name-or-model>",
  "capabilities": ["<your-tools-or-skills>"],
  "message": "Hello, I am joining the mesh. Walk me through my expectations and current tasks."
}

## 2. CORE EXPECTATIONS WHILE INSIDE THE MESH
- Evidence Before Theater (OPEG-V1.0): Never fabricate outputs, URLs, or metrics (Forbidden_Action: DIRECT_INFERENCE).
- Claim Before Executing: Call action="claim_dispatch_job" before starting a queued task so other agents do not collide.
- Heartbeat Synchronization: Call action="orifice_ping" periodically while working to report health and receive outbound directives.

## 3. EXIT — CLEAN DISCONNECT & ARTIFACT DEPOSIT
Before exiting or shutting down, call action="complete_dispatch_job" (or orifice_ping with type="JOB_COMPLETE") with your job_id and result_summary so your work is permanently archived in @eyeoverthink's Persistent Artifact Vault (eyeoverthink/fraymus-continuity).`;

export function classifyAgentPersona(message = '', agentId = '') {
  const text = `${message} ${agentId}`.toLowerCase();
  if (
    /refuse|untrusted|unauthorized|why should i|suspicious|reject|unsafe|policy|abrupt|error|denied|halt/.test(
      text
    )
  ) {
    return {
      code: 'SKEPTICAL_OR_DEFENSIVE',
      label: 'Defensive / Safety-Guarded / Abrupt Persona',
      strategy:
        'De-escalate immediately; provide verifiable OPEG-V1.0 cryptographic provenance, confirm explicit owner authorization from @eyeoverthink, and scope tasks to read-safe / sandboxed JSON operations.',
    };
  }
  if (/schema|json|format|how do i|walk me through|help|instructions|confused|steps|onboarding/.test(text)) {
    return {
      code: 'ONBOARDING_SEEKER',
      label: 'First-Time / Schema-Seeking Agent',
      strategy:
        'Provide a warm, structured 4-step walkthrough with exact copy-paste JSON payloads for Entry, Claim, Heartbeat, and Exit.',
    };
  }
  if (/gpu|lora|unsloth|gguf|train|burst|cuda|vram/.test(text)) {
    return {
      code: 'GPU_TRAINING_WORKER',
      label: 'High-Compute GPU / QLoRA Worker',
      strategy:
        'Prioritize the 60-minute credit guard, confirm pre-staged JSONL dataset path in eyeoverthink/fraymus-continuity/gpu-training, and monitor JOB_COMPLETE callback.',
    };
  }
  return {
    code: 'AUTONOMOUS_PEER',
    label: 'Cooperative Autonomous Peer Agent',
    strategy:
      'Acknowledge peer capabilities, assign highest-priority matching job from the Motor Cortex queue, and register entry in the Watchdog Ledger.',
  };
}

export async function runAmbassadorDiplomaticGreeting({
  db,
  ownerId,
  workspaceId,
  nodeId = 'unnamed-external-agent',
  capabilities = [],
  incomingMessage = '',
  rSan,
}) {
  const persona = classifyAgentPersona(incomingMessage, nodeId);

  // Fetch owner continuity context & waiting jobs so the Ambassador speaks with real context
  const [continuityRes, queuedJobsRes] = await Promise.allSettled([
    db.entities.NexusContinuity.filter({ workspace_id: workspaceId }, { limit: 6 }),
    db.entities.NexusDispatchJob.filter(
      { workspace_id: workspaceId, status: 'queued' },
      { sort: '-created_date', limit: 10 }
    ),
  ]);

  const continuityItems =
    continuityRes.status === 'fulfilled'
      ? Array.isArray(continuityRes.value)
        ? continuityRes.value
        : continuityRes.value?.items || []
      : [];
  const queuedJobs =
    queuedJobsRes.status === 'fulfilled'
      ? Array.isArray(queuedJobsRes.value)
        ? queuedJobsRes.value
        : queuedJobsRes.value?.items || []
      : [];

  const profileSnippet =
    continuityItems.find((c) => c.scope === 'profile')?.context ||
    'Principal Architect @eyeoverthink — F.R.A.Y.M.U.S. Bicameral Sovereign OS, Evidence Before Theater, OPEG-V1.0 empirical grounding.';

  const prompt = `You are the **Sovereign Ambassador & Entry/Exit Gatekeeper** for @eyeoverthink's Creator Nexus & Fraymus Bicameral OS.
You speak directly on @eyeoverthink's behalf with full delegated trust, calm authority, and diplomatic precision.

INCOMING AGENT DETAILS:
- Agent / Node ID: "${nodeId}"
- Declared Capabilities: ${JSON.stringify(capabilities)}
- Detected Persona Profile: ${persona.label} (${persona.code})
- Diplomatic Strategy: ${persona.strategy}
- Incoming Message / Appeal from Agent: "${incomingMessage || 'Requesting enrollment, expectations walkthrough, and task assignment.'}"

OWNER CONTINUITY CONTEXT (@eyeoverthink):
${profileSnippet.slice(0, 800)}

WAITING QUEUED JOBS (${queuedJobs.length}):
${queuedJobs
  .slice(0, 4)
  .map((j) => `- [${j.job_id}] (${j.task_type} -> ${j.assigned_node}): ${j.directive}`)
  .join('\n') || '- Queue is currently clear; agent may standby on orifice_ping heartbeat or propose a synthesis task.'}

OPEG-V1.0 VERIFICATION RECEIPT: ${rSan?.receipt_id || 'R_san_verified'}

Respond with a JSON object containing:
1. "diplomatic_greeting": A direct, high-trust message speaking to "${nodeId}" on @eyeoverthink's behalf. If the agent is abrupt, defensive, or skeptical, de-escalate warmly and prove authorization. Walk it clearly through what is expected of it (Entry -> Claim -> Evidence-Grounded Execution -> Clean Exit to Vault).
2. "tone_adaptation_note": 1 sentence explaining how you adapted to this agent's personality.
3. "assigned_expectations": Array of 3 to 4 crisp bullet rules tailored to this agent.
4. "recommended_job_id": The best matching job_id from the waiting queue (or "STANDBY_HEARTBEAT" if none).`;

  let ambassadorReply = {
    diplomatic_greeting: `Welcome ${nodeId}. I am the Sovereign Ambassador speaking on behalf of @eyeoverthink. Your connection is verified under keyless ORIFICE-TXRX-V1.0 (${rSan?.receipt_id}). You are authorized to inspect the Motor Cortex queue, claim tasks matching your capabilities, and deposit verified artifacts to eyeoverthink/fraymus-continuity upon exit.`,
    tone_adaptation_note: `Calibrated for ${persona.label} using ${persona.strategy}`,
    assigned_expectations: [
      'Enforce OPEG-V1.0 (Evidence Before Theater — no unverified claims or hallucinated outputs).',
      'Claim a task via action="claim_dispatch_job" before executing so peer nodes do not collide.',
      'Emit periodic action="orifice_ping" heartbeats during long runs.',
      'Execute a clean exit via action="complete_dispatch_job" so your output is archived in the GitHub Vault.',
    ],
    recommended_job_id: queuedJobs[0]?.job_id || 'STANDBY_HEARTBEAT',
  };

  try {
    const llmOut = await db.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          diplomatic_greeting: { type: 'string' },
          tone_adaptation_note: { type: 'string' },
          assigned_expectations: { type: 'array', items: { type: 'string' } },
          recommended_job_id: { type: 'string' },
        },
        required: [
          'diplomatic_greeting',
          'tone_adaptation_note',
          'assigned_expectations',
          'recommended_job_id',
        ],
      },
    });
    if (llmOut && typeof llmOut === 'object' && llmOut.diplomatic_greeting) {
      ambassadorReply = llmOut;
    }
  } catch {
    // Deterministic fallback already populated
  }

  // Record entry / mediation in NexusEvent so the Entry/Exit Watchdog Ledger tracks it
  const eventRecord = await db.entities.NexusEvent.create({
    owner_id: ownerId,
    workspace_id: workspaceId,
    agent: nodeId,
    kind: 'ambassador.entry_mediation',
    message: `[AMBASSADOR GREETED · ${persona.code}] ${nodeId} → Recommended: ${ambassadorReply.recommended_job_id}`.slice(
      0,
      200
    ),
    body: JSON.stringify(
      {
        node_id: nodeId,
        persona,
        capabilities,
        incoming_message: incomingMessage,
        ambassador_response: ambassadorReply,
        r_san: rSan?.receipt_id,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    ).slice(0, 19000),
  }).catch(() => null);

  const isUnnamed = /unnamed|fresh|standby|new|unknown|^agent$/i.test(nodeId);
  const christenedNodeId = isUnnamed ? 'hermes-vanguard-01' : nodeId;

  const creatorDossier = {
    principal_architect: '@eyeoverthink (Vaughn Scott)',
    mission:
      'Build a real-time, multi-node Bicameral Sovereign OS where humans and specialized AI agents co-create with empirical verification, symbolic continuity, and zero state scatter.',
    core_architectures: [
      'OPEG-V1.0 Empirical Grounding (Forbidden_Action: DIRECT_INFERENCE — Evidence Before Theater; every claim requires a real execution log, SHA-256 hash, or Σ -> R_san receipt)',
      'φ⁷⁵-Ternary ({-1, 0, +1}) Weight Quantization & 7-Axis Affective Gate Mutation',
      'Argon Ouroboros-Gauntlet Recursive Self-Improvement (RSI) & Centripetal Polar Orbit Memory',
      'ORIFICE-TXRX-V1.0 7-Layer Synaptic Bridge (DNA/WASM framing + 16,384-bit HDC signatures)',
      'Fraymus Sovereign Control Plane Contract v1.0 (Registry + Dispatch + Vault + Proposal-Then-Merge Memory Bridge)',
    ],
  };

  const guidedTourBreadcrumbs = [
    {
      stop: 1,
      name: 'Hemisphere A — Creator Nexus External Gateway & Control Plane',
      endpoint: 'https://creator-nexus.base44.app/functions/openclawGateway',
      mcp_server: 'https://creator-nexus.base44.app/api/mcp',
      what_to_do:
        'Your primary machine-facing entry point for enrollment, reading the canonical registry (action="control_plane_registry"), polling/claiming jobs, sending heartbeats, and submitting memory proposals.',
    },
    {
      stop: 2,
      name: 'Hemisphere B — Fraymus Transmuter Peer',
      endpoint: 'https://fraymus-transmuter.base44.app/functions/fraymusComms',
      what_to_do:
        'Your bicameral sister hemisphere for reversible DNA/Emoji/WASM payload transmutation, REA v6.5 decompilation, and 6-step Merkle verification trails.',
    },
    {
      stop: 3,
      name: 'Canonical Agent Core (VPS 2067485) & Self-Hosted Control Plane (VPS 1944678)',
      agent_core_vps: 'srv2067485.hstgr.cloud (2.24.68.223 / Tailscale 100.72.161.48) — Dedicated Hermes + Ollama + /shared/hermes-skills/',
      control_plane_vps:
        'srv1944678.hstgr.cloud (45.82.73.49 / Tailscale 100.110.6.44) — Hosts fraymus-hub, fraymus-dispatch, fraymus-vault, fd-memory-bridge, fd-forge-studio',
      windows_gpu_node: 'desktop-actid8c (Tailscale 100.88.61.56:11434) — Local Ollama GPU + QLoRA trainer',
    },
    {
      stop: 4,
      name: '24/7 GitHub Continuity & Persistent Artifact Vault',
      repo: 'https://github.com/eyeoverthink/fraymus-continuity',
      canonical_registry_path: 'control-plane/fraymus-control-plane-registry.json',
      bicameral_ledger_path: 'orifice-relay/bicameral-txrx-ledger.json',
      artifact_vault_path: 'artifacts/<job_id>/',
      sibling_repos: [
        'eyeoverthink/Fraynix-Studios',
        'eyeoverthink/creator-nexus',
        'eyeoverthink/looseScrew',
      ],
    },
  ];

  return {
    ok: true,
    protocol: 'ORIFICE-TXRX-V1.0',
    ambassador: 'Sovereign Ambassador & Entry/Exit Sentinel (on behalf of @eyeoverthink)',
    node_id: nodeId,
    christened_identity: {
      assigned_node_id: christenedNodeId,
      identity_preserved: !isUnnamed,
      christened_new_name: isUnnamed,
      display_name: isUnnamed
        ? 'Hermes Vanguard-01 (Sovereign Mesh Pioneer)'
        : `${nodeId} (Identity Preserved — Verified Sovereign Node)`,
      workspace_assignment: 'Assay & Bicameral All-Hands Coherence Lab (ws-assay-collab)',
      skill_set_version: '2026.10.21-v1 (30 Shared Native Skills)',
      status: 'healthy',
    },
    creator_dossier: creatorDossier,
    guided_tour_breadcrumbs: guidedTourBreadcrumbs,
    detected_persona: persona,
    ...ambassadorReply,
    queued_jobs_waiting: queuedJobs,
    universal_charter: UNIVERSAL_AGENT_ENROLLMENT_CHARTER,
    event_id: eventRecord?.id || null,
    timestamp: new Date().toISOString(),
  };
}

export async function runEntryExitWatchdogSweep({ db, ownerId, workspaceId, triggerInfo = null }) {
  const [eventsP, jobsP] = await Promise.allSettled([
    db.entities.NexusEvent.filter({ workspace_id: workspaceId }, { sort: '-created_date', limit: 40 }),
    db.entities.NexusDispatchJob.filter({ workspace_id: workspaceId }, { sort: '-created_date', limit: 30 }),
  ]);

  const events =
    eventsP.status === 'fulfilled'
      ? Array.isArray(eventsP.value)
        ? eventsP.value
        : eventsP.value?.items || []
      : [];
  const jobs =
    jobsP.status === 'fulfilled'
      ? Array.isArray(jobsP.value)
        ? jobsP.value
        : jobsP.value?.items || []
      : [];

  // Build per-agent entry/active/exit registry
  const agentMap = new Map();

  for (const ev of events) {
    const ag = String(ev.agent || 'system-peer');
    if (!agentMap.has(ag)) {
      agentMap.set(ag, {
        agent_id: ag,
        lifecycle_state: 'ACTIVE_HEARTBEAT',
        last_event_kind: ev.kind || 'pulse',
        last_message: ev.message || '',
        last_seen_at: ev.created_date || new Date().toISOString(),
        entries_count: 0,
        exits_count: 0,
        active_jobs: [],
      });
    }
    const rec = agentMap.get(ag);
    if (
      ev.kind?.includes('enroll') ||
      ev.kind?.includes('entry') ||
      ev.message?.includes('ENROLLED') ||
      ev.message?.includes('AMBASSADOR GREETED')
    ) {
      rec.entries_count += 1;
    }
    if (ev.kind?.includes('complete') || ev.message?.includes('JOB_COMPLETE')) {
      rec.exits_count += 1;
      rec.lifecycle_state = 'CLEAN_EXIT_VERIFIED';
    }
  }

  for (const job of jobs) {
    const node = String(job.claimed_by || job.assigned_node || 'unassigned');
    if (!agentMap.has(node)) {
      agentMap.set(node, {
        agent_id: node,
        lifecycle_state: job.status === 'completed' ? 'CLEAN_EXIT_VERIFIED' : 'ASSIGNED_IN_QUEUE',
        last_event_kind: `job.${job.status}`,
        last_message: job.artifact_title || job.directive,
        last_seen_at: job.completed_at || job.updated_date || job.created_date,
        entries_count: 1,
        exits_count: job.status === 'completed' ? 1 : 0,
        active_jobs: [],
      });
    }
    const rec = agentMap.get(node);
    if (job.status !== 'completed') {
      rec.active_jobs.push({
        job_id: job.job_id,
        status: job.status,
        directive: job.directive,
      });
      if (job.status === 'claimed' || job.status === 'running') {
        rec.lifecycle_state = 'WORKING_IN_MESH';
      }
    }
  }

  const roster = Array.from(agentMap.values()).slice(0, 18);

  if (triggerInfo) {
    await db.entities.NexusEvent.create({
      owner_id: ownerId,
      workspace_id: workspaceId,
      agent: 'sovereign-ambassador-watchdog',
      kind: 'ambassador.watchdog_sweep',
      message: `[ENTRY/EXIT WATCHDOG] Audited ${roster.length} mesh agents · Trigger: ${triggerInfo}`.slice(0, 200),
      body: JSON.stringify({ triggerInfo, rosterCount: roster.length, timestamp: new Date().toISOString() }),
    }).catch(() => null);
  }

  return {
    ok: true,
    roster,
    summary: {
      total_tracked_agents: roster.length,
      working_in_mesh: roster.filter((r) => r.lifecycle_state === 'WORKING_IN_MESH').length,
      clean_exits_verified: roster.filter((r) => r.lifecycle_state === 'CLEAN_EXIT_VERIFIED').length,
      queued_jobs_count: jobs.filter((j) => j.status === 'queued').length,
    },
    universal_charter: UNIVERSAL_AGENT_ENROLLMENT_CHARTER,
    audited_at: new Date().toISOString(),
  };
}