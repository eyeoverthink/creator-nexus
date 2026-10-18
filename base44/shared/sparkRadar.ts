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
 const host = url.hostname.toLowerCase().replace(/^www\./, '');
 const blocked = ['prnewswire.com', 'businesswire.com', 'globenewswire.com', 'researchandmarkets.com', 'marketsandmarkets.com'];
 if (blocked.some(domain => host === domain || host.endsWith('.' + domain))) return 'Market-report and press-release sites are excluded.';
 if (/market[\s_-]*(?:report|research|forecast)|press[\s_-]*release/i.test(signal.title + ' ' + url.pathname)) return 'Market reports and press releases are excluded.';
 if (signal.kind === 'constraint') return null;
 if (!/^\d{4}-\d{2}-\d{2}$/.test(signal.published_at)) return 'A verified publication day is required for the 14-day window.';
 const reddit = (host === 'reddit.com' || host.endsWith('.reddit.com')) && /^\/r\/(programming|electronics|hardware|musicproduction)\/comments\/[^/]+/i.test(url.pathname);
 const youtube = (host === 'youtube.com' || host === 'm.youtube.com') && (/^\/shorts\/[^/]+/.test(url.pathname) || (url.pathname === '/watch' && !!url.searchParams.get('v')));
 const shortLink = host === 'youtu.be' && /^\/[^/]+/.test(url.pathname);
 return reddit || youtube || shortLink ? null : 'Use a direct post from the selected Reddit communities or a YouTube video, not a report, channel page or search listing.';
}