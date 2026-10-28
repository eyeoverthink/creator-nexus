// REA evidence gathering: bounded, read-only collection from a public website, a GitHub repo or pasted source.
const PRIVATE = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|\[)/i;
export class ReaInputError extends Error {}

function publicUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (!['http:', 'https:'].includes(u.protocol)) return null;
  const h = u.hostname.toLowerCase();
  if (PRIVATE.test(h) || h.endsWith('.local') || h.endsWith('.internal')) return null;
  return u;
}

async function readLimited(res, limit) {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  while (size < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  reader.cancel().catch(() => {});
  return new TextDecoder().decode(new Uint8Array(chunks.flatMap((c) => [...c])).slice(0, limit));
}

async function fetchText(raw, limit) {
  let url = publicUrl(raw);
  if (!url) throw new ReaInputError('Use a public http(s) address.');
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'CreatorNexus-REA/1.0' }, signal: AbortSignal.timeout(15000) });
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      url = publicUrl(new URL(loc, url).toString());
      if (!url) throw new ReaInputError('That address redirects to a private network.');
      continue;
    }
    return { url: url.toString(), status: res.status, headers: res.headers, text: await readLimited(res, limit) };
  }
  throw new ReaInputError('Too many redirects.');
}

const uniq = (a, n) => [...new Set(a.filter(Boolean))].slice(0, n);
const MARKERS = [['React', /react-dom|__REACT_DEVTOOLS|jsx-runtime/], ['Next.js', /__NEXT_DATA__|\/_next\//], ['Vue', /__VUE__|createApp\(/], ['Svelte', /svelte/i], ['Angular', /ng-version|@angular/], ['Vite', /\/@vite\/|import\.meta\.env/], ['Webpack', /webpackChunk|__webpack_require__/], ['Tailwind', /tailwind/i], ['Firebase', /firebaseio\.com|firebaseapp/], ['Supabase', /supabase\.co/], ['Stripe', /js\.stripe\.com|Stripe\(/], ['Sentry', /sentry\.io|Sentry\.init/], ['Google Analytics', /googletagmanager|gtag\(/], ['Base44', /base44/i], ['Three.js', /THREE\.|three\.module/], ['GraphQL', /graphql/i]];

export function codeSignals(text) {
  const all = (re) => [...text.matchAll(re)].map((m) => m[1]);
  return {
    frameworks: MARKERS.filter(([, re]) => re.test(text)).map(([n]) => n),
    imports: uniq([...all(/import\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g), ...all(/require\(\s*['"]([^'"]+)['"]\s*\)/g)], 30),
    endpoints: uniq([...all(/fetch\(\s*[`'"]([^`'"]+)[`'"]/g), ...all(/["'`](\/api\/[^"'`\s]{1,120})["'`]/g), ...all(/["'`](https?:\/\/[^"'`\s]{4,160})["'`]/g)], 40),
    routes: uniq(all(/path\s*:\s*["'`](\/[^"'`]{0,80})["'`]/g), 30),
    symbols: uniq([...all(/function\s+([A-Za-z_$][\w$]{2,40})/g), ...all(/class\s+([A-Z][\w$]{2,40})/g), ...all(/def\s+([a-z_]\w{2,40})\s*\(/g), ...all(/(?:const|let)\s+([A-Za-z_$][\w$]{2,40})\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g)], 50),
    env_keys: uniq(all(/\b([A-Z][A-Z0-9_]{2,40}_(?:KEY|URL|ID|TOKEN|ENDPOINT))\b/g), 20),
  };
}

function keyLines(text) {
  return text.split('\n').flatMap((line, i) => (/\b(function|fetch|export|class|def|route|router|addEventListener|postMessage|useEffect)\b/.test(line) ? [`${i + 1}: ${line.trim().slice(0, 200)}`] : [])).slice(0, 25);
}

export async function webEvidence(target) {
  const page = await fetchText(target, 1500000);
  const html = page.text;
  const pick = (re) => (html.match(re) || [])[1]?.replace(/\s+/g, ' ').trim().slice(0, 300) || '';
  const scripts = uniq([...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => { try { return new URL(m[1], page.url).toString(); } catch { return null; } }), 6);
  const ev = [{
    kind: 'page', source: page.url,
    excerpt: JSON.stringify({ status: page.status, title: pick(/<title[^>]*>([\s\S]*?)<\/title>/i), description: pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i), server: page.headers.get('server'), powered_by: page.headers.get('x-powered-by'), csp: !!page.headers.get('content-security-policy'), headings: [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map((m) => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean).slice(0, 10), forms: (html.match(/<form/gi) || []).length, scripts }),
    signals: codeSignals(html.slice(0, 300000)),
  }];
  const results = await Promise.allSettled(scripts.map((s) => fetchText(s, 800000)));
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') { ev.push({ kind: 'script', source: scripts[i], excerpt: 'Could not download this script.' }); return; }
    const map = (r.value.text.match(/sourceMappingURL=([^\s'"]+)/) || [])[1];
    ev.push({ kind: 'script', source: r.value.url, excerpt: `${r.value.text.length} chars${map ? ` · source map referenced: ${map}` : ''} · start: ${r.value.text.slice(0, 400)}`, signals: codeSignals(r.value.text) });
  });
  return ev;
}

export async function githubEvidence(base44, target) {
  const m = String(target).trim().match(/^(?:https?:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/(?:tree|blob)\/([^/]+)(?:\/(.*))?)?\/?$/i);
  if (!m) throw new ReaInputError('Use owner/repo or a github.com link.');
  const [, owner, repo, ref0, sub] = m;
  let token = '';
  try { token = (await base44.asServiceRole.connectors.getConnection('github')).accessToken; } catch { token = ''; }
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'CreatorNexus-REA', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const gh = async (path, raw = false) => {
    const res = await fetch(`https://api.github.com${path}`, { headers: raw ? { ...headers, Accept: 'application/vnd.github.raw' } : headers, signal: AbortSignal.timeout(20000) });
    if (res.status === 404) throw new ReaInputError('Repository or path not found.');
    if (!res.ok) throw new Error(`GitHub answered ${res.status}.`);
    return raw ? (await res.text()).slice(0, 40000) : await res.json();
  };
  const meta = await gh(`/repos/${owner}/${repo}`);
  const ref = ref0 || meta.default_branch;
  const tree = await gh(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`);
  const files = (tree.tree || []).filter((x) => x.type === 'blob' && (!sub || x.path.startsWith(sub)));
  const dirs = {};
  files.forEach((f) => { const d = f.path.split('/')[0]; dirs[d] = (dirs[d] || 0) + 1; });
  const keyRe = /(^|\/)(readme\.md|package\.json|requirements\.txt|pyproject\.toml|cargo\.toml|go\.mod|dockerfile|(main|index|app|server)\.(js|jsx|ts|tsx|py|go|rs))$/i;
  const chosen = [...files.filter((f) => keyRe.test(f.path)), ...files.filter((f) => /\.(js|jsx|ts|tsx|py|go|rs|java)$/.test(f.path) && f.size < 60000).sort((a, b) => b.size - a.size)]
    .filter((f, i, a) => a.findIndex((x) => x.path === f.path) === i).slice(0, 10);
  const ev = [
    { kind: 'repo', source: meta.html_url, excerpt: JSON.stringify({ description: meta.description, language: meta.language, stars: meta.stargazers_count, topics: meta.topics, branch: ref, pushed_at: meta.pushed_at, license: meta.license?.spdx_id }) },
    { kind: 'tree', source: `${meta.html_url}/tree/${ref}`, excerpt: JSON.stringify({ files: files.length, top_dirs: dirs, paths: files.slice(0, 150).map((f) => f.path) }).slice(0, 6000) },
  ];
  const texts = await Promise.allSettled(chosen.map((f) => gh(`/repos/${owner}/${repo}/contents/${f.path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`, true)));
  texts.forEach((t, i) => {
    if (t.status === 'fulfilled') ev.push({ kind: 'file', source: chosen[i].path, excerpt: `${t.value.slice(0, 2000)}\n--- key lines ---\n${keyLines(t.value).join('\n')}`, signals: codeSignals(t.value) });
  });
  return ev;
}

export function sourceEvidence(files) {
  const list = Array.isArray(files) ? files.filter((f) => typeof f?.name === 'string' && typeof f?.text === 'string').slice(0, 20) : [];
  const total = list.reduce((s, f) => s + f.text.length, 0);
  if (!list.length) throw new ReaInputError('Add at least one source file or paste some code.');
  if (total > 400000) throw new ReaInputError('Source is limited to 400,000 characters in total.');
  return list.map((f) => ({ kind: 'file', source: f.name.slice(0, 200), excerpt: `${f.text.slice(0, 2500)}\n--- key lines ---\n${keyLines(f.text).join('\n')}`, signals: codeSignals(f.text) }));
}