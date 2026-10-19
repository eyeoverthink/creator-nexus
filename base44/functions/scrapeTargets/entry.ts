import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) CreatorNexus/1.0' };
const get = (url: string) => fetch(url, { headers: UA, signal: AbortSignal.timeout(8000) });
const decode = (s: string) => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]+>/g, '').trim();

function parseFeed(xml: string, source: string, max = 6) {
  const blocks = [...xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/g)].map((m) => m[0]);
  return blocks.slice(0, max).map((b) => {
    const title = decode(b.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || '');
    const url = decode(b.match(/<link>([\s\S]*?)<\/link>/)?.[1] || b.match(/<link[^>]*href="([^"]+)"/)?.[1] || '');
    return { label: title.slice(0, 120), url, source };
  }).filter((t) => t.url.startsWith('http'));
}

async function news(topic: string) {
  const u = topic ? `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en` : 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
  return parseFeed(await (await get(u)).text(), 'News');
}
async function reddit(topic: string) {
  const u = topic ? `https://www.reddit.com/search.rss?q=${encodeURIComponent(topic)}&sort=hot` : 'https://www.reddit.com/r/popular/.rss';
  const r = await get(u);
  if (!r.ok) throw new Error(`Reddit ${r.status}`);
  return parseFeed(await r.text(), 'Reddit');
}
async function hackerNews() {
  const ids = (await (await get('https://hacker-news.firebaseio.com/v0/topstories.json')).json()).slice(0, 6);
  const items = await Promise.all(ids.map((id: number) => get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json())));
  return items.map((i: any) => ({ label: i.title, url: i.url || `https://news.ycombinator.com/item?id=${i.id}`, source: 'Hacker News' }));
}
async function github(topic: string) {
  const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const q = `${topic ? topic + ' ' : ''}created:>${since}`;
  const r = await get(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=6`);
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return (await r.json()).items.map((x: any) => ({ label: `${x.full_name} ★${x.stargazers_count}`, url: x.html_url, source: 'GitHub' }));
}
async function youtube(channels: string[]) {
  const lists = await Promise.all(channels.slice(0, 5).map(async (c) =>
    parseFeed(await (await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(c)}`)).text(), 'YouTube', 3)));
  return lists.flat();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });
    const input = await req.json();
    const topic = String(input.topic || '').slice(0, 120);
    const channels = (Array.isArray(input.youtube_channels) ? input.youtube_channels : []).map(String).filter((c: string) => /^UC[\w-]{20,}$/.test(c));
    const history = (Array.isArray(input.history) ? input.history : []).map(String).slice(0, 10);

    const jobs: Record<string, Promise<any[]>> = {
      News: news(topic), Reddit: reddit(topic), 'Hacker News': hackerNews(), GitHub: github(topic),
      ...(channels.length ? { YouTube: youtube(channels) } : {}),
      'AI + Hive': base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        add_context_from_internet: true,
        prompt: `Suggest 5 real, currently relevant webpages worth studying for a creator/AI workspace. Topic focus: ${topic || 'current AI, creator tools and tech trends'}. ` +
          `The Hive has already studied: ${history.join(' | ') || 'nothing yet'}. Suggest pages that go deeper or adjacent, not repeats. Only real existing URLs.`,
        response_json_schema: { type: 'object', properties: { targets: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, url: { type: 'string' }, reason: { type: 'string' } } } } } },
      }).then((o: any) => (o.targets || []).filter((t: any) => /^https?:\/\//.test(t.url)).map((t: any) => ({ ...t, source: 'AI + Hive' }))),
    };
    const names = Object.keys(jobs);
    const settled = await Promise.allSettled(Object.values(jobs));
    const targets: any[] = [], errors: Record<string, string> = {};
    settled.forEach((s, i) => s.status === 'fulfilled' ? targets.push(...s.value) : (errors[names[i]] = String(s.reason?.message || s.reason)));
    return Response.json({ targets, errors });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});