import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { validUrl, fetchUrl, youtubeSearch } from './retrieve.ts';

const json = (o, status = 200) => Response.json(o, { status });
const TYPES = ['url', 'github', 'instagram', 'text', 'dnb'];
const DEFAULT_TOPICS = ['top 10 ways to make money with AI', 'AI skills that pay', 'AI agents business', 'AI agency', 'agentic AI', 'AI business ideas', 'AI career', 'AI employee'];

const SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' }, detail: { type: 'string' },
          kind: { type: 'string', enum: ['retrieved', 'synthesis'] },
          source_url: { type: 'string' }, score: { type: 'number' },
        },
        required: ['title', 'detail', 'kind', 'source_url', 'score'],
      },
    },
  },
  required: ['findings'],
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (user.role !== 'admin') return json({ error: 'Only the workspace owner (admin) can run research.' }, 403);
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').trim().slice(0, 1000);
    const inputs = (Array.isArray(body.sources) ? body.sources : []).slice(0, 8)
      .map((s) => ({ type: TYPES.includes(s?.type) ? s.type : 'text', value: String(s?.value || '').trim().slice(0, 6000) }))
      .filter((s) => s.value);
    const imageUri = typeof body.image_uri === 'string' && body.image_uri ? body.image_uri : '';
    if (!query && !inputs.length && !imageUri) return json({ error: 'Add a search, a source or an image.' }, 400);
    const topics = (Array.isArray(body.youtube_topics) && body.youtube_topics.length ? body.youtube_topics : DEFAULT_TOPICS).slice(0, 8).map((t) => String(t).slice(0, 120));

    const R = base44.entities.TrendResearchRun;
    const run = await R.create({ owner_id: String(user.id), query: query || '(sources only)', status: 'running', has_image: !!imageUri });

    try {
      // Per-source retrieval with explicit status.
      const sources = await Promise.all(inputs.map(async (s) => {
        if (s.type === 'text' || s.type === 'dnb') return { ...s, value: s.value.slice(0, 300), status: 'provided', note: 'Pasted by you (not independently verified)', text: s.value };
        let url = s.value;
        if (s.type === 'github' && !/^https?:/i.test(url)) url = `https://github.com/${url.replace(/^@/, '')}`;
        if (s.type === 'instagram' && !/^https?:/i.test(url)) url = `https://www.instagram.com/${url.replace(/^@/, '')}/`;
        url = validUrl(url);
        if (!url) return { ...s, status: 'failed', note: 'Not a valid web address' };
        const got = await fetchUrl(url);
        return got.ok ? { ...s, url, status: 'retrieved', title: got.title, note: 'Fetched', text: got.text } : { ...s, url, status: 'failed', note: got.note };
      }));

      const yt = await Promise.allSettled(topics.map((t) => youtubeSearch(t, 4)));
      const youtube = topics.map((topic, i) => yt[i].status === 'fulfilled' ? { topic, status: 'retrieved', videos: yt[i].value } : { topic, status: 'failed', note: String(yt[i].reason?.message || 'failed'), videos: [] });

      const known = new Set([...sources.filter((s) => s.url && s.status === 'retrieved').map((s) => s.url), ...youtube.flatMap((y) => y.videos.map((v) => v.url))]);
      const evidence = [
        ...sources.filter((s) => s.text).map((s) => `SOURCE [${s.type}] ${s.url || '(pasted)'}\n${s.text}`),
        ...youtube.flatMap((y) => y.videos.map((v) => `YOUTUBE "${y.topic}": ${v.title} | ${v.channel} | ${v.views} | ${v.published} | ${v.url}`)),
      ].join('\n\n').slice(0, 30000);

      const fileUrls = imageUri ? [(await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: imageUri, expires_in: 600 })).signed_url] : undefined;
      const prompt = `You are a research analyst. Goal: find trends and money-making opportunities around: ${query || 'the supplied sources'}.
Use ONLY the evidence below${fileUrls ? ' and the attached image' : ''}. Return up to 12 findings ranked by score 0-100 (relevance + opportunity).
- kind "retrieved": a fact stated in the evidence; source_url MUST be one of the URLs in the evidence (or "pasted" / "image").
- kind "synthesis": your own inference across evidence; source_url may be "".
Never invent URLs, numbers or quotes. JSON only.

EVIDENCE:
${evidence || '(no retrievable evidence)'}`;
      const out = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: SCHEMA, ...(fileUrls ? { file_urls: fileUrls } : {}) });

      const findings = (Array.isArray(out?.findings) ? out.findings : []).slice(0, 12).map((f) => {
        const url = String(f?.source_url || '').slice(0, 400);
        const kind = f?.kind === 'retrieved' ? 'retrieved' : 'synthesis';
        const verified = kind === 'retrieved' && (known.has(url) || url === 'pasted' || url === 'image');
        return { title: String(f?.title || '').slice(0, 200), detail: String(f?.detail || '').slice(0, 1200), kind, source_url: url, verified, score: Math.max(0, Math.min(100, Number(f?.score) || 0)), saved: false };
      }).filter((f) => f.title).sort((a, b) => b.score - a.score);

      const saved = await R.update(run.id, {
        status: 'completed', youtube, findings,
        sources: sources.map(({ text, ...s }) => s),
      });
      return json({ run: saved });
    } catch (e) {
      await R.update(run.id, { status: 'failed', error: String(e.message).slice(0, 1000) });
      return json({ error: `Research failed: ${e.message}` }, 502);
    }
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}