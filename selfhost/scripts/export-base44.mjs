#!/usr/bin/env node
// Phase 2: export every entity from the live Base44 app to JSON files (one <Entity>.json per entity).
// NOT run in Phase 1. Entity reads do not use AI/integration credits, but run it once credits reset anyway.
//   1. Sign in at https://creator-nexus.base44.app as the admin, open DevTools > Application > Local Storage,
//      copy the value of `base44_access_token` into an env var (do not paste it in chat):
//        export BASE44_TOKEN='...'
//   2. npm i @base44/sdk@0.8.59 && node selfhost/scripts/export-base44.mjs ./base44-export
import { createClient } from '@base44/sdk';
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2] || './base44-export';
const token = process.env.BASE44_TOKEN;
if (!token) { console.error('Set BASE44_TOKEN first'); process.exit(1); }
const appId = process.env.BASE44_APP_ID || '6ad00af14909c671e73bb835';
const base44 = createClient({ appId, token, serverUrl: 'https://base44.app', analytics: { enabled: false } });
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../base44/entities');
const names = fs.readdirSync(root).filter(f => f.endsWith('.jsonc')).map(f => f.replace(/\.jsonc$/, ''));
fs.mkdirSync(out, { recursive: true });
for (const name of names) {
  const rows = [];
  try {
    if (name === 'User') rows.push(...await base44.entities.User.list());
    else {
      let page = await base44.entities[name].list({ limit: 1000, sort: 'created_date' });
      rows.push(...page.items);
      while (page.has_more) { page = await base44.entities[name].list({ limit: 1000, sort: 'created_date', cursor: page.next_cursor }); rows.push(...page.items); }
    }
    fs.writeFileSync(path.join(out, name + '.json'), JSON.stringify(rows));
    console.log(`${name}: ${rows.length}`);
  } catch (e) { console.error(`${name}: FAILED ${e.status || ''} ${e.message}`); }
}
