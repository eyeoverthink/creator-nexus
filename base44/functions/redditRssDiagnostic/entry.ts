import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { XMLParser } from 'npm:fast-xml-parser@4.5.3';

const communities = ['programming', 'electronics', 'hardware', 'musicproduction'];
const userAgent = 'CreatorNexusRSSDiagnostic/1.0 (Spark Scout feed availability check; https://nexus-create-sync.base44.app)';

async function checkFeed(name) {
  const url = `https://www.reddit.com/r/${name}/new/.rss`;
  let status = null;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent, Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(15000),
    });
    status = response.status;
    const text = await response.text();
    const metadata = { subreddit: name, url, final_url: response.url, status, content_type: response.headers.get('content-type'), retry_after: response.headers.get('retry-after') };
    if (!response.ok) return { ...metadata, entries: [], error_preview: text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300) };
    if (text.length > 2000000) return { ...metadata, entries: [], error: 'Feed exceeds diagnostic size limit.' };
    const parser = new XMLParser({ ignoreAttributes: false, isArray: tag => tag === 'entry' || tag === 'link' });
    const feed = parser.parse(text)?.feed;
    if (!feed) return { ...metadata, entries: [], error: 'Response is not an Atom feed.' };
    const entries = (feed.entry || []).slice(0, 3).map(entry => {
      const links = entry.link || [];
      const link = links.find(item => (!item['@_rel'] || item['@_rel'] === 'alternate') && typeof item['@_href'] === 'string' && /\/comments\//.test(item['@_href']));
      const commentsUrl = link?.['@_href'] || null;
      let validUrl = false;
      if (commentsUrl) {
        const parsed = new URL(commentsUrl);
        validUrl = parsed.protocol === 'https:' && /^(www\.)?reddit\.com$/.test(parsed.hostname) && parsed.pathname.toLowerCase().startsWith(`/r/${name}/comments/`);
      }
      return { title: entry.title, comments_url: validUrl ? commentsUrl : null, published: entry.published || null };
    });
    return { ...metadata, feed_entries: (feed.entry || []).length, entries };
  } catch (error) {
    return { subreddit: name, url, status, entries: [], error: error.message };
  }
}

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'admin only' }, { status: 403 });
    const results = await Promise.all(communities.map(checkFeed));
    return Response.json({ checked_at: new Date().toISOString(), user_agent: userAgent, results }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status === 401 ? 401 : 500 });
  }
}