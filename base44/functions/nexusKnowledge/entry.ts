import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { prepareKnowledgeChat, knowledgeAnswer } from '../../shared/knowledgeChat.ts';
export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Use POST.' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to use knowledge chat.' }, { status: 401 });
    const raw = await req.text();
    if (raw.length > 5000) return Response.json({ error: 'Request too large.' }, { status: 413 });
    let input;
    try { input = JSON.parse(raw); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
    if (!input || !['chat', 'prepare_ollama'].includes(input.operation) || !['researcher', 'writer', 'strategist'].includes(input.agent) || typeof input.workspace_id !== 'string' || !/^[a-zA-Z0-9_-]{6,64}$/.test(input.workspace_id) || typeof input.question !== 'string' || !input.question.trim() || input.question.length > 2000) return Response.json({ error: 'Choose an agent and enter a question of up to 2000 characters.' }, { status: 400 });
    if (input.operation === 'chat' && input.consent !== true) return Response.json({ error: 'Approve this hosted AI run first.' }, { status: 400 });
    const workspace = await base44.entities.NexusWorkspace.filter({ id: input.workspace_id, owner_id: user.id }, { limit: 1, fields: ['owner_id'] });
    if (!workspace.items.length) return Response.json({ error: 'Workspace not found.' }, { status: 404 });
    const recent = await base44.entities.NexusChatTurn.count({ owner_id: user.id, created_date: { $gte: new Date(Date.now() - 60000).toISOString() } });
    if (recent >= 6) return Response.json({ error: 'Please wait a minute before sending another question.' }, { status: 429 });
    input.question = input.question.trim();
    const prepared = await prepareKnowledgeChat(base44, user, input);
    if (input.operation === 'prepare_ollama') return Response.json(prepared);
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: 'Follow the system instructions in this conversation and answer the final user question. Return only the structured answer.\n' + JSON.stringify(prepared.messages),
      response_json_schema: prepared.schema,
    });
    return Response.json(knowledgeAnswer(result, prepared.sources));
  } catch (error) {
    return Response.json({ error: error.message || 'Could not answer this question.' }, { status: error.status || 500 });
  }
}