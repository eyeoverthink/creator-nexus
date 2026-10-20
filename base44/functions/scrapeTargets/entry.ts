import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import {
  loadSavedScrapeContinuity,
  saveScrapeContinuity,
} from '../../shared/webScrapeOuroboros.ts';

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) CreatorNexus/2.0' };
const get = (url, timeout = 8000) => fetch(url, { headers: UA, signal: AbortSignal.timeout(timeout) });
const decode = (s) =>
  String(s || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim();

function parseFeed(xml, source, max = 6) {
  const blocks = [...String(xml || '').matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/g)].map((m) => m[0]);
  return blocks
    .slice(0, max)
    .map((b) => {
      const title = decode(b.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || '');
      const url = decode(
        b.match(/<link>([\s\S]*?)<\/link>/)?.[1] || b.match(/<link[^>]*href="([^"]+)"/)?.[1] || ''
      );
      const pubDate = decode(
        b.match(/<(?:pubDate|published|updated)>([\s\S]*?)<\/(?:pubDate|published|updated)>/)?.[1] || ''
      );
      return { label: title.slice(0, 130), url, source, publishedAt: pubDate };
    })
    .filter((t) => /^https?:\/\//i.test(t.url));
}

async function fetchNews(query) {
  const u = query
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
    : 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
  const res = await get(u);
  if (!res.ok) throw new Error(`News HTTP ${res.status}`);
  return parseFeed(await res.text(), 'Current News', 6);
}

async function fetchReddit(query, tags = []) {
  const subTag = tags.find((t) => /^r\/[A-Za-z0-9_]+$/i.test(t));
  const urls = [];
  if (subTag) {
    urls.push(`https://www.reddit.com/${subTag}/hot.rss?limit=6`);
  }
  if (query) {
    urls.push(`https://www.reddit.com/search.rss?q=${encodeURIComponent(query)}&sort=hot&t=week`);
  } else {
    urls.push('https://www.reddit.com/r/technology+LocalLLaMA+MachineLearning+programming/hot.rss?limit=6');
  }
  const results = [];
  for (const u of urls.slice(0, 2)) {
    const r = await get(u);
    if (r.ok) {
      results.push(...parseFeed(await r.text(), 'Reddit Trends', 5));
    }
  }
  if (!results.length) throw new Error('Reddit RSS rate-limited or empty');
  return results.slice(0, 6);
}

async function fetchHackerNews(query) {
  if (query) {
    const alg = await get(
      `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=6`
    );
    if (alg.ok) {
      const data = await alg.json();
      const hits = (data.hits || [])
        .map((h) => ({
          label: String(h.title || '').slice(0, 130),
          url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
          source: 'Hacker News',
          reason: `${h.points || 0} pts · ${h.num_comments || 0} comments`,
        }))
        .filter((x) => /^https?:\/\//i.test(x.url));
      if (hits.length) return hits;
    }
  }
  const ids = (await (await get('https://hacker-news.firebaseio.com/v0/topstories.json')).json()).slice(0, 6);
  const items = await Promise.all(
    ids.map((id) => get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json()))
  );
  return items
    .filter(Boolean)
    .map((i) => ({
      label: i.title,
      url: i.url || `https://news.ycombinator.com/item?id=${i.id}`,
      source: 'Hacker News',
      reason: `${i.score || 0} pts`,
    }));
}

async function fetchGithub(query, tags = []) {
  const since = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  const tagTerm = tags.filter((t) => !t.startsWith('r/')).slice(0, 2).join(' ');
  const combined = [query, tagTerm].filter(Boolean).join(' ').trim();
  const q = `${combined ? combined + ' ' : ''}pushed:>${since} stars:>25`;
  const r = await get(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=6`
  );
  if (!r.ok) throw new Error(`GitHub HTTP ${r.status}`);
  const body = await r.json();
  return (body.items || []).map((x) => ({
    label: `${x.full_name} ★${x.stargazers_count}`,
    url: x.html_url,
    source: 'GitHub Trending',
    reason: String(x.description || '').slice(0, 140),
  }));
}

async function resolveYoutubeChannelId(entry) {
  const clean = String(entry || '').trim();
  if (!clean) return null;
  if (/^UC[\w-]{20,}$/.test(clean)) return clean;
  // Support @handle or full youtube.com/@handle or channel URL
  let pageUrl = clean;
  if (clean.startsWith('@')) {
    pageUrl = `https://www.youtube.com/${clean}`;
  } else if (!/^https?:\/\//i.test(clean)) {
    pageUrl = `https://www.youtube.com/@${clean.replace(/\s+/g, '')}`;
  }
  try {
    const res = await get(pageUrl, 6000);
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(/itemprop="channelId"\s+content="(UC[\w-]{20,})"/i) ||
      html.match(/"externalId":"(UC[\w-]{20,})"/i) ||
      html.match(/"channelId":"(UC[\w-]{20,})"/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function fetchYoutubeAlerts(channels = [], query = '') {
  const resolvedIds = (
    await Promise.all(channels.slice(0, 5).map((c) => resolveYoutubeChannelId(c)))
  ).filter(Boolean);

  const items = [];
  if (resolvedIds.length > 0) {
    const lists = await Promise.all(
      resolvedIds.map(async (cid) => {
        const r = await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(cid)}`);
        return r.ok ? parseFeed(await r.text(), 'YouTube Alert', 3) : [];
      })
    );
    items.push(...lists.flat());
  }

  // Also fetch YouTube videos mentioned on Hacker News / Algolia for the active query so YouTube alerts work even before adding channels
  const ytQuery = query || 'AI engineering';
  try {
    const hnYt = await get(
      `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(ytQuery + ' youtube.com/watch')}&tags=story&hitsPerPage=4`
    );
    if (hnYt.ok) {
      const d = await hnYt.json();
      for (const h of d.hits || []) {
        if (h.url && /youtube\.com\/watch|youtu\.be\//i.test(h.url)) {
          items.push({
            label: String(h.title || 'YouTube Technical Alert').slice(0, 120),
            url: h.url,
            source: 'YouTube Alert',
            reason: `Trending video alert (${ytQuery})`,
          });
        }
      }
    }
  } catch {}

  return items.slice(0, 6);
}

async function fetchHiveSuggestions(db, scope, visitedSet, continuity) {
  const [nodesPage, knowPage, sparksPage] = await Promise.all([
    db.entities.NexusOuroborosNode.filter(scope, { sort: '-updated_date', limit: 10 }).catch(() => ({ items: [] })),
    db.entities.NexusKnowledge.filter(scope, { sort: '-updated_date', limit: 10 }).catch(() => ({ items: [] })),
    db.entities.SparkCard.filter(scope, { sort: '-created_date', limit: 10 }).catch(() => ({ items: [] })),
  ]);

  const hiveItems = [];
  // 1. Unvisited links discovered during earlier Ouroboros crawls
  for (const q of continuity.crawlQueue || []) {
    if (q?.url && !visitedSet.has(q.url)) {
      hiveItems.push({
        label: q.label || q.url,
        url: q.url,
        source: 'Hive Discovered Link',
        reason: 'Discovered in prior Ouroboros page crawl & not yet visited',
      });
    }
    if (hiveItems.length >= 4) break;
  }

  // 2. Extract URLs cited in Knowledge Library or Spark Cards
  const texts = [
    ...(knowPage.items || []).map((k) => ({ title: k.title, body: k.body })),
    ...(nodesPage.items || []).map((n) => ({ title: n.title, body: n.diagnostic_summary })),
    ...(sparksPage.items || []).map((s) => ({ title: s.hook_title, body: JSON.stringify(s.why_now || {}) })),
  ];

  for (const item of texts) {
    const matches = String(item.body || '').match(/https?:\/\/[^\s)"'`<>]+/g) || [];
    for (const u of matches) {
      if (!visitedSet.has(u) && !/nexus-create-sync\.base44\.app|fraymus\.cloud/i.test(u)) {
        hiveItems.push({
          label: `${item.title || 'Hive Artifact Reference'}`.slice(0, 110),
          url: u,
          source: 'Hive Memory',
          reason: `Referenced in Hive workspace memory (${item.title || 'Knowledge'})`,
        });
      }
      if (hiveItems.length >= 7) break;
    }
    if (hiveItems.length >= 7) break;
  }

  return hiveItems;
}

export default async function (req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });

    const input = await req.json().catch(() => ({}));
    const action = String(input.action || 'suggest');

    // Resolve workspace scope
    let workspaceId = String(input.workspace_id || '').trim();
    if (!workspaceId) {
      const wsPage = await base44.entities.NexusWorkspace.filter(
        { owner_id: user.id },
        { sort: 'created_date', limit: 1 }
      ).catch(() => ({ items: [] }));
      workspaceId = wsPage.items?.[0]?.id || 'ouroboros_live_ws';
    }
    const scope = { owner_id: String(user.id), workspace_id: workspaceId };
    const vpsConfig = {
      baseUrl: String(secrets.get('NEXUS_EVOLUTION_URL') || '').replace(/\/+$/, ''),
      token: String(secrets.get('NEXUS_EVOLUTION_TOKEN') || ''),
    };

    if (action === 'load') {
      const continuity = await loadSavedScrapeContinuity(base44, scope);
      return Response.json({
        ok: true,
        targets: continuity.targets,
        youtubeChannels: continuity.youtubeChannels,
        tags: continuity.tags,
        visitedUrls: continuity.visitedUrls,
        crawlQueue: continuity.crawlQueue,
      });
    }

    if (action === 'save') {
      const saved = await saveScrapeContinuity(
        base44,
        scope,
        {
          targets: Array.isArray(input.targets) ? input.targets : undefined,
          youtubeChannels: Array.isArray(input.youtube_channels) ? input.youtube_channels : undefined,
          tags: Array.isArray(input.tags) ? input.tags : undefined,
          visitedUrls: Array.isArray(input.visited_urls) ? input.visited_urls : undefined,
          crawlQueue: Array.isArray(input.crawl_queue) ? input.crawl_queue : undefined,
        },
        vpsConfig
      );
      return Response.json({
        ok: true,
        vpsSynced: saved.vpsSynced,
        targets: saved.settings.scrape_targets || [],
        youtubeChannels: saved.settings.youtube_channels || [],
        tags: saved.settings.scrape_tags || [],
        visitedUrls: saved.settings.visited_urls || [],
        crawlQueue: saved.settings.crawl_queue || [],
      });
    }

    const continuity = await loadSavedScrapeContinuity(base44, scope);
    const topic = String(input.topic || '').slice(0, 120).trim();
    const tags = Array.isArray(input.tags)
      ? input.tags.map(String)
      : continuity.tags || [];
    const channels = Array.isArray(input.youtube_channels)
      ? input.youtube_channels.map(String)
      : continuity.youtubeChannels || [];
    const visitedUrls = new Set([
      ...(continuity.visitedUrls || []),
      ...(Array.isArray(input.visited_urls) ? input.visited_urls.map(String) : []),
    ]);
    const history = (Array.isArray(input.history) ? input.history : []).map(String).slice(0, 12);
    const effectiveQuery = [topic, ...tags.slice(0, 3)].filter(Boolean).join(' ').trim();

    const jobs = {
      'Current News': fetchNews(effectiveQuery),
      'Reddit Trends': fetchReddit(topic, tags),
      'Hacker News': fetchHackerNews(topic),
      'GitHub Trending': fetchGithub(topic, tags),
      'YouTube Alerts': fetchYoutubeAlerts(channels, effectiveQuery),
      'Hive Memory': fetchHiveSuggestions(base44, scope, visitedUrls, continuity),
      'AI + Hive': base44.asServiceRole.integrations.Core.InvokeLLM({
        add_context_from_internet: true,
        prompt:
          `Suggest 5 real, live, technical or current-event webpages worth scraping and synthesizing next.\n` +
          `- Active topic/tags: ${effectiveQuery || 'autonomous AI agents, systems engineering, interactive visualization'}\n` +
          `- Pages already studied by the Hive (DO NOT repeat these): ${[...visitedUrls].slice(-12).join(' | ') || history.join(' | ') || 'none'}\n` +
          `Return only real, directly scrapable article/documentation/repository URLs with specific reasons why they advance the Hive's current evolution.`,
        response_json_schema: {
          type: 'object',
          properties: {
            targets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  url: { type: 'string' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
      }).then((o) =>
        (o?.targets || [])
          .filter((t) => /^https?:\/\//i.test(t.url) && !visitedUrls.has(t.url))
          .map((t) => ({ ...t, source: 'AI + Hive' }))
      ),
    };

    const names = Object.keys(jobs);
    const settled = await Promise.allSettled(Object.values(jobs));
    const targets = [];
    const errors = {};
    const seen = new Set();

    settled.forEach((s, i) => {
      if (s.status === 'fulfilled') {
        for (const item of s.value || []) {
          if (item?.url && !seen.has(item.url)) {
            seen.add(item.url);
            targets.push({
              ...item,
              visited: visitedUrls.has(item.url),
            });
          }
        }
      } else {
        errors[names[i]] = String(s.reason?.message || s.reason);
      }
    });

    return Response.json({
      ok: true,
      targets,
      errors,
      visitedCount: visitedUrls.size,
      queueCount: (continuity.crawlQueue || []).length,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}