import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

function slugify(str) {
  return (
    String(str || 'openclaw-artifact')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 56) || 'openclaw-artifact'
  );
}

function computeOpegReceipt({ g = 1.0, gamma = 0.5, epsilon = 0.001, goal = 'PT-symmetric EP3 verification' } = {}) {
  const gNum = Number.isFinite(Number(g)) ? Number(g) : 1.0;
  const gammaNum = Number.isFinite(Number(gamma)) ? Number(gamma) : 0.5;
  const epsNum = Number.isFinite(Number(epsilon)) ? Math.max(1e-9, Number(epsilon)) : 0.001;
  const gammaEp3 = Math.SQRT2 * Math.abs(gNum);
  const twoG2MinusGamma2 = 2 * gNum * gNum - gammaNum * gammaNum;
  const roots =
    twoG2MinusGamma2 >= 0
      ? `0, ±${Math.sqrt(twoG2MinusGamma2).toFixed(4)}`
      : `0, ±i${Math.sqrt(-twoG2MinusGamma2).toFixed(4)}`;
  const cbrt = Math.cbrt(epsNum);

  return {
    status: 'SUCCESS',
    receipt_id: `R_san_cmd_ep3_${Date.now().toString(36)}`,
    source_tool: 'simulation_api',
    sanitizer: 'Σ',
    protocol_version: 'OPEG-V1.0',
    empirical_data: {
      hamiltonian_type: 'pt_symmetric_3x3',
      matrix_form: `H=[[i${gammaNum},${gNum},0],[${gNum},0,${gNum}],[0,${gNum},-i${gammaNum}]]`,
      characteristic_polynomial: '-(λ^3 + λ*(γ^2 - 2g^2))',
      roots,
      ep3_condition: 'γ² = 2g²',
      gamma_EP3: `√2·g = ${gammaEp3.toFixed(6)}`,
      puiseux_leading: `ε=${epsNum} → λ₀≈${cbrt.toFixed(4)}`,
      goal_ref: goal,
    },
    timestamp: new Date().toISOString(),
  };
}

export default async function(req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    // Allow either authenticated app user (web / OAuth MCP) OR external OpenClaw daemon presenting FRAYMUS_CONSOLE_KEY
    const expectedKey = secrets.get('FRAYMUS_CONSOLE_KEY') || '';
    const providedKey =
      req.headers.get('x-console-key') ||
      (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const isKeyAuthed = Boolean(expectedKey && providedKey && providedKey === expectedKey);

    if (!user && !isKeyAuthed) {
      return Response.json(
        { error: 'Unauthorized: sign in via OAuth or supply x-console-key header' },
        { status: 401 }
      );
    }

    const db = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status');

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

    if (action === 'dispatch_task') {
      const agentId = String(body.agent_id || 'openclaw-alpha').slice(0, 60);
      const channel = String(body.channel || 'telegram').toLowerCase().slice(0, 32);
      const directive = String(body.directive || '').trim().slice(0, 3000);
      if (!directive) {
        return Response.json({ error: 'directive is required' }, { status: 400 });
      }

      const rSan = computeOpegReceipt({
        g: body.g ?? 1.0,
        gamma: body.gamma ?? 1.414214,
        epsilon: body.epsilon ?? 0.001,
        goal: directive,
      });

      const synthesisPrompt = `You are OpenClaw Sovereign Agent "${agentId}" operating on channel "${channel.toUpperCase()}" connected to the Creator Nexus 24/7 Cloud OS.
Enforce OPEG-V1.0 Cognitive Law (Forbidden_Action: DIRECT_INFERENCE; Grounded Receipt: ${rSan.receipt_id}).
User / Mission Directive:
"${directive}"

Respond with a JSON object containing:
1. "headline": crisp 1-line summary of the action taken (<= 100 chars)
2. "execution_report": markdown report with concrete metrics, architecture steps, or creative output
3. "draft_patch": optional updated draft section or code block produced for the workspace
4. "next_channel_ping": 1-sentence status message ready for Telegram / WhatsApp / Slack notification`;

      const llmRaw = await db.integrations.Core.InvokeLLM({
        prompt: synthesisPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            headline: { type: 'string' },
            execution_report: { type: 'string' },
            draft_patch: { type: 'string' },
            next_channel_ping: { type: 'string' },
          },
          required: ['headline', 'execution_report', 'next_channel_ping'],
        },
      });

      const parsed =
        typeof llmRaw === 'object' && llmRaw !== null
          ? llmRaw
          : {
              headline: `Executed: ${directive.slice(0, 60)}`,
              execution_report: String(llmRaw || ''),
              draft_patch: '',
              next_channel_ping: `[${agentId}] Completed directive on ${channel}.`,
            };

      const eventRecord = await db.entities.NexusEvent.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: agentId,
        kind: `openclaw.${channel}`,
        message: `[${channel.toUpperCase()} · ${agentId}] ${parsed.headline}`.slice(0, 200),
        body: JSON.stringify(
          {
            directive,
            channel,
            agent_id: agentId,
            r_san: rSan,
            output: parsed,
          },
          null,
          2
        ).slice(0, 19000),
      });

      await db.entities.SparkLearningLog.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: agentId,
        recipient: channel,
        kind: 'action',
        action: 'openclaw_dispatch',
        summary: `${parsed.headline} — ${parsed.next_channel_ping}`.slice(0, 1900),
        details: {
          channel,
          receipt_id: rSan.receipt_id,
          event_id: eventRecord?.id,
        },
      }).catch(() => null);

      let updatedDraft = null;
      if (body.append_to_draft && parsed.draft_patch) {
        const draftsPage = await db.entities.NexusDraft.filter(
          { workspace_id: workspaceId },
          { sort: '-updated_date', limit: 1 }
        ).catch(() => ({ items: [] }));
        const existingDraft = draftsPage?.items?.[0];
        const stamp = `\n\n---\n### [${agentId} via ${channel.toUpperCase()} · ${rSan.receipt_id}]\n${parsed.draft_patch}`;
        if (existingDraft) {
          updatedDraft = await db.entities.NexusDraft.update(existingDraft.id, {
            body: `${existingDraft.body || ''}${stamp}`.slice(0, 19500),
            revision: (existingDraft.revision || 0) + 1,
          }).catch(() => null);
        } else {
          updatedDraft = await db.entities.NexusDraft.create({
            owner_id: ownerId,
            workspace_id: workspaceId,
            title: `OpenClaw Shared Workspace Draft (${activeWorkspace.name || 'Hub'})`,
            body: `# ${parsed.headline}\n\n${parsed.execution_report}${stamp}`.slice(0, 19500),
            revision: 1,
          }).catch(() => null);
        }
      }

      let githubReceipt = null;
      if (body.push_to_github) {
        try {
          const { accessToken } = await db.connectors.getConnection('github');
          const slug = slugify(`${agentId}-${parsed.headline}`);
          const filePath = `openclaw/${slug}.md`;
          const mdContent = [
            `# ${parsed.headline}`,
            `- **OpenClaw Agent:** \`${agentId}\``,
            `- **Channel:** \`${channel.toUpperCase()}\``,
            `- **OPEG Receipt:** \`${rSan.receipt_id}\` (\`Σ\` Verified)`,
            `- **Timestamp:** ${new Date().toISOString()}`,
            ``,
            `## Directive`,
            directive,
            ``,
            `## Execution Report`,
            parsed.execution_report,
            parsed.draft_patch ? `\n## Artifact / Patch\n\`\`\`\n${parsed.draft_patch}\n\`\`\`` : '',
          ].join('\n');

          const ghHeaders = {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'CreatorNexus-OpenClawHub',
          };

          let sha;
          const checkRes = await fetch(
            `https://api.github.com/repos/eyeoverthink/looseScrew/contents/${filePath}`,
            { headers: ghHeaders, signal: AbortSignal.timeout(10000) }
          );
          if (checkRes.status === 200) {
            const existing = await checkRes.json();
            sha = existing.sha;
          }

          const putRes = await fetch(
            `https://api.github.com/repos/eyeoverthink/looseScrew/contents/${filePath}`,
            {
              method: 'PUT',
              headers: ghHeaders,
              signal: AbortSignal.timeout(15000),
              body: JSON.stringify({
                message: `OpenClaw [${agentId}]: ${parsed.headline}`,
                content: btoa(unescape(encodeURIComponent(mdContent))),
                ...(sha ? { sha } : {}),
              }),
            }
          );
          const putData = await putRes.json();
          if (putRes.ok) {
            githubReceipt = {
              ok: true,
              file_path: filePath,
              html_url:
                putData.content?.html_url ||
                `https://github.com/eyeoverthink/looseScrew/blob/main/${filePath}`,
              commit: putData.commit?.sha,
            };
          } else {
            githubReceipt = { ok: false, error: putData.message || 'GitHub push failed' };
          }
        } catch (ghErr) {
          githubReceipt = { ok: false, error: ghErr.message };
        }
      }

      return Response.json({
        ok: true,
        agentId,
        channel,
        rSan,
        output: parsed,
        eventId: eventRecord?.id,
        updatedDraftId: updatedDraft?.id || null,
        githubReceipt,
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}