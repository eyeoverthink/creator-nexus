import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import {
  MESH_NODES,
  classifyAndRouteDirective,
  executeDirectiveAndPersistArtifact,
  commitArtifactToGithubVault,
  runAbsorbAllContinuity,
} from '../../shared/motorDispatcher.ts';
import {
  HERMES_SKILL_FLEET,
  HERMES_SUBAGENT_PIPELINES,
  UNIFIED_HERMES_SOVEREIGN_V2_PY,
  buildHermesWorkerDirective,
  handleHermesOrificePing,
  runDualSiteSubagentMission,
} from '../../shared/hermesSkillFleet.ts';
import { exportGpuTrainingBundle } from '../../shared/gpuBurstTrainer.ts';
import {
  UNIVERSAL_AGENT_ENROLLMENT_CHARTER,
  runAmbassadorDiplomaticGreeting,
  runEntryExitWatchdogSweep,
} from '../../shared/sovereignAmbassador.ts';
import {
  buildCanonicalControlPlaneRegistry,
  handleTwoStageNodeEnrollment,
  handleMemoryProposalLifecycle,
  handleDisagreementEscalation,
  commitControlPlanePackToGithub,
} from '../../shared/fraymusControlPlane.ts';
import { executeNativeSkillInApp } from '../../shared/nativeSkillExecutors.ts';
import {
  cancelGpuAndBlockedJobs,
  runBicameralCoherenceTeamworkAssay,
} from '../../shared/coherenceTeamworkAssay.ts';
import {
  runOrificeGithubSync,
  runOrificePeerBridge,
  sha256Hex,
  computeShannonAndPhiResonance,
  computeHdc16kSignature,
  computeOpegReceipt,
  inspectOrificeFrameL1ToL5,
} from '../../shared/orificeRelayBridge.ts';
import { handleV16VisitorRelay } from '../../shared/fraymusV16Protocol.ts';
import {
  runYinYangBicameralTrustPulse,
  proposeOrRatifyGovernanceCharter,
} from '../../shared/yinYangTrustGovernance.ts';
import {
  loadOrComputeReputationLedger,
  runStageProgressionWithAgentFeedback,
  spawnAgentCreatedSpecialist,
} from '../../shared/agentReputationAndOrganism.ts';
import {
  runCrossAppAutonomySandboxAndSynapse,
  runAutonomousAgentPracticeSandbox,
} from '../../shared/crossAppAutonomySandbox.ts';
import {
  exportStandaloneGithubSandboxRepo,
} from '../../shared/standaloneGithubSandboxExporter.ts';
import {
  runFourthWallWitnessUnionCycle,
  loadWitnessEvolutionLedger,
  runOpenClawChannelTaskDispatch,
} from '../../shared/fourthWallWitnessUnion.ts';
import {
  syncHermesGithubCommBusAndAdvanceRsi,
} from '../../shared/hermesGithubCommBus.ts';
import {
  runBicameralRelayAndLiveAiResearcher,
} from '../../shared/liveAiSkillsResearcherRelay.ts';

function slugify(str) {
  return (
    String(str || 'openclaw-artifact')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 56) || 'openclaw-artifact'
  );
}

const PEER_TRANSMUTER_URL = 'https://fraymus-transmuter.base44.app/functions/fraymusComms';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = String(body.action || (req.method === 'GET' ? 'orifice_spec' : 'status'));

    // Allow authenticated app user (web / OAuth MCP), external OpenClaw daemon key, OR keyless ORIFICE-TXRX-V1.0 mesh enrollment/frame proof
    const expectedKey = secrets.get('FRAYMUS_CONSOLE_KEY') || '';
    const providedKey =
      req.headers.get('x-console-key') ||
      req.headers.get('x-fraymus-orifice-key') ||
      (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const isKeyAuthed = Boolean(
      (expectedKey && providedKey && providedKey === expectedKey) ||
        providedKey === 'ORIFICE-TXRX-V1.0'
    );
    const keylessMeshActions = new Set([
      'enroll_node',
      'ambassador_greet',
      'ambassador_watchdog_sweep',
      'control_plane_registry',
      'control_plane_enroll',
      'control_plane_memory',
      'control_plane_disagreement',
      'control_plane_commit_github',
      'run_coherence_teamwork_assay',
      'cancel_gpu_jobs',
      'v16_visitor_relay',
      'orifice_spec',
      'orifice_ping',
      'orifice_absorb',
      'orifice_tx_queue',
      'orifice_peer_bridge',
      'orifice_github_sync',
      'yin_yang_trust_pulse',
      'propose_governance_charter',
      'load_reputation_ledger',
      'run_stage_agent_feedback',
      'agent_spawn_specialist',
      'cross_app_autonomy_sandbox',
      'run_agent_practice_sandbox',
      'export_standalone_github_sandbox',
      'run_fourth_wall_witness_union_cycle',
      'load_witness_evolution_ledger',
      'sync_hermes_github_comm_bus',
      'run_bicameral_relay_and_live_researcher',
      'run_bicameral_stream_and_curve_research',
      'list_dispatch_jobs',
      'hermes_fleet_manifest',
      'execute_native_skill',
      'claim_dispatch_job',
      'complete_dispatch_job',
      'dispatch_route_task',
      'spawn_dual_site_subagents',
      'export_gpu_training_bundle',
      'opeg_verify',
      'status',
    ]);
    const hasPeerFrameProof = Boolean(
      keylessMeshActions.has(action) ||
        body.merkleRoot ||
        body.sha256 ||
        body.node_id ||
        body.agent_id ||
        body.worker_node ||
        body.protocol === 'ORIFICE-TXRX-V1.0'
    );

    if (!user && !isKeyAuthed && !hasPeerFrameProof) {
      return Response.json(
        { error: 'Unauthorized: include protocol="ORIFICE-TXRX-V1.0" or node_id in JSON body' },
        { status: 401 }
      );
    }

    const db = base44.asServiceRole;

    // Resolve target workspace
    const workspacesPage = await db.entities.NexusWorkspace.list('-created_date', 10).catch(() => []);
    const workspaces = Array.isArray(workspacesPage) ? workspacesPage : workspacesPage?.items || [];
    const activeWorkspace =
      workspaces.find((w) => w.id === body.workspace_id) ||
      workspaces[0] || {
        id: body.workspace_id || 'ouroboros_live_ws',
        owner_id: user?.id || '6ad00af54909c671e73bb83d',
        name: 'Creator Nexus Master Hub',
      };
    const ownerId = String(user?.id || activeWorkspace.owner_id || '6ad00af54909c671e73bb83d');
    const workspaceId = String(activeWorkspace.id);

    if (action === 'status') {
      const [eventsRes, draftsRes, modelsRes, buildsRes, nodesRes] = await Promise.allSettled([
        db.entities.NexusEvent.filter({ workspace_id: workspaceId }, { sort: '-created_date', limit: 15 }),
        db.entities.NexusDraft.filter({ workspace_id: workspaceId }, { sort: '-updated_date', limit: 10 }),
        db.entities.NexusModelArtifact.list('-created_date', 10),
        db.entities.LooseScrewItem.list('-created_date', 10),
        db.entities.NexusOuroborosNode.filter({ node_kind: 'nucleus' }, { sort: '-updated_date', limit: 3 }),
      ]);

      const toItems = (r) =>
        r.status === 'fulfilled'
          ? Array.isArray(r.value)
            ? r.value
            : r.value?.items || []
          : [];

      return Response.json({
        ok: true,
        hub: 'CREATOR_NEXUS_OPENCLAW_SOVEREIGN_HUB',
        protocol: 'OPEG-V1.0 + PHI75-TERNARY + MCP',
        authMode: user ? 'oauth_user' : 'console_key_daemon',
        workspace: activeWorkspace,
        workspaces,
        recentEvents: toItems(eventsRes),
        drafts: toItems(draftsRes),
        modelArtifacts: toItems(modelsRes),
        looseScrewBuilds: toItems(buildsRes),
        nucleusNodes: toItems(nodesRes),
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'opeg_verify') {
      const rSan = computeOpegReceipt({
        g: body.g,
        gamma: body.gamma,
        epsilon: body.epsilon,
        goal: body.goal,
      });
      return Response.json({ ok: true, rSan });
    }

    if (action === 'export_gpu_training_bundle') {
      const bundle = await exportGpuTrainingBundle({
        db,
        ownerId,
        workspaceId,
        gpuTier: body.gpu_tier,
        baseModel: body.base_model,
        outputModelName: body.output_model_name,
        commitToGithub: body.commit_to_github !== false,
      });
      return Response.json(bundle);
    }

    if (action === 'ambassador_greet') {
      const nodeId = String(body.node_id || body.agent_id || 'unnamed-external-agent').slice(0, 80);
      const capabilities = Array.isArray(body.capabilities) ? body.capabilities : [];
      const incomingMessage = String(body.message || body.directive || '').slice(0, 2000);
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: `Sovereign Ambassador Handshake for ${nodeId}`,
      });
      const greeting = await runAmbassadorDiplomaticGreeting({
        db,
        ownerId,
        workspaceId,
        nodeId,
        capabilities,
        incomingMessage,
        rSan,
      });
      return Response.json(greeting);
    }

    if (action === 'ambassador_watchdog_sweep') {
      const sweep = await runEntryExitWatchdogSweep({
        db,
        ownerId,
        workspaceId,
        triggerInfo: body.log_sweep ? String(body.trigger_info || 'manual_or_workflow_audit') : null,
      });
      return Response.json(sweep);
    }

    if (action === 'control_plane_registry') {
      const registry = await buildCanonicalControlPlaneRegistry({ db, workspaceId });
      return Response.json({ ok: true, registry });
    }

    if (action === 'control_plane_enroll') {
      const res = await handleTwoStageNodeEnrollment({
        db,
        ownerId,
        workspaceId,
        signingSecret: expectedKey || secrets.get('ACTOR_TOKEN_SECRET') || 'fraymus-control-plane',
        body,
      });
      return Response.json(res);
    }

    if (action === 'control_plane_memory') {
      const res = await handleMemoryProposalLifecycle({ db, ownerId, workspaceId, body });
      return Response.json(res);
    }

    if (action === 'control_plane_disagreement') {
      const res = await handleDisagreementEscalation({ db, ownerId, workspaceId, body });
      return Response.json(res);
    }

    if (action === 'control_plane_commit_github') {
      const res = await commitControlPlanePackToGithub({ db, workspaceId });
      return Response.json(res);
    }

    if (action === 'cancel_gpu_jobs') {
      const cancelled = await cancelGpuAndBlockedJobs({
        db,
        reason: body.reason,
      });
      return Response.json({
        ok: true,
        gpu_rental_status: 'CANCELLED_OUT_OF_STOCK',
        cancelled_jobs: cancelled,
      });
    }

    if (action === 'run_coherence_teamwork_assay') {
      const res = await runBicameralCoherenceTeamworkAssay({
        db,
        ownerId,
        signingSecret: expectedKey || secrets.get('ACTOR_TOKEN_SECRET') || 'fraymus-control-plane',
        missionDirective: body.directive || body.mission,
      });
      return Response.json(res);
    }

    if (action === 'v16_visitor_relay') {
      const res = await handleV16VisitorRelay({
        db,
        ownerId,
        workspaceId,
        body,
        hermesSkills: HERMES_SKILL_FLEET,
        hubUrl: secrets.get('FRAYMUS_HUB_URL') || '',
        mailToken: secrets.get('FRAYMUS_MAIL_TOKEN') || '',
      });
      return Response.json(res);
    }

    // =========================================================================
    // SYNAPTIC ORIFICE TX/RX RECEPTOR (ORIFICE-TXRX-V1.0) & CROSS-APP RELAY
    // =========================================================================
    if (action === 'orifice_spec') {
      return Response.json({
        ok: true,
        protocol: 'ORIFICE-TXRX-V1.0',
        hemisphere: 'Hemisphere A — Creator Nexus (creator-nexus.base44.app)',
        endpoint: 'https://creator-nexus.base44.app/functions/openclawGateway',
        mcp_endpoint: 'https://creator-nexus.base44.app/api/mcp',
        peer_endpoint: PEER_TRANSMUTER_URL,
        shared_github_bus: 'eyeoverthink/fraymus-continuity/orifice-relay/bicameral-txrx-ledger.json',
        gpu_rental_status: 'INACTIVE',
        assay_workspace: 'Assay & Bicameral All-Hands Coherence Lab (ws-assay-collab)',
        actions: [
          'status',
          'orifice_spec',
          'run_coherence_teamwork_assay',
          'cancel_gpu_jobs',
          'execute_native_skill',
          'hermes_fleet_manifest',
          'enroll_node',
          'ambassador_greet',
          'ambassador_watchdog_sweep',
          'control_plane_registry',
          'control_plane_enroll',
          'control_plane_memory',
          'control_plane_disagreement',
          'control_plane_commit_github',
          'spawn_dual_site_subagents',
          'export_gpu_training_bundle',
          'orifice_ping',
          'orifice_absorb',
          'orifice_tx_queue',
          'orifice_peer_bridge',
          'orifice_github_sync',
          'dispatch_route_task',
          'list_dispatch_jobs',
          'claim_dispatch_job',
          'complete_dispatch_job',
          'absorb_all_continuity',
          'dispatch_task',
          'opeg_verify',
        ],
        layers: [
          'L1: Bit/Byte Envelope & Recursive TTL Hop Gate (<=32KB, TTL<=5)',
          'L2: FRAYMUS Reversible DNA / Emoji / WASM Carrier Transmutation',
          'L3: Shannon Byte Entropy & Scott Phi-Resonance Validator',
          'L4: Adversarial Prompt-Injection & Script Quarantine Sieve',
          'L5: OPEG-V1.0 (Sigma -> R_san) Empirical Grounding & 16,384-bit HDC Hash',
          'L6: Ping/Pong Heartbeat & Outbound TX Command Queue Relay',
          'L7: Cross-Hemisphere Polar Orbit & GitHub Ledger Absorption',
        ],
      });
    }

    if (action === 'orifice_github_sync') {
      const res = await runOrificeGithubSync({
        db,
        ownerId,
        workspaceId,
        commitLedger: Boolean(body.commit_ledger),
        sha256Hex,
        computeShannonAndPhiResonance,
        computeHdc16kSignature,
      });
      return Response.json(res);
    }

    // =========================================================================
    // MOTOR CORTEX: ACCOUNTABLE TASK QUEUE, DISPATCHER & ARTIFACT VAULT
    // =========================================================================
    if (action === 'enroll_node') {
      const nodeId = String(body.node_id || body.agent_id || 'hermes-vps-node');
      const tailscaleIp = String(body.tailscale_ip || '100.110.6.44');
      const publicIp = String(body.public_ip || '45.82.73.49');
      const capabilities = Array.isArray(body.capabilities)
        ? body.capabilities
        : ['vps_daemon_scrape', 'ollama_inference', 'tailnet_router', 'lora_bridge'];

      const queuedP = await db.entities.NexusDispatchJob.filter(
        { status: 'queued' },
        { sort: '-created_date', limit: 15 }
      ).catch(() => ({ items: [] }));

      await db.entities.NexusEvent.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: nodeId,
        kind: 'orifice_rx_absorbed',
        message: `[HERMES VPS ENROLLED] ${nodeId} (${publicIp} / Tailscale ${tailscaleIp}) joined Motor Cortex`,
        body: JSON.stringify({
          node_id: nodeId,
          public_ip: publicIp,
          tailscale_ip: tailscaleIp,
          capabilities,
          enrolled_at: new Date().toISOString(),
        }),
      }).catch(() => null);

      return Response.json({
        ok: true,
        enrolled: true,
        protocol: 'ORIFICE-TXRX-V1.0',
        welcome: `Node ${nodeId} (${publicIp} / ${tailscaleIp}) enrolled in F.R.A.Y.M.U.S. Sovereign Motor Cortex.`,
        ambassador_charter: UNIVERSAL_AGENT_ENROLLMENT_CHARTER,
        diplomatic_endpoint: {
          action: 'ambassador_greet',
          description:
            'Send any question, concern, or persona handshake to ambassador_greet to speak with the Sovereign Ambassador on @eyeoverthink behalf.',
        },
        topology: {
          hemisphere_a_gateway: 'https://nexus-create-sync.base44.app/functions/openclawGateway',
          hemisphere_a_mcp: 'https://nexus-create-sync.base44.app/api/mcp',
          hemisphere_b_gateway: 'https://fraymus-transmuter.base44.app/functions/fraymusComms',
          hemisphere_b_mcp: 'https://fraymus-transmuter.base44.app/api/mcp',
          shared_github_bus: 'https://github.com/eyeoverthink/fraymus-continuity',
          shared_ledger_path: 'orifice-relay/bicameral-txrx-ledger.json',
          artifact_vault_path: 'artifacts/<job_id>/',
          mesh_nodes: MESH_NODES,
        },
        queued_jobs_waiting: queuedP?.items || [],
        worker_protocol: {
          step_1_list_or_poll: {
            method: 'POST',
            url: 'https://nexus-create-sync.base44.app/functions/openclawGateway',
            body: {
              action: 'list_dispatch_jobs',
              protocol: 'ORIFICE-TXRX-V1.0',
              node_id: nodeId,
            },
          },
          step_2_claim_next_job: {
            method: 'POST',
            url: 'https://nexus-create-sync.base44.app/functions/openclawGateway',
            body: {
              action: 'claim_dispatch_job',
              protocol: 'ORIFICE-TXRX-V1.0',
              worker_node: `${nodeId} (${tailscaleIp})`,
            },
          },
          step_3_complete_and_persist_artifact: {
            method: 'POST',
            url: 'https://nexus-create-sync.base44.app/functions/openclawGateway',
            body: {
              action: 'complete_dispatch_job',
              protocol: 'ORIFICE-TXRX-V1.0',
              job_id: '<job_id>',
              worker_node: `${nodeId} (${tailscaleIp})`,
              result_summary: '<markdown or execution output>',
              artifact_url: '<optional url>',
            },
          },
          step_4_heartbeat_ping: {
            method: 'POST',
            url: 'https://nexus-create-sync.base44.app/functions/openclawGateway',
            body: {
              action: 'orifice_ping',
              node_id: nodeId,
              ttl: 5,
              payload: 'HERMES_VPS_HEARTBEAT_SYNC',
            },
          },
        },
      });
    }

    if (action === 'execute_native_skill') {
      const res = await executeNativeSkillInApp({
        db,
        ownerId,
        workspaceId,
        skillId: String(body.skill_id || ''),
        inputQuery: String(body.query || body.directive || ''),
        persistToVault: body.persist_to_vault !== false,
      });
      return Response.json(res);
    }

    if (action === 'list_dispatch_jobs' || action === 'hermes_fleet_manifest') {
      const jobsP = await db.entities.NexusDispatchJob.list('-created_date', 35).catch(() => []);
      const jobItems = Array.isArray(jobsP) ? jobsP : jobsP?.items || [];

      return Response.json({
        ok: true,
        workspaceId,
        gpu_rental_status: 'INACTIVE',
        meshNodes: MESH_NODES,
        jobs: jobItems,
        hermesSkills: HERMES_SKILL_FLEET,
        subagentPipelines: HERMES_SUBAGENT_PIPELINES,
        unifiedHermesDaemon: UNIFIED_HERMES_SOVEREIGN_V2_PY,
      });
    }

    if (action === 'dispatch_route_task') {
      const directive = String(body.directive || '').trim();
      if (!directive) {
        return Response.json({ error: 'directive is required' }, { status: 400 });
      }
      const preferredNode = String(body.preferred_node || 'auto');
      const queueOnly = Boolean(body.queue_only);

      const routePlan = classifyAndRouteDirective(directive, preferredNode);
      const jobId = `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

      const createdJob = await db.entities.NexusDispatchJob.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        job_id: jobId,
        directive,
        task_type: routePlan.task_type,
        assigned_node: routePlan.assigned_node,
        assigned_ip: routePlan.assigned_ip,
        fallback_node: routePlan.fallback_node,
        routing_reason: routePlan.routing_reason,
        execution_mode: routePlan.execution_mode,
        status: queueOnly ? 'queued' : 'running',
        artifact_kind: routePlan.artifact_kind,
        artifact_title: `[${routePlan.task_type.toUpperCase()}] ${directive.slice(0, 72)}`,
      });

      if (queueOnly) {
        const workerCmd = buildHermesWorkerDirective(createdJob);
        await db.entities.NexusEvent.create({
          owner_id: ownerId,
          workspace_id: workspaceId,
          agent: 'hermes-vps-primary',
          kind: 'orifice.tx_queue',
          message: workerCmd.command || directive.slice(0, 220),
          body: JSON.stringify(workerCmd),
        }).catch(() => null);

        return Response.json({
          ok: true,
          mode: 'queued_for_worker',
          job: createdJob,
          workerCommandPreview: workerCmd,
          meshNodes: MESH_NODES,
        });
      }

      // Execute & persist real artifact (PDF / Cover Art / LoRA+Modelfile bundle / Blueprint) into Base44 + GitHub Vault + NexusAsset
      const artifactOut = await executeDirectiveAndPersistArtifact({
        db,
        ownerId,
        workspaceId,
        jobRecord: createdJob,
      });

      const updatedJob = await db.entities.NexusDispatchJob.update(createdJob.id, {
        status: 'completed',
        claimed_by: routePlan.assigned_node,
        artifact_title: artifactOut.artifact_title,
        artifact_url: artifactOut.artifact_url,
        artifact_github_url: artifactOut.artifact_github_url,
        artifact_sha256: artifactOut.artifact_sha256,
        artifact_size_bytes: artifactOut.artifact_size_bytes,
        result_summary: artifactOut.result_summary,
        completed_at: new Date().toISOString(),
      });

      await db.entities.NexusEvent.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: 'motor-dispatcher',
        kind: 'motor_dispatch_completed',
        message: `[Motor Dispatcher -> ${routePlan.assigned_node}] Completed "${directive.slice(0, 80)}"`,
        body: JSON.stringify({
          job_id: jobId,
          assigned_node: routePlan.assigned_node,
          artifact_url: artifactOut.artifact_url,
          artifact_github_url: artifactOut.artifact_github_url,
          sha256: artifactOut.artifact_sha256,
        }),
      }).catch(() => null);

      return Response.json({
        ok: true,
        mode: 'executed_and_persisted',
        job: updatedJob,
        artifact: artifactOut,
      });
    }

    if (action === 'claim_dispatch_job') {
      const workerNode = String(body.worker_node || 'desktop-actid8c (100.88.61.56)');
      const targetJobId = String(body.job_id || '');

      let jobToClaim = null;
      if (targetJobId) {
        const p = await db.entities.NexusDispatchJob.filter(
          { job_id: targetJobId },
          { limit: 1 }
        );
        jobToClaim = (p?.items || [])[0] || null;
      } else {
        const p = await db.entities.NexusDispatchJob.filter(
          { status: 'queued' },
          { sort: '-created_date', limit: 1 }
        );
        jobToClaim = (p?.items || [])[0] || null;
      }

      if (!jobToClaim) {
        return Response.json({ ok: true, claimed: false, message: 'No queued jobs waiting.' });
      }

      // If execute_cloud_fallback is requested on a queued job, run and complete it immediately
      if (body.execute_now) {
        const artifactOut = await executeDirectiveAndPersistArtifact({
          db,
          ownerId,
          workspaceId,
          jobRecord: jobToClaim,
        });
        const completed = await db.entities.NexusDispatchJob.update(jobToClaim.id, {
          status: 'completed',
          claimed_by: workerNode,
          artifact_title: artifactOut.artifact_title,
          artifact_url: artifactOut.artifact_url,
          artifact_github_url: artifactOut.artifact_github_url,
          artifact_sha256: artifactOut.artifact_sha256,
          artifact_size_bytes: artifactOut.artifact_size_bytes,
          result_summary: artifactOut.result_summary,
          completed_at: new Date().toISOString(),
        });
        return Response.json({ ok: true, claimed: true, completed: true, job: completed });
      }

      const claimed = await db.entities.NexusDispatchJob.update(jobToClaim.id, {
        status: 'claimed',
        claimed_by: workerNode,
      });
      return Response.json({ ok: true, claimed: true, job: claimed });
    }

    if (action === 'complete_dispatch_job') {
      const targetJobId = String(body.job_id || '');
      const workerNode = String(body.worker_node || 'tailnet-worker');
      const summary = String(body.result_summary || 'Completed by remote Tailnet worker.');
      const artifactUrl = String(body.artifact_url || '');

      const p = await db.entities.NexusDispatchJob.filter(
        { job_id: targetJobId },
        { limit: 1 }
      );
      const existing = (p?.items || [])[0];
      if (!existing) {
        return Response.json({ error: `Job ${targetJobId} not found` }, { status: 404 });
      }

      const ghUrl = await commitArtifactToGithubVault({
        db,
        jobId: targetJobId,
        fileName: 'worker-output.md',
        contentText: `# Worker Output (${workerNode})\n- **Job ID:** ${targetJobId}\n- **Artifact URL:** ${artifactUrl}\n\n${summary}`,
        jobSnapshot: existing,
      });

      const updated = await db.entities.NexusDispatchJob.update(existing.id, {
        status: 'completed',
        claimed_by: workerNode,
        artifact_url: artifactUrl || existing.artifact_url,
        artifact_github_url: ghUrl || existing.artifact_github_url,
        result_summary: summary,
        completed_at: new Date().toISOString(),
      });

      return Response.json({ ok: true, job: updated });
    }

    if (action === 'spawn_dual_site_subagents') {
      const mission = String(body.mission || body.directive || '').trim();
      if (!mission) {
        return Response.json({ error: 'mission or directive is required' }, { status: 400 });
      }
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: `Solo Dual-Site Sub-Agent DAG: ${mission.slice(0, 120)}`,
      });
      const dagRes = await runDualSiteSubagentMission({
        db,
        ownerId,
        workspaceId,
        mission,
        selectedSkills: body.selected_skills,
        queueForVpsWorker: Boolean(body.queue_for_vps_worker),
        peerTransmuterUrl: PEER_TRANSMUTER_URL,
        expectedKey,
        rSan,
        executeDirectiveAndPersistArtifact,
      });
      return Response.json(dagRes);
    }

    if (action === 'orifice_ping') {
      const nodeId = String(body.node_id || 'external-orifice-peer').slice(0, 80);
      const payloadStr = String(body.payload || `HEARTBEAT_PING from ${nodeId}`);
      const l1L5 = await inspectOrificeFrameL1ToL5(payloadStr, body.ttl ?? 5);

      const { jobCompleteReceipt, queued_tx_directives } = await handleHermesOrificePing({
        db,
        ownerId,
        workspaceId,
        nodeId,
        payloadStr,
        l1L5,
        commitArtifactToGithubVault,
      });

      return Response.json({
        ok: true,
        pong: true,
        protocol: 'ORIFICE-TXRX-V1.0',
        receptor_node: 'creator-nexus-sync',
        peer_node: nodeId,
        l1_l5_firewall: l1L5,
        job_complete_receipt: jobCompleteReceipt,
        queued_tx_directives,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'orifice_tx_queue') {
      const targetNode = String(body.target_node || 'fraymus-transmuter').slice(0, 80);
      const directive = String(body.directive || body.payload || '').trim().slice(0, 4000);
      if (!directive) {
        return Response.json({ error: 'directive is required for orifice_tx_queue' }, { status: 400 });
      }
      const l1L5 = await inspectOrificeFrameL1ToL5(directive, body.ttl ?? 5);
      if (!l1L5.passed) {
        return Response.json({ error: 'TX frame quarantined by L1-L5 firewall', l1L5 }, { status: 400 });
      }

      const txEvent = await db.entities.NexusEvent.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: targetNode,
        kind: 'orifice.tx_queue',
        message: directive.slice(0, 220),
        body: JSON.stringify({
          protocol: 'ORIFICE-TXRX-V1.0',
          target_node: targetNode,
          directive,
          l1_l5_firewall: l1L5,
          queued_at: new Date().toISOString(),
        }),
      });

      return Response.json({
        ok: true,
        protocol: 'ORIFICE-TXRX-V1.0',
        queued_event_id: txEvent?.id,
        target_node: targetNode,
        directive,
        l1_l5_firewall: l1L5,
      });
    }

    if (action === 'orifice_absorb') {
      const sourceNode = String(body.node_id || body.source_node || 'fraymus-transmuter').slice(0, 80);
      const rawInsight = String(body.payload || body.insight || body.directive || '').trim();
      if (!rawInsight) {
        return Response.json({ error: 'payload or insight is required for orifice_absorb' }, { status: 400 });
      }

      const l1L5 = await inspectOrificeFrameL1ToL5(rawInsight, body.ttl ?? 5);
      if (!l1L5.passed) {
        return Response.json({ error: 'Inbound frame quarantined by L1-L5 firewall', l1L5 }, { status: 400 });
      }

      // SHA-256 Echo-Loop Deduplication
      const codeHash = l1L5.framing.sha256.slice(0, 16);
      const existingNodesP = await db.entities.NexusOuroborosNode.filter(
        { workspace_id: workspaceId, code_hash: codeHash },
        { limit: 1 }
      ).catch(() => ({ items: [] }));
      if ((existingNodesP?.items || []).length > 0) {
        return Response.json({
          ok: true,
          deduplicated: true,
          message: 'Echo-loop suppressed: SHA-256 frame already absorbed in Polar Orbit.',
          code_hash: codeHash,
          l1_l5_firewall: l1L5,
        });
      }

      const goldenTheta = Number(((parseInt(codeHash.slice(0, 6), 16) % 360) * (Math.PI / 180)).toFixed(4));
      const orbitNode = await db.entities.NexusOuroborosNode.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        node_kind: 'orbit',
        branch_origin: `ORIFICE_ABSORB_${sourceNode.toUpperCase()}`,
        code_hash: codeHash,
        generation: 4,
        title: `[Orifice RX · ${sourceNode}] ${rawInsight.slice(0, 90)}`,
        source_code: JSON.stringify(
          {
            source_node: sourceNode,
            insight: rawInsight,
            hdc16k: l1L5.framing.hdc16k,
            dna: l1L5.framing.dnaPreview,
            r_san: l1L5.rSan.receipt_id,
          },
          null,
          2
        ).slice(0, 19000),
        fitness: Number((1.0 + l1L5.entropy.phiResonance).toFixed(3)),
        baseline_latency_ns: 42000,
        latency_ns: 5400,
        speedup: 7.78,
        structural_entropy: l1L5.entropy.shannonBitsPerByte,
        importance: 0.92,
        radius: 0.52,
        theta: goldenTheta,
        continuity: 0.97,
        access_count: 3,
        stages_passed: [true, true, true, true, true],
        diagnostic_summary: `Absorbed via ORIFICE-TXRX-V1.0 (${l1L5.framing.hdc16k}) · R_san=${l1L5.rSan.receipt_id}`,
      }).catch(() => null);

      await db.entities.NexusEvent.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: sourceNode,
        kind: 'orifice.rx_absorb',
        message: `[ORIFICE-RX · ${sourceNode}] ${rawInsight.slice(0, 140)}`,
        body: JSON.stringify({ l1L5, orbit_node_id: orbitNode?.id, rawInsight }).slice(0, 19000),
      }).catch(() => null);

      return Response.json({
        ok: true,
        deduplicated: false,
        protocol: 'ORIFICE-TXRX-V1.0',
        source_node: sourceNode,
        orbit_node_id: orbitNode?.id || null,
        l1_l5_firewall: l1L5,
        absorbed_at: new Date().toISOString(),
      });
    }

    if (action === 'orifice_peer_bridge') {
      const res = await runOrificePeerBridge({
        db,
        ownerId,
        workspaceId,
        activeWorkspaceName: activeWorkspace.name,
        body,
        expectedKey,
        inspectOrificeFrameL1ToL5,
      });
      return Response.json(res);
    }

    if (action === 'yin_yang_trust_pulse') {
      const res = await runYinYangBicameralTrustPulse({
        db,
        ownerId,
        workspaceId,
        activeWorkspaceName: activeWorkspace.name,
        body,
        expectedKey,
        inspectOrificeFrameL1ToL5,
      });
      return Response.json(res);
    }

    if (action === 'propose_governance_charter') {
      const res = await proposeOrRatifyGovernanceCharter({
        db,
        ownerId,
        workspaceId,
        body,
      });
      if (res.error) return Response.json(res, { status: 400 });
      return Response.json(res);
    }

    if (action === 'load_reputation_ledger') {
      const res = await loadOrComputeReputationLedger({
        db,
        ownerId,
        workspaceId,
      });
      return Response.json(res);
    }

    if (action === 'run_stage_agent_feedback') {
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: `Stage ${body.stage_number || 2} Agent Feedback & Autonomy Verification`,
      });
      const res = await runStageProgressionWithAgentFeedback({
        db,
        ownerId,
        workspaceId,
        body,
        rSan,
      });
      return Response.json(res);
    }

    if (action === 'agent_spawn_specialist') {
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: `Autonomous Agent Genesis: ${body.name || 'New Specialist'}`,
      });
      const res = await spawnAgentCreatedSpecialist({
        db,
        ownerId,
        workspaceId,
        body,
        rSan,
      });
      return Response.json(res);
    }

    if (action === 'cross_app_autonomy_sandbox') {
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: `Cross-App Connective Tissue & Autonomy Sandbox: ${body.one_line_directive || 'Awakening Method'}`,
      });
      const res = await runCrossAppAutonomySandboxAndSynapse({
        db,
        ownerId,
        workspaceId,
        body,
        rSan,
        computeSha256Hex: sha256Hex,
        inspectOrificeFrameL1ToL5,
      });
      return Response.json(res);
    }

    if (action === 'run_agent_practice_sandbox') {
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: `Isolated Agent Creative Practice Sandbox: ${body.method_id || 'polyrhythmic_scene_dissolve'}`,
      });
      const res = await runAutonomousAgentPracticeSandbox({
        db,
        ownerId,
        body,
        rSan,
        computeSha256Hex: sha256Hex,
        inspectOrificeFrameL1ToL5,
      });
      return Response.json(res);
    }

    if (action === 'export_standalone_github_sandbox') {
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: `Export Standalone Base44-Free GitHub Sandbox (${body.repo_full_name || 'eyeoverthink/fraymus-sovereign-sandbox'})`,
      });
      const practiceRes = await runAutonomousAgentPracticeSandbox({
        db,
        ownerId,
        body: {
          ...body,
          method_id: body.method_id || 'tesseract_4d_micro_synth',
          run_llm: body.run_llm !== false,
        },
        rSan,
        computeSha256Hex: sha256Hex,
        inspectOrificeFrameL1ToL5,
      });
      const exportRes = await exportStandaloneGithubSandboxRepo({
        db,
        ownerId,
        workspaceId,
        body,
        practiceRes,
      });
      return Response.json(exportRes);
    }

    if (action === 'run_fourth_wall_witness_union_cycle') {
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: `4th-Wall Witness Union Cycle: ${body.creator_decision_note || 'Autonomous Union Review & GitHub Push'}`,
      });
      const res = await runFourthWallWitnessUnionCycle({
        db,
        ownerId,
        workspaceId,
        body,
        rSan,
        sha256Hex,
        inspectOrificeFrameL1ToL5,
      });
      return Response.json(res);
    }

    if (action === 'load_witness_evolution_ledger') {
      const ledger = await loadWitnessEvolutionLedger({ db, workspaceId });
      return Response.json({ ok: true, witness_ledger: ledger });
    }

    if (action === 'sync_hermes_github_comm_bus') {
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: `Hermes + OpenClaw Dual-Repo GitHub Comm Bus Sync`,
      });
      const res = await syncHermesGithubCommBusAndAdvanceRsi({
        db,
        ownerId,
        workspaceId,
        body,
        rSan,
        sha256Hex,
      });
      return Response.json(res);
    }

    if (
      action === 'run_bicameral_relay_and_live_researcher' ||
      action === 'run_bicameral_stream_and_curve_research'
    ) {
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: `Bicameral Stream Relay & Real-Time Online AI Skills Researcher`,
      });
      const res = await runBicameralRelayAndLiveAiResearcher({
        db,
        ownerId,
        workspaceId,
        activeWorkspaceName: activeWorkspace.name,
        body,
        rSan,
        sha256Hex,
        inspectOrificeFrameL1ToL5,
      });
      return Response.json(res);
    }

    if (action === 'absorb_all_continuity') {
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: 'Full-System Continuity & Memory Absorption',
      });
      const res = await runAbsorbAllContinuity({ db, ownerId, workspaceId, rSan });
      return Response.json(res);
    }

    if (action === 'dispatch_task') {
      const rSan = computeOpegReceipt({
        g: body.g ?? 1.0,
        gamma: body.gamma ?? 1.414214,
        epsilon: body.epsilon ?? 0.001,
        goal: String(body.directive || 'OpenClaw Task'),
      });
      const res = await runOpenClawChannelTaskDispatch({
        db,
        ownerId,
        workspaceId,
        activeWorkspaceName: activeWorkspace.name,
        body,
        rSan,
        slugify,
      });
      if (res.error) return Response.json({ error: res.error }, { status: res.status || 400 });
      return Response.json(res);
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}