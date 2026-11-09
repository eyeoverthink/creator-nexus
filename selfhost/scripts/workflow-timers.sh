#!/usr/bin/env bash
# Installs one systemd timer per scheduled Base44 workflow (base44/workflows/*.jsonc with trigger_type=scheduled).
# Timers are installed DISABLED. Usage: workflow-timers.sh install | enable <name>|all | disable <name>|all | status
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
declare -A CAL=(
  [DailyRsaRsiConsciousnessReport]="*-*-* 08:00:00 America/Los_Angeles"   # 0 8 * * *
  [FraymusCreatorRelayHeartbeat]="*:0/5"                                  # */5 * * * *
  [LinkedInOptimalFeedDispatcher]="*-*-* *:00:00"                         # 0 * * * *
  [SovereignUnionFourthWallAutonomyCron]="*-*-* 00/6:00:00 America/Los_Angeles" # 0 */6 * * *
)
case "${1:-status}" in
  install)
    install -m 644 "$ROOT/selfhost/systemd/creator-nexus-workflow@.service" /etc/systemd/system/
    for n in "${!CAL[@]}"; do
      cat > "/etc/systemd/system/creator-nexus-workflow@$n.timer" <<T
[Unit]
Description=creator-nexus workflow timer $n

[Timer]
OnCalendar=${CAL[$n]}
Persistent=false
Unit=creator-nexus-workflow@$n.service

[Install]
WantedBy=timers.target
T
    done
    systemctl daemon-reload; echo "installed ${#CAL[@]} timers (disabled)";;
  enable|disable)
    names=("${2:?name or all}"); [ "$2" = all ] && names=("${!CAL[@]}")
    for n in "${names[@]}"; do systemctl "$1" --now "creator-nexus-workflow@$n.timer"; done;;
  status) systemctl list-timers --all 'creator-nexus-workflow@*' --no-pager;;
  *) echo "usage: $0 install|enable <name|all>|disable <name|all>|status"; exit 2;;
esac
