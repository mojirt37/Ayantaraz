#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# setup.sh — Ayantaraz production .env generator
# Generates a validated .env with safe defaults. You supply only the
# API keys / URLs that require your credentials.
#
# Usage:
#   bash setup.sh              # interactive
#   bash setup.sh --non-interactive   # CI / headless (reads env or uses defaults)
#   bash setup.sh --validate          # validate existing .env only
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_NAME="ayan-taraz"
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"
ENV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_PATH="${ENV_DIR}/${ENV_FILE}"

# ── colours (disabled when stdout is not a terminal) ──────────────────
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
MODE="interactive"
for arg in "$@"; do
  case "$arg" in
    --non-interactive) MODE="non-interactive" ;;
    --validate)        MODE="validate" ;;
    --help|-h)
      echo "Usage: bash setup.sh [--non-interactive] [--validate]"
      echo "  (no args)        Interactive mode — prompts for required values"
      echo "  --non-interactive  CI/headless — uses env vars or defaults"
      echo "  --validate        Validate existing .env without writing"
      exit 0 ;;
    *) fail "Unknown argument: $arg" ;;
  esac
done

# ── validate mode ─────────────────────────────────────────────────────
if [ "$MODE" = "validate" ]; then
  [ -f "$ENV_PATH" ] || fail ".env not found at ${ENV_PATH}"
  info "Validating existing .env ..."
  # Source and check required vars
  set -a; source "$ENV_PATH"; set +a
  REQUIRED_VARS=(DATABASE_URL REDIS_URL OTP_HMAC_SECRET SESSION_HMAC_SECRET NEXT_PUBLIC_APP_URL BUILD_ID SMS_TEMPLATE_ID)
  MISSING=()
  for v in "${REQUIRED_VARS[@]}"; do
    [ -n "${!v:-}" ] || MISSING+=("$v")
  done
  if [ ${#MISSING[@]} -gt 0 ]; then
    fail "Missing required variables: ${MISSING[*]}"
  fi
  # Validate lengths
  [ ${#OTP_HMAC_SECRET} -ge 32 ]      || fail "OTP_HMAC_SECRET must be >= 32 chars (got ${#OTP_HMAC_SECRET})"
  [ ${#SESSION_HMAC_SECRET} -ge 32 ]  || fail "SESSION_HMAC_SECRET must be >= 32 chars (got ${#SESSION_HMAC_SECRET})"
  # Validate BUILD_ID format
  [[ "$BUILD_ID" =~ ^[A-Za-z0-9._-]{7,128}$ ]] || fail "BUILD_ID must match ^[A-Za-z0-9._-]{7,128}$"
  ok ".env is valid"
  exit 0
fi

# ── helper: generate a hex secret ────────────────────────────────────
gen_secret() {
  if command -v openssl &>/dev/null; then
    openssl rand -hex 32
  elif [ -f /dev/urandom ]; then
    od -An -tx1 -w32 < /dev/urandom | tr -d ' \n'
  else
    fail "Cannot generate secret: no openssl or /dev/urandom"
  fi
}

# ── helper: prompt for value with default ────────────────────────────
prompt() {
  local var_name="$1"
  local label="$2"
  local default="$3"
  local required="${4:-true}"

  if [ "$MODE" = "non-interactive" ]; then
    # In non-interactive: use env var if set, else default
    local env_val="${!var_name:-}"
    if [ -n "$env_val" ]; then
      eval "$var_name='$env_val'"
    elif [ -n "$default" ]; then
      eval "$var_name='$default'"
    elif [ "$required" = "true" ]; then
      fail "$var_name is required but not set (no default). Export it before running."
    fi
    return
  fi

  # Interactive prompt
  if [ -n "$default" ]; then
    printf "${BOLD}%s${RESET} [%s]: " "$label" "$default"
  else
    printf "${BOLD}%s${RESET}: " "$label"
  fi

  local input
  read -r input
  input="${input:-$default}"

  if [ -z "$input" ] && [ "$required" = "true" ]; then
    fail "$label is required."
  fi

  eval "$var_name='$input'"
}

# ── banner ────────────────────────────────────────────────────────────
echo ""
printf "${BOLD}╔══════════════════════════════════════╗${RESET}\n"
printf "${BOLD}║   Ayantaraz — Production Setup       ║${RESET}\n"
printf "${BOLD}╚══════════════════════════════════════╝${RESET}\n"
echo ""

# ── check prerequisites ──────────────────────────────────────────────
info "Checking prerequisites ..."
for cmd in docker node npm git; do
  if command -v "$cmd" &>/dev/null; then
    ok "$cmd $(command "$cmd" --version 2>/dev/null | head -1 || echo 'found')"
  else
    warn "$cmd not found — may be needed for full deployment"
  fi
done
echo ""

# ── auto-generate secrets ────────────────────────────────────────────
info "Generating cryptographic secrets ..."
OTP_HMAC_SECRET_DEFAULT=$(gen_secret)
SESSION_HMAC_SECRET_DEFAULT=$(gen_secret)
ok "Secrets generated (32-byte hex)"

# ── BUILD_ID from git or timestamp ───────────────────────────────────
BUILD_ID_DEFAULT=""
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  BUILD_ID_DEFAULT=$(git rev-parse --verify HEAD 2>/dev/null || echo "")
fi
if [ -z "$BUILD_ID_DEFAULT" ]; then
  BUILD_ID_DEFAULT="release-$(date +%Y%m%d-%H%M%S)"
fi

# ── prompt for all variables ─────────────────────────────────────────
echo ""
info "Configure your deployment (press Enter for defaults):"
echo ""

# ── 1. App URL (required) ────────────────────────────────────────────
prompt NEXT_PUBLIC_APP_URL \
  "App URL (public, no trailing slash)" \
  "http://localhost:3000" \
  "true"

# ── 2. Database (required) ───────────────────────────────────────────
prompt DATABASE_URL \
  "PostgreSQL connection string" \
  "postgresql://ayan_taraz:ayan_taraz_secret@db:5432/ayan_taraz" \
  "true"

# ── 3. Redis (required for production, optional for dev) ─────────────
prompt REDIS_URL \
  "Redis connection string" \
  "redis://redis:6379" \
  "true"

# ── 4. SMS (optional but needed for OTP) ─────────────────────────────
echo ""
info "SMS Provider (optional — OTP returns 503 without it)"
prompt SMS_PROVIDER_URL \
  "SMS provider API URL" \
  "" \
  "false"

prompt SMS_API_KEY \
  "SMS provider API key" \
  "" \
  "false"

prompt SMS_TEMPLATE_ID \
  "SMS template ID" \
  "otp" \
  "true"

# ── 5. Media (optional) ──────────────────────────────────────────────
echo ""
prompt MEDIA_BASE_URL \
  "Media storage base URL (optional, leave blank to skip)" \
  "" \
  "false"

# ── 6. Build ID ──────────────────────────────────────────────────────
echo ""
prompt BUILD_ID \
  "Build ID (source revision hash)" \
  "$BUILD_ID_DEFAULT" \
  "true"

# ── 7. Secrets ───────────────────────────────────────────────────────
echo ""
info "Using auto-generated HMAC secrets (shown once):"
echo "  OTP_HMAC_SECRET:     ${OTP_HMAC_SECRET_DEFAULT:0:8}...${OTP_HMAC_SECRET_DEFAULT: -8}"
echo "  SESSION_HMAC_SECRET: ${SESSION_HMAC_SECRET_DEFAULT:0:8}...${SESSION_HMAC_SECRET_DEFAULT: -8}"
echo ""

OTP_HMAC_SECRET="$OTP_HMAC_SECRET_DEFAULT"
SESSION_HMAC_SECRET="$SESSION_HMAC_SECRET_DEFAULT"

# ── write .env ────────────────────────────────────────────────────────
info "Writing ${ENV_FILE} ..."

cat > "$ENV_PATH" <<ENVEOF
# ─── Ayantaraz Production Environment ───────────────────────────────
# Generated by setup.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ)
# Run 'bash setup.sh --validate' to verify. Run 'bash setup.sh' to regenerate.
#
# WARNING: Do not commit this file to version control.

# ── Build Identity (immutable source revision) ──────────────────────
BUILD_ID=${BUILD_ID}

# ── Public App URL (no trailing slash) ──────────────────────────────
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# ── PostgreSQL ──────────────────────────────────────────────────────
DATABASE_URL=${DATABASE_URL}

# ── Redis ───────────────────────────────────────────────────────────
REDIS_URL=${REDIS_URL}

# ── HMAC Secrets (min 32 chars, auto-generated) ────────────────────
OTP_HMAC_SECRET=${OTP_HMAC_SECRET}
SESSION_HMAC_SECRET=${SESSION_HMAC_SECRET}

# ── SMS Provider (optional — OTP returns 503 without these) ────────
SMS_PROVIDER_URL=${SMS_PROVIDER_URL:-}
SMS_API_KEY=${SMS_API_KEY:-}
SMS_TEMPLATE_ID=${SMS_TEMPLATE_ID}

# ── Media Storage (optional) ───────────────────────────────────────
MEDIA_BASE_URL=${MEDIA_BASE_URL:-}
ENVEOF

chmod 600 "$ENV_PATH"
ok ".env written and chmod 600"

# ── validate the generated .env ──────────────────────────────────────
info "Validating generated .env ..."
set -a; source "$ENV_PATH"; set +a

ERRORS=0
for var in DATABASE_URL REDIS_URL OTP_HMAC_SECRET SESSION_HMAC_SECRET NEXT_PUBLIC_APP_URL BUILD_ID SMS_TEMPLATE_ID; do
  if [ -z "${!var:-}" ]; then
    fail "$var is empty"
    ERRORS=$((ERRORS + 1))
  fi
done
[ ${#OTP_HMAC_SECRET} -ge 32 ]      || { fail "OTP_HMAC_SECRET < 32 chars"; ERRORS=$((ERRORS+1)); }
[ ${#SESSION_HMAC_SECRET} -ge 32 ]  || { fail "SESSION_HMAC_SECRET < 32 chars"; ERRORS=$((ERRORS+1)); }
[[ "$BUILD_ID" =~ ^[A-Za-z0-9._-]{7,128}$ ]] || { fail "BUILD_ID format invalid"; ERRORS=$((ERRORS+1)); }

if [ $ERRORS -eq 0 ]; then
  ok "All environment variables validated"
else
  fail "Validation failed with $ERRORS errors"
fi

# ── summary ──────────────────────────────────────────────────────────
echo ""
printf "${BOLD}╔══════════════════════════════════════╗${RESET}\n"
printf "${BOLD}║   Setup Complete                     ║${RESET}\n"
printf "${BOLD}╚══════════════════════════════════════╝${RESET}\n"
echo ""
ok "Next steps:"
echo "  1. Edit .env if you need to change SMS_PROVIDER_URL / SMS_API_KEY"
echo "  2. Run: bash deploy.sh          (build + deploy)"
echo "  3. Run: bash deploy.sh --down   (stop all containers)"
echo ""
