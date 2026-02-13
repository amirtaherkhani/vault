# Docker Setup

This project uses two Compose files and two Dockerfiles:

- `docker/compose.dependencies.yaml`: starts dependency services only (PostgreSQL, Redis, Maildev).
- `docker/compose.app.yaml`: starts the app container only.
- `docker/Dockerfile.app`: runtime image for the NestJS app.
- `docker/Dockerfile.ci`: CI image that runs migrations, seed, lint, and e2e tests.

## Environment Files

The app compose file loads env files in this order:

1. `env-example-relational`
2. `.env`

This keeps template defaults and lets `.env` override secrets and local values.

Inside Docker, connection endpoints are forced to Docker service DNS defaults:

- `DATABASE_HOST=postgres`
- `MAIL_HOST=maildev`
- Redis URLs -> `redis://redis:6379/*`

You can override these via optional `DOCKER_*` environment variables.

## Local Docker Run

Start dependencies:

```bash
npm run docker:dev:up
```

The script auto-creates the shared network `${VAULT_DOCKER_NETWORK:-vault-net}` when missing.

Start app:

```bash
npm run docker:app:up
```

Stop app/dependencies:

```bash
npm run docker:app:down
npm run docker:dev:down
```

## Docker E2E Test Run

```bash
npm run test:e2e:relational:docker
```

That script:

- starts dependencies
- runs app with `docker/Dockerfile.ci`
- executes lint + e2e tests
- tears everything down and exits with test status

## CI Behavior

GitHub workflow `.github/workflows/docker-e2e.yml` now:

- copies `env-example-relational` to `.env`
- starts dependencies via `docker/compose.dependencies.yaml`
- runs tests via `docker/compose.app.yaml` with:
  - `APP_DOCKERFILE=docker/Dockerfile.ci`
  - `APP_COMMAND=/opt/start-ci.sh`
- uploads `prod.log` if the relational CI step fails
