import { ollamaRequest } from '@/components/nexus/models/ollamaClient';

export function sanitizeOllamaModelTag(rawName, generation = 1) {
  const base = String(rawName || 'fraymus-model')
    .toLowerCase()
    .replace(/\.modelfile$/i, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'fraymus-model';
  return base.includes(':') ? base : `${base}:gen${generation}`;
}

export function parseModelfileSpec(content = '', fallbackFrom = '', fallbackSystem = '', fallbackParams = {}) {
  const text = String(content || '');
  let fromModel = String(fallbackFrom || '').trim();
  let systemPrompt = String(fallbackSystem || '').trim();
  const parameters = { ...(fallbackParams || {}) };
  const messages = [];

  const fromMatch = text.match(/^\s*FROM\s+([^\s#]+)/im);
  if (fromMatch?.[1]) {
    fromModel = fromMatch[1].trim();
  }

  const tripleSystemMatch = text.match(/SYSTEM\s+"""([\s\S]*?)"""/i);
  if (tripleSystemMatch?.[1]) {
    systemPrompt = tripleSystemMatch[1].trim();
  } else {
    const singleSystemMatch = text.match(/^\s*SYSTEM\s+["']?([^\n"']+)["']?/im);
    if (singleSystemMatch?.[1]) {
      systemPrompt = singleSystemMatch[1].trim();
    }
  }

  const paramRegex = /^\s*PARAMETER\s+([a-zA-Z0-9_]+)\s+([^\s#]+)/gim;
  let pMatch;
  while ((pMatch = paramRegex.exec(text)) !== null) {
    const key = pMatch[1].trim();
    const rawVal = pMatch[2].trim();
    const numVal = Number(rawVal);
    parameters[key] = Number.isNaN(numVal) ? rawVal : numVal;
  }

  const msgRegex = /^\s*MESSAGE\s+(user|assistant|system)\s+"""([\s\S]*?)"""/gim;
  let mMatch;
  while ((mMatch = msgRegex.exec(text)) !== null) {
    messages.push({ role: mMatch[1].toLowerCase(), content: mMatch[2].trim() });
  }

  return { fromModel, systemPrompt, parameters, messages };
}

export function buildModelfileString({ fromModel, systemPrompt, parameters = {}, messages = [] }) {
  const lines = [`FROM ${fromModel}`];
  for (const [k, v] of Object.entries(parameters)) {
    if (v === undefined || v === null || typeof v === 'object') continue;
    if (['temperature', 'top_p', 'top_k', 'repeat_penalty', 'num_ctx', 'num_predict', 'seed'].includes(k)) {
      lines.push(`PARAMETER ${k} ${v}`);
    }
  }
  if (systemPrompt) {
    lines.push(`\nSYSTEM """\n${systemPrompt.replace(/"""/g, "'''")}\n"""`);
  }
  for (const m of messages) {
    if (m?.role && m?.content) {
      lines.push(`\nMESSAGE ${m.role} """\n${String(m.content).replace(/"""/g, "'''")}\n"""`);
    }
  }
  return lines.join('\n');
}

export async function createModelOnOllamaBackend({
  settings,
  token,
  artifact,
  fewShotMessages = [],
  ternaryDirective = '',
}) {
  const t0 = performance.now();

  // 1. Fetch installed models from Ollama /api/tags to verify connectivity & resolve valid FROM model
  const tagsData = await ollamaRequest(settings, token, '/api/tags');
  const installedModels = (tagsData?.models || []).map((m) => m.name).filter(Boolean);

  if (installedModels.length === 0) {
    throw new Error(
      'Connected to Ollama, but no base models are installed yet (/api/tags is empty). Run `ollama pull llama3.2` first.'
    );
  }

  const parsed = parseModelfileSpec(
    artifact.content,
    artifact.base_model,
    artifact.system_prompt,
    artifact.parameters
  );

  // Match requested FROM model against installed models (exact or prefix match), or fall back to user's selected/first installed model
  const requestedFrom = parsed.fromModel || artifact.base_model || settings.model || installedModels[0];
  const exactOrPrefix =
    installedModels.find((m) => m === requestedFrom) ||
    installedModels.find((m) => m.split(':')[0] === requestedFrom.split(':')[0]);
  const resolvedFrom = exactOrPrefix || (settings.model && installedModels.includes(settings.model) ? settings.model : installedModels[0]);

  const nextGen = (artifact.evolution_generation || 1) + 1;
  const targetModelTag = sanitizeOllamaModelTag(artifact.name, nextGen);

  const combinedSystem = [
    parsed.systemPrompt || artifact.system_prompt || 'You are F.R.A.Y.M.U.S. Sovereign Director.',
    ternaryDirective,
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();

  const cleanParams = {};
  const allowedKeys = ['temperature', 'top_p', 'top_k', 'repeat_penalty', 'num_ctx', 'num_predict', 'seed'];
  for (const k of allowedKeys) {
    if (parsed.parameters?.[k] !== undefined && typeof parsed.parameters[k] === 'number') {
      cleanParams[k] = parsed.parameters[k];
    }
  }
  if (cleanParams.temperature === undefined) cleanParams.temperature = 0.62;
  if (cleanParams.num_ctx === undefined) cleanParams.num_ctx = 8192;

  const combinedMessages = [...parsed.messages, ...fewShotMessages].slice(0, 12);
  const compiledModelfile = buildModelfileString({
    fromModel: resolvedFrom,
    systemPrompt: combinedSystem,
    parameters: cleanParams,
    messages: combinedMessages,
  });

  // 2. Call POST /api/create on Ollama (supports modern v0.5+ structured payload + fallback to legacy modelfile payload)
  let createResponse;
  try {
    createResponse = await ollamaRequest(settings, token, '/api/create', {
      model: targetModelTag,
      from: resolvedFrom,
      system: combinedSystem,
      parameters: cleanParams,
      ...(combinedMessages.length > 0 ? { messages: combinedMessages } : {}),
      stream: false,
    });
  } catch (modernErr) {
    // Fallback for older Ollama versions that expect { name, modelfile, stream: false }
    createResponse = await ollamaRequest(settings, token, '/api/create', {
      name: targetModelTag,
      model: targetModelTag,
      modelfile: compiledModelfile,
      stream: false,
    });
  }

  // 3. Re-read /api/tags to confirm the newly created model is registered on Ollama
  const afterTagsData = await ollamaRequest(settings, token, '/api/tags').catch(() => tagsData);
  const updatedModels = (afterTagsData?.models || []).map((m) => m.name).filter(Boolean);
  const createdEntry = (afterTagsData?.models || []).find(
    (m) => m.name === targetModelTag || m.name?.startsWith(targetModelTag.split(':')[0])
  );

  const elapsedMs = Number((performance.now() - t0).toFixed(1));

  return {
    ok: true,
    createdModelTag: createdEntry?.name || targetModelTag,
    resolvedBaseModel: resolvedFrom,
    status: createResponse?.status || 'success',
    digest: createdEntry?.digest || '',
    sizeBytes: createdEntry?.size || 0,
    compiledModelfile,
    installedModels: updatedModels,
    elapsedMs,
    generation: nextGen,
  };
}