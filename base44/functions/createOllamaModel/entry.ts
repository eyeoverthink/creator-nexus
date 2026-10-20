import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import process from 'node:process';

export default async function(req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    const rawBaseModel = String(body.baseModel || '').trim();
    const baseModel =
      rawBaseModel === 'llama3.2:3b-instruct' || rawBaseModel === 'llama3.2:3b'
        ? 'llama3.2:3b-instruct-q8_0'
        : rawBaseModel;
    const systemPrompt = String(body.systemPrompt || '').trim();

    if (!name || !baseModel || !systemPrompt) {
      return Response.json(
        { error: 'name, baseModel, and systemPrompt are required' },
        { status: 400 }
      );
    }

    const upstreamRes = await fetch(
      'https://fraymus-messenger.srv1944678.hstgr.cloud/api/console/ollama/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-console-key': process.env.FRAYMUS_CONSOLE_KEY || secrets.get('FRAYMUS_CONSOLE_KEY') || '',
        },
        body: JSON.stringify({
          name,
          from: baseModel,
          system: systemPrompt,
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    const responseText = await upstreamRes.text();
    let responseData = {};
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      responseData = { raw: responseText };
    }

    if (!upstreamRes.ok) {
      return Response.json(
        {
          error:
            responseData?.error ||
            responseData?.message ||
            `Ollama create failed with status ${upstreamRes.status}`,
          details: responseData,
        },
        { status: upstreamRes.status }
      );
    }

    return Response.json({
      ok: true,
      name,
      from: baseModel,
      result: responseData,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}