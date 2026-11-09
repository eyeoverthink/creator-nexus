#!/usr/bin/env bash
# Creates selfhost/.env (root-only) with fresh random secrets. Never prints secret values.
# Usage: sudo selfhost/scripts/gen-env.sh <public_url> <admin_email>
set -euo pipefail
cd "$(dirname "$0")/.."
PUBLIC_URL="${1:?public url, e.g. https://srv2140791.tail18025b.ts.net}"
ADMIN_EMAIL="${2:?admin email}"
umask 077
if [ -f .env ]; then echo ".env already exists; not overwriting (delete it first to regenerate)"; exit 0; fi
r() { openssl rand -hex 32; }
cat > .env <<ENV
# Generated $(date -Iseconds). Root-only. Do not commit.
PUBLIC_URL=${PUBLIC_URL}
CREATOR_NEXUS_URL=${PUBLIC_URL}
APP_ID=6ad00af14909c671e73bb835
POSTGRES_PASSWORD=$(r)
BETTER_AUTH_SECRET=$(r)
FILE_SIGNING_SECRET=$(r)
INTERNAL_SECRET=$(r)
CRON_SECRET=$(r)
# NEW runner secret for this server only (the Nexus runner still uses its Base44 one).
RUNNER_SECRET=$(r)
ACTOR_TOKEN_SECRET=$(r)
ADMIN_EMAILS=${ADMIN_EMAIL}
SIGNUP_MODE=allowlist
SIGNUP_ALLOWLIST=
# LLM routing (tried in order): FRAYMUS-HOME RTX 5070, then fraymus-kvm2 (Nexus) CPU.
OLLAMA_URLS=http://100.99.98.101:11434,http://100.72.161.48:11434
OLLAMA_MODELS=qwen3:14b,qwen3:4b
LLM_NUM_CTX=16384
# Scheduled/entity workflows stay off until Base44 is retired (avoids double LinkedIn/GitHub actions).
WORKFLOWS_ENABLED=false
FRAYMUS_TRANSMUTER_URL=
ENV
chmod 600 .env
printf 'x-cron-secret: %s\n' "$(grep '^CRON_SECRET=' .env | cut -d= -f2)" > cron.header
chmod 600 cron.header
echo "wrote $(pwd)/.env and cron.header (mode 600)"
