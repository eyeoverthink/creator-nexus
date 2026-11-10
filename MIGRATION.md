# creator-nexus: self-hosted (no Base44) — Phase 1

Branch: `selfhost` (never merge into `main`; Base44 syncs `main`). Everything for the self-hosted build lives in
`selfhost/` plus three small frontend changes (SDK alias, Register auto-sign-in, Living Artifact page).

## Architecture

```
browser ──https (tailnet only, `tailscale serve`)──► 127.0.0.1:8080 Caddy (web container: Vite dist + reverse proxy)
                                                     │  /api/* /functions/* /files/* /healthz
                                                     ▼
                                               api container (Deno 2.5)  ──► Postgres 16 (JSONB, db container)
                                                     │  base44/functions/*/entry.ts run UNCHANGED via an import map:
                                                     │    npm:@base44/sdk  -> selfhost/api/shim/sdk.ts
                                                     │    base44:runtime   -> selfhost/api/shim/runtime.ts
                                                     │    base44:runtime/actors -> selfhost/api/shim/actors.ts
                                                     ├──► Ollama FRAYMUS-HOME 100.99.98.101:11434 (qwen3:8b)  ─fallback─► fraymus-kvm2 100.72.161.48 (qwen3:4b)
                                                     └──► /data/files (local disk, HMAC-signed URLs)
systemd timers (host) ──► 127.0.0.1:8787/internal/workflows/<name>   (installed, DISABLED)
```

| Base44 piece | Self-hosted replacement | Where |
|---|---|---|
| `@base44/sdk` in the browser | `src/api/selfhostSdk.js`, same API (entities, functions, integrations.Core, auth, agents, actors, connectors, app) | `vite.config.selfhost.js` aliases `@base44/sdk` |
| `@base44/sdk` in functions (`createClientFromRequest`, `asServiceRole`) | in-process shim, same calls, no HTTP hop | `selfhost/api/shim/sdk.ts` |
| 49 entities | one Postgres table per entity (`ent."<Name>"`: id, data jsonb, created/updated, created_by[_id]) created from `base44/entities/*.jsonc`; GIN index on data | `lib/entities.ts` |
| Mongo-style queries | `$or $and $nor $in $nin $ne $gt(e) $lt(e) $regex/$options $exists $not $all $size $elemMatch`, nested paths, array-contains equality, sort, limit/skip, cursor pages, `fields`, `distinct`, `count`, `aggregate` (groupBy/sum/avg/min/max/countDistinct/dateBucket), `upsert`, `bulkCreate/bulkUpdate`, `updateMany` (`$set $unset $inc $push $addToSet $pull $currentDate`), `deleteMany` | `lib/query.ts`, `lib/entities.ts` |
| Entity RLS (`rls` blocks in the jsonc files) | enforced for every user call (`data.owner_id`, `created_by_id`, `user_condition.role`, `$or`); `asServiceRole` bypasses, like Base44 | `lib/query.ts` |
| Auth | Better Auth 1.7 (email + password, bearer sessions in Postgres). The app's own Login/Register pages work unchanged; no e-mail OTP step | `lib/auth.ts` |
| 36 backend functions | served at the same paths: `/functions/<name>` (runner) and `/api/apps/<id>/functions/<name>` (SDK) | `lib/functions.ts` |
| `Core.InvokeLLM` | Ollama `/api/chat` with `format: <json schema>`, `think:false`; routes tried in order from `OLLAMA_URLS`; health checks reuse `base44/shared/partnerModelProviders.ts` (`providerModels`) | `lib/llm.ts` |
| `aiGateway.connection()` (nexusAgent, fraymusArchitect, originAgent use `@ai-sdk/openai-compatible`) | internal OpenAI-compatible endpoint `/api/ai-gateway/v1` → Ollama `/v1/chat/completions`, model `automatic` → configured model | `lib/llm.ts` |
| UploadFile / UploadPrivateFile / CreateFileSignedUrl | local disk volume, `selfhost://private/<key>` URIs, HMAC-signed expiring links at `/files/private/...` | `lib/files.ts` |
| Realtime (`entities.X.subscribe`, agent conversation updates) | WebSocket `/api/realtime`, RLS-filtered fan-out | `lib/realtime.ts` |
| Actor `NexusRoom` | same `base44/actors/NexusRoom/entry.ts`, hosted in-process (storage in Postgres, schedule/broadcast), WebSocket `/api/actors/<Name>/<room>` | `shim/actors.ts`, `lib/actorHost.ts` |
| Agents (`base44/agents/*.jsonc`) | conversations in Postgres, replies streamed from Ollama using each agent's `instructions` | `lib/agents.ts` |
| Workflows (12) | 4 scheduled → systemd timers (installed **disabled**); 8 entity/connector-triggered → listed, not executed (TODO) | `lib/workflows.ts`, `selfhost/scripts/workflow-timers.sh` |
| Hard-coded `*.base44.app` URLs | **egress guard** on every outbound `fetch` from the server: `creator-nexus.base44.app` → this server, `fraymus-transmuter.base44.app` → `FRAYMUS_TRANSMUTER_URL` if set to a non-Base44 host, else blocked; anything else on base44.app/.com blocked (GET of `media.base44.com` static files allowed). In the UI, `https://creator-nexus.base44.app` is rewritten at build time to `PUBLIC_URL`. | `lib/egress.ts`, `vite.config.selfhost.js` |
| Nexus runner endpoints | `runnerPoll`, `runnerReport`, `videoUpload`, `audioUpload` run unchanged; this server has its **own new** `RUNNER_SECRET` (in `.env`) | — |

## What works (verified on nexus-kvm8)

See the "Verification" section at the bottom (filled in from the live run).

## Stubbed / TODO

- `Core.GenerateImage`, `GenerateSpeech`, `GenerateVideo`, `ExtractDataFromUploadedFile`, `SendEmail` → HTTP 501 with a clear message.
  TODO: images via ComfyUI/FLUX-schnell on FRAYMUS-HOME or fraymus-video-studio; speech/video via the Nexus runner jobs (already used by nexusTTS/nexusRender).
- `InvokeLLM` `file_urls` (images/PDFs) and `add_context_from_internet` are ignored with a note in the prompt. TODO: qwen3-vl on fraymus-kvm2; SearXNG.
- Agents: plain chat only. `tool_configs` (entity/function tools), WhatsApp/Telegram links: TODO (Ollama tool calling).
- Workflows: entity-triggered (jq conditions) and connector-triggered ones are not executed; scheduled timers are installed but disabled. `WORKFLOWS_ENABLED=false` in `.env` also blocks the internal endpoint. Keep them off while Base44 is live, otherwise LinkedIn posts / GitHub pushes could happen twice.
- Connectors (GitHub, Google Calendar, Hugging Face): read from `CONNECTOR_<TYPE>_TOKEN` in `.env`; none set → functions get a clear "not set up" error. Google sign-in and OAuth connectors need your own client IDs.
- Password reset by e-mail, MFA/TOTP pages, OAuth consent: not wired (Better Auth has plugins for all three).
- Living Artifact page (`/living-artifact`, from the `master` branch) is included, but `/api/streaming/*` returns 503 so nothing reaches Chandra. To enable later, add a `reverse_proxy` to the Chandra streaming server in `selfhost/Caddyfile`.
- Entity `importEntities` (CSV upload from the UI) → 501. Use the Phase 2 import script below.
- Cursor pagination is offset-based (fine for this data size).

## Operating it (on nexus-kvm8, as root)

```bash
cd /opt/creator-nexus && git pull && cd selfhost
docker compose up -d --build              # rebuild + restart
docker compose logs -f api                # logs
docker compose ps
curl -s http://127.0.0.1:8787/api/selfhost/status | jq .   # entities, functions, LLM routes, egress log
tailscale serve status                    # https://<host>.<tailnet>.ts.net -> 127.0.0.1:8080 (tailnet only)
selfhost/scripts/workflow-timers.sh status|install|enable <name>|disable all
```

- Secrets: `selfhost/.env` (mode 600, generated by `selfhost/scripts/gen-env.sh`, never committed). `cron.header` holds the timer secret.
- Sign-up is allow-listed: `ADMIN_EMAILS` (admins) + `SIGNUP_ALLOWLIST`. Set `SIGNUP_MODE=open` to let anyone on the tailnet register.
- Models: `OLLAMA_URLS` / `OLLAMA_MODELS` (same order). Default `qwen3:8b` on FRAYMUS-HOME, fallback `qwen3:4b` on fraymus-kvm2. For bigger answers set `qwen3:14b` (fits the 12 GB 5070). A flat-rate Ollama Pro account can be added as another URL later (needs an API key header — TODO).
- No public ports: Docker publishes only on 127.0.0.1; ufw allows only 22 + tailscale0; HTTPS comes from `tailscale serve`.

## Phase 2: move the data (after Base44 credits reset)

Everything runs **on nexus-kvm8 as root**, from `/opt/creator-nexus/selfhost`, with `selfhost/scripts/phase2.sh`.
Base44 is only *read*: the exporter's single network function refuses anything but `GET` (Apps API: entity schemas,
per-entity `count` and `v2/list`, `User` list/count). No functions, integrations, AI or writes. About 1 + 2×(entities) calls
(~100 for 49 entities), paced at ≤55/min. The running api/web/db containers are not restarted; export/import use one-off containers.

1. **Credential** (pick one, never paste it in chat):
   - `phase2.sh cli-login`: Base44 device-code login (prints a URL + code; Vaughn approves it in his browser). Then use `--cli`;
     every call goes through `base44 api fetch … --read-only`, which refuses non-read-only operations.
   - or a **Read-only personal access token** (Base44 → workspace settings → Secrets → access tokens) saved as
     `/root/.base44-readonly.token` (mode 600). Delete it afterwards.
2. `phase2.sh backup`: `pg_dump -Fc` + files-volume tarball → `/opt/creator-nexus/backups/cn-<UTC>.dump`, `files-<UTC>.tgz` (mode 600).
   Restore: `docker compose exec -T db pg_restore -U cn -d cn --clean < backups/cn-<UTC>.dump`.
3. `phase2.sh export [--cli]` → `/opt/creator-nexus/import/<Entity>.json`, `_manifest.json` (Base44's own counts, schema diff,
   API calls), `_files.json` (every Base44-hosted URL / private URI found in the data).
4. `phase2.sh files`: downloads public copies (media.base44.com, Supabase public storage, base44 public file links: plain HTTPS,
   not Apps API, no credits). Records keep their original URLs; `sh.base44_file_mirror` maps url → local `/files/public/<key>`.
   Private `UploadPrivateFile` URIs are listed, not fetched.
5. `phase2.sh import [--replace]`: takes a fresh backup, then upserts by Base44 id (keeps id, created/updated dates as UTC,
   created_by, created_by_id, is_sample). Idempotent. Users go first; `ADMIN_EMAILS` (eyeoverthink@gmail.com) are forced to admin;
   if an e-mail already registered here under a different id, that login (auth user/account/sessions and anything it created) is
   moved onto the Base44 id. Local-only rows (Phase 1 test data) are kept unless `--replace`.
6. `phase2.sh verify`: per entity Base44 count vs exported vs present in Postgres, plus field-by-field check. Exit 1 on mismatch.
7. **Users** sign in on the new server by registering with the same e-mail (allow-listed) → they get their Base44 id and data.
8. **Runner** stays on Base44 for now. Dual-run test later: a *copy* of the runner with `RUNNER_BASE_URL=https://<kvm8 tailnet host>`.
9. Phase 3 (cutover): enable timers, implement entity triggers, switch the app URL. Nothing is shut down by this plan.

## Verification

Checked live on 2026-11-09 (times in UTC, as logged on the server).

**On nexus-kvm8 (`/opt/creator-nexus`, branch `selfhost`, docker compose project `creator-nexus`)**
- The `db` (postgres:16, healthy), `api` and `web` containers are up. They listen only on `127.0.0.1:8080` and `127.0.0.1:8787`; Postgres has no host port. From the public internet, ports 80, 443, 5432, 8080 and 8787 on 194.195.86.230 are closed. The only external access is through `tailscale serve`, which listens on 443 on `tailscale0` only.
- `GET https://srv2140791.tail18025b.ts.net/api/selfhost/status` returns 49 entities, 36 functions and 12 workflows, with `workflows_enabled: false` and an empty egress log. Both LLM routes are reachable and have their model: FRAYMUS-HOME `qwen3:8b` (83 ms) and kvm2 `qwen3:4b` (379 ms).
- Browser end to end (`selfhost/test/e2e.mjs`, headless Chromium in the Playwright container on the server, going through the tailnet URL → Caddy → API → Postgres/Ollama):
  ```
  23:53:34 unauthenticated /time-audit -> /login
  23:53:41 signed in as selfhost-test@creator-nexus.local role=admin
  23:53:48 after reload, saved row visible: true          (UI create on Time Audit, persisted)
  23:54:03 ideaFinder HTTP 200 in 15s, status=completed, ideas=3
  23:54:04 last LLM route: {"used":"http://100.99.98.101:11434","model":"qwen3:8b"} egress log: []
  ```
  The stored `IdeaFinderRun` holds real model output (first idea: "Self-Host Tracker", with a 10-step build plan). The only browser console error was the expected 400 from registering an account that already existed.
- After the test, the test account was demoted to `user`, its sessions and password credential were deleted (login now returns 401), and it was removed from `ADMIN_EMAILS` and `SIGNUP_ALLOWLIST`. The row stays so the test data still has an owner.
- The workflow timers are installed but **disabled** (`systemctl list-timers` shows 0 active).

**Locally (embedded Postgres, same code)**
- Register: a non-allowlisted e-mail gets 403. Login and `me` work, and requests without a token get 401.
- Entity CRUD works. `v2` list with `$gte`, `$regex` (case-insensitive), sort and cursor pages works; so do `aggregate` (groupBy/avg/sum/countDistinct) and `count` with `$in`.
- An imported user id is reused on registration (matched by e-mail).
- RLS: a second user sees 0 of the admin's rows. Creating a row with someone else's `owner_id` gets 403, and a role-escalation attempt is blocked.
- `runnerPoll`: without the secret it returns unauthorized; with the new secret it claims the queued job, and the next poll returns `{job:null}`.
- The `NexusRoom` actor over WebSocket handles initialize, edit and save; the draft persists (rev 1), and the realtime entity-update event arrives.
- All 36 functions load and respond. `test/egress_test.ts` passes: Base44 hosts are blocked or rewritten.
