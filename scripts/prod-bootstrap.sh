#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if [[ "${ALLOW_DIRTY_WORKTREE:-0}" != "1" ]] && [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree has uncommitted changes." >&2
  echo "Commit/stash changes first, or run with ALLOW_DIRTY_WORKTREE=1." >&2
  exit 1
fi

echo "[1/7] Restart app docker compose"
npm run docker:dev:app:down
npm run docker:dev:app:up

echo "[2/7] Switch to main branch"
git checkout main

echo "[3/7] Pull latest changes from main"
git pull --ff-only origin main

echo "[4/7] Run migrations"
npm run migration:run

echo "[5/7] Run seeds"
npm run seed:run:relational

echo "[6/7] Build application"
npm run build

echo "[7/7] Start production app"
npm run start:prod
