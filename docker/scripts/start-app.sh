#!/usr/bin/env bash
set -euo pipefail

/opt/wait-for-it.sh postgres:5432 -t 0
/opt/wait-for-it.sh redis:6379 -t 0
/opt/wait-for-it.sh maildev:1080 -t 0

if [[ "${SKIP_MIGRATIONS:-false}" != "true" ]]; then
  npm run migration:run
fi

if [[ "${SKIP_SEEDS:-false}" != "true" ]]; then
  npm run seed:run:relational
fi

node dist/src/main.js
