import {z} from 'npm:zod@4.4.3';
export const fraymusHex=z.string().regex(/^[0-9a-f]{64}$/);
const programSchema=z.object({css:z.string().max(8192),js:z.string().max(8192),html:z.string().max(8192),wasm:z.string().max(8192)}).strict();
const leaves=z.object({css:fraymusHex,js:fraymusHex,html:fraymusHex,wasm:fraymusHex}).strict();
export const fraymusEnvelopeSchema=z.object({protocol:z.literal('fraymus.dispatch/2'),alg:z.literal('Ed25519'),workspace_id:z.string().min(1).max(120),from:z.string().regex(/^fx-(?:[0-9a-f]{4}-){3}[0-9a-f]{4}$/),to:z.string().min(1).max(160),subject:z.string().min(1).max(160),pubkey:fraymusHex,challenge_id:z.string().min(1).max(120),nonce:z.string().uuid(),issued_at:z.string().datetime(),expires_at:z.string().datetime(),program:programSchema,psha:fraymusHex,merkle:z.object({root:fraymusHex,leaves}).strict(),sig:z.string().regex(/^[0-9a-f]{128}$/).optional()}).strict();
export function dispatchRequire(ok,message,status=400){if(!ok){const error=new Error(message);error.status=status;throw error;}}
export const dispatchBytes=text=>new TextEncoder().encode(text);
export const dispatchUnhex=hex=>Uint8Array.from(hex.match(/../g)||[],x=>parseInt(x,16));
export async function dispatchHash(value){const bytes=typeof value==='string'?dispatchBytes(value):value;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
export async function dispatchIdentity(pubkey){fraymusHex.parse(pubkey);const fingerprint=await dispatchHash(dispatchUnhex(pubkey));return {fingerprint,sender:'fx-'+fingerprint.slice(0,16).match(/.{4}/g).join('-')};}
export function dispatchProgram(input){const p=programSchema.parse({css:'',js:'',html:'',wasm:'',...input});dispatchRequire(dispatchBytes(JSON.stringify(p)).length<=12000,'Program exceeds the 12,000-byte dispatch limit.');return p;}
export async function dispatchMerkle(program){const names=['css','js','html','wasm'];const hashes=await Promise.all(names.map(k=>dispatchHash(program[k])));const pair=await Promise.all([dispatchHash(hashes[0]+hashes[1]),dispatchHash(hashes[2]+hashes[3])]);return {root:await dispatchHash(pair[0]+pair[1]),leaves:Object.fromEntries(names.map((k,i)=>[k,hashes[i]]))};}
// Fixed field order, including subject, algorithm, key, scope, challenge and expiry.
// A deliberately separate security profile, not compatible with legacy dispatch/1 signatures.
export function dispatchCanonical(e){return JSON.stringify({protocol:e.protocol,alg:e.alg,workspace_id:e.workspace_id,from:e.from,to:e.to,subject:e.subject,pubkey:e.pubkey,challenge_id:e.challenge_id,nonce:e.nonce,issued_at:e.issued_at,expires_at:e.expires_at,psha:e.psha,merkle:{root:e.merkle.root,leaves:{css:e.merkle.leaves.css,js:e.merkle.leaves.js,html:e.merkle.leaves.html,wasm:e.merkle.leaves.wasm}}});}
export async function verifyDispatchCrypto(input){
 const e=fraymusEnvelopeSchema.parse(input),program=dispatchProgram(e.program),identity=await dispatchIdentity(e.pubkey),merkle=await dispatchMerkle(program);
 dispatchRequire(e.from===identity.sender,'Sender does not match its public key.');
 dispatchRequire(e.psha===await dispatchHash(JSON.stringify(program)),'Program digest mismatch.');
 dispatchRequire(JSON.stringify(merkle)===JSON.stringify({root:e.merkle.root,leaves:{css:e.merkle.leaves.css,js:e.merkle.leaves.js,html:e.merkle.leaves.html,wasm:e.merkle.leaves.wasm}}),'Merkle leaf or root mismatch.');
 dispatchRequire(Boolean(e.sig),'A client-side Ed25519 signature is required.');
 const key=await crypto.subtle.importKey('raw',dispatchUnhex(e.pubkey),{name:'Ed25519'},false,['verify']);
 const canonical=dispatchCanonical(e),valid=await crypto.subtle.verify({name:'Ed25519'},key,dispatchUnhex(e.sig),dispatchBytes(canonical));
 dispatchRequire(valid,'Ed25519 signature mismatch.');
 return {envelope:e,identity,receipt_id:await dispatchHash(canonical),signature_valid:true,merkle_valid:true};
}