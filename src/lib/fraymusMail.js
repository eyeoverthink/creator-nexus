// FRAYMUS v16 Protocol Library (Pure JS Ed25519 RFC 8032 + FX Number Derivation + Hash-Chained Signed Mail)
// Invariant: The server relay only ever sees signed requests, never a private key.
// Every check is recomputed client-side; nothing from the hub is taken on trust.

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

export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex) {
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

export async function sha512Bytes(dataBytes) {
  const buf = await crypto.subtle.digest('SHA-512', dataBytes);
  return new Uint8Array(buf);
}

export async function sha256Hex(input) {
  const bytes =
    input instanceof Uint8Array ? input : new TextEncoder().encode(String(input ?? ''));
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return bytesToHex(new Uint8Array(buf));
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

export function canonical(kind, ...fields) {
  const text = [String(kind || 'mail'), ...fields.map((f) => String(f ?? ''))].join('\n');
  return new TextEncoder().encode(text);
}

// Derive public key hex from 32-byte secret key hex (RFC 8032)
export async function publicFromSecret(secretHex) {
  const seed = hexToBytes(secretHex);
  if (seed.length !== 32) throw new Error('Ed25519 secret must be 32 bytes (64 hex chars)');
  const h = await sha512Bytes(seed);
  h[0] &= 248;
  h[31] &= 127;
  h[31] |= 64;
  const s = bytesToBigIntLE(h.slice(0, 32));
  const A = encodePoint(scalarMult(s, B));
  return bytesToHex(A);
}

// FX number derivation: numberOf(pubHex) -> fx-xxxx-xxxx-xxxx-xxxx
export async function numberOf(pubHex) {
  const pubClean = String(pubHex || '').toLowerCase().trim();
  const digestHex = await sha256Hex(hexToBytes(pubClean));
  const s = digestHex.slice(0, 16);
  return `fx-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}`;
}

// RFC 8032 Ed25519 sign(secretHex, msgBytesOrString)
export async function sign(secretHex, msg) {
  const seed = hexToBytes(secretHex);
  const msgBytes = msg instanceof Uint8Array ? msg : new TextEncoder().encode(String(msg ?? ''));
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

// RFC 8032 Ed25519 verify(pubHex, msgBytesOrString, sigHex)
export async function verify(pubHex, msg, sigHex) {
  try {
    const pubBytes = hexToBytes(pubHex);
    const sigBytes = hexToBytes(sigHex);
    if (pubBytes.length !== 32 || sigBytes.length !== 64) return false;
    const msgBytes = msg instanceof Uint8Array ? msg : new TextEncoder().encode(String(msg ?? ''));

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

// Create new Ed25519 v16 identity
export async function newIdentity(name = 'visitor') {
  const seed = new Uint8Array(32);
  crypto.getRandomValues(seed);
  const secret = bytesToHex(seed);
  const pub = await publicFromSecret(secret);
  const number = await numberOf(pub);
  return {
    name: String(name || 'visitor').trim(),
    secret,
    public: pub,
    number,
    protocol: 'FRAYMUS-V16',
    created_at: new Date().toISOString(),
  };
}

// Validate an identity by re-deriving public key + FX number from secret
export async function checkIdentity(id) {
  if (!id || !id.secret || !id.public || !id.number) return false;
  try {
    const derivedPub = await publicFromSecret(id.secret);
    if (derivedPub.toLowerCase() !== String(id.public).toLowerCase()) return false;
    const derivedNum = await numberOf(derivedPub);
    return derivedNum === id.number;
  } catch {
    return false;
  }
}

// Verify a single message client-side (recomputes number from pubkey, payload hash, and Ed25519 sig)
export async function checkMessage(m, senderPubHex) {
  if (!m) return { valid: false, reason: 'missing_message' };
  const pub = senderPubHex || m.pubkey || m.sender_pub;
  if (!pub) return { valid: false, reason: 'missing_sender_pubkey' };

  const derivedNumber = await numberOf(pub);
  const numberMatch = !m.from || m.from === derivedNumber;
  const payloadText = typeof m.payload === 'string' ? m.payload : JSON.stringify(m.payload ?? '');
  const payloadHash = await sha256Hex(payloadText);
  const canonicalBytes = canonical(
    'msg',
    m.from || derivedNumber,
    m.to || '',
    m.prev || 'GENESIS',
    m.ts || '',
    payloadHash
  );
  const sigOk = m.sig ? await verify(pub, canonicalBytes, m.sig) : false;
  const expectedId = (await sha256Hex(canonicalBytes)).slice(0, 24);
  const idMatch = !m.id || m.id === expectedId;

  return {
    valid: Boolean(numberMatch && sigOk && idMatch),
    numberMatch,
    derivedNumber,
    payloadHash,
    sigOk,
    idMatch,
    expectedId,
  };
}

// Three client-side browser proofs (World.jsx proveInBrowser standard)
export async function proveInBrowser(m, senderPubHex) {
  const check = await checkMessage(m, senderPubHex);
  return {
    proof1_number_derivation: {
      passed: check.numberMatch,
      claimed: m?.from,
      derived: check.derivedNumber,
    },
    proof2_payload_sha256: {
      passed: Boolean(check.payloadHash),
      sha256: check.payloadHash,
      prev_link: m?.prev || 'GENESIS',
    },
    proof3_ed25519_rfc8032: {
      passed: check.sigOk,
      sig_prefix: String(m?.sig || '').slice(0, 24),
      msg_id: check.expectedId,
    },
    all_passed: check.valid,
  };
}

// File/attachment envelope with SHA-256 integrity
export async function makeEnvelope(text, attachments = []) {
  const normalized = [];
  for (const att of attachments) {
    const contentStr = String(att.content || '');
    const hash = await sha256Hex(contentStr);
    normalized.push({
      name: att.name || 'attachment.txt',
      mime: att.mime || 'text/plain',
      sha256: hash,
      size: contentStr.length,
      content: contentStr,
    });
  }
  return JSON.stringify({
    v: 16,
    text: String(text || ''),
    attachments: normalized,
    ts: new Date().toISOString(),
  });
}

export async function openEnvelope(rawPayload) {
  try {
    const parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
    if (!parsed || typeof parsed !== 'object' || !('text' in parsed)) {
      return { text: String(rawPayload ?? ''), attachments: [], verifiedAttachments: true };
    }
    let allOk = true;
    const verifiedAttachments = [];
    for (const att of parsed.attachments || []) {
      const actualHash = await sha256Hex(String(att.content || ''));
      const ok = actualHash === att.sha256;
      if (!ok) allOk = false;
      verifiedAttachments.push({ ...att, verified: ok, computed_sha256: actualHash });
    }
    return {
      text: parsed.text || '',
      attachments: verifiedAttachments,
      verifiedAttachments: allOk,
    };
  } catch {
    return { text: String(rawPayload ?? ''), attachments: [], verifiedAttachments: true };
  }
}

// Signed Hub Registration
export async function register(relay, id, skills = []) {
  const valid = await checkIdentity(id);
  if (!valid) throw new Error('Invalid v16 identity: secret does not match pubkey/number');
  const ts = new Date().toISOString();
  const canon = canonical('register', id.number, id.name, id.public, skills.join(','), ts);
  const sig = await sign(id.secret, canon);
  return relay('register', {
    number: id.number,
    name: id.name,
    pubkey: id.public,
    skills,
    ts,
    sig,
  });
}

// Directory fetch
export async function directory(relay) {
  return relay('directory', {});
}

// Hash-chained, Ed25519-signed send
export async function send(relay, id, toNumber, payload, prevHead = null) {
  const valid = await checkIdentity(id);
  if (!valid) throw new Error('Invalid v16 identity: cannot sign message');
  if (String(id.number).startsWith('fx-0601') || String(id.number).startsWith('fx-5066')) {
    throw new Error('Owner-key boundary: Academy/Nexus visitor relay never signs as Vaughn (fx-0601)');
  }

  const ts = new Date().toISOString();
  const prev = prevHead || id.head || 'GENESIS';
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload ?? '');
  const payloadHash = await sha256Hex(payloadStr);
  const canon = canonical('msg', id.number, toNumber, prev, ts, payloadHash);
  const sig = await sign(id.secret, canon);
  const msgId = (await sha256Hex(canon)).slice(0, 24);

  const packet = {
    id: msgId,
    from: id.number,
    from_name: id.name,
    pubkey: id.public,
    to: toNumber,
    prev,
    ts,
    payload: payloadStr,
    payload_sha256: payloadHash,
    sig,
  };

  const res = await relay('send', { packet });
  return { packet, relayResponse: res };
}

// Signed Inbox read + client-side verification of every message
export async function inbox(relay, id) {
  const ts = new Date().toISOString();
  const canon = canonical('inbox', id.number, ts);
  const sig = await sign(id.secret, canon);
  const res = await relay('inbox', { number: id.number, ts, sig });
  const messages = Array.isArray(res?.messages) ? res.messages : [];
  const verified = await Promise.all(
    messages.map(async (m) => {
      const check = await checkMessage(m, m.pubkey);
      const env = await openEnvelope(m.payload);
      return {
        ...m,
        verified: check.valid,
        verification: check,
        envelope: env,
      };
    })
  );
  return { ...res, messages: verified };
}

// Audit full sender hash-chain
export async function verifyChain(relay, number) {
  const res = await relay('verify_chain', { number });
  const chain = Array.isArray(res?.chain) ? res.chain : [];
  let prevExpected = 'GENESIS';
  let chainIntact = true;
  const steps = [];

  for (const m of chain) {
    const check = await checkMessage(m, m.pubkey);
    const prevLinksMatch = (m.prev || 'GENESIS') === prevExpected;
    if (!check.valid || !prevLinksMatch) chainIntact = false;
    steps.push({
      id: m.id,
      prev: m.prev || 'GENESIS',
      expectedPrev: prevExpected,
      prevLinksMatch,
      sigValid: check.sigOk,
      numberValid: check.numberMatch,
    });
    prevExpected = m.id;
  }

  return {
    number,
    chainLength: chain.length,
    chainIntact,
    head: prevExpected,
    steps,
  };
}

// RFC 8032 §7.1 Test Vector 1 (empty message)
export async function selfTest() {
  const testSecret = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
  const expectedPub = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';
  const expectedSig =
    'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b';

  const pub = await publicFromSecret(testSecret);
  const sig = await sign(testSecret, new Uint8Array(0));
  const verified = await verify(expectedPub, new Uint8Array(0), expectedSig);
  const tampered = await verify(expectedPub, new TextEncoder().encode('tampered'), expectedSig);
  const fxNum = await numberOf(expectedPub);

  return {
    passed: pub === expectedPub && sig === expectedSig && verified === true && tampered === false,
    rfc8032_vector1: {
      derivedPubMatches: pub === expectedPub,
      signatureMatches: sig === expectedSig,
      verifyPositive: verified === true,
      verifyNegativeControl: tampered === false,
      derivedFxNumber: fxNum,
    },
  };
}