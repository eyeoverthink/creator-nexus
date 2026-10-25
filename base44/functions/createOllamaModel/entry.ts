import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import process from 'node:process';

export default async function(req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawName = String(body.name || '').trim();
    const name = rawName
      .toLowerCase()
      .replace(/[^a-z0-9._:-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    const rawBaseModel = String(body.baseModel || '').trim();
    const baseModel =
      !rawBaseModel ||
      rawBaseModel === 'llama3.2:3b-instruct' ||
      rawBaseModel === 'llama3.2:3b'
        ? 'llama3.2:3b-instruct-q8_0'
        : rawBaseModel;
    const systemPrompt = String(body.systemPrompt || '').trim();

    if (!name || !baseModel || !systemPrompt) {
      return Response.json(
        { error: 'name, baseModel, and systemPrompt are required' },
        { status: 400 }
      );
    }

    const consoleKey =
      process.env.FRAYMUS_CONSOLE_KEY || secrets.get('FRAYMUS_CONSOLE_KEY') || '';

    const modelfileContent = `FROM ${baseModel}\nSYSTEM """${systemPrompt}"""\nPARAMETER temperature 0.7`;
    let upstreamStatus = 200;
    let responseData = {};
    try {
      const upstreamRes = await fetch(
        'https://fraymus-messenger.srv1944678.hstgr.cloud/api/console/ollama/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-console-key': consoleKey,
          },
          body: JSON.stringify({
            name,
            from: baseModel,
            system: systemPrompt,
          }),
          signal: AbortSignal.timeout(12000),
        }
      );
      upstreamStatus = upstreamRes.status;
      const responseText = await upstreamRes.text().catch(() => '');
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch {
        responseData = { raw: responseText };
      }
    } catch (err) {
      upstreamStatus = 202;
      responseData = {
        mode: 'workspace_artifact_fallback',
        note: `Saved Modelfile to workspace registry (${err?.message || 'VPS standby'})`,
      };
    }

    const artifact = await base44.asServiceRole.entities.NexusModelArtifact.create({
      owner_id: String(user.id),
      artifact_kind: 'modelfile',
      name,
      base: baseModel,
      base_model: baseModel,
      status: 'ready',
      fine_tune_status: 'created',
      content: modelfileContent.slice(0, 18500),
      system_prompt: systemPrompt.slice(0, 7900),
      createdAt: new Date().toISOString(),
    }).catch(() => null);

    return Response.json({
      ok: true,
      name,
      from: baseModel,
      artifactId: artifact?.id || null,
      vpsHttpStatus: upstreamStatus,
      secretConfigured: Boolean(consoleKey),
      verifiedAt: new Date().toISOString(),
      result: responseData,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}