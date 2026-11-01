import { XMLParser } from 'npm:fast-xml-parser@4.5.3';

export const redditCommunities = ['programming', 'electronics', 'hardware', 'musicproduction'];
export const redditUserAgent = 'CreatorNexusRSS/1.0 (Spark Scout RSS research; https://creator-nexus.base44.app)';
const plainText = value => String(typeof value === 'object' ? value?.['#text'] || '' : value || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export function isRedditSource(value) {
  try { const host = new URL(value).hostname.toLowerCase(); return host === 'reddit.com' || host.endsWith('.reddit.com') || host === 'redd.it'; }
  catch { return false; }
}

export async function fetchRedditFeed(name) {
  if (!redditCommunities.includes(name)) throw new Error('Unsupported subreddit');
  const url = `https://www.reddit.com/r/${name}/new/.rss`;
  let status = null;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': redditUserAgent, Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(15000) });
    status = response.status;
    const metadata = { subreddit: name, url, final_url: response.url, status, content_type: response.headers.get('content-type'), retry_after: response.headers.get('retry-after') };
    if (!response.ok) { await response.body?.cancel(); return { ...metadata, entries: [], error: `RSS HTTP ${status}` }; }
    const reader = response.body.getReader(), chunks = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 2000000) { await reader.cancel(); throw new Error('RSS feed exceeds size limit'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const text = new TextDecoder().decode(bytes);
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('Unsupported XML declarations');
    const feed = new XMLParser({ ignoreAttributes: false, isArray: tag => tag === 'entry' || tag === 'link' }).parse(text)?.feed;
    if (!feed) throw new Error('Response is not an Atom feed');
    const entries = [];
    for (const entry of (feed.entry || []).slice(0, 25)) {
      const link = (entry.link || []).find(item => (!item['@_rel'] || item['@_rel'] === 'alternate') && typeof item['@_href'] === 'string' && /\/comments\//.test(item['@_href']));
      let commentsUrl = null;
      try {
        const parsed = new URL(link?.['@_href']);
        if (parsed.protocol === 'https:' && !parsed.username && !parsed.password && /^(www\.)?reddit\.com$/.test(parsed.hostname) && new RegExp(`^/r/${name}/comments/[a-z0-9]+(?:/|$)`, 'i').test(parsed.pathname)) commentsUrl = link['@_href'];
      } catch { /* Missing or malformed feed link stays unusable. */ }
      entries.push({ title: plainText(entry.title).slice(0, 500), comments_url: commentsUrl, published: typeof entry.published === 'string' ? entry.published : null, excerpt: plainText(entry.content).slice(0, 2000) });
    }
    return { ...metadata, feed_entries: (feed.entry || []).length, entries };
  } catch (error) { return { subreddit: name, url, status, entries: [], error: error.message }; }
}