#!/usr/bin/env bash
# scripts/verify.sh — the single definition of "this change is verified".
#
# CI calls these same lanes (see .github/workflows/*.yml), so "passes
# locally" and "passes CI" mean the same thing. Agents and humans run this
# instead of hand-picking commands or clicking through the app.
#
#   scripts/verify.sh                 # lanes affected by your changes vs origin/main (default)
#   scripts/verify.sh --all           # every lane (slow — before a big PR, or nightly)
#   scripts/verify.sh --lane <name>   # one lane explicitly (repeatable)
#   scripts/verify.sh --base <ref>    # diff against another ref
#   scripts/verify.sh --list          # print the lanes that would run, then exit
#
# Lanes: api api-db web contract infra
# Exit code is non-zero if any lane fails; every selected lane still runs so
# one report shows everything that is broken.
#
# GENERATED from Honey's Spec Harness lane snippets. Add or change lanes here
# freely afterwards; keep the workflows in .github/workflows/ in sync.

set -uo pipefail

export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

BASE="origin/main"
MODE="changed"
LIST_ONLY=0
EXPLICIT_LANES=()

while [ $# -gt 0 ]; do
  case "$1" in
    --all) MODE="all" ;;
    --changed) MODE="changed" ;;
    --lane) EXPLICIT_LANES+=("$2"); MODE="explicit"; shift ;;
    --base) BASE="$2"; shift ;;
    --list) LIST_ONLY=1 ;;
    -h|--help) sed -n '2,17p' "$0"; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

# ---------------------------------------------------------------------------
# Changed files: committed on this branch + staged + unstaged + untracked.
# ---------------------------------------------------------------------------
changed_files() {
  local merge_base
  merge_base="$(git merge-base HEAD "$BASE" 2>/dev/null || git rev-parse HEAD)"
  {
    git diff --name-only "$merge_base"...HEAD
    git diff --name-only --cached
    git diff --name-only
    git ls-files --others --exclude-standard
  } | sort -u
}

CHANGED=""
if [ "$MODE" = "changed" ]; then
  CHANGED="$(changed_files)"
fi

touched() { # touched <extended-regex>
  [ -n "$CHANGED" ] && echo "$CHANGED" | grep -Eq "$1"
}

declare -A RUN=()
select_lane() { RUN["$1"]=1; }

case "$MODE" in
  all) for l in api api-db web contract infra; do select_lane "$l"; done ;;
  explicit)
    for l in "${EXPLICIT_LANES[@]}"; do
      case "$l" in
        api|api-db|web|contract|infra) select_lane "$l" ;;
        *) echo "Unknown lane: $l" >&2; exit 2 ;;
      esac
    done ;;
  changed)
    touched '^apps/api/' && select_lane api
    touched '^apps/api/' && select_lane api-db
    touched '^apps/web/' && select_lane web
    touched '^package(-lock)?\.json$' && select_lane web
    touched '^apps/api/|^packages/api-client/' && select_lane contract
    touched '^infra/|^\.github/workflows/|^scripts/' && select_lane infra
    ;;
esac

ORDER=(api api-db web contract infra)
SELECTED=()
for l in "${ORDER[@]}"; do [ -n "${RUN[$l]:-}" ] && SELECTED+=("$l"); done

if [ ${#SELECTED[@]} -eq 0 ]; then
  echo "verify: nothing to verify (no changes vs $BASE)."
  exit 0
fi

echo "verify: lanes -> ${SELECTED[*]}"
[ "$LIST_ONLY" = 1 ] && exit 0

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
FAILED=()
SKIPPED=()

step() { # step <label> <command...> — runs in a subshell, records failure
  local label="$1"; shift
  echo ""
  echo "── $label"
  if ! ( "$@" ); then
    echo "✗ $label"
    FAILED+=("$label")
    return 1
  fi
}

have() { command -v "$1" > /dev/null 2>&1; }
host_path() { if have cygpath; then cygpath -m "$1"; else echo "$1"; fi; }
docker_up() { have docker && docker info > /dev/null 2>&1; }

# ---------------------------------------------------------------------------
# Lanes — each mirrors a CI job. Keep them in sync with the workflow that
# calls them; that sync is the whole point of this file.
# ---------------------------------------------------------------------------
lane_api() {
  have uv || { echo "⚠ api: uv not installed — SKIPPED."; SKIPPED+=("api"); return 0; }
  cd apps/api || return 1
  step "api: uv sync" uv sync --locked --quiet || return
  step "api: ruff" uv run ruff check .
  step "api: mypy" uv run mypy .
  step "api: pytest" uv run pytest -q
}

# Migrations must (1) apply cleanly to an empty database, (2) match the SQLAlchemy models (`alembic check`), (3) round-trip (downgrade base, upgrade head).
# Uses $URL_ENV when it is already set (CI service container); otherwise starts a throwaway container if Docker is running.
api_db_migrations() {
  set -e
  local cid="" port=55432 url
  if [ -n "${DATABASE_URL:-}" ]; then
    url="${DATABASE_URL}"
  else
    cid="$(docker run -d --rm -p "$port:5432" -e POSTGRES_PASSWORD=verify -e POSTGRES_DB=verify postgres:16)"
    trap 'docker stop "$cid" > /dev/null 2>&1 || true' RETURN
    for _ in $(seq 1 40); do
      docker exec "$cid" pg_isready -U postgres -d verify > /dev/null 2>&1 && break
      sleep 1
    done
    url="postgresql+psycopg://postgres:verify@localhost:$port/verify"
  fi
  export DATABASE_URL="$url"
  uv run alembic upgrade head
  uv run alembic check
  uv run alembic downgrade base
  uv run alembic upgrade head
  echo "Migrations apply, match the models, and round-trip."
}

lane_api_db() {
  have uv || { echo "⚠ api-db: uv not installed — SKIPPED."; SKIPPED+=("api-db"); return 0; }
  cd apps/api || return 1
  if [ -z "${DATABASE_URL:-}" ] && ! docker_up; then
    echo "⚠ api-db: no DATABASE_URL and Docker not running — migration check SKIPPED (CI will run it)."
    SKIPPED+=("api-db")
    return 0
  fi
  step "api-db: uv sync" uv sync --locked --quiet || return
  step "api-db: migrations apply, match models, round-trip" api_db_migrations
}

lane_web() {
  have npm || { echo "⚠ web: npm not installed — SKIPPED."; SKIPPED+=("web"); return 0; }
  [ -d node_modules ] || [ -d apps/web/node_modules ] || step "web: install" npm ci || return
  cd apps/web || return 1
  has_script() { node -e 'process.exit(require("./package.json").scripts?.[process.argv[1]] ? 0 : 1)' "$1"; }
  has_script lint && step "web: lint" npm run --silent lint
  has_script typecheck && step "web: typecheck" npm run --silent typecheck
  [ -f tsconfig.json ] && ! has_script typecheck && step "web: tsc" npx tsc --noEmit
  has_script test && step "web: test" npm run --silent test
  has_script build && step "web: build" npm run --silent build
  return 0
}

# Fails when the committed generated client differs from what the live API contract produces.
contract_stop_port() {
  if have fuser; then
    fuser -k "$1/tcp" > /dev/null 2>&1 || true
  elif have powershell.exe; then
    powershell.exe -NoProfile -Command "Get-NetTCPConnection -LocalPort $1 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force }" > /dev/null 2>&1 || true
  fi
  true
}

contract_check() {
  set -e
  local port=8000 log pid
  export PORT="$port"
  log="$(mktemp)"
  # Bare, no database: the API's startup must tolerate that, exactly like CI.
  ( cd apps/api && exec uv run uvicorn app.main:app --host 127.0.0.1 --port "$PORT" ) > "$log" 2>&1 &
  pid=$!
  cleanup() {
    [ -n "${pid:-}" ] && kill "$pid" 2>/dev/null || true
    contract_stop_port "${port:-8000}" || true
    [ -n "${log:-}" ] && rm -f "$log" || true
  }
  trap cleanup EXIT
  local ok=0
  for _ in $(seq 1 60); do
    if curl -sf "http://127.0.0.1:$port/api/v1/health" > /dev/null || curl -sf "http://localhost:$port/api/v1/health" > /dev/null; then ok=1; break; fi
    sleep 2
  done
  if [ "$ok" != 1 ]; then echo "API did not start:"; tail -40 "$log"; return 1; fi
  ( cd packages/api-client && SPEC_URL="http://127.0.0.1:$port/api/v1/openapi.json" pnpm --filter @hunar/api-client generate )
  if ! git diff --exit-code -- packages/api-client/src/index.ts; then
    echo "packages/api-client was stale and has been REGENERATED — review and commit the diff above."
    return 1
  fi
  echo "packages/api-client matches the live API contract."
}

lane_contract() {
  step "contract: API contract drift" contract_check
}

lane_infra() {
  if [ -f infra/docker-compose.yml ] && docker_up; then
    step "infra: compose config" bash -c 'cd infra && docker compose -f docker-compose.yml config --quiet'
  else
    echo "⚠ infra: no compose file or Docker not running — compose check SKIPPED."
    SKIPPED+=("infra")
  fi
  if [ -d .github/workflows ] && docker_up; then
    # MSYS_NO_PATHCONV: stop Git Bash on Windows rewriting /repo into a host path.
    step "infra: actionlint" env MSYS_NO_PATHCONV=1 docker run --rm -v "$(host_path "$ROOT"):/repo" -w /repo rhysd/actionlint:1.7.7 -color
  fi
  step "infra: verify.sh syntax" bash -n scripts/verify.sh
}



for lane in "${SELECTED[@]}"; do
  echo ""
  echo "════ lane: $lane"
  # Failures are reported from the "✗" markers in the log, below.
  # A lane that bails out early must never look like a pass.
  ( cd "$ROOT" && "lane_${lane//-/_}" ) || echo "✗ lane $lane did not complete cleanly (see output above)"
done 2>&1 | tee "${TMPDIR:-/tmp}/verify-last.log"

echo ""
echo "════ summary"
FAILS="$(grep -E '^✗ ' "${TMPDIR:-/tmp}/verify-last.log" || true)"
SKIPS="$(grep -E '^⚠ ' "${TMPDIR:-/tmp}/verify-last.log" || true)"
[ -n "$SKIPS" ] && echo "$SKIPS"
if [ -n "$FAILS" ]; then
  echo "$FAILS"
  echo "verify: FAILED"
  exit 1
fi
echo "verify: PASSED (${SELECTED[*]})"
