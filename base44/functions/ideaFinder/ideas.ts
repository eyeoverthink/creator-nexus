const s = (v, n) => String(v ?? '').slice(0, n);
const list = (a, n) => (Array.isArray(a) ? a : []).slice(0, n);

export const IDEA_SCHEMA = {
  type: 'object',
  properties: {
    my_top_complaints: { type: 'array', items: { type: 'object', properties: { complaint: { type: 'string' }, evidence: { type: 'string' } }, required: ['complaint', 'evidence'] } },
    niche_complaints: { type: 'array', items: { type: 'object', properties: { complaint: { type: 'string' }, source: { type: 'string' } }, required: ['complaint', 'source'] } },
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' }, pain: { type: 'string' }, agent_design: { type: 'string' },
          build_plan: { type: 'array', items: { type: 'string' } }, offer: { type: 'string' },
          buyers_where: { type: 'string' }, first_outreach: { type: 'string' },
          assumptions: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'pain', 'agent_design', 'build_plan', 'offer', 'buyers_where', 'first_outreach', 'assumptions'],
      },
    },
  },
  required: ['my_top_complaints', 'niche_complaints', 'ideas'],
};

// Same leak rule as the Leaks tab: a half hour worth less than half the hourly value.
export function summarize(entries, hourly) {
  const block = hourly / 2, cats = {};
  for (const e of entries) {
    const c = (cats[e.category] ||= { blocks: 0, low: 0, energy: 0, value: 0, acts: {} });
    c.blocks++; c.energy += e.energy; c.value += e.dollar_value || 0;
    if ((e.dollar_value || 0) < block) c.low++;
    const a = String(e.activity || '').toLowerCase().trim();
    c.acts[a] = (c.acts[a] || 0) + 1;
  }
  const categories = Object.entries(cats).map(([category, c]) => ({
    category, hours: c.blocks / 2, low_value_hours: c.low / 2, avg_energy: +(c.energy / c.blocks).toFixed(1), dollars: c.value,
    top_activities: Object.entries(c.acts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a),
  })).sort((a, b) => b.low_value_hours - a.low_value_hours);
  const complaints = entries.filter((e) => e.complaint).slice(0, 60).map((e) => `${e.slot_date} ${e.slot_time} [${e.category}] ${e.complaint}`);
  return { days: new Set(entries.map((e) => e.slot_date)).size, total_hours: entries.length / 2, categories, complaints };
}

export function buildMessages(set, audit, web) {
  const system = `You are my Million Dollar Idea Finder. Ideas come from my own pain, not from trends.
1. my_top_complaints: only from my time audit and my complaints below, most frequent first, max 5. Evidence must cite the audit (category and hours) or quote my complaint.
2. niche_complaints: what other ${set.niche} complain about, max 5. ${web ? 'Use web research and put the site or URL in "source".' : 'You have no web access: set every source to "model knowledge (unverified)".'} Never invent statistics.
3. ideas: exactly 3 business ideas. Each solves one of the top complaints with an AI agent product I can build in about 12 hours as a workspace dashboard, sold at $${set.price_usd} to ${set.buyers} buyers. Fields: name; pain (which complaint it solves); agent_design (role, outcome, tools, rules); build_plan (6-10 concrete steps that fit about 12 hours); offer (one-line pitch); buyers_where (where to find ${set.buyers}+ people with this pain); first_outreach (short outreach draft, it will not be sent); assumptions (what must be true; revenue is a goal, not a guarantee).
Reply as JSON only.`;
  const user = `NICHE: ${set.niche}
MY COMPLAINTS: ${set.complaints || '(none written)'}
TIME AUDIT: ${audit.days} day(s), ${audit.total_hours} h logged. Low-value = half hours worth less than $${set.hourly_value / 2}.
CATEGORIES: ${JSON.stringify(audit.categories)}
COMPLAINTS LOGGED DURING THE AUDIT:
${audit.complaints.join('\n') || '(none)'}`;
  return [{ role: 'system', content: system }, { role: 'user', content: user }];
}

export function cleanOutput(out, set) {
  if (!out || !Array.isArray(out.ideas) || !out.ideas.length) throw new Error('The model did not return any ideas.');
  return {
    my_complaints: list(out.my_top_complaints, 5).map((c) => ({ complaint: s(c?.complaint, 300), evidence: s(c?.evidence, 300) })).filter((c) => c.complaint),
    niche_complaints: list(out.niche_complaints, 5).map((c) => ({ complaint: s(c?.complaint, 300), source: s(c?.source, 300) || 'model knowledge (unverified)' })).filter((c) => c.complaint),
    ideas: list(out.ideas, 3).map((i) => ({
      name: s(i?.name, 120), pain: s(i?.pain, 400), agent_design: s(i?.agent_design, 1200),
      build_plan: list(i?.build_plan, 12).map((x) => s(x, 300)), offer: s(i?.offer, 400),
      buyers_where: s(i?.buyers_where, 600), first_outreach: s(i?.first_outreach, 1500),
      assumptions: list(i?.assumptions, 6).map((x) => s(x, 300)),
      price_usd: set.price_usd, buyers: set.buyers, revenue_goal_usd: set.price_usd * set.buyers,
    })),
  };
}