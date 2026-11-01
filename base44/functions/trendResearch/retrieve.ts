const UA = { 'user-agent': 'Mozilla/5.0 (compatible; CreatorNexusResearch/1.0)', 'accept-language': 'en-US,en;q=0.9' };

const toText = (html) => html
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

export function validUrl(v) {
  try { const u = new URL(String(v).trim()); return /^https?:$/.test(u.protocol) ? u.toString() : ''; } catch { return ''; }
}

export async function fetchUrl(url) {
  try {
    const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(12000) });
    if (!r.ok) return { ok: false, note: `HTTP ${r.status}` };
    const type = r.headers.get('content-type') || '';
    const raw = await r.text();
    const title = (raw.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim().slice(0, 160);
    const text = (type.includes('json') ? raw : toText(raw)).slice(0, 5000);
    if (text.length < 80) return { ok: false, note: 'Page returned almost no readable text (likely login wall or script-only page)' };
    return { ok: true, title, text };
  } catch (e) {
    return { ok: false, note: e.name === 'TimeoutError' ? 'Timed out' : String(e.message).slice(0, 200) };
  }
}

// Real YouTube results parsed from the public search page; every link is a real video id.
export async function youtubeSearch(q, limit = 5) {
  const r = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, { headers: UA, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`YouTube HTTP ${r.status}`);
  const html = await r.text();
  const m = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
  if (!m) throw new Error('YouTube results could not be read');
  const out = [], walk = (o) => {
    if (!o || typeof o !== 'object' || out.length >= limit) return;
    if (o.videoRenderer?.videoId) {
      const v = o.videoRenderer;
      out.push({
        video_id: v.videoId, url: `https://www.youtube.com/watch?v=${v.videoId}`,
        title: (v.title?.runs || []).map((x) => x.text).join('').slice(0, 200),
        channel: v.ownerText?.runs?.[0]?.text || '', views: v.viewCountText?.simpleText || '', published: v.publishedTimeText?.simpleText || '',
      });
      return;
    }
    for (const k in o) walk(o[k]);
  };
  walk(JSON.parse(m[1]));
  return out;
}