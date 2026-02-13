#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-}"
COMPOSE_FILE="${2:-}"
shift 2 || true
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -z "${ACTION}" || -z "${COMPOSE_FILE}" ]]; then
  echo "Usage: $0 <up|down|stop|restart> <compose-file> [docker-compose args...]" >&2
  exit 1
fi

case "${ACTION}" in
  up|down|stop|restart) ;;
  *)
    echo "Unsupported action: ${ACTION}. Use up, down, stop, or restart." >&2
    exit 1
    ;;
esac

"${SCRIPT_DIR}/ensure-env.sh"

if [[ "${ACTION}" == "up" ]]; then
  docker network inspect "${VAULT_DOCKER_NETWORK:-vault-net}" >/dev/null 2>&1 || \
    docker network create "${VAULT_DOCKER_NETWORK:-vault-net}"
fi

docker compose --env-file .env --env-file env-example-relational -f "${COMPOSE_FILE}" "${ACTION}" "$@"
