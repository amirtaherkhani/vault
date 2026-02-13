#!/usr/bin/env bash
set -euo pipefail

/opt/wait-for-it.sh postgres:5432 -t 0
/opt/wait-for-it.sh redis:6379 -t 0
/opt/wait-for-it.sh maildev:1080 -t 0

npm run migration:run
npm run seed:run:relational

node dist/src/main.js > prod.log 2>&1 &
APP_PID=$!

cleanup() {
  if kill -0 "$APP_PID" 2>/dev/null; then
    kill "$APP_PID" || true
    wait "$APP_PID" || true
  fi
}
trap cleanup EXIT

/opt/wait-for-it.sh 127.0.0.1:${APP_PORT:-3000} -t "${APP_BOOT_TIMEOUT_SECONDS:-180}"

npm run lint
npm run test:e2e -- --runInBand
