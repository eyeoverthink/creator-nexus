#!/usr/bin/env bash
# Phase 2 data move, run ON nexus-kvm8 as root from /opt/creator-nexus/selfhost.
# Base44 side is read-only (GET-only exporter). Nothing is restarted: the running api/web/db containers stay up;
# export/import run in one-off containers. Re-runnable (the import upserts by Base44 id).
#
#   selfhost/scripts/phase2.sh backup                 # pg_dump + files volume tarball -> /opt/creator-nexus/backups
#   selfhost/scripts/phase2.sh cli-login              # one-time: Base44 device-code login (prints a URL + code for Vaughn)
#   selfhost/scripts/phase2.sh export [--cli]         # read-only export -> /opt/creator-nexus/import (token: /root/.base44-readonly.token)
#   selfhost/scripts/phase2.sh files                  # download public Base44 file copies into the export
#   selfhost/scripts/phase2.sh import [--replace]     # backup first, then import
#   selfhost/scripts/phase2.sh verify                 # Base44 counts vs Postgres
#   selfhost/scripts/phase2.sh all [--cli]            # backup, export, files, import, verify (SKIP_BACKUP=1 to skip backup)
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=/opt/creator-nexus; IMP=$ROOT/import; BK=$ROOT/backups; B44HOME=$ROOT/.base44-cli-home
TOKEN_FILE=${BASE44_TOKEN_FILE:-/root/.base44-readonly.token}
NODE_IMG=node:22-alpine
mkdir -p "$BK" "$IMP" "$B44HOME"; chmod 700 "$BK"; chown 1000:1000 "$B44HOME"; chmod 700 "$B44HOME"; chmod 700 "$IMP"
cmd=${1:-help}; shift || true
TS=$(date -u +%Y%m%dT%H%M%SZ)

backup() {
  docker compose exec -T db pg_dump -U cn -d cn -Fc > "$BK/cn-$TS.dump"
  docker run --rm -v creator-nexus_files:/f:ro -v "$BK":/b alpine tar czf "/b/files-$TS.tgz" -C /f .
  chmod 600 "$BK/cn-$TS.dump" "$BK/files-$TS.tgz"
  [ -s "$BK/cn-$TS.dump" ] || { echo "backup is empty, stopping"; exit 1; }
  n=$(docker compose exec -T db sh -c 'cat > /tmp/chk.dump && pg_restore -l /tmp/chk.dump | grep -c " TABLE "; rm -f /tmp/chk.dump' < "$BK/cn-$TS.dump")
  [ "${n:-0}" -gt 0 ] || { echo "backup did not verify, stopping"; exit 1; }
  echo "backup verified ($n table entries)" && echo "backup ok: $BK/cn-$TS.dump ($(du -h "$BK/cn-$TS.dump" | cut -f1)), $BK/files-$TS.tgz"
}
node_run() { docker run --rm -v "$ROOT":/repo:ro -v "$IMP":/import -v "$B44HOME":/home/node -e HOME=/home/node -w /repo "$@"; }
export_() {
  rm -rf "$IMP"/*.json "$IMP"/files
  if [ "${1:-}" = "--cli" ]; then
    chown 1000:1000 "$IMP"; node_run -u node $NODE_IMG node selfhost/scripts/export-base44.mjs /import --cli
  else
    [ -s "$TOKEN_FILE" ] || { echo "no token file at $TOKEN_FILE (or use --cli)"; exit 1; }
    chmod 600 "$TOKEN_FILE"
    node_run -v "$TOKEN_FILE":/run/b44token:ro -e BASE44_TOKEN_FILE=/run/b44token $NODE_IMG node selfhost/scripts/export-base44.mjs /import
  fi
}
files() { node_run $NODE_IMG node selfhost/scripts/fetch-base44-files.mjs /import; }
api_run() { docker compose run --rm --no-deps -u root -v "$IMP":/import:ro -v "$PWD/api/scripts":/app/selfhost/api/scripts:ro api run -A "$@"; }
case "$cmd" in
  backup) backup ;;
  cli-login) node_run -it -u node $NODE_IMG sh -c 'npx --yes base44 login && npx --yes base44 whoami' ;;
  export) export_ "$@" ;;
  files) files ;;
  import) [ "${SKIP_BACKUP:-0}" = 1 ] && echo "skipping backup (SKIP_BACKUP=1)" || backup; api_run scripts/import-base44.ts /import "$@" ;;
  verify) api_run scripts/verify-import.ts /import ;;
  all) [ "${SKIP_BACKUP:-0}" = 1 ] && echo "skipping backup (SKIP_BACKUP=1)" || backup; export_ "$@"; files; api_run scripts/import-base44.ts /import; api_run scripts/verify-import.ts /import ;;
  *) sed -n 2,13p "$0" ;;
esac
