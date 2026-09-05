#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# deploy.sh — Ayantaraz production deployment orchestrator
#
# Usage:
#   bash deploy.sh                  # full build + deploy
#   bash deploy.sh --no-cache       # rebuild from scratch
#   bash deploy.sh --down           # stop all containers
#   bash deploy.sh --status         # show container status
#   bash deploy.sh --logs           # tail app logs
#   bash deploy.sh --health         # run health check only
#   bash deploy.sh --migrate        # run migrations only
#   bash deploy.sh --clean          # remove containers + volumes
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── colours ───────────────────────────────────────────────────────────
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
  CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; BOLD=''; RESET=''
fi

info()  { printf "${CYAN}▸${RESET} %s\n" "$*"; }
ok()    { printf "${GREEN}✔${RESET} %s\n" "$*"; }
warn()  { printf "${YELLOW}⚠${RESET} %s\n" "$*"; }
fail()  { printf "${RED}✘${RESET} %s\n" "$*" >&2; exit 1; }

# ── parse args ────────────────────────────────────────────────────────
ACTION="deploy"
NO_CACHE=""
for arg in "$@"; do
  case "$arg" in
    --no-cache)   NO_CACHE="--no-cache" ;;
    --down)       ACTION="down" ;;
    --status)     ACTION="status" ;;
    --logs)       ACTION="logs" ;;
    --health)     ACTION="health" ;;
    --migrate)    ACTION="migrate" ;;
    --clean)      ACTION="clean" ;;
    --help|-h)
      echo "Usage: bash deploy.sh [--no-cache|--down|--status|--logs|--health|--migrate|--clean]"
      exit 0 ;;
    *) fail "Unknown argument: $arg" ;;
  esac
done

# ── helper: check if container is healthy ─────────────────────────────
container_running() {
  docker compose ps --format json 2>/dev/null | grep -q "\"Service\":\"$1\"" && \
  docker compose ps --format json 2>/dev/null | grep "\"Service\":\"$1\"" | grep -q '"State":"running"'
}

# ── prerequisite checks ──────────────────────────────────────────────
check_prereqs() {
  info "Checking prerequisites ..."
  for cmd in docker; do
    command -v "$cmd" &>/dev/null || fail "$cmd is required but not installed."
  done
  # Check Docker daemon
  docker info &>/dev/null || fail "Docker daemon is not running."
  # Check docker compose (v2 plugin)
  docker compose version &>/dev/null || fail "docker compose v2 plugin is required."
  ok "Docker $(docker --version | awk '{print $3}') ready"
  ok "Docker Compose $(docker compose version --short) ready"
}

# ── ensure .env exists ───────────────────────────────────────────────
ensure_env() {
  if [ ! -f ".env" ]; then
    info ".env not found — running setup.sh ..."
    bash setup.sh
  fi
  # Validate
  bash setup.sh --validate
}

# ── extract BUILD_ID ──────────────────────────────────────────────────
get_build_id() {
  set -a; source .env; set +a
  echo "$BUILD_ID"
}

# ── actions ───────────────────────────────────────────────────────────

action_deploy() {
  echo ""
  printf "${BOLD}╔══════════════════════════════════════╗${RESET}\n"
  printf "${BOLD}║   Ayantaraz — Production Deploy     ║${RESET}\n"
  printf "${BOLD}╚══════════════════════════════════════╝${RESET}\n"
  echo ""

  check_prereqs
  ensure_env

  BUILD_ID=$(get_build_id)
  info "Build ID: ${BUILD_ID:0:12}..."

  # ── Step 1: Build ────────────────────────────────────────────────
  echo ""
  info "Step 1/4: Building images ..."
  docker compose build $NO_CACHE --build-arg BUILD_ID="$BUILD_ID"
  ok "Images built"

  # ── Step 2: Stop old containers ──────────────────────────────────
  echo ""
  info "Step 2/4: Stopping old containers ..."
  docker compose down --remove-orphans 2>/dev/null || true
  ok "Old containers removed"

  # ── Step 3: Start stack ──────────────────────────────────────────
  echo ""
  info "Step 3/4: Starting services ..."
  docker compose up -d
  ok "Services started"

  # ── Step 4: Wait for health ──────────────────────────────────────
  echo ""
  info "Step 4/4: Waiting for health check (max 60s) ..."
  HEALTHY=false
  for i in $(seq 1 12); do
    sleep 5
    if docker compose ps --format json 2>/dev/null | grep '"Service":"app"' | grep -q '"State":"running"'; then
      # Try the health endpoint
      if curl -sf "http://127.0.0.1:3000/api/health" -o /tmp/ayan-health.json 2>/dev/null; then
        STATUS=$(cat /tmp/ayan-health.json | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ "$STATUS" = "ok" ] || [ "$STATUS" = "degraded" ]; then
          HEALTHY=true
          break
        fi
      fi
    fi
    printf "  Waiting ... (%ds)\n" $((i * 5))
  done

  echo ""
  if [ "$HEALTHY" = "true" ]; then
    printf "${GREEN}${BOLD}╔══════════════════════════════════════╗${RESET}\n"
    printf "${GREEN}${BOLD}║   Deploy Complete — Healthy          ║${RESET}\n"
    printf "${GREEN}${BOLD}╚══════════════════════════════════════╝${RESET}\n"
    echo ""
    ok "App: http://127.0.0.1:3000"
    ok "Health: http://127.0.0.1:3000/api/health"
    echo ""
    info "Service status:"
    docker compose ps
  else
    printf "${YELLOW}${BOLD}╔══════════════════════════════════════╗${RESET}\n"
    printf "${YELLOW}${BOLD}║   Deploy Complete — Unhealthy        ║${RESET}\n"
    printf "${YELLOW}${BOLD}╚══════════════════════════════════════╝${RESET}\n"
    echo ""
    warn "App did not become healthy within 60s"
    warn "Check logs: docker compose logs app"
    docker compose ps
    exit 1
  fi
}

action_down() {
  info "Stopping all services ..."
  docker compose down --remove-orphans
  ok "All services stopped"
}

action_status() {
  docker compose ps
}

action_logs() {
  docker compose logs -f --tail=100 app
}

action_health() {
  if curl -sf "http://127.0.0.1:3000/api/health" 2>/dev/null; then
    echo ""
    ok "Health check passed"
  else
    fail "Health check failed — is the app running?"
  fi
}

action_migrate() {
  ensure_env
  set -a; source .env; set +a
  info "Running migrations ..."
  docker compose run --rm init
  ok "Migrations complete"
}

action_clean() {
  warn "This will remove all containers and volumes (including data)!"
  read -p "Are you sure? (y/N): " confirm
  if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    docker compose down -v --remove-orphans
    docker image prune -f 2>/dev/null || true
    ok "Cleaned up"
  else
    info "Aborted"
  fi
}

# ── dispatch ──────────────────────────────────────────────────────────
case "$ACTION" in
  deploy)  action_deploy ;;
  down)    action_down ;;
  status)  action_status ;;
  logs)    action_logs ;;
  health)  action_health ;;
  migrate) action_migrate ;;
  clean)   action_clean ;;
esac
