const SUBREDDITS = ['programming', 'electronics', 'hardware', 'musicproduction'];

export function buildRadarSearch(profile, today) {
 const start = new Date(today + 'T00:00:00Z');
 start.setUTCDate(start.getUTCDate() - 14);
 const from = start.toISOString().slice(0, 10);
 const topics = profile.loves.map(value => String(value).replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)).filter(Boolean);
 const interests = topics.join(' OR ');
 const exclusions = '-"market report" -"market research" -"market forecast" -"press release" -site:prnewswire.com -site:businesswire.com -site:globenewswire.com -site:researchandmarkets.com -site:marketsandmarkets.com';
 return JSON.stringify({
  date_window: {from, through: today},
  audience: profile.audience,
  interests: profile.loves,
  queries: [
   ...SUBREDDITS.map(name => `site:reddit.com/r/${name}/comments/ (${interests}) after:${from} ${exclusions}`),
   ...topics.flatMap(topic => [
    `site:youtube.com/shorts/ ${topic} after:${from} ${exclusions}`,
    `site:youtube.com/watch ${topic} explanation demonstration after:${from} ${exclusions}`
   ])
  ],
  audience_guidance: 'Adapt query wording and select explanations for the stated audience and posting platforms. Do not require literal age ranges in source titles. Respect the profile time, budget, hates and red lines.'
 }, null, 2);
}

export function radarSourceProblem(signal) {
 let url;
 try { url = new URL(signal.source_url); } catch { return 'Source must have a valid URL.'; }
 if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return 'Source must be a public HTTP or HTTPS URL.';
 const host = url.hostname.toLowerCase().replace(/^www\./, '');
 const blocked = ['prnewswire.com', 'businesswire.com', 'globenewswire.com', 'researchandmarkets.com', 'marketsandmarkets.com'];
 if (blocked.some(domain => host === domain || host.endsWith('.' + domain))) return 'Market-report and press-release sites are excluded.';
 if (/market[\s_-]*(?:report|research|forecast)|press[\s_-]*release/i.test(signal.title + ' ' + url.pathname)) return 'Market reports and press releases are excluded.';
 if (signal.kind === 'constraint') return null;
 if (!/^\d{4}-\d{2}-\d{2}$/.test(signal.published_at)) return 'A verified publication day is required for the 14-day window.';
 if (host === 'reddit.com' || host.endsWith('.reddit.com')) return /^\/r\/[^/]+\/comments\/[^/]+/i.test(url.pathname) ? null : 'Use a direct Reddit discussion, not a community homepage or search listing.';
 if (host === 'youtube.com' || host.endsWith('.youtube.com')) return /^\/shorts\/[^/]+/.test(url.pathname) || (url.pathname === '/watch' && !!url.searchParams.get('v')) ? null : 'Use a direct YouTube video, not a channel or search listing.';
 if (host === 'youtu.be') return /^\/[^/]+/.test(url.pathname) ? null : 'Use a direct YouTube video.';
 if (host === 'news.ycombinator.com') return url.pathname === '/item' && /^\d+$/.test(url.searchParams.get('id') || '') ? null : 'Use a direct discussion, not a news listing.';
 if (host === 'github.com') return /^\/[^/]+\/[^/]+\/(?:releases\/tag|commit|issues|discussions|pull)\/[^/]+/.test(url.pathname) ? null : 'Use a dated release, commit or discussion, not a repository homepage.';
 const path = url.pathname.replace(/\/+$/, '');
 if (!host.includes('.') || /^(?:localhost|127\.|10\.|192\.168\.)/.test(host) || host.endsWith('.local')) return 'Source must be a public article or discussion.';
 if (!path || /^\/(?:search|results|tags?|category|categories|topics?|feeds?|rss|archives?|latest|news|blog|articles?|index\.[a-z]+)\/?$/i.test(path) || /\/(?:search|tags?|category|categories)\//i.test(path) || ['q','query','search','s'].some(key => url.searchParams.has(key))) return 'Use a specific dated article, tutorial or release, not a homepage, category or search listing.';
 return null;
}