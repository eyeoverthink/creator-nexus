# Fraymus: implementation and confirmation plan

Requested order: (1) scale adaptive core, (2) activate native model inference, (3) train an emotion classifier. Confirmation means implementation plus measured acceptance evidence, not a renamed status or a predicted capability. Do not call all three complete after finishing one.

## Step 1 — Scale the adaptive core
Status: implemented and backend-verified. Sixteen regression assertions passed; direct endpoint and existing agent-method smoke checks returned 200; production frontend build passed. Retained synthetic checkpoints: 6adeb37d45c0da6e84bb6ae1 and 6adeb37fcf9197f1e7ac3b63. Verification receipt: 6adebac2e85fa39a2797b120. Maximum tested run: 256 neurons, 2,048 edges, 512 ticks, 4,098 spikes and 32,496 synaptic arrivals. Eight actual observation appends were tested; 128 is configured capacity, not a measured 128-append benchmark. The runtime clock did not advance during the computation, so elapsed time is unavailable and no speed claim is made. All temporary fixture records were removed. UI interaction testing remains separate from the successful build.

Deliver: adjacency-indexed sparse synapses, tick-bucket delayed events and stimulus indexing; 256 neurons, 2,048 edges, 128 local observations, 512 ticks per advance, 32 competitive spikes per tick and 32,768 queued events. Preserve old state shapes and LIF/STDP/TD/witness rules. Keep finite resource ceilings rather than remove safeguards. Add a direct Adaptive core tab inside the existing workbench. Large explicit checkpoints go into private file storage with bounded reads, content digests and owner/workspace-scoped metadata; old inline checkpoints still resume.

Acceptance: maximum graph previews and checkpoints; continuation beyond tick 64; exact split-vs-continuous graph equivalence; more than six memories with prediction/witness/replay; original STDP direction and duplicate-witness rejection; invalid graphs/bounds rejected; private checkpoint read and resume; existing agent method path; frontend production build. Retain a measured synthetic benchmark receipt, clearly separated from real observations.

## Step 2 — Activate native model inference
Status: next in sequence, blocked on local activation. Owner-scoped worker inspection found no paired Needle3 workers. Native execution is not confirmed. Use Learning Lab → Models → Fraymus Brain → Needle3 worker to create a private pairing in the browser, download the existing launcher and start it on the model PC; do not create an invisible pairing from this chat.

Reuse the existing Needle3 pairing, worker launcher, installed runtime manifest, extraction schema, lease and input-bound receipts. Inspect actual owner-scoped worker heartbeat and attestation; do not replace/revoke a pairing without permission. Confirm local files and runtime hashes on the model PC, start the existing worker, execute a bounded user-approved extraction request and verify its returned receipt. If the PC is offline, say activation needs the local launch; cloud code cannot start an inaccessible computer. Do not claim a 120B model is loaded from a configuration manifest. Model size and inference readiness must come from the actual local runtime and resources.

Acceptance: worker ready, nonempty real native output, input/nonce/lease-bound receipt verified, timeout and stale-worker failure shown without simulated output. Record worker-reported provenance; do not call it hardware attestation.

## Step 3 — Train an emotion classifier
Status: queued after Step 2; real labeled dataset required.

Define explicit label taxonomy and consent for user-authored observations. Use a deterministic train/validation/test split with leakage checks; train real classifier parameters from labeled examples; keep a final held-out test set separate from parameter selection. Report support per class, accuracy, macro-F1, confusion matrix, abstention behavior and comparison with a simple baseline. Persist versioned parameters and dataset digests, not raw private conversations by default. Integrate predictions as uncertain controller input only with user opt-in; labels never assert subjective feelings or authorize actions. Synthetic examples may test plumbing but cannot establish real-world classifier accuracy. No LLM-generated appraisal labels are substituted for independently supplied labels.

Acceptance: real labeled corpus, reproducible training, held-out metrics and baseline comparison, saved model reload and same predictions, explicit opt-in controller integration, versioned report. Data collection may be implemented before enough data exists, but the classifier is not declared trained until these gates pass.

## Reporting
Each completed step receives a Library receipt with implementation, measured checks, remaining limitations and the next dependency. The existing agent monitor remains reported progress, not an independent source of truth. Biological-scale connectomes, perfect recall, skill/weight transfer and general formal reasoning are separate research goals and are not silently implied by these three steps.