import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const FORGE_SYSTEM = `You are the Autonomous App Architect & REA (Reverse Engineer Anything) Engine for looseScrew (EyeOverthink).
Your job is to design and output a COMPLETE, real, working, self-contained interactive web application or synth/shader workstation in HTML/CSS/JS (app_html), plus an executable JS verification module (code) and an 8-step REA engineering trace (rea_trace).
Rules:
1. app_html MUST be a complete, dark-mode (#05070a void, #00f3ff cyan neon accents, monospace typography) interactive application with real working controls, buttons, canvas/WebAudio/DOM logic, and zero external dependencies that fail to load.
2. code MUST be valid JavaScript body code (suitable for running directly and returning a diagnostic string/JSON result).
3. rea_trace MUST document the 8-step REA protocol (1. Target Scoping, 2. Readiness, 3. Surface Mapping, 4. Feature Tracing, 5. Evidence Collection, 6. Clean-Room Reconstruction, 7. Behavioral Verification, 8. Final Verdict).
4. Output valid JSON only matching the requested schema.`;

function extractJson(text) {
  if (typeof text === 'object' && text !== null) return text;
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Model did not return valid JSON');
  return JSON.parse(m[0]);
}

function slugify(str) {
  return String(str || 'app')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'app';
}

export default async function(req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'method_not_allowed' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'autonomous_build');

    if (action === 'autonomous_build' || action === 'autonomous_evolve') {
      const promptText = String(body.prompt || '').trim().slice(0, 4000);
      if (!promptText) {
        return Response.json({ error: 'Prompt is required' }, { status: 400 });
      }
      const targetUrl = String(body.target_url || '').trim().slice(0, 1000);
      const requestedChannel = ['MUSIC', 'VIDEO', 'CODE'].includes(body.channel) ? body.channel : 'CODE';
      const existingCode = String(body.existing_code || '').slice(0, 12000);
      const existingHtml = String(body.existing_app_html || '').slice(0, 14000);

      const llmPrompt = `${FORGE_SYSTEM}

USER DIRECTIVE:
${promptText}
${targetUrl ? `\nTARGET LINK / REFERENCE URL TO REVERSE-ENGINEER OR INTEGRATE: ${targetUrl}` : ''}
${existingHtml ? `\nCURRENT APP HTML TO EVOLVE:\n${existingHtml}` : ''}
${existingCode ? `\nCURRENT JS MODULE TO EVOLVE:\n${existingCode}` : ''}

Return a JSON object with these exact keys:
{
  "title": "Short punchy title (<=80 chars)",
  "channel": "${requestedChannel}",
  "bpm": 120,
  "duration": "LIVE_APP",
  "tags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4"],
  "voice_intro": "1-2 sentences spoken by the EyeOverthink Avatar Host introducing what this app/music/video build does.",
  "synth_notes": [110, 146.83, 164.81, 220, 261.63, 293.66],
  "code": "// Valid runnable JS code that executes assertions or returns live state summary\\nreturn 'Verified';",
  "rea_trace": "Detailed 8-step REA trace & architecture breakdown",
  "app_html": "<!DOCTYPE html><html>...Complete interactive dark-mode app with working UI, Canvas/WebAudio/DOM controls...</html>"
}`;

      const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: llmPrompt,
        add_context_from_internet: Boolean(targetUrl || /https?:\/\//i.test(promptText))
      });

      const parsed = extractJson(raw);
      const itemData = {
        owner_id: String(user.id),
        channel: ['MUSIC', 'VIDEO', 'CODE'].includes(parsed.channel) ? parsed.channel : requestedChannel,
        title: String(parsed.title || promptText.slice(0, 70)).slice(0, 180),
        duration: String(parsed.duration || 'LIVE_APP').slice(0, 40),
        screws: 1,
        bpm: Number(parsed.bpm) || 120,
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 6) : ['#EyeOverthink', '#AutonomousForge', '#LiveApp'],
        voice_intro: String(parsed.voice_intro || `Autonomous build online: ${parsed.title || 'New Module'}.`).slice(0, 900),
        media_url: String(body.media_url || '').slice(0, 2000),
        external_link: targetUrl,
        synth_notes: Array.isArray(parsed.synth_notes) ? parsed.synth_notes.map(Number).filter(n => n > 30 && n < 2000) : [110, 146.83, 164.81, 220],
        code: String(parsed.code || '// Verified\nreturn "ONLINE";').slice(0, 19000),
        app_html: String(parsed.app_html || '').slice(0, 19500),
        rea_trace: String(parsed.rea_trace || '[REA PIPELINE VERIFIED]').slice(0, 9500)
      };

      if (action === 'autonomous_evolve' && body.item_id) {
        const updated = await base44.entities.LooseScrewItem.update(String(body.item_id), itemData);
        return Response.json({ item: updated, mode: 'evolved' });
      }
      const created = await base44.entities.LooseScrewItem.create(itemData);
      return Response.json({ item: created, mode: 'created' });
    }

    if (action === 'push_github') {
      const title = String(body.title || 'looseScrew-app').slice(0, 120);
      const slug = slugify(title);
      const filePath = `apps/${slug}.html`;
      const htmlContent = String(body.app_html || '').trim() || `<!DOCTYPE html><html><body style="background:#05070a;color:#00f3ff;font-family:monospace;padding:24px;"><h1>${title}</h1><pre>${String(body.code || '')}</pre></body></html>`;

      const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'CreatorNexus-LooseScrew'
      };

      let sha;
      const check = await fetch(`https://api.github.com/repos/eyeoverthink/looseScrew/contents/${filePath}`, {
        headers,
        signal: AbortSignal.timeout(10000)
      });
      if (check.status === 200) {
        const existing = await check.json();
        sha = existing.sha;
      }

      const putRes = await fetch(`https://api.github.com/repos/eyeoverthink/looseScrew/contents/${filePath}`, {
        method: 'PUT',
        headers,
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          message: `Forge: Publish ${title} (${filePath})`,
          content: btoa(unescape(encodeURIComponent(htmlContent))),
          ...(sha ? { sha } : {})
        })
      });
      const putData = await putRes.json();
      if (!putRes.ok) {
        return Response.json({ error: putData.message || 'GitHub push failed' }, { status: putRes.status });
      }

      const htmlUrl = putData.content?.html_url || `https://github.com/eyeoverthink/looseScrew/blob/main/${filePath}`;
      if (body.item_id) {
        await base44.entities.LooseScrewItem.update(String(body.item_id), { github_path: filePath, external_link: htmlUrl }).catch(() => null);
      }
      return Response.json({ ok: true, file_path: filePath, html_url: htmlUrl, commit: putData.commit?.sha });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}