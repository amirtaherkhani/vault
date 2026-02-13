#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  exit 0
fi

cp env-example-relational .env
echo "Created .env from env-example-relational"
