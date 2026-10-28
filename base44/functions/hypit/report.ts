export const HYPIT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    one_line: { type: 'string' },
    format: { type: 'string' },
    hook: { type: 'object', properties: { seconds: { type: 'number' }, what_happens: { type: 'string' }, technique: { type: 'string' }, why_it_works: { type: 'string' } }, required: ['what_happens', 'technique'] },
    beats: { type: 'array', items: { type: 'object', properties: { start_s: { type: 'number' }, end_s: { type: 'number' }, shot: { type: 'string' }, on_screen_text: { type: 'string' }, voiceover: { type: 'string' }, purpose: { type: 'string' } }, required: ['start_s', 'shot', 'purpose'] } },
    pacing: { type: 'object', properties: { average_shot_seconds: { type: 'number' }, cuts_per_minute: { type: 'number' }, notes: { type: 'string' } } },
    audio: { type: 'object', properties: { voice: { type: 'string' }, music: { type: 'string' }, sound_effects: { type: 'string' } } },
    retention_tactics: { type: 'array', items: { type: 'string' } },
    why_it_works: { type: 'array', items: { type: 'string' } },
    recreation: { type: 'object', properties: { concept: { type: 'string' }, narration_script: { type: 'string' }, shot_list: { type: 'array', items: { type: 'string' } }, alternative_hooks: { type: 'array', items: { type: 'string' } } }, required: ['concept', 'narration_script', 'shot_list'] },
    limits: { type: 'string' },
  },
  required: ['title', 'one_line', 'hook', 'beats', 'why_it_works', 'recreation'],
};

export function hypitPrompt({ times, duration, transcript, goal, title }) {
  return `You are Hypit, a video analyst that reverse engineers short-form videos so a creator can make an ORIGINAL video with the same structure.
Video: "${title}", about ${duration.toFixed(1)} seconds long.
The attached images are frames sampled at these timestamps (seconds), in order: ${times.map((t, i) => `frame ${i + 1} at ${t}s`).join(', ')}.
Transcript: ${transcript ? `"""${transcript}"""` : 'not available'}.
Creator's goal for their own version: ${goal || 'not given, propose a strong original angle'}.
Describe only what is visible in the frames or audible in the transcript. Put anything you could not see in "limits".
Break the video into beats with start/end seconds, explain the hook, pacing, audio and why it holds attention.
Then write a recreation plan. narration_script must be original (never copy the transcript), 60-140 words, one short sentence per beat so it can be rendered as motion cards. Give 3 alternative hooks.`;
}

export function hypitMarkdown(a, meta) {
  const list = (xs) => (xs || []).map((x) => `- ${x}`).join('\n');
  return [
    `# Hypit · ${a.title}`, a.one_line, `Source: ${meta.title} · ${meta.duration.toFixed(1)}s · transcript: ${meta.transcriptNote}`,
    `## Hook (${a.hook?.seconds ?? '?'}s)`, `${a.hook?.what_happens}\nTechnique: ${a.hook?.technique}\n${a.hook?.why_it_works || ''}`,
    '## Beats', (a.beats || []).map((b) => `- ${b.start_s}s–${b.end_s ?? '?'}s: ${b.shot}${b.on_screen_text ? ` · text "${b.on_screen_text}"` : ''}${b.voiceover ? ` · says "${b.voiceover}"` : ''} — ${b.purpose}`).join('\n'),
    '## Pacing', `${a.pacing?.average_shot_seconds ?? '?'}s per shot · ${a.pacing?.cuts_per_minute ?? '?'} cuts/min\n${a.pacing?.notes || ''}`,
    '## Audio', `Voice: ${a.audio?.voice || '-'}\nMusic: ${a.audio?.music || '-'}\nSFX: ${a.audio?.sound_effects || '-'}`,
    '## Why it works', list(a.why_it_works), '## Retention tactics', list(a.retention_tactics),
    '## Your version', a.recreation?.concept, '### Script', a.recreation?.narration_script, '### Shot list', list(a.recreation?.shot_list), '### Alternative hooks', list(a.recreation?.alternative_hooks),
    a.limits ? `## Limits\n${a.limits}` : '',
  ].join('\n\n');
}