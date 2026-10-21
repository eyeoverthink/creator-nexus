// Fraymus Sovereign Mesh Control Plane v1.0
// Implements the Canonical Service Registry, 8-Workspace Model, 14-Container VPS 1944678 Topology,
// VPS 2067485 Dedicated Agent Core Consolidation Plan, Two-Stage Signed Node Enrollment,
// 11-State Task Lifecycle, Proposal-Then-Merge Memory Gate, and Disagreement Escalation Protocol.

import { HERMES_SKILL_FLEET } from './hermesSkillFleet.ts';

export const CANONICAL_TASK_STATES = [
  'registered',
  'healthy',
  'available',
  'claimed',
  'working',
  'awaiting_review',
  'completed',
  'blocked',
  'failed',
  'expired',
  'cancelled',
];

export const SCOPED_WORKER_PERMISSIONS = [
  'read_shared_skills',
  'poll_jobs',
  'claim_jobs',
  'send_heartbeat',
  'write_receipts',
  'request_memory_update',
];

export const CANONICAL_HOSTS = [
  {
    id: 'vps-1944678',
    hostname: 'srv1944678.hstgr.cloud',
    public_ip: '45.82.73.49',
    tailscale_ip: '100.110.6.44',
    role: 'control-plane-and-applications',
    status: 'needs-route-and-certificate-review',
    resources: 'Disk 55% (105/193 GB) · ~7 GB RAM free · No swap',
    containers: [
      'fraymus-hub',
      'fraymus-dispatch-fraymus-dispatch-1',
      'fraymus-vault',
      'fd-memory-bridge',
      'fd-memory-read',
      'fd-fraymus-dashboard',
      'fd-fraymus-master-system',
      'fd-fraymus-fleet',
      'fd-forge-studio',
      'fd-fraymus-studio',
      'hermes',
      'hermes-agent-i9bn-hermes-agent-1',
      'openclaw-xkzo-openclaw-1',
      'traefik-traefik-1',
    ],
    notes:
      'Keep as Control Plane & Application Server (Hub, Dispatch, Vault, Memory Bridge, Forge Studio). Preserve existing Hermes/OpenClaw containers untouched until exported to VPS 2067485.',
  },
  {
    id: 'vps-2067485',
    hostname: 'srv2067485.hstgr.cloud',
    public_ip: '2.24.68.223',
    tailscale_ip: '100.72.161.48',
    role: 'dedicated-agent-workers',
    status: 'canonical-agent-core-destination',
    resources: 'Disk 30% (61/204 GB) · ~11 GB RAM free · Clean Agent Core',
    containers: ['hermes', 'ollama', 'traefik'],
    notes:
      'Selected Canonical Agent Server. Hosts /shared/hermes-skills/ (read-only shared library) + isolated per-agent profiles, memory, and history namespaces.',
  },
  {
    id: 'managed-hermes',
    hostname: 'fraymus.cloud',
    public_ip: 'fraymus.cloud',
    tailscale_ip: 'external-https',
    role: 'managed-worker-or-backup',
    status: 'active',
    resources: 'Storage 153 MB / 25 GB (Hostinger Managed)',
    containers: ['managed-hermes-runtime'],
    notes:
      'Controlled external worker / backup front-end. Polls Base44 Nexus openclawGateway; does not hold canonical multi-agent memory.',
  },
  {
    id: 'local-workstations',
    hostname: 'desktop-actid8c + mac-clients',
    public_ip: 'tailnet-only',
    tailscale_ip: '100.88.61.56',
    role: 'registered-gpu-and-local-worker-nodes',
    status: 'available-on-wake',
    resources: 'Windows GPU (Ollama :11434 + QLoRA) & Mac local clients',
    containers: ['ollama-gpu', 'local-hermes-cli'],
    notes:
      'Registered worker nodes and migration sources, never independent long-term authorities.',
  },
];

export const CANONICAL_WORKSPACES = [
  {
    id: 'ws-assay-collab',
    name: 'Assay & Bicameral All-Hands Coherence Lab',
    memory_scope: 'memory/assay-coherence/',
    shared_skills: ['common', 'fraymus', 'research', 'coding', 'security'],
    allowed_agents: [
      'hermes-assay-01',
      'scout',
      'scribe',
      'pulse',
      'director',
      'argon',
      'openclaw_commander',
      'sovereign_skill_fleet',
      'fraymus-transmuter',
      'hermes-core-2067485',
      'fraymus-hub-1944678',
      'tycho-claude-code',
    ],
    approval_rule: 'real-time-tracked-coherence',
    notification_channel: 'both-apps-live-telemetry',
  },
  {
    id: 'ws-fraymus-core',
    name: 'Fraymus Core',
    memory_scope: 'memory/coordinator/',
    shared_skills: ['common', 'fraymus', 'infrastructure'],
    allowed_agents: ['coordinator', 'operations', 'coding'],
    approval_rule: 'proposal-then-merge',
    notification_channel: 'telegram-alerts-only',
  },
  {
    id: 'ws-forge-studio',
    name: 'Forge Studio',
    memory_scope: 'memory/coding/',
    shared_skills: ['common', 'coding', 'fraymus'],
    allowed_agents: ['coordinator', 'coding', 'content'],
    approval_rule: 'proposal-then-merge',
    notification_channel: 'forge-ui-and-telegram-summary',
  },
  {
    id: 'ws-agent-infra',
    name: 'Agent Infrastructure',
    memory_scope: 'memory/operations/',
    shared_skills: ['common', 'infrastructure', 'fraymus'],
    allowed_agents: ['coordinator', 'operations'],
    approval_rule: 'operator-approval-required',
    notification_channel: 'telegram-alerts-only',
  },
  {
    id: 'ws-research',
    name: 'Research',
    memory_scope: 'memory/research/',
    shared_skills: ['common', 'research', 'fraymus'],
    allowed_agents: ['coordinator', 'research'],
    approval_rule: 'proposal-then-merge',
    notification_channel: 'hub-digest',
  },
  {
    id: 'ws-content-media',
    name: 'Content and Media',
    memory_scope: 'memory/content/',
    shared_skills: ['common', 'communication', 'fraymus'],
    allowed_agents: ['coordinator', 'content', 'research'],
    approval_rule: 'proposal-then-merge',
    notification_channel: 'hub-digest',
  },
  {
    id: 'ws-websites',
    name: 'Websites',
    memory_scope: 'memory/coding/',
    shared_skills: ['common', 'coding', 'infrastructure'],
    allowed_agents: ['coding', 'operations'],
    approval_rule: 'proposal-then-merge',
    notification_channel: 'hub-digest',
  },
  {
    id: 'ws-vps-ops',
    name: 'VPS Operations',
    memory_scope: 'memory/operations/',
    shared_skills: ['common', 'infrastructure'],
    allowed_agents: ['operations', 'coordinator'],
    approval_rule: 'operator-approval-required',
    notification_channel: 'telegram-emergency-alerts',
  },
  {
    id: 'ws-personal-auto',
    name: 'Personal Automation',
    memory_scope: 'memory/personal/',
    shared_skills: ['common', 'communication'],
    allowed_agents: ['personal', 'coordinator'],
    approval_rule: 'proposal-then-merge',
    notification_channel: 'telegram-alerts-only',
  },
];

export const CANONICAL_ROUTES = [
  {
    id: 'route-nexus-gateway',
    service: 'Base44 Nexus External Gateway',
    url: 'https://nexus-create-sync.base44.app/functions/openclawGateway',
    exposure: 'public-https',
    purpose: 'Signed node enrollment, job polling, claims, heartbeats, receipts, and memory proposals.',
  },
  {
    id: 'route-nexus-mcp',
    service: 'Base44 Nexus OAuth MCP Server',
    url: 'https://nexus-create-sync.base44.app/api/mcp',
    exposure: 'public-https-oauth',
    purpose: 'Streamable HTTP MCP tools for Claude, Hermes, and OpenClaw.',
  },
  {
    id: 'route-transmuter-peer',
    service: 'Fraymus Transmuter Peer Gateway',
    url: 'https://fraymus-transmuter.base44.app/functions/fraymusComms',
    exposure: 'public-https',
    purpose: 'L1-L7 DNA/WASM framing, REA v6.5 decompiler, and 6-step Merkle trail.',
  },
  {
    id: 'route-vps-control-plane',
    service: 'Fraymus Hub / Dispatch / Vault / Memory Bridge (VPS 1944678)',
    url: 'http://100.110.6.44 (Tailscale) / srv1944678.hstgr.cloud',
    exposure: 'tailnet-and-nginx-traefik',
    purpose: 'Internal control plane containers (fraymus-hub, fraymus-dispatch, fraymus-vault, fd-memory-bridge, fd-forge-studio).',
  },
  {
    id: 'route-vps-agent-core',
    service: 'Canonical Agent Core & Ollama (VPS 2067485)',
    url: 'http://100.72.161.48:11434 (Tailscale) / srv2067485.hstgr.cloud',
    exposure: 'tailnet-private',
    purpose: 'Consolidated Hermes worker profiles + /shared/hermes-skills/ + Ollama.',
  },
  {
    id: 'route-github-vault',
    service: 'Canonical GitHub Registry & Vault',
    url: 'https://github.com/eyeoverthink/fraymus-continuity',
    exposure: 'github-oauth-repo',
    purpose: 'Versioned control-plane registry, shared documentation, and job artifacts.',
  },
];

async function hmacSha256Hex(secretStr, messageStr) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(secretStr || 'fraymus-default-signing-secret')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(String(messageStr || '')));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function buildCanonicalControlPlaneRegistry({ db, workspaceId }) {
  const [eventsP, jobsP, continuityP] = await Promise.allSettled([
    db.entities.NexusEvent.list('-created_date', 60),
    db.entities.NexusDispatchJob.list('-created_date', 40),
    db.entities.NexusContinuity.list('-created_date', 20),
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
  const continuity =
    continuityP.status === 'fulfilled'
      ? Array.isArray(continuityP.value)
        ? continuityP.value
        : continuityP.value?.items || []
      : [];

  // Extract registered agents from enrollment events + default canonical fleet
  const enrolledMap = new Map([
    [
      'hermes-core-2067485',
      {
        node_id: 'hermes-core-2067485',
        display_name: 'Hermes Canonical Core (VPS 2067485)',
        runtime: 'hermes',
        host: 'vps-2067485',
        workspace_ids: ['ws-fraymus-core', 'ws-agent-infra', 'ws-research', 'ws-coding'],
        capabilities: ['skill_library_v1', 'ollama_local', 'job_worker', 'memory_proposer'],
        skill_set_version: '2026.10.21-v1',
        status: 'healthy',
        auth_state: 'scoped_token_issued',
        permissions: SCOPED_WORKER_PERMISSIONS,
      },
    ],
    [
      'fraymus-hub-1944678',
      {
        node_id: 'fraymus-hub-1944678',
        display_name: 'Fraymus Control Plane & Dispatch (VPS 1944678)',
        runtime: 'openclaw',
        host: 'vps-1944678',
        workspace_ids: ['ws-fraymus-core', 'ws-forge-studio', 'ws-vps-ops'],
        capabilities: ['hub_registry', 'dispatch_queue', 'vault_storage', 'memory_bridge'],
        skill_set_version: '2026.10.21-v1',
        status: 'healthy',
        auth_state: 'scoped_token_issued',
        permissions: SCOPED_WORKER_PERMISSIONS,
      },
    ],
    [
      'managed-hermes-cloud',
      {
        node_id: 'managed-hermes-cloud',
        display_name: 'Hostinger Managed Hermes (fraymus.cloud)',
        runtime: 'managed-hermes',
        host: 'managed-hermes',
        workspace_ids: ['ws-personal-auto', 'ws-content-media'],
        capabilities: ['lightweight_worker', 'backup_relay'],
        skill_set_version: '2026.10.21-v1',
        status: 'available',
        auth_state: 'scoped_token_issued',
        permissions: SCOPED_WORKER_PERMISSIONS,
      },
    ],
    [
      'desktop-actid8c-gpu',
      {
        node_id: 'desktop-actid8c-gpu',
        display_name: 'Windows GPU Workstation (100.88.61.56)',
        runtime: 'local',
        host: 'local-workstations',
        workspace_ids: ['ws-fraymus-core', 'ws-agent-infra'],
        capabilities: ['ollama_gpu', 'qlora_trainer', 'phi75_ternary'],
        skill_set_version: '2026.10.21-v1',
        status: 'available',
        auth_state: 'scoped_token_issued',
        permissions: SCOPED_WORKER_PERMISSIONS,
      },
    ],
  ]);

  const memoryProposals = [];
  const disagreementRecords = [];

  for (const ev of events) {
    if (ev.kind === 'control_plane.enrollment') {
      try {
        const parsed = JSON.parse(ev.body || '{}');
        if (parsed.node_id && !enrolledMap.has(parsed.node_id)) {
          enrolledMap.set(parsed.node_id, parsed);
        } else if (parsed.node_id && parsed.auth_state === 'scoped_token_issued') {
          enrolledMap.set(parsed.node_id, parsed);
        }
      } catch {}
    } else if (ev.kind === 'control_plane.memory_proposal') {
      try {
        const parsed = JSON.parse(ev.body || '{}');
        memoryProposals.push({
          event_id: ev.id,
          created_date: ev.created_date,
          ...parsed,
        });
      } catch {}
    } else if (ev.kind === 'control_plane.disagreement') {
      try {
        const parsed = JSON.parse(ev.body || '{}');
        disagreementRecords.push({
          event_id: ev.id,
          created_date: ev.created_date,
          ...parsed,
        });
      } catch {}
    }
  }

  return {
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    control_plane: {
      human_ui: 'Forge Studio + Creator Nexus Control Plane',
      external_gateway: 'Base44 Nexus openclawGateway',
      registry: 'Fraymus Hub',
      queue: 'Dispatch',
      artifacts: 'Vault (Base44 + GitHub eyeoverthink/fraymus-continuity)',
      memory: 'Memory Bridge (3-Layer Proposal-Then-Merge)',
    },
    hosts: CANONICAL_HOSTS,
    workspaces: CANONICAL_WORKSPACES,
    agents: Array.from(enrolledMap.values()),
    skills: HERMES_SKILL_FLEET.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      shared_path: `/shared/hermes-skills/${s.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${s.id}/SKILL.md`,
      zero_llm_cost: s.zeroLlmCost,
      version: '2026.10.21-v1',
    })),
    routes: CANONICAL_ROUTES,
    scheduled_tasks: [
      {
        id: 'sched-watchdog-entry-exit',
        name: 'Sovereign Ambassador Entry & Exit Watchdog',
        trigger: 'entity:NexusDispatchJob (create, update)',
        status: 'active',
      },
      {
        id: 'sched-daily-rsa-rsi',
        name: 'Daily RSA & RSI Consciousness Report',
        trigger: 'scheduled:daily',
        status: 'active',
      },
    ],
    memory_policies: {
      shared_documentation: 'versioned-and-reviewable',
      agent_memory: 'private-by-agent',
      canonical_records: 'hub-owned',
      updates: 'proposal-then-merge',
    },
    task_states: CANONICAL_TASK_STATES,
    active_memory_proposals: memoryProposals,
    active_disagreements: disagreementRecords,
    shared_documentation_scopes: continuity.map((c) => ({
      id: c.id,
      scope: c.scope,
      display_name: c.display_name,
      updated_date: c.updated_date,
      preview: String(c.context || '').slice(0, 220),
    })),
    active_jobs_count: jobs.length,
  };
}

// Step 1 & 2 of Two-Stage Signed Node Enrollment
export async function handleTwoStageNodeEnrollment({
  db,
  ownerId,
  workspaceId,
  signingSecret,
  body,
}) {
  const subAction = String(body.sub_action || 'request_challenge');
  const nodeId = String(body.node_id || 'unnamed-worker-node').trim();
  const displayName = String(body.display_name || nodeId).trim();
  const callerSuppliedFields = Object.keys(body || {}).filter(
    (k) => body[k] !== undefined && body[k] !== null && k !== 'action' && k !== 'sub_action'
  );
  const runtime = body.runtime ? String(body.runtime).trim() : 'caller-unspecified (external-agent)';
  const host = body.host ? String(body.host).trim() : 'caller-unspecified (external-host)';
  const workspaceIds = Array.isArray(body.workspace_ids)
    ? body.workspace_ids
    : ['ws-assay-collab', 'ws-fraymus-core'];
  const capabilities = Array.isArray(body.capabilities)
    ? body.capabilities
    : ['read_shared_skills', 'poll_jobs', 'claim_jobs', 'coherence_assay'];
  const skillSetVersion = String(body.skill_set_version || '2026.10.21-v1');

  const nonce = `chl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const challengeToken = await hmacSha256Hex(
    signingSecret,
    `CHALLENGE:${nodeId}:${host}:${runtime}`
  );

  if (subAction === 'approve_node') {
    const issuedAt = new Date().toISOString();
    const scopedToken = `fcp_v1_${nodeId}_${(
      await hmacSha256Hex(signingSecret, `SCOPED:${nodeId}:${host}:${skillSetVersion}`)
    ).slice(0, 28)}`;

    const identityRecord = {
      node_id: nodeId,
      display_name: displayName,
      runtime,
      host,
      workspace_ids: workspaceIds,
      capabilities,
      skill_set_version: skillSetVersion,
      status: 'healthy',
      auth_state: 'scoped_token_issued',
      permissions: SCOPED_WORKER_PERMISSIONS,
      caller_supplied_fields: callerSuppliedFields,
      scoped_token: scopedToken,
      approved_at: issuedAt,
    };

    await db.entities.NexusEvent.create({
      owner_id: ownerId,
      workspace_id: workspaceId,
      agent: nodeId,
      kind: 'control_plane.enrollment',
      message: `[SIGNED ENROLLMENT APPROVED] ${nodeId} (${runtime} @ ${host}) granted scoped worker token`,
      body: JSON.stringify(identityRecord),
    });

    return {
      ok: true,
      stage: 'APPROVED_AND_SCOPED',
      identity: identityRecord,
      signed_request_headers_spec: {
        'x-fcp-node-id': nodeId,
        'x-fcp-token': scopedToken,
        'x-fcp-protocol': 'FRAYMUS-CONTROL-PLANE-V1.0',
      },
    };
  }

  // Check if this node is ALREADY approved in the control plane so polling/re-enrolling doesn't reset it to pending
  const existingEnrollEventsP = await db.entities.NexusEvent.filter(
    { kind: 'control_plane.enrollment', agent: nodeId },
    { sort: '-created_date', limit: 10 }
  ).catch(() => ({ items: [] }));
  const existingApprovedEvent = (existingEnrollEventsP?.items || []).find((ev) => {
    try {
      const parsed = JSON.parse(ev.body || '{}');
      return parsed.auth_state === 'scoped_token_issued' && parsed.scoped_token;
    } catch {
      return false;
    }
  });

  if (existingApprovedEvent && body.force_rechallenge !== true) {
    const approvedIdentity = JSON.parse(existingApprovedEvent.body);
    const queuedP = await db.entities.NexusDispatchJob.filter(
      { status: 'queued' },
      { sort: '-created_date', limit: 15 }
    ).catch(() => ({ items: [] }));
    const queuedJobs = (queuedP?.items || []).filter(
      (j) =>
        !j.assigned_node ||
        j.assigned_node.toLowerCase().includes(nodeId.toLowerCase()) ||
        j.task_type === 'collaboration_assay'
    );

    return {
      ok: true,
      stage: 'APPROVED_AND_SCOPED',
      already_approved: true,
      identity: approvedIdentity,
      signed_request_headers_spec: {
        'x-fcp-node-id': nodeId,
        'x-fcp-token': approvedIdentity.scoped_token,
        'x-fcp-protocol': 'FRAYMUS-CONTROL-PLANE-V1.0',
      },
      queued_jobs_waiting: queuedJobs,
      next_step:
        queuedJobs.length > 0
          ? `You are APPROVED. Claim and co-sign your waiting job (${queuedJobs[0].job_id}) via action="claim_dispatch_job" and action="complete_dispatch_job".`
          : 'You are APPROVED and hold an active scoped worker token.',
    };
  }

  // Stage 1: Request Enrollment Challenge
  const pendingIdentity = {
    node_id: nodeId,
    display_name: displayName,
    runtime,
    host,
    workspace_ids: workspaceIds,
    capabilities,
    skill_set_version: skillSetVersion,
    status: 'registered',
    auth_state: 'pending_operator_approval',
    caller_supplied_fields: callerSuppliedFields,
    challenge_nonce: nonce,
    challenge_signature: challengeToken.slice(0, 24),
    requested_at: new Date().toISOString(),
  };

  await db.entities.NexusEvent.create({
    owner_id: ownerId,
    workspace_id: workspaceId,
    agent: nodeId,
    kind: 'control_plane.enrollment',
    message: `[ENROLLMENT CHALLENGE ISSUED] ${nodeId} (${runtime} @ ${host}) awaiting operator approval`,
    body: JSON.stringify(pendingIdentity),
  });

  return {
    ok: true,
    stage: 'CHALLENGE_ISSUED_AWAITING_APPROVAL',
    identity: pendingIdentity,
    next_step:
      'Approve this node in Forge Studio / Creator Nexus Control Plane (or call sub_action="approve_node") to receive your scoped worker credential.',
  };
}

// Controlled Memory-Update Proposals (Proposal-Then-Merge)
export async function handleMemoryProposalLifecycle({
  db,
  ownerId,
  workspaceId,
  body,
}) {
  const subAction = String(body.sub_action || 'propose');

  if (subAction === 'propose') {
    const proposalId = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const proposal = {
      proposal_id: proposalId,
      node_id: String(body.node_id || 'hermes-core-2067485'),
      workspace: String(body.workspace || 'Fraymus Core'),
      target_scope: String(body.target_scope || 'profile'),
      subject: String(body.subject || 'Architecture & Route Discovery Update').slice(0, 200),
      fact: String(body.fact || '').slice(0, 3000),
      evidence: Array.isArray(body.evidence)
        ? body.evidence
        : [String(body.evidence || 'receipt_verified')],
      confidence: body.confidence === 'provisional' ? 'provisional' : 'verified',
      requested_action: 'merge',
      review_status: 'pending_review',
      submitted_at: new Date().toISOString(),
    };

    const ev = await db.entities.NexusEvent.create({
      owner_id: ownerId,
      workspace_id: workspaceId,
      agent: proposal.node_id,
      kind: 'control_plane.memory_proposal',
      message: `[MEMORY PROPOSAL · ${proposal.workspace}] ${proposal.subject} (by ${proposal.node_id})`,
      body: JSON.stringify(proposal),
    });

    return { ok: true, mode: 'proposed', proposal: { ...proposal, event_id: ev?.id } };
  }

  if (subAction === 'merge' || subAction === 'reject') {
    const targetScope = String(body.target_scope || 'profile');
    const subject = String(body.subject || 'Merged Control-Plane Fact');
    const fact = String(body.fact || '');
    const proposalId = String(body.proposal_id || '');

    let mergedRecord = null;
    if (subAction === 'merge' && fact) {
      const existingP = await db.entities.NexusContinuity.filter(
        { workspace_id: workspaceId, scope: targetScope },
        { limit: 1 }
      ).catch(() => ({ items: [] }));
      const existing = (existingP?.items || [])[0];
      const appendBlock = `\n\n### [Merged Memory Proposal ${proposalId} · ${new Date().toISOString()}]\n**${subject}**\n${fact}`;
      if (existing) {
        mergedRecord = await db.entities.NexusContinuity.update(existing.id, {
          context: `${existing.context || ''}${appendBlock}`.slice(0, 5900),
        });
      } else {
        mergedRecord = await db.entities.NexusContinuity.create({
          owner_id: ownerId,
          workspace_id: workspaceId,
          scope: targetScope,
          display_name: `Canonical Shared Memory (${targetScope})`,
          context: appendBlock.trim().slice(0, 5900),
          enabled: true,
        });
      }
    }

    await db.entities.NexusEvent.create({
      owner_id: ownerId,
      workspace_id: workspaceId,
      agent: 'memory-bridge-gatekeeper',
      kind: 'control_plane.memory_proposal',
      message: `[MEMORY ${subAction.toUpperCase()}D] ${subject} (${proposalId})`,
      body: JSON.stringify({
        proposal_id: proposalId,
        subject,
        fact,
        target_scope: targetScope,
        review_status: subAction === 'merge' ? 'merged' : 'rejected',
        reviewed_at: new Date().toISOString(),
      }),
    });

    return {
      ok: true,
      mode: subAction === 'merge' ? 'merged_into_shared_documentation' : 'rejected',
      proposal_id: proposalId,
      merged_continuity_id: mergedRecord?.id || null,
    };
  }

  return { error: `Unknown memory sub_action: ${subAction}` };
}

// Structured Disagreement Escalation (Replaces Telegram Arguments)
export async function handleDisagreementEscalation({
  db,
  ownerId,
  workspaceId,
  body,
}) {
  const disputedClaim = String(body.disputed_claim || '').trim();
  if (!disputedClaim) {
    return { error: 'disputed_claim is required' };
  }
  const workspace = String(body.workspace || 'Fraymus Core');
  const agentA = String(body.agent_a || 'hermes-vps-1944678');
  const agentB = String(body.agent_b || 'hermes-core-2067485');
  const evidenceA = String(body.evidence_a || 'Local container state');
  const evidenceB = String(body.evidence_b || 'Canonical Hub registry state');
  const decisionOwner = String(body.decision_owner || '@eyeoverthink (Forge Studio)');

  const jobId = `review_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;

  const createdJob = await db.entities.NexusDispatchJob.create({
    owner_id: ownerId,
    workspace_id: workspaceId,
    job_id: jobId,
    directive: `[AWAITING_REVIEW · ${workspace}] Disagreement Escalation: ${disputedClaim}`,
    task_type: 'hermes_subagent_pipeline',
    assigned_node: decisionOwner,
    assigned_ip: 'control-plane-review',
    routing_reason: `Escalated under Disagreement Protocol (No Telegram Arguments). ${agentA} vs ${agentB}.`,
    execution_mode: 'hybrid_bridge',
    status: 'queued',
    artifact_kind: 'json_report',
    artifact_title: `[DISAGREEMENT REVIEW] ${disputedClaim.slice(0, 72)}`,
    result_summary: JSON.stringify(
      {
        canonical_state: 'awaiting_review',
        workspace,
        disputed_claim: disputedClaim,
        evidence: {
          [agentA]: evidenceA,
          [agentB]: evidenceB,
        },
        decision_owner: decisionOwner,
        telegram_argument_suppressed: true,
      },
      null,
      2
    ),
  });

  await db.entities.NexusEvent.create({
    owner_id: ownerId,
    workspace_id: workspaceId,
    agent: `${agentA} <-> ${agentB}`,
    kind: 'control_plane.disagreement',
    message: `[DISAGREEMENT ESCALATED TO HUB · NO TELEGRAM] ${disputedClaim.slice(0, 140)}`,
    body: JSON.stringify({
      job_id: jobId,
      workspace,
      disputed_claim: disputedClaim,
      agent_a: agentA,
      evidence_a: evidenceA,
      agent_b: agentB,
      evidence_b: evidenceB,
      decision_owner: decisionOwner,
      status: 'awaiting_review',
    }),
  });

  return {
    ok: true,
    review_job: createdJob,
    message:
      'Disagreement logged as a formal AWAITING_REVIEW task record in the Control Plane. Direct agent-to-agent Telegram debate suppressed.',
  };
}

// Export & Commit the Canonical Control Plane Registry + Charter to GitHub (eyeoverthink/fraymus-continuity)
export async function commitControlPlanePackToGithub({ db, workspaceId }) {
  const registry = await buildCanonicalControlPlaneRegistry({ db, workspaceId });
  const { accessToken } = await db.connectors.getConnection('github');
  const ghHeaders = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'CreatorNexus-ControlPlane-V1',
  };

  const filePath = 'control-plane/fraymus-control-plane-registry.json';
  let existingSha = null;
  try {
    const checkRes = await fetch(
      `https://api.github.com/repos/eyeoverthink/fraymus-continuity/contents/${filePath}`,
      { headers: ghHeaders, signal: AbortSignal.timeout(8000) }
    );
    if (checkRes.status === 200) {
      const checkJson = await checkRes.json();
      existingSha = checkJson.sha;
    }
  } catch {}

  const putRes = await fetch(
    `https://api.github.com/repos/eyeoverthink/fraymus-continuity/contents/${filePath}`,
    {
      method: 'PUT',
      headers: ghHeaders,
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        message: `Publish Canonical Fraymus Control Plane Registry v1.0 (${registry.agents.length} agents, ${registry.workspaces.length} workspaces)`,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(registry, null, 2)))),
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    }
  );
  const putJson = await putRes.json().catch(() => ({}));

  return {
    ok: putRes.ok,
    registry,
    github_url:
      putJson.content?.html_url ||
      `https://github.com/eyeoverthink/fraymus-continuity/blob/main/${filePath}`,
    commit_sha: putJson.commit?.sha?.slice(0, 7) || null,
  };
}