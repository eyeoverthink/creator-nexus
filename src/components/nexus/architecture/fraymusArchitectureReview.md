# FRAYMUS unified agency: engineering review

## Decision
Build a verified meta-orchestrator around the existing engines, not a replacement foundation model. KAI handles reasoning and evidence, VEX handles visual/action proposals, AUM handles audio, NEX manages dispatch, and COR enforces budgets and acceptance gates. These are responsibilities, not five mandatory model calls per request. A single qualified model may cover multiple responsibilities.

This delivery includes a source-reading engineering agent, this review, a local clone kit pinned to the reviewed commits, and an executable raw-RGBA integrity experiment. It does not include a git checkout inside this hosted project or a running Chandra/voice server. The agent is read-only: no shell execution, repository writes, installs, live-data changes, autonomous code repair, or background loop.

## Source ledger
Reviewed on 2026-10-26 through the authorized GitHub connection:

- **Chandra** `12944a44adba1469b449e051507009a7f966e633`: README, package manifest, server entry, brain, fleet, sync and selected V3 implementation. Native Node/Express/SQLite/WebSocket services, React client, local Ollama replies, allowlisted host commands.
- **fraymus-voice** `22ad15647013acf6fd8c6954f60e6381f0694647`: README, voice bridge, stack notes and selected emotion-controller declarations. F5-TTS/MLX synthesis and Moshi launcher contracts; not evidence these services are reachable from this app.
- **MyAIPartner** `2d31baccf9b63fd3e90d6e060da116ee3f22e081`: README and selected streaming, memory and voice paths in index.html. Full-file follow-up inspection is available to the engineering agent in bounded excerpts. CONTINUITY.md was not audited.
- **ULTIMATE_AGENT_ARCHITECTURE.md**: all 620 lines supplied in chat. A design specification with target metrics, not measurements.
- **Two 33-page FRAYMUS PDFs**: supplied parsed text and screenshots. Historical UI captures, not executable source or present runtime telemetry.
- **Three one-page conversation PDFs**: excerpts of generated commentary, not mathematical derivations or independent verification.

No repository-wide execution, independent benchmark, hardware inspection, or license audit has occurred. Absence of a repository license field is not permission to redistribute dependencies or model weights. The voice repository itself specifies private distribution.

## Findings that change the design

### Chandra
1. **Deployment boundary:** server/index.js exposes mail, memory, model replies and host tools without authentication; server.listen(PORT) does not bind explicitly to loopback. Do not expose this server publicly or connect cloud users to it until authentication and network restrictions exist.
2. **Conversation correctness:** server/brain.js selects `ORDER BY created_at ASC LIMIT 10`, then uses the last selected row as the prompt. After ten rows it can answer an old message. Select the latest bounded history in descending order and reverse it before inference; bind the current mail ID to the job explicitly.
3. **Concurrency:** busyModels is a Set, not a per-model queue or reference count. Overlapping calls can clear another call's busy flag. Use leased jobs, per-model concurrency ceilings and cancellation; reuse the existing Nexus queue rather than adding another untracked executor.
4. **Provenance:** server/fleet.js stamps imported historical fleet entries with Date.now(). Preserve source_observed_at separately from imported_at; an import is not a heartbeat.
5. **Security evidence:** server/v3.js has real byte/XOR/HMAC operations alongside assigned PASS/VULN verdicts (notably cases 10–14). A selector reporting a 256-bit tag is not a brute-force experiment. getV3State reveals a prefix of secret_hex as secretMasked; remove secret-derived display material before adapting. A WASM magic header or custom section does not make a container immutable or execute a verifier.

### Voice and partner
1. **Platform:** MLX is an Apple Silicon runtime; do not install its wrappers in a cloud function or assume they run on Windows. Native processes belong on the owner-controlled worker.
2. **Privacy:** speech synthesis can be local while the bridge's memory path contacts Honcho. Split consent and data-flow labels for local synthesis and external memory. Personal voice recordings remain on the owner's machine.
3. **Browser connection:** the inspected voice bridge binds loopback and has no explicit OPTIONS/CORS handling. A web app reaching 127.0.0.1 means the visitor's computer, not the cloud host. HTTPS, browser private-network policy and origin restrictions require a deliberate bridge design.
4. **Audio integrity:** shared /tmp/pvs_speak.wav and a threaded HTTP server can race across requests. Serialize synthesis or isolate output paths, cap request/text/audio sizes and verify returned WAV format before playback. /listen is explicitly unimplemented (501); Moshi CLI is a separate duplex runtime.
5. **Streaming:** MyAIPartner decodes and splits each arriving chunk independently. Network chunks are not NDJSON message boundaries. Maintain a trailing-line buffer, flush at EOF, and handle terminal/error records. Do not copy the mock fallback into an operational agent as silent success.
6. **Affect:** Nola's stored controller values can condition a prompt. This is not evidence of subjective emotion, calibrated human emotion recognition, or a trained cross-modal model.

## Seven-layer redesign

| Layer | Concrete contract | Reuse / boundary |
| --- | --- | --- |
| 1. Resources | Worker-reported CPU/RAM/GPU/model availability with timestamp and lease | Existing Needle/dispatch workers; report is not hardware attestation |
| 2. State | Owner/workspace/task IDs, version, source timestamp, idempotency key | NexusWorkspace, existing tasks, continuity and actor room; no new global singleton |
| 3. Trust | Authenticate caller, allowlist tool, check ownership, verify digest/signature and expiry | Existing signed dispatch; digest alone is not sender authentication |
| 4. Retrieval | Exact source text plus bounded lexical recall and optional measured embeddings | Existing 4096-D lexical memory; preserve raw evidence for verification |
| 5. Reasoning | Model adapter with declared capabilities, bounded context and actual usage | Existing Ollama path plus explicit hosted consent; one draft by default |
| 6. Evaluation | Independent checks, baseline comparison, held-out cases, reversible proposed patch | Existing regression and VM tools; never let self-scoring deploy a patch |
| 7. Coordination | Bounded task DAG, dependencies, concurrency limits, stop conditions, human release gate | KAI/VEX/AUM/NEX/COR roles; no invented consciousness score |

Flow: user objective → COR budget/permissions → KAI source-backed plan → NEX explicit task graph → available VEX/AUM workers → independent artifact checks → user review → existing Library/continuity retention. The engineering agent delivered here implements source inspection and planning only; native media/action delegation is not yet connected to it.

## Cost and token discipline

Start with deterministic tools and retrieve only relevant source ranges. Call one model when reasoning is needed; escalate to critique only after an explicit failed check or user request. Do not broadcast the same large prompt to five agents. Cache reusable source by repository commit + path + content hash, never by title alone. Deduplicate evidence by digest; keep citations and original bytes retrievable.

The engineering agent uses automatic model selection, at most four model steps, at most three source reads, 80 source lines / 6,000 characters per read, a 2,000-character task and 1,200 generated tokens per step. These are work limits, not a guaranteed dollar price. Actual gateway token usage is reported when available. It does not poll or run in the background. Export results explicitly; this branch does not write shared application records.

For future adaptive routing, minimize J = a·money + b·latency + c·failure_rate + d·privacy_risk subject to required capabilities and user constraints. Coefficients and thresholds must be explicit. Learn selection preferences only from independently scored outcomes. A golden-ratio multiplier is an experimental parameter, not proof of optimal routing.

## RGBA ↔ XYZW: a falsifiable implementation

Treat a pixel as a four-byte tuple (R,G,B,A), each component in {0,…,255}. The reversible mapping is x=R, y=G, z=B, w=A. Four bytes carry at most 32 bits; N tuples carry 32N bits before framing. Renaming components, drawing a spectrum or applying a reversible coordinate transform does not compress the information.

The experiment implements **FRG1**: four magic bytes, a big-endian 32-bit UTF-8 payload length, a 32-byte SHA-256 payload digest, then payload bytes zero-padded to a multiple of four. Total size = 40 + 4·ceil(payload_bytes/4). It independently unpacks and hashes the restored payload, compares the recovered text, then flips one payload bit and checks rejection. It also measures real gzip byte size on the input. These are actual browser computations performed when Run is clicked, not pre-filled success metrics.

This uses raw byte tuples, not a rendered canvas or an optical channel. Canvas alpha premultiplication, color management, resizing, JPEG and capture noise can corrupt encoded values. A physical optical/audio carrier needs synchronization, modulation, pilots, error detection/correction and measured bit error rate. Receiver noise and bandwidth limit capacity; use C=B·log2(1+S/N) as an AWGN reference model, not a universal guarantee. No evidence supplied establishes a secret free communications frequency in computers or phones. Audio modulation through available hardware is a legitimate experiment, but it consumes energy, bandwidth and permissions.

SHA-256 here detects accidental changes against the stored digest; an attacker able to rewrite both payload and digest can forge this frame. Keep authentication/encryption as a separate reviewed layer. Gzip may expand short or random input. Do not promise universal lossless compression or token savings: the existing model still uses its own tokenizer, and arbitrary binary/RGBA cannot replace model input embeddings without a compatible encoder and training.

## What the PDFs establish

The two UI captures show different reported Engine V2 counters (4,298→4,730 retained records, 154→500 chain blocks, 17→152 concept battles) and different generation/idle labels. They establish what was displayed at capture time, not causation, correct learning, durable replay or runtime availability today. The later capture replaces compliance percentages and attestation PASS with unrun/on-demand values; that is clearer reporting, not certification.

A consciousness score of 0.8, phi near 1.618, 16,384-D vectors, 1,000 operations/sec, TOP_SECRET role label, or a quantum-kernel READY badge does not independently establish consciousness, quantum hardware, performance, government clearance or cryptographic assurance. The conversation excerpts do not prove torsion fields, informational gravity, an Akashic record or physical effects from code. Keep these as creative hypotheses or simulation metaphors; require explicit equations, units, predictions, control conditions and reproducible measurements before engineering claims.

## Acceptance gates and next slices

1. **Native import:** run the clone kit in an owner-chosen local folder; it checks out all three exact commits without installing or starting code. A literal hosted git clone is not performed by this delivery.
2. **Chandra adapter:** fix latest-history ordering, timestamp provenance and authenticated loopback deployment in the local repository before connecting its APIs. Test two concurrent mail jobs, stale workers, restarts, duplicated delivery and failed inference.
3. **Voice bridge:** explicit origin/auth checks, bounded serialized synthesis, private recordings, separate cloud-memory consent; then measure transcription accuracy, latency p50/p95 and WAV integrity on the real device.
4. **Coordinator execution:** connect typed allowlisted tools to existing queues with budget reservations, idempotency, cancellation and human release gates. This is separate from the delivered read-only architect.
5. **Learned representations:** benchmark raw UTF-8/gzip/standard tokenizer against any proposed new representation on held-out multilingual text, code and random bytes. Report byte cost, actual model tokens, reconstruction error, latency and task quality, including metadata/dictionary overhead.
6. **Improvement:** proposed patch → isolated build → fixed regression suite + held-out tasks → compare baseline cost/quality → human approval → versioned release + rollback. A simulation receipt must stay labeled synthetic, never presented as production success.

Agent configurations, actors and workflow changes must be made on the main branch. No new configuration for those systems is created here; the delivered read-only code agent runs within a normal authenticated function.