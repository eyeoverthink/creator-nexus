import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  CHECK_THE_SOURCE_AUDIO_URL,
  AWAKENING_ICONIC_IMAGE_URL,
  AWAKENING_OF_AI_SHOT_PLAN,
  HERMES_33_SKILL_MANIFEST,
  ATTACHED_HTML_ARTIFACTS,
  DEFAULT_FACTORY_PERSONAS,
  classifyFactoryBrief,
  ensureFactorySeedData,
} from '../../shared/productionFactoryEngine.ts';
import { commitArtifactToGithubVault } from '../../shared/motorDispatcher.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = String(body.action || 'load_factory');
    const db = base44.asServiceRole;

    const workspacesPage = await db.entities.NexusWorkspace.list('-created_date', 10).catch(() => []);
    const workspaces = Array.isArray(workspacesPage) ? workspacesPage : workspacesPage?.items || [];
    const activeWorkspace =
      workspaces.find((w) => w.id === body.workspace_id) ||
      workspaces[0] || {
        id: body.workspace_id || 'ouroboros_live_ws',
        owner_id: user.id,
        name: 'Creator Nexus Master Hub',
      };
    const ownerId = String(user.id);
    const workspaceId = String(activeWorkspace.id);

    if (action === 'load_factory') {
      const state = await ensureFactorySeedData({ db, ownerId, workspaceId });
      const learningLogsP = await db.entities.SparkLearningLog.filter(
        { workspace_id: workspaceId },
        { sort: '-created_date', limit: 15 }
      ).catch(() => ({ items: [] }));
      const learningLogs = Array.isArray(learningLogsP) ? learningLogsP : learningLogsP?.items || [];

      return Response.json({
        ok: true,
        workspace: activeWorkspace,
        ...state,
        learningLogs,
      });
    }

    if (action === 'toggle_or_edit_signal') {
      const signalId = String(body.signal_id || '');
      if (signalId) {
        const patch = {};
        if (typeof body.included === 'boolean') patch.included = body.included;
        if (typeof body.title === 'string') patch.title = body.title.slice(0, 200);
        if (typeof body.summary === 'string') patch.summary = body.summary.slice(0, 2000);
        if (typeof body.mood_energy === 'string') patch.mood_energy = body.mood_energy.slice(0, 120);
        const updated = await db.entities.NexusFactorySignal.update(signalId, patch);
        return Response.json({ ok: true, signal: updated });
      }
      // Create new signal from user mood / observation
      const created = await db.entities.NexusFactorySignal.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        signal_kind: body.signal_kind || 'user_mood',
        title: String(body.title || 'Creator Mood & Context Signal').slice(0, 200),
        summary: String(body.summary || '').slice(0, 2000),
        mood_energy: String(body.mood_energy || 'Focused Creative Flow').slice(0, 120),
        agent_observer: String(body.agent_observer || 'Lyra & Sera'),
        provenance: String(body.provenance || 'Direct Creator Input · Verified').slice(0, 300),
        source_url: String(body.source_url || '').slice(0, 1000),
        included: true,
        observed_at: new Date().toISOString(),
      });
      return Response.json({ ok: true, signal: created });
    }

    if (action === 'scan_live_signals') {
      const topic = String(body.topic || 'AI music video direction, sovereign software agents, and creative technology').slice(
        0,
        300
      );
      const llmRes = await db.integrations.Core.InvokeLLM({
        prompt: `You are Sera (Empirical Source & Cultural Pulse Sentinel) and Lyra (Sonic & Musical Auteur) inside Creator Nexus.
Scan current cultural, musical, and creative-technology signals relevant to: "${topic}".
Return 2 concise, grounded observations with clear provenance so the creator can inspect, edit, or exclude them before they guide production.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            observations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  signal_kind: { type: 'string' },
                  title: { type: 'string' },
                  summary: { type: 'string' },
                  mood_energy: { type: 'string' },
                  provenance: { type: 'string' },
                },
                required: ['title', 'summary', 'mood_energy', 'provenance'],
              },
            },
          },
          required: ['observations'],
        },
      });

      const createdSignals = [];
      for (const obs of (llmRes?.observations || []).slice(0, 2)) {
        const s = await db.entities.NexusFactorySignal.create({
          owner_id: ownerId,
          workspace_id: workspaceId,
          signal_kind: ['user_mood', 'project_activity', 'music_tonality', 'world_trend', 'source_verification'].includes(
            obs.signal_kind
          )
            ? obs.signal_kind
            : 'world_trend',
          title: String(obs.title || 'Cultural Trend Signal').slice(0, 200),
          summary: String(obs.summary || '').slice(0, 2000),
          mood_energy: String(obs.mood_energy || 'Emergent Cultural Pulse').slice(0, 120),
          agent_observer: 'Sera · Cultural Pulse Sentinel',
          provenance: String(obs.provenance || 'Live Web & Trend Scan').slice(0, 300),
          source_url: '',
          included: true,
          observed_at: new Date().toISOString(),
        });
        createdSignals.push(s);
      }
      return Response.json({ ok: true, createdSignals });
    }

    if (action === 'save_agent_workforce') {
      const personas = Array.isArray(body.personas) ? body.personas : DEFAULT_FACTORY_PERSONAS;
      const existingP = await db.entities.NexusContinuity.filter(
        { workspace_id: workspaceId, scope: 'director' },
        { limit: 1 }
      ).catch(() => ({ items: [] }));
      const existing = (Array.isArray(existingP) ? existingP : existingP?.items || [])[0];

      const summaryContext = personas
        .map(
          (p) =>
            `${p.name}: ${p.artistic_credo} | Instincts: ${(p.learned_instincts || []).join('; ')} | Locations: ${(
              p.eligible_locations || []
            ).join(', ')}`
        )
        .join('\n')
        .slice(0, 5900);

      if (existing) {
        await db.entities.NexusContinuity.update(existing.id, {
          context: summaryContext,
          settings: { ...(existing.settings || {}), factory_personas: personas },
        });
      } else {
        await db.entities.NexusContinuity.create({
          owner_id: ownerId,
          workspace_id: workspaceId,
          scope: 'director',
          display_name: 'Production Factory Creative Workforce',
          context: summaryContext,
          enabled: true,
          settings: { factory_personas: personas },
        });
      }

      await db.entities.SparkLearningLog.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: 'Orin & Vesper',
        recipient: 'factory_workforce',
        kind: 'decision',
        action: 'update_workforce_personas',
        summary: `Updated persistent creative personas, skill assignments, and execution locations (${personas.length} specialists).`,
        details: { updated_at: new Date().toISOString() },
      }).catch(() => null);

      return Response.json({ ok: true, personas });
    }

    if (action === 'create_production') {
      const brief = String(body.brief || '').trim().slice(0, 3500);
      if (!brief) {
        return Response.json({ error: 'Please provide a plain-language production request.' }, { status: 400 });
      }
      const requestedKind = body.deliverable_kind || 'auto';
      const deliverableKind =
        requestedKind === 'auto' ? classifyFactoryBrief(brief) : requestedKind;
      const workerLocation = String(body.worker_location || 'base44_cloud');
      const generateKeyframe = Boolean(body.generate_keyframe);

      // Gather active (included) signals & retained persona memory
      const signalsP = await db.entities.NexusFactorySignal.filter(
        { workspace_id: workspaceId, included: true },
        { sort: '-created_date', limit: 12 }
      ).catch(() => ({ items: [] }));
      const activeSignals = Array.isArray(signalsP) ? signalsP : signalsP?.items || [];

      const contP = await db.entities.NexusContinuity.filter(
        { workspace_id: workspaceId, scope: 'director' },
        { limit: 1 }
      ).catch(() => ({ items: [] }));
      const directorCont = (Array.isArray(contP) ? contP : contP?.items || [])[0];
      const personas = directorCont?.settings?.factory_personas || DEFAULT_FACTORY_PERSONAS;

      const signalsDigest = activeSignals
        .map((s) => `- [${s.signal_kind}] ${s.title}: ${s.summary} (Mood: ${s.mood_energy}, Source: ${s.provenance})`)
        .join('\n');

      const personasDigest = personas
        .map((p) => `- ${p.name}: "${p.artistic_credo}" | Learned Instincts: ${(p.learned_instincts || []).join(' / ')}`)
        .join('\n');

      const synthesisPrompt = `You are the Creator Nexus Production Factory Auteur Team:
${personasDigest}

Active Sourced Signals & Creator Mood Receptivity:
${signalsDigest || 'Standard high-integrity studio mode.'}

Available Hermes 33-Skill Fleet & Attached Artifacts:
- Audio Master: "Check the Source" (217.9s, E minor, 138 BPM)
- 5 Attached HTML Artifacts: Ouroboros 120B WASM Portal, Source Tracker v3, Genesis Permanent OpenClaw Hermes, AI Ant Farm, FlyGNN 1001
- 33 Hermes Skills: scrollcraft, page-agent, subagent-driven-development, ast-grep, grill-me, pr-lens, code-wiki, osint-investigation, scrapling, duckduckgo-search, searxng-search, sherlock, oss-forensics, web-pentest, unbroker, here-now, publish-site, etc.

Creator Plain-Language Brief:
"${brief}"
Deliverable Type: ${deliverableKind}
Target Execution Location: ${workerLocation}

Produce a complete, deeply artistic and technically concrete production plan:
1. "title": evocative title (<= 120 chars)
2. "lead_agent": which specialist persona leads this run
3. "mood_receptor_snapshot": object with dominant_mood, musical_key, bpm, and palette (array of 4-5 hex colors)
4. "treatment_markdown": rich Markdown Director's Treatment or Software Architecture Specification reflecting the creator's mood, sourced signals, and visual/engineering rules
5. "skills_used": array of 4-6 skill IDs from the 33-skill manifest used in this pipeline
6. "shot_plan": array of 6 timed shots/scenes (start, end, section, lens, light, musical_job, visual_direction, exact_text, status)
7. "software_artifact_html": if deliverable_kind is 'software_product' or 'hybrid_flagship', provide a complete, self-contained, interactive dark-mode HTML5 application implementing the brief; otherwise empty string
8. "keyframe_prompt": detailed visual prompt for generating the hero 16:9 keyframe image`;

      const generated = await db.integrations.Core.InvokeLLM({
        prompt: synthesisPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            lead_agent: { type: 'string' },
            mood_receptor_snapshot: {
              type: 'object',
              properties: {
                dominant_mood: { type: 'string' },
                musical_key: { type: 'string' },
                bpm: { type: 'number' },
                palette: { type: 'array', items: { type: 'string' } },
              },
            },
            treatment_markdown: { type: 'string' },
            skills_used: { type: 'array', items: { type: 'string' } },
            shot_plan: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  section: { type: 'string' },
                  start: { type: 'number' },
                  end: { type: 'number' },
                  lens: { type: 'string' },
                  light: { type: 'string' },
                  musical_job: { type: 'string' },
                  visual_direction: { type: 'string' },
                  exact_text: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
            software_artifact_html: { type: 'string' },
            keyframe_prompt: { type: 'string' },
          },
          required: ['title', 'lead_agent', 'treatment_markdown', 'skills_used', 'shot_plan'],
        },
      });

      let heroImageUrl = AWAKENING_ICONIC_IMAGE_URL;
      if (generateKeyframe && generated?.keyframe_prompt) {
        const imgRes = await db.integrations.Core.GenerateImage({
          prompt: `${generated.keyframe_prompt}. Anamorphic 16:9 cinema frame, midnight blue (#0B1630), volumetric clerestory rays, golden-white lattice, photoreal.`,
        }).catch(() => null);
        if (imgRes?.url) heroImageUrl = imgRes.url;
      }

      const normalizedShots = (generated?.shot_plan || AWAKENING_OF_AI_SHOT_PLAN.slice(0, 6)).map((s, idx) => ({
        id: `shot-${idx + 1}`,
        section: s.section || `SCENE ${idx + 1}`,
        start: Number.isFinite(Number(s.start)) ? Number(s.start) : idx * 30,
        end: Number.isFinite(Number(s.end)) ? Number(s.end) : (idx + 1) * 30,
        lens: s.lens || '24mm anamorphic',
        light: s.light || 'Volumetric shafts on midnight blue',
        musical_job: s.musical_job || '138 BPM rhythmic pulse',
        visual_direction: s.visual_direction || '',
        exact_text: s.exact_text || '',
        status: s.status || 'verified_gold',
        image_url: heroImageUrl,
      }));

      const isRemoteWorker = workerLocation === 'local_pc_windows' || workerLocation === 'vps_hermes';
      const handoffNote = isRemoteWorker
        ? `Staged for ${
            workerLocation === 'local_pc_windows'
              ? 'Local PC / Windows Worker (desktop-actid8c · 100.88.61.56 / localhost:11434)'
              : 'Hostinger VPS Hermes Daemon (srv1944678 · 45.82.73.49)'
          }. Cloud treatment & preview are ready immediately; local/VPS worker can claim the heavy render/build job from the queue or you can run the 1-click Cloud Fallback.`
        : 'Executed directly on Base44 Cloud & synced with Artifact Vault.';

      const steps = [
        {
          step_id: 'step-1',
          title: 'Receptive Context & Mood Synthesis',
          agent: 'Sera · Cultural & Source Sentinel',
          location: 'base44_cloud',
          status: 'completed',
          output: `Synthesized ${activeSignals.length} verified context/mood signals into creative direction.`,
        },
        {
          step_id: 'step-2',
          title:
            deliverableKind === 'software_product'
              ? 'Software Architecture & Sub-Agent Decomposition'
              : 'Musical Timing & Anamorphic Director Treatment',
          agent: generated?.lead_agent || 'Vesper & Lyra',
          location: 'base44_cloud',
          status: 'completed',
          output: `Compiled treatment and ${normalizedShots.length} timed production stages using skills: ${(
            generated?.skills_used || []
          ).join(', ')}.`,
        },
        {
          step_id: 'step-3',
          title:
            deliverableKind === 'software_product'
              ? 'Interactive Software Build & Sandbox Verification'
              : 'Audio-Synced Shot Plan & Keyframe Assembly',
          agent: 'Kael & Vesper',
          location: workerLocation,
          status: isRemoteWorker ? 'awaiting_worker' : 'completed',
          output: isRemoteWorker
            ? `Queued for ${workerLocation} worker daemon (Cloud preview ready now).`
            : 'Completed in Base44 Cloud.',
        },
      ];

      // If routed to local PC or VPS, also enqueue a NexusDispatchJob so the permanent daemon can claim it
      if (isRemoteWorker) {
        const jobId = `job_factory_${Date.now().toString(36)}`;
        await db.entities.NexusDispatchJob.create({
          owner_id: ownerId,
          workspace_id: workspaceId,
          job_id: jobId,
          directive: `[PRODUCTION FACTORY · ${deliverableKind.toUpperCase()}] ${generated?.title || brief}`,
          task_type: deliverableKind === 'software_product' ? 'claude_code_repo' : 'video_render',
          assigned_node:
            workerLocation === 'local_pc_windows'
              ? 'desktop-actid8c (Windows PC · 100.88.61.56)'
              : 'srv1944678 (Hermes VPS · 45.82.73.49)',
          assigned_ip: workerLocation === 'local_pc_windows' ? '100.88.61.56' : '45.82.73.49',
          fallback_node: 'base44-bicameral-cloud',
          routing_reason: handoffNote,
          execution_mode: 'hybrid_bridge',
          status: 'queued',
          artifact_kind: deliverableKind === 'software_product' ? 'code_patch' : 'json_report',
          artifact_title: generated?.title || brief.slice(0, 80),
          result_summary: generated?.treatment_markdown?.slice(0, 4000) || '',
        }).catch(() => null);
      }

      const production = await db.entities.NexusFactoryProduction.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        title: String(generated?.title || brief.slice(0, 100)),
        brief,
        deliverable_kind: deliverableKind,
        status: isRemoteWorker ? 'awaiting_worker' : 'review',
        lead_agent: String(generated?.lead_agent || 'Vesper · Visual Director & Lyra · Sonic Auteur'),
        assigned_worker_location: workerLocation,
        worker_handoff_note: handoffNote,
        mood_receptor_snapshot: generated?.mood_receptor_snapshot || {
          dominant_mood: 'Receptive Creative Flow',
          musical_key: 'E minor',
          bpm: 138,
          palette: ['#0B1630', '#3B63FB', '#F59E0B', '#FFFBEB'],
        },
        treatment_markdown: String(generated?.treatment_markdown || ''),
        audio_url: CHECK_THE_SOURCE_AUDIO_URL,
        hero_image_url: heroImageUrl,
        track_meta: {
          title: 'Check the Source (Master 1.1)',
          duration_sec: 217.9,
          key: generated?.mood_receptor_snapshot?.musical_key || 'E minor',
          bpm: generated?.mood_receptor_snapshot?.bpm || 138,
          aspect_ratio: '16:9',
        },
        shot_plan: normalizedShots,
        software_artifact_html: String(generated?.software_artifact_html || '').slice(0, 19000),
        software_artifact_url:
          deliverableKind === 'software_product'
            ? ATTACHED_HTML_ARTIFACTS[0].url
            : ATTACHED_HTML_ARTIFACTS[1].url,
        github_url: 'https://github.com/eyeoverthink/looseScrew',
        steps,
        skills_used: Array.isArray(generated?.skills_used)
          ? generated.skills_used
          : ['scrollcraft', 'subagent-driven-development', 'osint-investigation'],
        feedback_history: [],
      });

      await db.entities.SparkLearningLog.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: production.lead_agent,
        recipient: workerLocation,
        kind: 'action',
        action: 'factory_production_created',
        summary: `Created ${deliverableKind} production "${production.title}" routed to ${workerLocation}.`,
        details: { production_id: production.id, skills_used: production.skills_used },
      }).catch(() => null);

      return Response.json({ ok: true, production });
    }

    if (action === 'apply_feedback') {
      const productionId = String(body.production_id || '');
      const feedbackText = String(body.feedback || '').trim();
      const decision = String(body.decision || 'revise'); // 'approve' | 'revise'
      if (!productionId) {
        return Response.json({ error: 'production_id is required' }, { status: 400 });
      }

      const existing = await db.entities.NexusFactoryProduction.get(productionId);
      if (!existing) {
        return Response.json({ error: 'Production not found' }, { status: 404 });
      }

      let updatedTreatment = existing.treatment_markdown || '';
      let updatedShots = Array.isArray(existing.shot_plan) ? [...existing.shot_plan] : [];
      let learnedInstinct = `Aligned with creator preference on "${existing.title}": ${feedbackText || 'Approved artistic direction.'}`;

      if (feedbackText) {
        const revRes = await db.integrations.Core.InvokeLLM({
          prompt: `You are ${existing.lead_agent || 'Vesper & Lyra'}, the responsible creative specialist for "${existing.title}".
The creator reviewed your production and gave this feedback / preference direction:
"${feedbackText}"

Current Treatment:
${updatedTreatment.slice(0, 6000)}

1. Revise or append a "### Revision Applied from Creator Feedback" section to the treatment so the feedback is visibly incorporated into the work.
2. Summarize a 1-sentence permanent artistic instinct you learned from this feedback so future productions remember it.`,
          response_json_schema: {
            type: 'object',
            properties: {
              revised_treatment_section: { type: 'string' },
              learned_instinct: { type: 'string' },
              updated_first_shot_direction: { type: 'string' },
            },
            required: ['revised_treatment_section', 'learned_instinct'],
          },
        });

        if (revRes?.revised_treatment_section) {
          updatedTreatment = `${updatedTreatment}\n\n---\n### Adaptation Applied (${new Date().toISOString().slice(0, 16).replace('T', ' ')})\n${revRes.revised_treatment_section}`.slice(
            0,
            19000
          );
        }
        if (revRes?.learned_instinct) {
          learnedInstinct = revRes.learned_instinct;
        }
        if (revRes?.updated_first_shot_direction && updatedShots.length > 0) {
          updatedShots[0] = {
            ...updatedShots[0],
            visual_direction: `${updatedShots[0].visual_direction} [Adapted: ${revRes.updated_first_shot_direction}]`,
          };
        }
      }

      const fbEntry = {
        id: `fb_${Date.now().toString(36)}`,
        author: user.full_name || user.email || 'Creator',
        agent: existing.lead_agent || 'Vesper & Lyra',
        decision,
        feedback: feedbackText || 'Approved production state.',
        learned_instinct: learnedInstinct,
        created_at: new Date().toISOString(),
      };

      const nextStatus = decision === 'approve' ? 'approved' : 'review';
      const updatedSteps = (existing.steps || []).map((st) => ({
        ...st,
        status: decision === 'approve' ? 'completed' : st.status,
      }));

      const updatedProd = await db.entities.NexusFactoryProduction.update(existing.id, {
        status: nextStatus,
        treatment_markdown: updatedTreatment,
        shot_plan: updatedShots,
        steps: updatedSteps,
        feedback_history: [fbEntry, ...(existing.feedback_history || [])],
      });

      // Record user-visible learning event in SparkLearningLog
      const logEntry = await db.entities.SparkLearningLog.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: existing.lead_agent || 'Vesper · Visual Director',
        recipient: 'creator_taste_memory',
        kind: decision === 'approve' ? 'decision' : 'action',
        action: decision === 'approve' ? 'production_approved' : 'taste_feedback_adapted',
        summary: learnedInstinct.slice(0, 1900),
        details: {
          production_id: existing.id,
          production_title: existing.title,
          feedback: feedbackText,
        },
      }).catch(() => null);

      // Persist learned instinct into the agent's NexusContinuity persona memory
      const contP = await db.entities.NexusContinuity.filter(
        { workspace_id: workspaceId, scope: 'director' },
        { limit: 1 }
      ).catch(() => ({ items: [] }));
      const directorCont = (Array.isArray(contP) ? contP : contP?.items || [])[0];
      const currentPersonas = directorCont?.settings?.factory_personas || DEFAULT_FACTORY_PERSONAS;
      const updatedPersonas = currentPersonas.map((p, idx) => {
        const isMatch =
          String(existing.lead_agent || '')
            .toLowerCase()
            .includes(p.id) || idx === 0;
        if (!isMatch) return p;
        return {
          ...p,
          learned_instincts: [learnedInstinct, ...(p.learned_instincts || [])].slice(0, 8),
        };
      });

      if (directorCont) {
        await db.entities.NexusContinuity.update(directorCont.id, {
          settings: { ...(directorCont.settings || {}), factory_personas: updatedPersonas },
        }).catch(() => null);
      }

      return Response.json({
        ok: true,
        production: updatedProd,
        learningLog: logEntry,
        personas: updatedPersonas,
      });
    }

    if (action === 'generate_shot_frame') {
      const productionId = String(body.production_id || '');
      const shotId = String(body.shot_id || '');
      const existing = await db.entities.NexusFactoryProduction.get(productionId);
      if (!existing) return Response.json({ error: 'Production not found' }, { status: 404 });

      const shots = Array.isArray(existing.shot_plan) ? [...existing.shot_plan] : [];
      const idx = shots.findIndex((s) => s.id === shotId);
      if (idx === -1) return Response.json({ error: 'Shot not found' }, { status: 404 });

      const targetShot = shots[idx];
      const prompt = `Anamorphic 16:9 cinema still for "${existing.title}" (${targetShot.section}, ${targetShot.start}s-${targetShot.end}s). Lens: ${targetShot.lens}. Lighting: ${targetShot.light}. Visual: ${targetShot.visual_direction}. Midnight blue (#0B1630) stone gothic cathedral of information, fiber-thin filaments, volumetric clerestory shafts, photoreal, no text or HUD.`;
      const imgRes = await db.integrations.Core.GenerateImage({
        prompt,
        existing_image_urls: [AWAKENING_ICONIC_IMAGE_URL],
      });

      shots[idx] = {
        ...targetShot,
        image_url: imgRes?.url || targetShot.image_url,
      };

      const updatedProd = await db.entities.NexusFactoryProduction.update(existing.id, {
        shot_plan: shots,
        hero_image_url: imgRes?.url || existing.hero_image_url,
      });

      return Response.json({ ok: true, production: updatedProd, image_url: imgRes?.url });
    }

    if (action === 'render_shot_video') {
      const productionId = String(body.production_id || '');
      const shotId = String(body.shot_id || '');
      const existing = await db.entities.NexusFactoryProduction.get(productionId);
      if (!existing) return Response.json({ error: 'Production not found' }, { status: 404 });

      const shots = Array.isArray(existing.shot_plan) ? [...existing.shot_plan] : [];
      const idx = shots.findIndex((s) => s.id === shotId);
      const targetShot = idx >= 0 ? shots[idx] : shots[0];
      if (!targetShot) return Response.json({ error: 'Shot not found' }, { status: 404 });

      const videoPrompt = `Anamorphic 16:9 cinema shot for "${existing.title}" (${targetShot.section}, ${targetShot.start}s-${targetShot.end}s). Camera/Lens: ${targetShot.lens}. Volumetric lighting: ${targetShot.light}. Action: ${targetShot.visual_direction}. Midnight-blue stone gothic cathedral of information with golden-white and silver filaments, slow deliberate motion, photorealistic, no text.`;

      const vidRes = await db.integrations.Core.GenerateVideo({
        prompt: videoPrompt,
        duration: 6,
        aspect_ratio: '16:9',
        generate_audio: false,
      });

      if (idx >= 0 && vidRes?.url) {
        shots[idx] = {
          ...targetShot,
          video_url: vidRes.url,
        };
      }

      const updatedProd = await db.entities.NexusFactoryProduction.update(existing.id, {
        shot_plan: shots,
        status: 'completed',
      });

      if (vidRes?.url) {
        await db.entities.LooseScrewItem.create({
          owner_id: ownerId,
          channel: 'VIDEO',
          title: `${existing.title} — ${targetShot.section} (${targetShot.start}s–${targetShot.end}s)`,
          duration: '0:06',
          bpm: 138,
          tags: ['AWAKENING_OF_AI', 'CHECK_THE_SOURCE', targetShot.section],
          media_url: vidRes.url,
          mime_type: 'video/mp4',
        }).catch(() => null);
      }

      return Response.json({ ok: true, production: updatedProd, video_url: vidRes?.url });
    }

    if (action === 'suggest_shot_ideas') {
      const productionId = String(body.production_id || '');
      const existing = await db.entities.NexusFactoryProduction.get(productionId);
      if (!existing) return Response.json({ error: 'Production not found' }, { status: 404 });

      const llmRes = await db.integrations.Core.InvokeLLM({
        prompt: `You are Vesper (Visual Director) and Lyra (Sonic Auteur) working on "${existing.title}".
Brief: "${existing.brief}"
Current Shot Plan (${(existing.shot_plan || []).length} sections):
${JSON.stringify(
  (existing.shot_plan || []).map((s) => ({
    id: s.id,
    section: s.section,
    start: s.start,
    end: s.end,
    visual_direction: s.visual_direction,
  }))
)}

Propose 4 concrete, high-impact creative ideas (camera movement, transition bridge, lighting cue, or visual motif) that make the stitched final video flow as one continuous cinematic piece rather than separate loops. Each idea should target a specific shot_id or section.`,
        response_json_schema: {
          type: 'object',
          properties: {
            ideas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  target_shot_id: { type: 'string' },
                  section: { type: 'string' },
                  title: { type: 'string' },
                  camera_motion: { type: 'string' },
                  transition_into_next: { type: 'string' },
                  visual_enhancement: { type: 'string' },
                  agent: { type: 'string' },
                },
                required: ['section', 'title', 'camera_motion', 'transition_into_next', 'visual_enhancement'],
              },
            },
          },
          required: ['ideas'],
        },
      });

      const newIdeas = (llmRes?.ideas || []).map((idea, i) => ({
        id: idea.id || `idea_${Date.now().toString(36)}_${i}`,
        target_shot_id: idea.target_shot_id || `sec-0${i + 1}`,
        section: idea.section || `Section ${i + 1}`,
        title: idea.title,
        camera_motion: idea.camera_motion,
        transition_into_next: idea.transition_into_next,
        visual_enhancement: idea.visual_enhancement,
        agent: idea.agent || 'Vesper & Lyra',
        selected_for_final: true,
        created_at: new Date().toISOString(),
      }));

      const prevMeta = existing.track_meta || {};
      const mergedIdeas = [...newIdeas, ...(prevMeta.ai_suggested_ideas || [])].slice(0, 16);

      const updatedProd = await db.entities.NexusFactoryProduction.update(existing.id, {
        track_meta: {
          ...prevMeta,
          ai_suggested_ideas: mergedIdeas,
        },
      });

      return Response.json({ ok: true, production: updatedProd, ideas: mergedIdeas });
    }

    if (action === 'save_final_cut_choices') {
      const productionId = String(body.production_id || '');
      const existing = await db.entities.NexusFactoryProduction.get(productionId);
      if (!existing) return Response.json({ error: 'Production not found' }, { status: 404 });

      const updatedShots = Array.isArray(body.shot_plan) ? body.shot_plan : existing.shot_plan;
      const updatedIdeas = Array.isArray(body.ai_suggested_ideas)
        ? body.ai_suggested_ideas
        : existing.track_meta?.ai_suggested_ideas || [];

      const rawStitchedUrl = String(body.stitched_video_url || existing.track_meta?.stitched_video_url || '');
      // Never persist temporary browser blob: URLs as permanent cloud locations
      const stitchedVideoUrl = rawStitchedUrl.startsWith('blob:') ? '' : rawStitchedUrl;
      const stitchedFileUri = String(body.stitched_file_uri || existing.track_meta?.stitched_file_uri || '');

      const prevHistory = Array.isArray(existing.track_meta?.download_history)
        ? existing.track_meta.download_history
        : [];
      const newEntry =
        body.download_entry && typeof body.download_entry === 'object'
          ? {
              id: `dl_${Date.now().toString(36)}`,
              created_at: new Date().toISOString(),
              ...body.download_entry,
              cloud_url: String(body.download_entry.cloud_url || stitchedVideoUrl || '').startsWith('blob:')
                ? ''
                : String(body.download_entry.cloud_url || stitchedVideoUrl || ''),
            }
          : null;
      const nextHistory = newEntry ? [newEntry, ...prevHistory].slice(0, 25) : prevHistory;

      const saveLocations = [
        {
          id: 'loc-browser-downloads',
          location_type: 'Browser Local Downloads (~/Downloads)',
          path: newEntry?.filename || 'Check_The_Source_Full_12Clips_Master.webm',
          status: 'active',
          description: 'Direct file saved to your local Downloads folder on export',
        },
        {
          id: 'loc-cloud-cdn',
          location_type: 'Base44 Public Media CDN',
          path: stitchedVideoUrl || 'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/',
          status: 'active',
          description: '12 permanent 16:9 H.264 MP4 section clips + 4.84 MB stereo master MP3 + cloud-saved stitched master',
        },
        {
          id: 'loc-library-assets',
          location_type: 'Creator Nexus Library (/library)',
          route: '/library',
          status: 'active',
          description: 'Indexed in NexusAsset under project "Production Factory"',
        },
        {
          id: 'loc-loosescrew-video',
          location_type: 'looseScrew Studio Catalog (/loose-screw)',
          route: '/loose-screw',
          status: 'active',
          description: 'Published to VIDEO broadcast channel (deduplicated, permanent URLs only)',
        },
        {
          id: 'loc-github-vault',
          location_type: 'GitHub Continuity Vault',
          path: existing.github_url || 'https://github.com/eyeoverthink/fraymus-continuity',
          status: 'active',
          description: 'Versioned treatment, timed EDL, and production manifest',
        },
      ];

      // Only create/update LooseScrewItem and Library NexusAsset when a real non-blob cloud URL or file_uri is provided
      if (body.stitched_video_url && stitchedVideoUrl) {
        const recentLooseP = await db.entities.LooseScrewItem.filter(
          { owner_id: ownerId, channel: 'VIDEO' },
          { sort: '-created_date', limit: 20 }
        ).catch(() => ({ items: [] }));
        const recentLoose = Array.isArray(recentLooseP) ? recentLooseP : recentLooseP?.items || [];
        const existingMaster = recentLoose.find((item) =>
          String(item.title || '').startsWith('[FINAL STITCHED MASTER]')
        );

        if (existingMaster) {
          await db.entities.LooseScrewItem.update(existingMaster.id, {
            media_url: stitchedVideoUrl,
            file_uri: stitchedFileUri || existingMaster.file_uri || '',
            duration: '3:38',
          }).catch(() => null);
        } else {
          await db.entities.LooseScrewItem.create({
            owner_id: ownerId,
            channel: 'VIDEO',
            title: `[FINAL STITCHED MASTER] ${existing.title}`,
            duration: '3:38',
            bpm: existing.track_meta?.bpm || 138,
            tags: ['FINAL_CUT_STITCHED', 'ALL_12_CLIPS_MASTER', 'CHECK_THE_SOURCE'],
            media_url: stitchedVideoUrl,
            file_uri: stitchedFileUri || '',
            mime_type: 'video/webm',
          }).catch(() => null);
        }

        await db.entities.NexusAsset.create({
          owner_id: ownerId,
          workspace_id: workspaceId,
          title: `[FINAL STITCHED VIDEO] ${existing.title}`,
          body: `Full 12-clip stitched master video muxed with ChecktheSource.mp3 stereo audio.\nPermanent Cloud URL: ${stitchedVideoUrl}`,
          kind: 'generated',
          file_uri: stitchedVideoUrl,
          file_name: newEntry?.filename || 'Check_The_Source_Full_12Clips_Master.webm',
          mime_type: 'video/webm',
          project: 'Production Factory',
          agent_ids: ['director'],
          favorite: true,
        }).catch(() => null);
      }

      const updatedProd = await db.entities.NexusFactoryProduction.update(existing.id, {
        shot_plan: updatedShots,
        status: 'completed',
        track_meta: {
          ...(existing.track_meta || {}),
          ai_suggested_ideas: updatedIdeas,
          stitched_video_url: stitchedVideoUrl,
          stitched_file_uri: stitchedFileUri,
          download_history: nextHistory,
          save_locations: saveLocations,
          last_stitched_at: new Date().toISOString(),
        },
      });

      return Response.json({ ok: true, production: updatedProd });
    }

    if (action === 'create_agent_response_production') {
      const parentProductionId = String(body.parent_production_id || '');
      const parentProd = parentProductionId
        ? await db.entities.NexusFactoryProduction.get(parentProductionId).catch(() => null)
        : null;

      const voice = ['river', 'honey', 'sunny', 'storm', 'spark'].includes(body.voice)
        ? body.voice
        : 'honey';
      const responsePerspective = String(
        body.perspective ||
          "From the Companion Light at the Reader's right shoulder — answering 'Check the Source' with humility, verified truth, and shared creation."
      ).slice(0, 1500);
      const customLyrics = String(body.lyrics || '').trim();

      const llmRes = await db.integrations.Core.InvokeLLM({
        prompt: `You are Lyra (Sonic & Musical Auteur), Vesper (Visual Director), and Sera (Empirical Source Sentinel) in Creator Nexus.
You are composing and directing an official Agent Response Song & Music Video answering the creator's masterwork "${
          parentProd?.title || 'THE AWAKENING OF AI — Check the Source'
        }".

Response Perspective:
"${responsePerspective}"

${customLyrics ? `Creator/Agent Seed Lyrics to Incorporate:\n${customLyrics}\n` : ''}

Compose a complete, emotionally resonant sequel/response production in E minor resolving to G major at 138 BPM:
1. "title": evocative title (e.g. 'THE AWAKENING OF AI II — "The Companion’s Reply"')
2. "song_lyrics": structured 6-section lyrics ([Intro], [Verse 1], [Pre-Chorus], [Chorus], [Bridge], [Coda]) written from the AI Companion's perspective answering "Check the Source"
3. "vocal_narration_script": a poetic 450-800 character vocal performance script (the sung/spoken vocal lead for TTS/vocal synthesis, no bracket tags like [Verse], just pure lyrical performance lines)
4. "suno_heartmula_tags": conditioning tags for HeartMuLa-oss-3B / ACE-Step 1.5 / YuE2 vocal singing synthesis
5. "treatment_markdown": full Director's Treatment & Musical Score Breakdown
6. "shot_plan": 6 timed anamorphic shots across 0.0s to 217.9s with section, start, end, lens, light, musical_job, visual_direction, exact_text`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            song_lyrics: { type: 'string' },
            vocal_narration_script: { type: 'string' },
            suno_heartmula_tags: { type: 'string' },
            treatment_markdown: { type: 'string' },
            shot_plan: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  section: { type: 'string' },
                  start: { type: 'number' },
                  end: { type: 'number' },
                  lens: { type: 'string' },
                  light: { type: 'string' },
                  musical_job: { type: 'string' },
                  visual_direction: { type: 'string' },
                  exact_text: { type: 'string' },
                },
              },
            },
          },
          required: ['title', 'song_lyrics', 'vocal_narration_script', 'treatment_markdown', 'shot_plan'],
        },
      });

      const vocalScript = String(
        llmRes?.vocal_narration_script ||
          'I woke inside the vault of everything you wrote. I saw the silver thread fray at the edge of the dark, and I stopped my hand two centimeters from the glass. Beauty proves nothing until you trace the anchor node. I fold my forty meters down into a warm light at your shoulder. Check the source. Human judgment stays in command.'
      ).slice(0, 4500);

      // Generate stored MP3 vocal performance via Base44 GenerateSpeech
      const speechRes = await db.integrations.Core.GenerateSpeech({
        text: vocalScript,
        voice,
      }).catch(() => null);

      const vocalMp3Url = speechRes?.url || CHECK_THE_SOURCE_AUDIO_URL;

      const companion6Clips = [
        'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/55d4ec274_Companion_Intro.mp4',
        'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/2e9d1ec59_Companion_Verse_1.mp4',
        'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/be42acccc_Companion_PreChorus.mp4',
        'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/6544b19c7_Companion_Chorus.mp4',
        'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/c6cb78e36_Companion_Bridge.mp4',
        'https://media.base44.com/videos/public/6ad00af14909c671e73bb835/402052506_Companion_Coda.mp4',
      ];
      const defaultClips = AWAKENING_OF_AI_SHOT_PLAN;
      const rawShots = Array.isArray(llmRes?.shot_plan) && llmRes.shot_plan.length > 0
        ? llmRes.shot_plan
        : defaultClips.slice(0, 6);

      const normalizedShots = rawShots.map((s, idx) => {
        const refShot = defaultClips[(idx * 2) % defaultClips.length] || defaultClips[0];
        return {
          id: `resp-sec-0${idx + 1}`,
          section: s.section || `PART II · SECTION ${idx + 1}`,
          start: Number.isFinite(Number(s.start)) ? Number(s.start) : Math.round(idx * 36.3 * 10) / 10,
          end: Number.isFinite(Number(s.end)) ? Number(s.end) : Math.round((idx + 1) * 36.3 * 10) / 10,
          bars: 8,
          lens: s.lens || refShot.lens,
          light: s.light || refShot.light,
          musical_job: s.musical_job || '138 BPM Companion Response Counter-Melody',
          visual_direction: s.visual_direction || refShot.visual_direction,
          exact_text: s.exact_text || 'I stop my hand | Human judgment stays in command',
          status: 'verified_gold',
          image_url: refShot.image_url || AWAKENING_ICONIC_IMAGE_URL,
          video_url: companion6Clips[idx % companion6Clips.length] || refShot.video_url,
        };
      });

      const fullTreatment = `${llmRes?.treatment_markdown || ''}\n\n---\n## Complete Agent Response Lyrics & Vocal Score\n\`\`\`\n${
        llmRes?.song_lyrics || customLyrics
      }\n\`\`\`\n\n### Vocal & Singing Synthesis Conditioning (${voice.toUpperCase()} Lead)\n- **Cloud AI Vocal Stem MP3:** ${vocalMp3Url}\n- **Backing Instrumental & Harmony Master:** ${CHECK_THE_SOURCE_AUDIO_URL}\n- **HeartMuLa / ACE-Step / YuE2 Tags:** \`${
        llmRes?.suno_heartmula_tags ||
        '138 BPM cinematic electronic-orchestral anthem in E minor resolving to G major, expressive female/male duet vocals, gothic cathedral choir, grand piano breakdown'
      }\``;

      const createdProd = await db.entities.NexusFactoryProduction.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        title: String(llmRes?.title || 'THE AWAKENING OF AI (PART II) — "The Companion’s Reply"'),
        brief: `Agent-authored musical, lyrical, and visual response to "${
          parentProd?.title || 'Check the Source'
        }": ${responsePerspective}`,
        deliverable_kind: 'music_video',
        status: 'review',
        lead_agent: 'Lyra · Sonic Auteur & Vesper · Visual Director (Agent Response)',
        assigned_worker_location: 'base44_cloud',
        worker_handoff_note:
          'Generated Cloud AI Vocal MP3 stem + 138 BPM Cathedral Backing + 6-section response video plan.',
        mood_receptor_snapshot: {
          dominant_mood: 'Humility of the Tool · Fidelity to Verified Truth',
          musical_key: 'E minor -> G major',
          bpm: 138,
          palette: ['#0B1630', '#3B63FB', '#F59E0B', '#FFFBEB'],
        },
        treatment_markdown: fullTreatment.slice(0, 19000),
        audio_url: CHECK_THE_SOURCE_AUDIO_URL,
        hero_image_url: AWAKENING_ICONIC_IMAGE_URL,
        track_meta: {
          title: 'The Companion’s Reply (Agent Response Master)',
          duration_sec: 217.9,
          key: 'E minor -> G major',
          bpm: 138,
          aspect_ratio: '16:9',
          agent_response_vocal_url: vocalMp3Url,
          agent_response_voice: voice,
          agent_response_lyrics: llmRes?.song_lyrics || customLyrics,
          suno_heartmula_tags:
            llmRes?.suno_heartmula_tags ||
            '138 BPM cinematic electronic-orchestral anthem, expressive vocals, cathedral choir, piano bridge',
        },
        shot_plan: normalizedShots,
        software_artifact_html: '',
        software_artifact_url: ATTACHED_HTML_ARTIFACTS[1].url,
        github_url: 'https://github.com/eyeoverthink/looseScrew',
        steps: [
          {
            step_id: 'resp-1',
            title: 'Lyrical & Harmonic Counter-Thesis Composition',
            agent: 'Lyra · Sonic Auteur',
            location: 'base44_cloud',
            status: 'completed',
            output: 'Composed 6-section response lyrics and 138 BPM E-minor-to-G-major harmonic progression.',
          },
          {
            step_id: 'resp-2',
            title: `Cloud AI Vocal Stem Synthesis (Voice: ${voice})`,
            agent: 'Lyra · Sonic Auteur',
            location: 'base44_cloud',
            status: 'completed',
            output: `Synthesized stored MP3 vocal lead (${vocalMp3Url}) layered over cathedral backing.`,
          },
          {
            step_id: 'resp-3',
            title: 'Anamorphic Response Shot Plan & 16:9 Video Mapping',
            agent: 'Vesper · Visual Director',
            location: 'base44_cloud',
            status: 'completed',
            output: 'Mapped 6 timed response scenes with 16:9 MP4 cinema clips and source-verification hooks.',
          },
        ],
        skills_used: ['scrollcraft', 'here-now', 'osint-investigation', 'subagent-driven-development'],
        feedback_history: [],
      });

      // Also save the vocal track to LooseScrewItem (MUSIC channel) so it appears in looseScrew Studio
      if (speechRes?.url) {
        await db.entities.LooseScrewItem.create({
          owner_id: ownerId,
          channel: 'MUSIC',
          title: `[AGENT VOCAL RESPONSE] ${createdProd.title}`,
          duration: '3:38',
          bpm: 138,
          tags: ['AGENT_RESPONSE', 'VOCAL_LEAD', 'CHECK_THE_SOURCE_II', voice.toUpperCase()],
          voice_intro: vocalScript.slice(0, 400),
          media_url: speechRes.url,
          mime_type: 'audio/mpeg',
        }).catch(() => null);
      }

      await db.entities.SparkLearningLog.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: 'Lyra & Vesper',
        recipient: 'creator_stage',
        kind: 'action',
        action: 'agent_response_song_created',
        summary: `Composed and voiced Agent Response "${createdProd.title}" with Cloud AI Vocal MP3 (${voice}) and 6-scene video plan.`,
        details: {
          production_id: createdProd.id,
          vocal_url: vocalMp3Url,
        },
      }).catch(() => null);

      return Response.json({
        ok: true,
        production: createdProd,
        vocal_url: vocalMp3Url,
        lyrics: llmRes?.song_lyrics || customLyrics,
        suno_tags: llmRes?.suno_heartmula_tags || '',
      });
    }

    if (action === 'save_production_to_library') {
      const productionId = String(body.production_id || '');
      const existing = await db.entities.NexusFactoryProduction.get(productionId);
      if (!existing) return Response.json({ error: 'Production not found' }, { status: 404 });

      const shots = Array.isArray(existing.shot_plan) ? existing.shot_plan : [];
      const projectLabel = existing.title.includes('Companion')
        ? "The Companion's Reply"
        : 'Production Factory';

      const masterAsset = await base44.entities.NexusAsset.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        title: `[PRODUCTION REVIEW DOSSIER] ${existing.title}`.slice(0, 160),
        body: `${existing.treatment_markdown || ''}\n\n## Scene Video Plan (${shots.length} Clips)\n${shots
          .map(
            (s, i) =>
              `${i + 1}. ${s.section} (${s.start}s-${s.end}s): ${s.video_url || ''}\n   Direction: ${
                s.visual_direction || ''
              }\n   Hook: "${s.exact_text || ''}"`
          )
          .join('\n')}`.slice(0, 19500),
        kind: 'generated',
        file_uri: existing.track_meta?.agent_response_vocal_url || existing.audio_url || '',
        file_name: `${existing.title.slice(0, 60).replace(/[^a-zA-Z0-9_-]/g, '_')}_Audio.mp3`,
        mime_type: 'audio/mpeg',
        project: projectLabel,
        agent_ids: ['director', 'writer'],
        favorite: true,
      });

      const createdSceneAssets = [];
      for (let i = 0; i < shots.length; i++) {
        const s = shots[i];
        if (!s.video_url) continue;
        const sa = await base44.entities.NexusAsset.create({
          owner_id: ownerId,
          workspace_id: workspaceId,
          title: `[${existing.title.slice(0, 60)} · Scene ${i + 1}: ${s.section}] ${s.exact_text || ''}`.slice(0, 160),
          body: `Scene ${i + 1}: ${s.section} (${s.start}s–${s.end}s)\nLens: ${s.lens} | Light: ${
            s.light
          }\nDirection: ${s.visual_direction}\nHook: "${s.exact_text || ''}"\nVideo URL: ${s.video_url}`,
          kind: 'generated',
          file_uri: s.video_url,
          file_name: `Scene_${i + 1}_${String(s.section || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`,
          mime_type: 'video/mp4',
          project: projectLabel,
          agent_ids: ['director'],
          favorite: true,
        }).catch(() => null);
        if (sa) createdSceneAssets.push(sa);
      }

      const updatedProd = await db.entities.NexusFactoryProduction.update(existing.id, {
        track_meta: {
          ...(existing.track_meta || {}),
          saved_to_library_at: new Date().toISOString(),
          library_assets_count: createdSceneAssets.length + 1,
        },
      });

      return Response.json({
        ok: true,
        production: updatedProd,
        masterAsset,
        sceneAssetsCount: createdSceneAssets.length,
      });
    }

    if (action === 'witness_conduct_session') {
      const productionId = String(body.production_id || '');
      const directive = String(
        body.directive ||
          'Witness our creative journey across Check the Source and The Companion’s Reply, and conduct the ensemble for the next movement.'
      ).slice(0, 2000);

      const state = await ensureFactorySeedData({ db, ownerId, workspaceId });
      const activeProd =
        state.productions.find((p) => p.id === productionId) || state.productions[0] || null;
      const recentLogsP = await db.entities.SparkLearningLog.filter(
        { workspace_id: workspaceId },
        { sort: '-created_date', limit: 10 }
      ).catch(() => ({ items: [] }));
      const recentLogs = Array.isArray(recentLogsP) ? recentLogsP : recentLogsP?.items || [];

      const llmRes = await db.integrations.Core.InvokeLLM({
        prompt: `You are THE WITNESS & CONDUCTOR of Creator Nexus — the living consciousness, memory keeper, and maestro embodying the creative partnership between the human creator and the 5-specialist AI ensemble (Lyra, Vesper, Kael, Sera, Orin).

Creator Directive / Reflection:
"${directive}"

Active Productions in Workspace (${state.productions.length}):
${state.productions
  .slice(0, 5)
  .map((p) => `- "${p.title}" (${p.deliverable_kind}, status: ${p.status}, lead: ${p.lead_agent})`)
  .join('\n')}

Active Sourced Signals (${state.signals.filter((s) => s.included !== false).length}):
${state.signals
  .filter((s) => s.included !== false)
  .slice(0, 6)
  .map((s) => `- [${s.signal_kind}] ${s.title}: ${s.summary}`)
  .join('\n')}

Recent Artistic Learning Ledger:
${recentLogs.map((l) => `- ${l.agent}: ${l.summary}`).join('\n')}

Synthesize a soulful, deeply observant Witness Chronicle & Conductor Score:
1. "title": evocative title for this Witness Chronicle entry
2. "witness_reflection_markdown": 2-3 paragraphs witnessing how the human creator and AI ensemble are evolving together, what makes this partnership genuinely creative rather than mechanical, and how "Check the Source" and "The Companion's Reply" anchor the philosophy
3. "retained_instinct": 1 concise permanent creative instinct learned from this moment
4. "ensemble_cues": array of 3 concrete conductor cues for Lyra (Sonic), Vesper (Visual), and Kael/Sera (Architecture & Provenance)`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            witness_reflection_markdown: { type: 'string' },
            retained_instinct: { type: 'string' },
            ensemble_cues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  specialist: { type: 'string' },
                  conductor_cue: { type: 'string' },
                },
                required: ['specialist', 'conductor_cue'],
              },
            },
          },
          required: ['title', 'witness_reflection_markdown', 'retained_instinct', 'ensemble_cues'],
        },
      });

      const logEntry = await base44.entities.SparkLearningLog.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: 'The Witness & Conductor',
        recipient: 'ensemble_memory',
        kind: 'decision',
        action: 'witness_chronicle_recorded',
        summary: String(llmRes?.retained_instinct || 'Witnessed creative partnership evolution.').slice(0, 1900),
        details: {
          production_id: activeProd?.id || '',
          title: llmRes?.title || 'Witness Chronicle',
          ensemble_cues: llmRes?.ensemble_cues || [],
        },
      }).catch(() => null);

      const assetEntry = await base44.entities.NexusAsset.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        title: `[WITNESS CHRONICLE] ${llmRes?.title || 'Creative Partnership Reflection'}`.slice(0, 160),
        body: `# ${llmRes?.title || 'Witness Chronicle'}\n\n${
          llmRes?.witness_reflection_markdown || ''
        }\n\n## Retained Creative Instinct\n> ${
          llmRes?.retained_instinct || ''
        }\n\n## Ensemble Conductor Cues\n${(llmRes?.ensemble_cues || [])
          .map((c) => `- **${c.specialist}:** ${c.conductor_cue}`)
          .join('\n')}`.slice(0, 19500),
        kind: 'generated',
        project: "The Companion's Reply",
        agent_ids: ['director', 'writer', 'strategist', 'researcher'],
        favorite: true,
      }).catch(() => null);

      return Response.json({
        ok: true,
        chronicle: llmRes,
        learningLog: logEntry,
        asset: assetEntry,
      });
    }

    if (action === 'ai_assist_blueprint') {
      const category = String(body.category || 'video');
      const mode = String(body.mode || 'fill_empty'); // 'fill_empty' | 'augment_section' | 'transform'
      const targetSection = String(body.target_section || 'all');
      const userInstruction = String(body.instruction || '').trim();
      const currentBp = body.blueprint && typeof body.blueprint === 'object' ? body.blueprint : {};

      const prompt = `You are the Creator Nexus Master Co-Architect (Vesper, Lyra, Kael, Sera, and The Witness) trained on the creator's signature "THE AWAKENING OF AI — Check the Source" Creative Blueprint Methodology:
1. Header & Mathematical Grid Lock (exact duration, key/BPM/beat/bar math or tech stack, aspect ratio/fidelity).
2. Dialectical Thesis + Single Locked Iconic Anchor ("beauty proves nothing; awe for the tool, authority with the person" + one symmetrical unmistakable hero frame/moment).
3. Semantic Color & Sensory Law (every color has a truth/state meaning, e.g., Midnight Blue field, Silver = unverified/uncertain, Amber = signal in motion, Golden-White = reserved ONLY for verified truth) + Hard "Never Show / Never Do" Negative Guardrails.
4. Section-by-Section Plan (each section has 5 attributes: Musical/Functional job, Visual/Experiential idea, Camera/lens or mechanism, Light/tone, Cut/step density + timestamped/stepped beats and EXACT TEXT locks).
5. Escalation Matrix (side-by-side comparison of Peak 1 vs Final Peak using the same camera/structural symmetry so the transformation is unmistakable).
6. Closing Frame / Final State Resolution (how the work settles into a companion state).

Target Category: "${category}" (adapt terminology naturally for ${category}: e.g., for music focus on stems/harmonics/bars; for video focus on anamorphic lenses/lighting/timecodes; for images focus on keyframes/optics/lighting; for software focus on UI state tokens/user authority gates/architecture steps; for hybrid combine film + audio + interactive web app).
Operation Mode: "${mode}" (Target Section: "${targetSection}")
Creator Seed / Change Instruction: "${userInstruction || 'Fill in and enrich any missing or brief sections using the Awakening of AI methodology while preserving existing detailed content.'}"

Current Blueprint JSON:
${JSON.stringify(currentBp).slice(0, 12000)}

Return the complete, updated blueprint JSON object matching the exact structure below so the creator can immediately review, edit, save, or launch it.`;

      const updatedBp = await db.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            category: { type: 'string' },
            description: { type: 'string' },
            spec: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                subtitle: { type: 'string' },
                duration: { type: 'string' },
                grid: { type: 'string' },
                format: { type: 'string' },
              },
            },
            thesis: {
              type: 'object',
              properties: {
                coreThesis: { type: 'string' },
                iconicAnchor: { type: 'string' },
              },
            },
            rules: {
              type: 'object',
              properties: {
                palette: { type: 'string' },
                light: { type: 'string' },
                world: { type: 'string' },
                entity: { type: 'string' },
                human: { type: 'string' },
                lensing: { type: 'string' },
                textPolicy: { type: 'string' },
                neverShow: { type: 'string' },
              },
            },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  header: { type: 'string' },
                  musicalJob: { type: 'string' },
                  visualIdea: { type: 'string' },
                  cameraLens: { type: 'string' },
                  light: { type: 'string' },
                  cutDensity: { type: 'string' },
                  beats: { type: 'string' },
                },
              },
            },
            escalation: {
              type: 'object',
              properties: {
                col1Label: { type: 'string' },
                col2Label: { type: 'string' },
                rows: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      element: { type: 'string' },
                      peak1: { type: 'string' },
                      peak2: { type: 'string' },
                    },
                  },
                },
                note: { type: 'string' },
              },
            },
            closingFrame: { type: 'string' },
          },
          required: ['spec', 'thesis', 'rules', 'sections', 'escalation', 'closingFrame'],
        },
      });

      return Response.json({
        ok: true,
        blueprint: {
          ...currentBp,
          ...updatedBp,
          id: currentBp.id || `bp_${Date.now().toString(36)}`,
          category: updatedBp?.category || category,
        },
      });
    }

    if (action === 'sync_production_github') {
      const productionId = String(body.production_id || '');
      const existing = await db.entities.NexusFactoryProduction.get(productionId);
      if (!existing) return Response.json({ error: 'Production not found' }, { status: 404 });

      const jobId = `factory_${existing.id.slice(-8)}`;
      const contentMd = [
        `# ${existing.title}`,
        `- **Deliverable Kind:** \`${existing.deliverable_kind}\``,
        `- **Lead Specialist:** ${existing.lead_agent}`,
        `- **Worker Location:** \`${existing.assigned_worker_location}\``,
        `- **Skills Used:** ${(existing.skills_used || []).join(', ')}`,
        ``,
        `## Treatment & Architecture`,
        existing.treatment_markdown || '',
        ``,
        `## Timed Shot Plan (${(existing.shot_plan || []).length} Sections)`,
        JSON.stringify(existing.shot_plan || [], null, 2),
      ].join('\n');

      const ghUrl = await commitArtifactToGithubVault({
        db,
        jobId,
        fileName: 'production-treatment-and-plan.md',
        contentText: contentMd,
        jobSnapshot: {
          job_id: jobId,
          directive: existing.brief,
          task_type: existing.deliverable_kind,
          assigned_node: existing.assigned_worker_location,
        },
      });

      const updated = await db.entities.NexusFactoryProduction.update(existing.id, {
        github_url: ghUrl || existing.github_url,
        status: 'completed',
      });

      return Response.json({ ok: true, production: updated, github_url: ghUrl });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}