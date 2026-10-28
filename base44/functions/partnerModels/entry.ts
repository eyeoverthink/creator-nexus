import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { readProvider, providerModels, providerChat } from '../../shared/partnerModelProviders.ts';

const MODEL_NAME = /^[\w.:/@+-]{1,200}$/;

function readConversation(body) {
  const { system, messages } = body;
  if (typeof system !== 'string' || system.length > 30000) return null;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 16) return null;
  let total = 0;
  const clean = [];
  for (const m of messages) {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content) return null;
    total += m.content.length;
    clean.push({ role: m.role, content: m.content });
  }
  return total <= 13000 ? { system, messages: clean } : null;
}

function builtinPrompt({ system, messages }) {
  const transcript = messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
  return `${system}\n\nConversation so far, oldest first:\n\n${transcript}\n\nWrite the assistant's next reply to the user's last message. Reply with the message text only.`;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Please sign in again.' }, { status: 401 });
    const body = await req.json().catch(() => ({}));

    if (body.action === 'models') {
      const provider = readProvider(body.provider);
      if (provider.error) return Response.json({ error: provider.error }, { status: 400 });
      const result = await providerModels(provider);
      if (result.error) return Response.json({ error: result.error }, { status: 502 });
      return Response.json({ models: result.models });
    }
    if (body.action !== 'chat') return Response.json({ error: 'Unknown action.' }, { status: 400 });
    const conversation = readConversation(body);
    if (!conversation) return Response.json({ error: 'This conversation is too long or malformed to send.' }, { status: 400 });

    if (body.engine === 'builtin') {
      const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: builtinPrompt(conversation) });
      const text = typeof reply === 'string' ? reply.trim() : '';
      if (!text) return Response.json({ error: 'The built-in AI returned an empty reply.' }, { status: 502 });
      return Response.json({ text: text.slice(0, 12000), usage: null });
    }
    if (body.engine !== 'provider') return Response.json({ error: 'Unknown engine.' }, { status: 400 });
    const provider = readProvider(body.provider);
    if (provider.error) return Response.json({ error: provider.error }, { status: 400 });
    const model = typeof body.model === 'string' ? body.model.trim() : '';
    if (!MODEL_NAME.test(model)) return Response.json({ error: 'Choose a valid model name.' }, { status: 400 });
    const temperature = Math.min(1, Math.max(0, Number(body.temperature) || 0.6));
    const result = await providerChat(provider, model, conversation.system, conversation.messages, temperature);
    if (result.error) return Response.json({ error: result.error }, { status: 502 });
    return Response.json({ text: result.text.slice(0, 12000), usage: result.usage });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}