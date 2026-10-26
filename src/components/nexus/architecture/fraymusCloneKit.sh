#!/usr/bin/env bash
# FRAYMUS reviewed source checkout kit. Requires git and repository access.
# No dependency installs, model downloads, service startup or remote writes.
set -euo pipefail
root="${1:-fraymus-reviewed-sources}"
if [ -e "$root" ]; then
  printf '%s\n' 'Refusing to overwrite an existing destination. Choose a new folder.' >&2
  exit 1
fi
mkdir -p "$root"
clone_pinned() {
  name="$1"; commit="$2"
  git clone --no-checkout "https://github.com/eyeoverthink/${name}.git" "$root/$name"
  git -C "$root/$name" checkout --detach "$commit"
  actual="$(git -C "$root/$name" rev-parse HEAD)"
  [ "$actual" = "$commit" ] || { printf '%s\n' 'Commit verification failed.' >&2; exit 1; }
  printf '%s %s\n' "$name" "$actual"
}
clone_pinned Chandra 12944a44adba1469b449e051507009a7f966e633
clone_pinned fraymus-voice 22ad15647013acf6fd8c6954f60e6381f0694647
clone_pinned MyAIPartner 2d31baccf9b63fd3e90d6e060da116ee3f22e081
printf '%s\n' 'Pinned checkouts complete. Nothing was installed or started.' 'Review authentication/network restrictions before running Chandra. Voice wrappers require local Apple Silicon setup.'