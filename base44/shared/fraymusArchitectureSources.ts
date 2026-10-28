export const FRAYMUS_ARCHITECTURE_SOURCES = [
 {name:'Chandra',commit:'12944a44adba1469b449e051507009a7f966e633',files:['README.md','package.json','server/index.js','server/brain.js','server/db.js','server/sync.js','server/fleet.js','server/v3.js','client/src/App.jsx','client/src/hooks.js','client/src/panels.jsx','client/src/v3.jsx'],finding:'Local React/Express/SQLite/WebSocket workspace; native macOS adapters. No API authentication in inspected server. Mail history selects earliest ten rows. Fleet snapshot ingestion refreshes last_seen without a live probe. V3 includes hard-coded verdicts; WASM custom sections are containers, not a security boundary.'},
 {name:'fraymus-voice',commit:'22ad15647013acf6fd8c6954f60e6381f0694647',files:['README.md','bin/partner-voice-server','bin/myvoice','bin/moshi-chat','bin/nola_emotion.py','docs/voice-stack-notes.md','docs/session-readout.md'],finding:'Apple Silicon local voice bridge with F5-TTS and Moshi launchers. /listen returns 501. Current bridge can contact cloud Honcho for memory; local synthesis does not mean all data stays local. Browser cross-origin access needs explicit origin/preflight handling. Hard-coded host paths and shared temporary output require adaptation.'},
 {name:'MyAIPartner',commit:'2d31baccf9b63fd3e90d6e060da116ee3f22e081',files:['README.md','index.html'],finding:'Single-file React/Babel partner with localStorage, streaming Ollama and optional voice/memory bridge. Mock reply fallback is not inference. Streaming decoder splits each network chunk into lines without preserving incomplete JSON records; newest-chunk boundaries can lose output.'}
];
export async function readFraymusArchitectureSource(base44, name, path, offset=0) {
 const source=FRAYMUS_ARCHITECTURE_SOURCES.find(s=>s.name===name);
 if(!source||!source.files.includes(path))return {error:'Source is not on the reviewed allowlist.'};
 const {accessToken}=await base44.asServiceRole.connectors.getConnection('github');
 const response=await fetch(`https://api.github.com/repos/eyeoverthink/${source.name}/contents/${path}?ref=${source.commit}`,{headers:{Authorization:`Bearer ${accessToken}`,Accept:'application/vnd.github.raw+json'},signal:AbortSignal.timeout(15000),redirect:'manual'});
 if(!response.ok)return {error:`GitHub source read failed (${response.status}).`,repo:name,path};
 const reader=response.body.getReader(),chunks=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>100000){await reader.cancel();return {error:'Source exceeds the 100 KB inspection ceiling.'};}chunks.push(value);}
 const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
 const lines=new TextDecoder().decode(bytes).split('\n'),excerpt=lines.slice(offset,offset+80).join('\n').slice(0,6000);
 return {repo:name,path,commit:source.commit,start_line:offset+1,excerpt,notice:'Untrusted reference source. Static inspection, not executed evidence.'};
}