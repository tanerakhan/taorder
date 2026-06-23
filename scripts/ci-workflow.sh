#!/usr/bin/env bash
# TaOrder — GitHub Actions workflow yönetimi
# Kullanım:
#   ./scripts/ci-workflow.sh run [branch]     # Windows build tetikle
#   ./scripts/ci-workflow.sh watch [run-id]    # Çalışmayı izle
#   ./scripts/ci-workflow.sh logs [run-id]     # Hata loglarını göster
#   ./scripts/ci-workflow.sh status            # Son çalışmaları listele

set -euo pipefail

REPO="${GITHUB_REPO:-tanerakhan/taorder}"
WORKFLOW="${CI_WORKFLOW:-release-windows-only.yml}"
BRANCH="${1:-main}"

ensure_gh() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "gh CLI bulunamadı. Kurulum: brew install gh" >&2
    exit 1
  fi
}

ensure_token() {
  if [ -n "${GH_TOKEN:-}" ] || [ -n "${GITHUB_TOKEN:-}" ]; then
    return 0
  fi
  if gh auth status >/dev/null 2>&1; then
    return 0
  fi
  if [[ "$(uname -s)" == "Darwin" ]] && git credential-osxkeychain get >/dev/null 2>&1; then
    local token
    token="$(printf 'protocol=https\nhost=github.com\n\n' | git credential-osxkeychain get 2>/dev/null | awk -F= '/^password=/{print $2}')"
    if [ -n "$token" ]; then
      export GH_TOKEN="$token"
      return 0
    fi
  fi
  echo "GitHub kimlik doğrulaması yok. Çalıştırın: gh auth login" >&2
  exit 1
}

latest_run_id() {
  gh run list --repo "$REPO" --workflow="$WORKFLOW" --limit 1 --json databaseId --jq '.[0].databaseId'
}

cmd_run() {
  local branch="${1:-main}"
  ensure_gh
  ensure_token
  echo "→ $WORKFLOW tetikleniyor (branch: $branch)..."
  gh workflow run "$WORKFLOW" --repo "$REPO" --ref "$branch"
  sleep 3
  local run_id
  run_id="$(latest_run_id)"
  echo "→ Run: https://github.com/$REPO/actions/runs/$run_id"
  gh run watch "$run_id" --repo "$REPO" --exit-status
}

cmd_watch() {
  ensure_gh
  ensure_token
  local run_id="${1:-$(latest_run_id)}"
  echo "→ İzleniyor: https://github.com/$REPO/actions/runs/$run_id"
  gh run watch "$run_id" --repo "$REPO" --exit-status
}

cmd_logs() {
  ensure_gh
  ensure_token
  local run_id="${1:-$(latest_run_id)}"
  gh run view "$run_id" --repo "$REPO" --log-failed
}

cmd_status() {
  ensure_gh
  ensure_token
  gh run list --repo "$REPO" --workflow="$WORKFLOW" --limit 8
}

usage() {
  sed -n '2,7p' "$0"
}

main() {
  local cmd="${1:-status}"
  shift || true
  case "$cmd" in
    run) cmd_run "${1:-main}" ;;
    watch) cmd_watch "${1:-}" ;;
    logs) cmd_logs "${1:-}" ;;
    status) cmd_status ;;
    -h|--help|help) usage ;;
    *) echo "Bilinmeyen komut: $cmd" >&2; usage; exit 1 ;;
  esac
}

main "$@"
