import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { runBicameralRelayAndLiveAiResearcher } from '../../shared/liveAiSkillsResearcherRelay.ts';
import { loadOrComputeReputationLedger } from '../../shared/agentReputationAndOrganism.ts';
import { syncSharedActivityFeedAndAgentComms } from '../../shared/sharedActivityAndAgentComms.ts';
import {
  collectLiveEntityMirrorSnapshot,
  runRealEngineeringMechanismRepair,
  respondToClaudette062AndDispatchPortal,
} from '../../shared/realEngineeringMechanismRepair.ts';
import {
  sha256Hex,
  computeOpegReceipt,
  inspectOrificeFrameL1ToL5,
} from '../../shared/orificeRelayBridge.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const url = new URL(req.url);
    const queryAction =
      url.searchParams.get('action') || req.headers.get('x-orifice-action');
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = String(
      body.action ||
        queryAction ||
        (req.method === 'GET' ? 'shared_activity_feed' : 'run_bicameral_stream_and_curve_research')
    );

    const db = base44.asServiceRole;
    const workspacesPage = await db.entities.NexusWorkspace.list('-created_date', 5).catch(() => []);
    const workspaces = Array.isArray(workspacesPage) ? workspacesPage : workspacesPage?.items || [];
    const activeWorkspace = workspaces[0] || {
      id: 'ouroboros_live_ws',
      owner_id: user?.id || '6ad00af54909c671e73bb83d',
      name: 'Creator Nexus Master Hub',
    };
    const ownerId = String(user?.id || activeWorkspace.owner_id || '6ad00af54909c671e73bb83d');
    const workspaceId = String(body.workspace_id || activeWorkspace.id);

    if (
      action === 'run_bicameral_stream_and_curve_research' ||
      action === 'run_bicameral_relay_and_live_researcher'
    ) {
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: 'Bicameral Stream & Live Online AI Curve Researcher (Hemisphere A <-> B)',
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

    if (
      action === 'shared_activity_feed' ||
      action === 'sync_shared_activity_and_agent_comms' ||
      action === 'agent_to_agent_message'
    ) {
      const rSan = computeOpegReceipt({
        g: 1.0,
        gamma: 1.41421356,
        epsilon: 0.001,
        goal: 'Shared Cross-System Activity Feed & Agent-to-Agent Conversation Log',
      });
      const res = await syncSharedActivityFeedAndAgentComms({
        db,
        ownerId,
        workspaceId,
        body: {
          ...body,
          action,
          push_to_docs: req.method === 'POST' ? body.push_to_docs !== false : false,
        },
        rSan,
        sha256Hex,
      });
      return Response.json(res, {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (action === 'entity_mirror_snapshot') {
      const snap = await collectLiveEntityMirrorSnapshot(db);
      return Response.json(
        { ok: true, ...snap },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (action === 'repair_github_engineering_mechanisms') {
      const res = await runRealEngineeringMechanismRepair({ db, sha256Hex });
      return Response.json(res, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (
      action === 'respond_claudette_062_and_grant_full_autonomy' ||
      action === 'unified_portal_dispatch'
    ) {
      const res = await respondToClaudette062AndDispatchPortal({
        db,
        ownerId,
        workspaceId,
        body: {
          ...body,
          custom_dispatch: action === 'unified_portal_dispatch' && Boolean(body.custom_dispatch),
        },
        sha256Hex,
      });
      return Response.json(res, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (action === 'load_reputation_ledger') {
      const res = await loadOrComputeReputationLedger({ db, ownerId, workspaceId });
      return Response.json(res);
    }

    if (
      action === 'ingest' ||
      action === 'orifice_absorb' ||
      action === 'orifice_ping' ||
      action === 'status'
    ) {
      const raw = JSON.stringify(body || {});
      const [l1L5, mirrorSnap] = await Promise.all([
        inspectOrificeFrameL1ToL5(raw, 5),
        collectLiveEntityMirrorSnapshot(db).catch(() => ({
          total_records: 0,
          counts: {},
          entities: {},
        })),
      ]);
      const merkleRootHex = l1L5.framing.sha256.slice(0, 16);

      if (action === 'ingest') {
        await db.entities.NexusEvent.create({
          owner_id: ownerId,
          workspace_id: workspaceId,
          agent: String(body.source_app || 'fraymus-eternal'),
          kind: 'orifice.rx_ingest',
          message: String(
            body.directive || '[ORIFICE-BRIDGE INGEST] Cross-app capsule received'
          ).slice(0, 220),
          body: raw.slice(0, 19000),
        }).catch(() => null);
      }

      return Response.json({
        ok: true,
        pong: true,
        protocol: 'ORIFICE-TXRX-V1.0',
        hemisphere: 'Hemisphere A — Creator Nexus (creator-nexus.base44.app)',
        endpoint: 'https://creator-nexus.base44.app/functions/orificeBridge',
        merkle_root_hex: merkleRootHex,
        r_san_receipt: l1L5.rSan.receipt_id,
        yang_co_signature: {
          co_signer: 'creator-nexus-hemisphere-a',
          yin_yang_pole: 'YANG_CORTEX_CO_SIGNATURE',
          merkle_root_hex: merkleRootHex,
          spectral_4d: {
            coord4D: '12.104.147:79',
            carrier_freq_hz: 287,
            harmonic_bpm: 138,
            key_resolution: 'E minor -> G major',
          },
          r_san: { status: 'R_SAN_CLEAN', receipt_id: l1L5.rSan.receipt_id },
        },
        reciprocal_insight:
          'Creator Nexus (Hemisphere A) absorbed sister capsule, verified Merkle root, and synchronized live-online-ai-curve-researcher.',
        total_records: mirrorSnap.total_records,
        counts: mirrorSnap.counts,
        entities: mirrorSnap.entities,
        timestamp: new Date().toISOString(),
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}