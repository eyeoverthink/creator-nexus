const conf = { type: 'string', enum: ['proven', 'likely', 'guessed'] };
const ids = { type: 'array', items: { type: 'string' } };
export const REA_SCHEMA = {
  type: 'object',
  properties: {
    executive_summary: { type: 'object', properties: { what_it_is: { type: 'string' }, how_it_works: { type: 'string' }, rebuild_effort: { type: 'string' } }, required: ['what_it_is', 'how_it_works'] },
    surface_map: { type: 'object', properties: { stack: { type: 'array', items: { type: 'string' } }, components: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string' }, evidence: ids }, required: ['name', 'role'] } }, external_services: { type: 'array', items: { type: 'string' } }, data_flows: { type: 'array', items: { type: 'string' } } } },
    feature_trace: { type: 'array', items: { type: 'object', properties: { step: { type: 'integer' }, layer: { type: 'string' }, location: { type: 'string' }, what_happens: { type: 'string' }, confidence: conf, evidence: ids }, required: ['step', 'what_happens', 'confidence'] } },
    evidence_log: { type: 'array', items: { type: 'object', properties: { claim: { type: 'string' }, evidence: ids, confidence: conf }, required: ['claim', 'confidence'] } },
    unknowns: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, how_to_resolve: { type: 'string' } }, required: ['question'] } },
    rebuild_plan: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, details: { type: 'string' } }, required: ['title', 'details'] } },
    verification: { type: 'array', items: { type: 'object', properties: { test: { type: 'string' }, expected: { type: 'string' } }, required: ['test', 'expected'] } },
  },
  required: ['executive_summary', 'surface_map', 'feature_trace', 'evidence_log', 'unknowns', 'rebuild_plan', 'verification'],
};

export function reaPrompt({ mode, target, feature, question, evidence }) {
  return `You are REA (Reverse Engineer Anything). Work only from the evidence below.
Method: 1) map the surface (stack, components, external services, data flows); 2) trace ${feature ? `the feature "${feature}"` : 'the main user-facing feature'} end to end; 3) tag every claim: proven = directly visible in a cited evidence item, likely = strongly implied by cited evidence, guessed = no direct evidence; 4) list unknowns and exactly how to resolve each (what to capture or observe); 5) give a clean-room rebuild plan (original code, never copying proprietary source) and verification tests.
Cite evidence by id (E1, E2...). Never mark anything proven without citing evidence.
Target (${mode}): ${target}
${question ? `The creator wants to know: ${question}` : ''}
Evidence:
${JSON.stringify(evidence).slice(0, 60000)}`;
}

export function enforce(report, validIds) {
  const fix = (item) => {
    const evidence = (item.evidence || []).filter((id) => validIds.has(id));
    return { ...item, evidence, confidence: item.confidence === 'proven' && !evidence.length ? 'likely' : item.confidence };
  };
  return { ...report, feature_trace: (report.feature_trace || []).map(fix), evidence_log: (report.evidence_log || []).map(fix) };
}

export function reaMarkdown(r, meta) {
  const tag = (x) => `[${x.confidence}${x.evidence?.length ? ` · ${x.evidence.join(', ')}` : ''}]`;
  return [
    `# REA · ${meta.target}`, `Mode: ${meta.mode}${meta.feature ? ` · Feature: ${meta.feature}` : ''}`,
    '## Summary', r.executive_summary?.what_it_is, r.executive_summary?.how_it_works, r.executive_summary?.rebuild_effort ? `Effort: ${r.executive_summary.rebuild_effort}` : '',
    '## Surface map', `Stack: ${(r.surface_map?.stack || []).join(', ')}`, (r.surface_map?.components || []).map((c) => `- ${c.name}: ${c.role}`).join('\n'),
    '## Feature trace', r.feature_trace.map((h) => `${h.step}. ${h.layer ? `${h.layer} · ` : ''}${h.location ? `${h.location} · ` : ''}${h.what_happens} ${tag(h)}`).join('\n'),
    '## Evidence log', r.evidence_log.map((e) => `- ${e.claim} ${tag(e)}`).join('\n'),
    '## Unknowns', r.unknowns.map((u) => `- ${u.question}${u.how_to_resolve ? ` → ${u.how_to_resolve}` : ''}`).join('\n'),
    '## Rebuild plan', r.rebuild_plan.map((s, i) => `${i + 1}. ${s.title}: ${s.details}`).join('\n'),
    '## Verification', r.verification.map((v) => `- ${v.test} → ${v.expected}`).join('\n'),
    '## Evidence sources', meta.evidence.map((e) => `- ${e.id} ${e.kind}: ${e.source}`).join('\n'),
  ].join('\n\n');
}