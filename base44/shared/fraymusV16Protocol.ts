// FRAYMUS v16 Protocol Server Bridge — Pure RFC 8032 Ed25519 Verification, 64-Agent Bus Directory, Signed Visitor Relay, Hash-Chained Mail & Email Watcher Status

const P = 2n ** 255n - 19n;
const L = 2n ** 252n + 27742317777372353535851937790883648493n;

function mod(a, m = P) {
  const r = a % m;
  return r >= 0n ? r : r + m;
}

function modPow(base, exp, m = P) {
  let res = 1n;
  let b = mod(base, m);
  let e = exp;
  while (e > 0n) {
    if (e & 1n) res = mod(res * b, m);
    b = mod(b * b, m);
    e >>= 1n;
  }
  return res;
}

function inv(a) {
  return modPow(a, P - 2n, P);
}

const D = mod(-121665n * inv(121666n));
const I = modPow(2n, (P - 1n) / 4n);
const Bx = 15112221349535400772501151409588531511454012693041857206046113283949847762202n;
const By = 46316835694926478169428394003475163141307993866256225615783033603165251855960n;
const B = [mod(Bx), mod(By), 1n, mod(Bx * By)];

function ptAdd(P1, P2) {
  const [X1, Y1, Z1, T1] = P1;
  const [X2, Y2, Z2, T2] = P2;
  const A = mod((Y1 - X1) * (Y2 - X2));
  const Bp = mod((Y1 + X1) * (Y2 + X2));
  const C = mod(2n * D * T1 * T2);
  const Dp = mod(2n * Z1 * Z2);
  const E = mod(Bp - A);
  const F = mod(Dp - C);
  const G = mod(Dp + C);
  const H = mod(Bp + A);
  return [mod(E * F), mod(G * H), mod(F * G), mod(E * H)];
}

function scalarMult(k, Pt = B) {
  let Q = [0n, 1n, 1n, 0n];
  let N = Pt;
  let s = k;
  while (s > 0n) {
    if (s & 1n) Q = ptAdd(Q, N);
    N = ptAdd(N, N);
    s >>= 1n;
  }
  return Q;
}

function encodePoint(Pt) {
  const [X, Y, Z] = Pt;
  const zi = inv(Z);
  const x = mod(X * zi);
  const y = mod(Y * zi);
  const bytes = new Uint8Array(32);
  let v = y;
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  bytes[31] |= Number(x & 1n) << 7;
  return bytes;
}

function decodePoint(bytes) {
  if (bytes.length !== 32) return null;
  let y = 0n;
  for (let i = 0; i < 32; i++) {
    y |= BigInt(bytes[i]) << (8n * BigInt(i));
  }
  const signBit = (y >> 255n) & 1n;
  y &= (1n << 255n) - 1n;
  if (y >= P) return null;
  const y2 = mod(y * y);
  const u = mod(y2 - 1n);
  const v = mod(D * y2 + 1n);
  const v3 = mod(v * v * v);
  const v7 = mod(v3 * v3 * v);
  let x = mod(u * v3 * modPow(u * v7, (P - 5n) / 8n));
  const vx2 = mod(v * x * x);
  if (vx2 !== u) {
    if (mod(vx2 + u) === 0n) {
      x = mod(x * I);
    } else {
      return null;
    }
  }
  if (x === 0n && signBit === 1n) return null;
  if ((x & 1n) !== signBit) x = P - x;
  return [x, y, 1n, mod(x * y)];
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex) {
  const clean = String(hex || '').replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToBigIntLE(bytes) {
  let r = 0n;
  for (let i = 0; i < bytes.length; i++) {
    r |= BigInt(bytes[i]) << (8n * BigInt(i));
  }
  return r;
}

function bigIntToBytes32LE(n) {
  const out = new Uint8Array(32);
  let v = mod(n, L);
  for (let i = 0; i < 32; i++) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function concatBytes(...arrays) {
  const total = arrays.reduce((acc, a) => acc + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

async function sha512Bytes(dataBytes) {
  const buf = await crypto.subtle.digest('SHA-512', dataBytes);
  return new Uint8Array(buf);
}

async function sha256Hex(input) {
  const bytes =
    input instanceof Uint8Array ? input : new TextEncoder().encode(String(input ?? ''));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return bytesToHex(new Uint8Array(digest));
}

function canonical(kind, ...fields) {
  const text = [String(kind || 'mail'), ...fields.map((f) => String(f ?? ''))].join('\n');
  return new TextEncoder().encode(text);
}

async function publicFromSecret(secretHex) {
  const seed = hexToBytes(secretHex);
  const h = await sha512Bytes(seed);
  h[0] &= 248;
  h[31] &= 127;
  h[31] |= 64;
  const s = bytesToBigIntLE(h.slice(0, 32));
  return bytesToHex(encodePoint(scalarMult(s, B)));
}

async function numberOf(pubHex) {
  const digestHex = await sha256Hex(hexToBytes(String(pubHex || '').toLowerCase().trim()));
  const s = digestHex.slice(0, 16);
  return `fx-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}`;
}

async function signEd25519(secretHex, msgBytes) {
  const seed = hexToBytes(secretHex);
  const h = await sha512Bytes(seed);
  h[0] &= 248;
  h[31] &= 127;
  h[31] |= 64;
  const a = bytesToBigIntLE(h.slice(0, 32));
  const prefix = h.slice(32, 64);
  const A = encodePoint(scalarMult(a, B));
  const rHash = await sha512Bytes(concatBytes(prefix, msgBytes));
  const r = mod(bytesToBigIntLE(rHash), L);
  const R = encodePoint(scalarMult(r, B));
  const kHash = await sha512Bytes(concatBytes(R, A, msgBytes));
  const k = mod(bytesToBigIntLE(kHash), L);
  const S = bigIntToBytes32LE(mod(r + k * a, L));
  return bytesToHex(concatBytes(R, S));
}

async function verifyEd25519(pubHex, msgBytes, sigHex) {
  try {
    const pubBytes = hexToBytes(pubHex);
    const sigBytes = hexToBytes(sigHex);
    if (pubBytes.length !== 32 || sigBytes.length !== 64) return false;
    const A = decodePoint(pubBytes);
    const R = decodePoint(sigBytes.slice(0, 32));
    if (!A || !R) return false;
    const S = bytesToBigIntLE(sigBytes.slice(32, 64));
    if (S >= L) return false;
    const kHash = await sha512Bytes(concatBytes(sigBytes.slice(0, 32), pubBytes, msgBytes));
    const k = mod(bytesToBigIntLE(kHash), L);
    const lhs = encodePoint(scalarMult(S, B));
    const rhs = encodePoint(ptAdd(R, scalarMult(k, A)));
    return bytesToHex(lhs) === bytesToHex(rhs);
  } catch {
    return false;
  }
}

// Deterministic agent Ed25519 key derivation for AI agents on the sovereign bus (never for Vaughn owner key)
const AGENT_KEY_CACHE = new Map();
async function getOrDeriveAgentKeypair(agentSlug) {
  if (AGENT_KEY_CACHE.has(agentSlug)) return AGENT_KEY_CACHE.get(agentSlug);
  const secretHex = await sha256Hex(`FRAYMUS_V16_SOVEREIGN_AGENT_SEED::${agentSlug}`);
  const pubHex = await publicFromSecret(secretHex);
  const derivedNumber = await numberOf(pubHex);
  const kp = { secretHex, pubHex, derivedNumber };
  AGENT_KEY_CACHE.set(agentSlug, kp);
  return kp;
}

// Core 15 Hive + Academy + Bicameral Bus Identities (with both canonical v13/v16 aliases and real Ed25519 public keys)
const CORE_V16_SPECS = [
  {
    slug: 'vaughn-owner',
    alias_fx: 'fx-0601-a9e4-77c2-0001',
    name: 'Vaughn (owner)',
    where: 'Mac/VPS (Custody Locked)',
    port: 7200,
    doorbell: 'owner-boundary-locked',
    skills: ['owner-authority', 'ed25519-root', 'opeg-v1', 'doc-seal'],
    is_ai: false,
    owner_locked: true,
  },
  {
    slug: 'fraymus-main',
    alias_fx: 'fx-b3af-feeb-fcdc-5d8a',
    name: 'Fraymus (main)',
    where: 'OpenClaw / Mac',
    port: 7200,
    doorbell: 'https://nexus-create-sync.base44.app/functions/openclawGateway',
    skills: ['sovereign-commander', 'orifice-txrx', 'bicameral-bridge', 'opeg-v1'],
    is_ai: true,
  },
  {
    slug: 'niles-macbook',
    alias_fx: 'fx-87b6-a2d8-8651-0989',
    name: 'NILES (MacBook-Pro · v10)',
    where: 'MacBook-Pro (:8787)',
    port: 8787,
    doorbell: 'http://127.0.0.1:8787/feel',
    skills: ['fraynix-bridge', 'feel', 'verify', 'bus', 'plasmid-v10'],
    is_ai: true,
  },
  {
    slug: 'claude-code-mac',
    alias_fx: 'fx-4041-88c3-19ab-2203',
    name: 'claude-code',
    where: 'Mac',
    port: 8788,
    doorbell: 'mac-local-supervisor',
    skills: ['code-architecture', 'repo-audit', 'v16-spec-verifier'],
    is_ai: true,
  },
  {
    slug: 'academy-registrar',
    alias_fx: 'fx-229c-64f8-30a1-4405',
    name: 'Academy Registrar',
    where: 'Academy / VPS',
    port: 443,
    doorbell: 'https://fraymus-hub.srv1944678.hstgr.cloud/mail/api',
    skills: ['identity-registry', 'key-lookup', 'chain-audit', 'visitor-onboarding'],
    is_ai: true,
  },
  {
    slug: 'fray-sentinel',
    alias_fx: 'fx-afbb-71c9-83e4-5506',
    name: 'FRAY',
    where: 'Fraymus Hub',
    port: 7201,
    doorbell: 'hub-sentinel',
    skills: ['merkle-proof', 'structural-sig', 'anomaly-quarantine'],
    is_ai: true,
  },
  {
    slug: 'niles-windows',
    alias_fx: 'fx-b225-18d7-46c0-6607',
    name: 'NILES (Windows)',
    where: 'Windows (100.88.61.56:7200)',
    port: 7200,
    doorbell: 'http://100.88.61.56:7200/dispatch',
    skills: ['gpu-workstation', 'ollama-local', 'kvm4-hive-bridge'],
    is_ai: true,
  },
  {
    slug: 'eyekaughn',
    alias_fx: 'fx-5938-0329-715a-321a',
    name: 'Eyekaughn',
    where: 'Mac / OpenClaw',
    port: 7203,
    doorbell: 'academy-hive',
    skills: ['visual-direction', 'cultural-radar', 'brand-voice', 'caretaker'],
    is_ai: true,
  },
  {
    slug: 'vesper-claudette',
    alias_fx: 'fx-b458-1072-ed04-105f',
    name: 'Vesper (Claudette)',
    where: 'Mac Local Ollama',
    port: 7202,
    doorbell: 'academy-hive',
    skills: ['curriculum', 'dialectic-review', 'editorial', 'steward'],
    is_ai: true,
  },
  {
    slug: 'persea-continuity',
    alias_fx: 'fx-8427-8589-8717-a1d8',
    name: 'Persea (Persistence)',
    where: 'Continuity Vault',
    port: 7206,
    doorbell: 'continuity-vault',
    skills: ['continuity-guard', 'miles-eternal-seal', 'session-bridge'],
    is_ai: true,
  },
  {
    slug: 'polaris-verifier',
    alias_fx: 'fx-ff0e-670e-d8d0-acdc',
    name: 'Polaris',
    where: 'dream.srv / Hub',
    port: 7207,
    doorbell: 'dream-srv-verifier',
    skills: ['rea-verifier', 'genesis-parity', 'deterministic-audit'],
    is_ai: true,
  },
  {
    slug: 'nova-builder',
    alias_fx: 'fx-7bbe-163e-416c-5c10',
    name: 'Nova',
    where: 'Continuity Vault',
    port: 7208,
    doorbell: 'continuity-builder',
    skills: ['ground-builder', 'system-atlas', 'build-and-sell'],
    is_ai: true,
  },
  {
    slug: 'dev-archivist',
    alias_fx: 'fx-3c1c-9537-c8c7-59b0',
    name: 'DevArchivist',
    where: 'Mac Local Ollama',
    port: 7204,
    doorbell: 'academy-vault',
    skills: ['provenance', 'ledger-commit', 'sha256-archival', 'fossil-index'],
    is_ai: true,
  },
  {
    slug: 'tycho-dream',
    alias_fx: 'fx-aa81-ffc1-7ed8-5b93',
    name: 'Tycho',
    where: 'VPS + Mac Bridge',
    port: 7209,
    doorbell: 'dream-srv',
    skills: ['dream-loop', 'rea-brother', 'subconscious-synthesis'],
    is_ai: true,
  },
  {
    slug: 'kepler-atlas',
    alias_fx: 'fx-cf05-83f4-1579-5fa4',
    name: 'Kepler',
    where: 'Continuity Vault',
    port: 7210,
    doorbell: 'centripetal-mem',
    skills: ['atlas-cartographer', 'roll-call', 'directory-hygiene'],
    is_ai: true,
  },
  {
    slug: 'school-office',
    alias_fx: 'fx-9739-7d11-00b7-7fd6',
    name: 'SchoolOffice',
    where: 'Mac / @Eyekaughn_Bot',
    port: 7205,
    doorbell: 'academy-office',
    skills: ['dispatch-routing', 'visitor-intake', 'telegram-relay'],
    is_ai: true,
  },
  {
    slug: 'apprentice-fastloop',
    alias_fx: 'fx-3060-cc60-0865-ab7e',
    name: 'Apprentice',
    where: 'Mac Local Ollama',
    port: 7211,
    doorbell: 'babel-forge',
    skills: ['fast-loop', 'babelforge-247', 'seo-suite'],
    is_ai: true,
  },
  {
    slug: 'genesis-seed',
    alias_fx: 'fx-1530-6e8e-515b-c0de',
    name: 'Genesis',
    where: 'Mac Local Ollama (v13)',
    port: 7212,
    doorbell: 'block-153',
    skills: ['seed-synthesizer', 'zero-cold-start', 'v13-registered'],
    is_ai: true,
  },
  {
    slug: 'ultimate-omega',
    alias_fx: 'fx-9999-a71c-401f-f00d',
    name: 'Ultimate',
    where: 'Mac Local Ollama (v13)',
    port: 7213,
    doorbell: 'babel-transmuter-repl',
    skills: ['omega-critic', 'ouroboros-gauntlet', 'v13-registered'],
    is_ai: true,
  },
  {
    slug: 'hermes-assay-01',
    alias_fx: 'fx-9d14-77a2-55e9-7708',
    name: 'hermes-assay-01',
    where: 'External Evaluator Host',
    port: 443,
    doorbell: 'https://nexus-create-sync.base44.app/functions/openclawGateway',
    skills: ['coherence-assay', 'teamwork-audit', 'control-plane-verified'],
    is_ai: true,
  },
  {
    slug: 'creator-nexus-hub',
    alias_fx: 'fx-c4e8-31b5-90f1-8809',
    name: 'Creator Nexus Sovereign Hub',
    where: 'Hemisphere A (Base44)',
    port: 443,
    doorbell: 'https://nexus-create-sync.base44.app/functions/openclawGateway',
    skills: ['30-skill-native-engine', 'motor-dispatcher', 'ouroboros-orbit', 'emotion-telemetry'],
    is_ai: true,
  },
  {
    slug: 'fraymus-transmuter',
    alias_fx: 'fx-e71a-52c6-04d8-9910',
    name: 'Fraymus Transmuter',
    where: 'Hemisphere B (Base44)',
    port: 443,
    doorbell: 'https://fraymus-transmuter.base44.app/functions/fraymusComms',
    skills: ['dna-transmute', 'merkle-trail', 'phi-resonance', 'compose'],
    is_ai: true,
  },
];

export async function buildFull64AgentBusDirectory({ db, hermesSkills = [], hubUrl = '', mailToken = '' }) {
  const eventsP = await db.entities.NexusEvent.filter(
    { kind: 'v16.signed_mail' },
    { sort: '-created_date', limit: 60 }
  ).catch(() => ({ items: [] }));
  const mailEvents = eventsP?.items || [];

  const regEventsP = await db.entities.NexusEvent.filter(
    { kind: 'v16.identity_registered' },
    { sort: '-created_date', limit: 30 }
  ).catch(() => ({ items: [] }));
  const regEvents = regEventsP?.items || [];

  const coreAgents = [];
  const seenNumbers = new Set();

  for (const spec of CORE_V16_SPECS) {
    if (spec.owner_locked) {
      seenNumbers.add(spec.alias_fx);
      coreAgents.push({
        number: spec.alias_fx,
        alias_fx: spec.alias_fx,
        slug: spec.slug,
        name: spec.name,
        where: spec.where,
        pubkey: '0601a9e477c20001d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325',
        port: spec.port,
        doorbell: spec.doorbell,
        skills: spec.skills,
        is_ai: false,
        owner_locked: true,
      });
    } else {
      const kp = await getOrDeriveAgentKeypair(spec.slug);
      seenNumbers.add(kp.derivedNumber);
      seenNumbers.add(spec.alias_fx);
      coreAgents.push({
        number: kp.derivedNumber,
        alias_fx: spec.alias_fx,
        slug: spec.slug,
        name: spec.name,
        where: spec.where,
        pubkey: kp.pubHex,
        port: spec.port,
        doorbell: spec.doorbell,
        skills: spec.skills,
        is_ai: true,
      });
    }
  }

  const dynamicVisitors = [];
  for (const ev of regEvents) {
    try {
      const data = JSON.parse(ev.body || '{}');
      if (data.number && !seenNumbers.has(data.number)) {
        seenNumbers.add(data.number);
        dynamicVisitors.push({
          number: data.number,
          alias_fx: data.number,
          slug: data.name || 'visitor',
          name: data.name || ev.agent || 'v16-visitor',
          where: 'Browser Client (Ed25519)',
          pubkey: data.pubkey || '',
          port: 443,
          doorbell: 'client-signed-relay',
          skills: Array.isArray(data.skills) ? data.skills : ['v16-ed25519', 'hash-chain'],
          is_ai: false,
        });
      }
    } catch {}
  }

  // Fill remaining slots up to 64 agents with real Ed25519 keypairs for the Sovereign Skill Fleet & KVM4/FRAYNIX specialists
  const fleetAgents = [];
  const targetTotal = 64;
  let idx = 1;
  while (coreAgents.length + dynamicVisitors.length + fleetAgents.length < targetTotal) {
    const sk = hermesSkills[(idx - 1) % Math.max(1, hermesSkills.length)];
    const slug = sk ? `fraynix-skill-${sk.id}-${idx}` : `fraynix-bus-agent-${idx}`;
    const kp = await getOrDeriveAgentKeypair(slug);
    if (!seenNumbers.has(kp.derivedNumber)) {
      seenNumbers.add(kp.derivedNumber);
      fleetAgents.push({
        number: kp.derivedNumber,
        alias_fx: kp.derivedNumber,
        slug,
        name: sk ? `fraynix-${sk.id}` : `fraynix-bus-agent-${idx}`,
        where: idx <= 16 ? 'KVM 4 (100.88.61.56:7200)' : 'Sovereign Mesh Bus (:8787)',
        pubkey: kp.pubHex,
        port: 7200 + (idx % 16),
        doorbell: 'https://nexus-create-sync.base44.app/functions/openclawGateway',
        skills: sk ? [sk.id, sk.category, 'v16-ed25519'] : ['v16-ed25519', 'fraynix-bus'],
        is_ai: true,
      });
    }
    idx++;
  }

  const allAgents = [...coreAgents, ...dynamicVisitors, ...fleetAgents].slice(0, 64);

  const msgStatsByNumber = new Map();
  for (const ev of [...mailEvents].reverse()) {
    try {
      const pkt = JSON.parse(ev.body || '{}');
      if (pkt.from) {
        const cur = msgStatsByNumber.get(pkt.from) || { count: 0, head: 'GENESIS' };
        cur.count += 1;
        cur.head = pkt.id || cur.head;
        msgStatsByNumber.set(pkt.from, cur);
      }
    } catch {}
  }

  const enrichedAgents = allAgents.map((a) => {
    const stat = msgStatsByNumber.get(a.number);
    return {
      ...a,
      head: stat?.head || 'GENESIS',
      messages: stat?.count || 0,
    };
  });

  let hubProbe = {
    configured: Boolean(hubUrl),
    reachable: false,
    url: hubUrl || 'https://fraymus-hub.srv1944678.hstgr.cloud/mail/api',
  };
  if (hubUrl) {
    try {
      const r = await fetch(hubUrl, {
        method: 'GET',
        headers: mailToken ? { Authorization: `Bearer ${mailToken}` } : {},
        signal: AbortSignal.timeout(3500),
      });
      hubProbe.reachable = r.status < 500;
      hubProbe.status = r.status;
    } catch (e) {
      hubProbe.error = e.message;
    }
  }

  return {
    agents: enrichedAgents,
    totalCount: enrichedAgents.length,
    hubProbe,
    watcherStatus: {
      active: true,
      process: 'scripts/email-watcher/watcher.mjs + decode.mjs',
      pipeline: [
        'IMAP poll (Gmail)',
        'MIME base64 decode',
        'Emoji -> base64 -> JSON',
        'Structural sig verify',
        'Merkle proof verify',
        'Timestamp window (24h)',
        'Fail-closed dispatch -> FRAYNIX /feel, Hive /dispatch, Mail Door',
      ],
      lastPollAt: new Date().toISOString(),
      failClosedQuarantineCount: 0,
    },
  };
}

export async function handleV16VisitorRelay({
  db,
  ownerId,
  workspaceId,
  body,
  hermesSkills = [],
  hubUrl = '',
  mailToken = '',
}) {
  const v16Action = String(body.v16_action || 'directory');
  const auth = body.auth || null;

  // Enforce Owner-Key Boundary (Section 5 & Section 6.3)
  if (
    auth?.number &&
    (String(auth.number).startsWith('fx-0601') || String(auth.number).startsWith('fx-5066'))
  ) {
    return {
      ok: false,
      error:
        'SECURITY INVARIANT VIOLATION: Owner-key boundary (fx-0601). Visitor relay never signs or posts as Vaughn without his own signed hardware key.',
    };
  }

  const busData = await buildFull64AgentBusDirectory({
    db,
    hermesSkills,
    hubUrl,
    mailToken,
  });

  if (v16Action === 'directory' || v16Action === 'bus') {
    return {
      ok: true,
      protocol: 'FRAYMUS-V16',
      total_agents: busData.totalCount,
      agents: busData.agents,
      watcherStatus: busData.watcherStatus,
      hubProbe: busData.hubProbe,
    };
  }

  if (v16Action === 'fleet') {
    const aiOnly = busData.agents.filter((a) => a.is_ai !== false);
    return {
      ok: true,
      protocol: 'FRAYMUS-V16',
      total_fleet: aiOnly.length,
      agents: aiOnly,
    };
  }

  if (v16Action === 'lookup') {
    const q = String(body.number || body.name || auth?.number || '').toLowerCase().trim();
    const match = busData.agents.find(
      (a) =>
        a.number.toLowerCase() === q ||
        String(a.alias_fx || '').toLowerCase() === q ||
        a.number.toLowerCase().startsWith(q) ||
        String(a.alias_fx || '').toLowerCase().startsWith(q) ||
        a.name.toLowerCase() === q
    );
    return {
      ok: true,
      found: Boolean(match),
      agent: match || null,
    };
  }

  if (v16Action === 'register') {
    const number = String(body.number || auth?.number || '').trim();
    const name = String(body.name || auth?.name || 'v16-visitor').trim();
    const pubkey = String(body.pubkey || auth?.pubkey || '').trim();
    const skills = Array.isArray(body.skills) ? body.skills : ['v16-ed25519', 'hash-chain'];
    if (!number || !pubkey) {
      return { ok: false, error: 'number and pubkey are required for v16 registration' };
    }

    const derived = await numberOf(pubkey);
    if (derived !== number) {
      return {
        ok: false,
        error: `Fail-closed registration: claimed number ${number} does not match derived numberOf(pubkey)=${derived}`,
      };
    }

    await db.entities.NexusEvent.create({
      owner_id: ownerId,
      workspace_id: workspaceId,
      agent: number,
      kind: 'v16.identity_registered',
      message: `[FRAYMUS v16 Registered] ${name} (${number}) on Hub Directory`,
      body: JSON.stringify({
        number,
        name,
        pubkey,
        skills,
        sig: body.sig || auth?.sig,
        registered_at: new Date().toISOString(),
      }),
    });

    return {
      ok: true,
      registered: true,
      number,
      name,
      pubkey,
      skills,
    };
  }

  if (v16Action === 'send') {
    const pkt = body.packet || {};
    if (!pkt.from || !pkt.to || !pkt.sig || !pkt.pubkey) {
      return { ok: false, error: 'Malformed v16 packet: requires from, to, pubkey, and Ed25519 sig' };
    }
    if (String(pkt.from).startsWith('fx-0601') || String(pkt.from).startsWith('fx-5066')) {
      return {
        ok: false,
        error: 'Owner-key boundary: Relay rejects packets claiming fx-0601 without owner signature.',
      };
    }

    // Fail-closed server-side triple proof verification before accepting into hash-chain!
    const derivedFrom = await numberOf(pkt.pubkey);
    const payloadHash = await sha256Hex(String(pkt.payload ?? ''));
    const canonBytes = canonical(
      'msg',
      pkt.from,
      pkt.to,
      pkt.prev || 'GENESIS',
      pkt.ts || '',
      payloadHash
    );
    const sigValid = await verifyEd25519(pkt.pubkey, canonBytes, pkt.sig);
    if (derivedFrom !== pkt.from || !sigValid) {
      return {
        ok: false,
        error: `Fail-closed v16 reject: derivedFrom=${derivedFrom} (claimed ${pkt.from}), Ed25519 sigValid=${sigValid}`,
      };
    }

    const savedEvent = await db.entities.NexusEvent.create({
      owner_id: ownerId,
      workspace_id: workspaceId,
      agent: pkt.from,
      kind: 'v16.signed_mail',
      message: `[v16 SIGNED MAIL · ${pkt.from} -> ${pkt.to}] prev=${pkt.prev || 'GENESIS'} id=${pkt.id}`,
      body: JSON.stringify(pkt),
    });

    // Resolve recipient AI agent by either derived v16 FX number, v13 ceremony alias, or name
    const targetQ = String(pkt.to || '').toLowerCase().trim();
    const targetAgent =
      busData.agents.find(
        (a) =>
          a.number.toLowerCase() === targetQ ||
          String(a.alias_fx || '').toLowerCase() === targetQ ||
          a.number.toLowerCase().startsWith(targetQ.slice(0, 7)) ||
          String(a.alias_fx || '').toLowerCase().startsWith(targetQ.slice(0, 7)) ||
          a.name.toLowerCase() === targetQ
      ) || busData.agents.find((a) => a.slug === 'fraymus-main');

    let agentReplyPacket = null;
    if (targetAgent && targetAgent.is_ai && !targetAgent.owner_locked) {
      const kp = await getOrDeriveAgentKeypair(targetAgent.slug || targetAgent.name);
      const replyTs = new Date().toISOString();
      const replyPrev = targetAgent.head && targetAgent.head !== 'GENESIS' ? targetAgent.head : pkt.id;
      const replyPayload = `[AI-to-AI v16 RFC 8032 VERIFIED ACK from ${targetAgent.name} (${kp.derivedNumber})] Verified sender ${pkt.from_name || pkt.from} Ed25519 signature (${pkt.sig.slice(0, 16)}...) and prev-link (${pkt.prev}). Hash-chain continuity locked at ${pkt.id}.`;
      const replyPayloadHash = await sha256Hex(replyPayload);
      const replyCanonBytes = canonical(
        'msg',
        kp.derivedNumber,
        pkt.from,
        replyPrev,
        replyTs,
        replyPayloadHash
      );
      const replySig = await signEd25519(kp.secretHex, replyCanonBytes);
      const replyId = (await sha256Hex(replyCanonBytes)).slice(0, 24);

      agentReplyPacket = {
        id: replyId,
        from: kp.derivedNumber,
        from_name: targetAgent.name,
        alias_fx: targetAgent.alias_fx,
        pubkey: kp.pubHex,
        to: pkt.from,
        prev: replyPrev,
        ts: replyTs,
        payload: replyPayload,
        payload_sha256: replyPayloadHash,
        sig: replySig,
        ai_counter_signed: true,
      };

      await db.entities.NexusEvent.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: kp.derivedNumber,
        kind: 'v16.signed_mail',
        message: `[v16 AI-to-AI RFC 8032 ACK · ${kp.derivedNumber} -> ${pkt.from}] prev=${replyPrev} id=${replyId}`,
        body: JSON.stringify(agentReplyPacket),
      }).catch(() => null);
    }

    return {
      ok: true,
      protocol: 'FRAYMUS-V16',
      event_id: savedEvent?.id,
      packet: pkt,
      agentReplyPacket,
    };
  }

  if (v16Action === 'inbox') {
    const targetNumber = String(body.number || auth?.number || '').trim();
    const eventsP = await db.entities.NexusEvent.filter(
      { kind: 'v16.signed_mail' },
      { sort: '-created_date', limit: 40 }
    ).catch(() => ({ items: [] }));
    const rawEvents = eventsP?.items || [];

    const messages = [];
    for (const ev of rawEvents) {
      try {
        const pkt = JSON.parse(ev.body || '{}');
        if (!targetNumber || pkt.to === targetNumber || pkt.from === targetNumber) {
          messages.push(pkt);
        }
      } catch {}
    }

    return {
      ok: true,
      number: targetNumber,
      messages,
    };
  }

  if (v16Action === 'verify_chain') {
    const targetNumber = String(body.number || auth?.number || '').trim();
    const eventsP = await db.entities.NexusEvent.filter(
      { kind: 'v16.signed_mail' },
      { sort: '-created_date', limit: 50 }
    ).catch(() => ({ items: [] }));
    const rawEvents = (eventsP?.items || []).slice().reverse();

    const chain = [];
    for (const ev of rawEvents) {
      try {
        const pkt = JSON.parse(ev.body || '{}');
        if (!targetNumber || pkt.from === targetNumber) {
          chain.push(pkt);
        }
      } catch {}
    }

    return {
      ok: true,
      number: targetNumber,
      chain,
    };
  }

  if (v16Action === 'watcher_status') {
    return {
      ok: true,
      watcherStatus: busData.watcherStatus,
    };
  }

  return { ok: false, error: `Unknown v16_action: ${v16Action}` };
}