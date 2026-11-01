import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { allow } from '../../shared/rateLimit.ts';
import { ownedWorkspace, saveLibraryDocument } from '../../shared/libraryDocs.ts';
import { webEvidence, githubEvidence, sourceEvidence, ReaInputError } from './evidence.ts';
import { REA_SCHEMA, reaPrompt, enforce, reaMarkdown } from './report.ts';

export default async function (req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Please sign in again.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Only the app owner can run REA.' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    if (body.action !== 'analyze') return Response.json({ error: 'action must be analyze' }, { status: 400 });
    const mode = ['web', 'github', 'source'].includes(body.mode) ? body.mode : null;
    if (!mode) return Response.json({ error: 'mode must be web, github or source' }, { status: 400 });
    if (body.authorized !== true) return Response.json({ error: 'Confirm you own this target or are allowed to analyze it.' }, { status: 400 });
    const target = String(body.target || (mode === 'source' ? 'Uploaded source' : '')).trim().slice(0, 300);
    if (!target) return Response.json({ error: 'Enter what to analyze.' }, { status: 400 });
    const feature = String(body.feature || '').slice(0, 200);
    const question = String(body.question || '').slice(0, 1000);
    const ws = await ownedWorkspace(base44, user.id, body.workspace_id);
    if (!ws) return Response.json({ error: 'Workspace not found.' }, { status: 404 });
    if (!allow(`rea:${user.id}`, 6, 60000)) return Response.json({ error: 'Too many analyses, wait a minute.' }, { status: 429 });

    let raw;
    try {
      raw = mode === 'web' ? await webEvidence(target) : mode === 'github' ? await githubEvidence(base44, target) : sourceEvidence(body.files);
    } catch (e) {
      if (e instanceof ReaInputError) return Response.json({ error: e.message }, { status: 400 });
      throw e;
    }
    const evidence = raw.map((e, i) => ({ id: `E${i + 1}`, ...e }));
    const draft = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: reaPrompt({ mode, target, feature, question, evidence }), response_json_schema: REA_SCHEMA });
    const report = enforce(draft, new Set(evidence.map((e) => e.id)));
    const markdown = reaMarkdown(report, { mode, target, feature, evidence });
    const asset = await saveLibraryDocument(base44, { ownerId: user.id, workspaceId: ws.id, title: `REA · ${target}`, body: markdown, project: 'REA' });
    return Response.json({ report, evidence: evidence.map((e) => ({ id: e.id, kind: e.kind, source: e.source, excerpt: String(e.excerpt).slice(0, 600) })), markdown, asset_id: asset.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}