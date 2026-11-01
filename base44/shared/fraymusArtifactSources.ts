import {readArtifactBytes,describeArtifactBytes} from './fraymusArtifactBytes.ts';
const ROOT='https://media.base44.com/files/public/6ad00af14909c671e73bb835/';
export const ARTIFACT_CORPUS=[
 {id:'ART-DIRECTIVE-V2',filename:'016386e65_OPENCLAW_FRAYNIX_UNIVERSAL_ARTIFACT_FORENSICS_PRIME_DIRECTIVE_v2.md',sha256:'df7c54e238291f29d902a205da143dc24ea3c386fc1f257e2f4a40b48f887cbe',type:'policy_document'},
 {id:'ART-STATE-LATER',filename:'cda5567ab_fraymus_state-2026-05-29T004905270.json',sha256:'b549f6f664b36348f8963f230a8bc7de1757e564d27cd0e3c502b837c93ef765',type:'state_snapshot'},
 {id:'ART-STATE-EARLIER',filename:'83c6af551_fraymus_state-2026-05-28T232655485.json',sha256:'c7d68c2b6fa44ce8bcfff6ffe115fc36e6ad0d13e21eb8a5000b01cc3f5f9d4a',type:'state_snapshot'},
 {id:'ART-INFINITY-MATH',filename:'bf7828612_INFINITY_STORAGE_MATHEMATICAL_FOUNDATIONS.md',sha256:'cccce6da49f15ce2a95b240d60920f7eb7ef7814a5955ac51efabfa3bad99ee3',type:'mathematical_document'}
];
export async function readSuppliedArtifactCorpus(){return Promise.all(ARTIFACT_CORPUS.map(async source=>{const response=await fetch(ROOT+source.filename,{signal:AbortSignal.timeout(15000)}),bytes=await readArtifactBytes(response),description=await describeArtifactBytes(bytes);if(description.sha256!==source.sha256)throw new Error(`Source bytes changed: ${source.id}. No source is executed or silently substituted.`);return {...source,source_url:ROOT+source.filename,bytes,...description};}));}