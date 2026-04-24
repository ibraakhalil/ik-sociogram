#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

export PATH="$HOME/.bun/bin:$PATH"

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # Load Node for PM2 when the server uses NVM.
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh"
  nvm use default >/dev/null 2>&1 || nvm use --lts >/dev/null 2>&1 || true
fi

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

require_command bun
require_command pm2

if [[ ! -f "$ROOT_DIR/backend/.env" ]]; then
  echo "Missing $ROOT_DIR/backend/.env"
  exit 1
fi

if ! grep -Eq '^JWT_SECRET=.+' "$ROOT_DIR/backend/.env"; then
  echo "backend/.env must define JWT_SECRET"
  exit 1
fi

if [[ -z "${NEXT_PUBLIC_API_BASE_URL:-}" ]]; then
  echo "NEXT_PUBLIC_API_BASE_URL environment variable is required"
  exit 1
fi

mkdir -p "$ROOT_DIR/backend/public/posts"

cd "$ROOT_DIR/backend"
bun install --frozen-lockfile
bun run db:migrate

cd "$ROOT_DIR/frontend"
bun install --frozen-lockfile
bun run build

cd "$ROOT_DIR"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
