import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { fetchRedditFeed, redditCommunities, redditUserAgent } from '../../shared/redditRss.ts';

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'admin only' }, { status: 403 });
    const feeds = await Promise.all(redditCommunities.map(fetchRedditFeed));
    const results = feeds.map(feed => ({ ...feed, entries: feed.entries.slice(0, 3).map(({ title, comments_url, published }) => ({ title, comments_url, published })) }));
    return Response.json({ checked_at: new Date().toISOString(), user_agent: redditUserAgent, results }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status === 401 ? 401 : 500 });
  }
}