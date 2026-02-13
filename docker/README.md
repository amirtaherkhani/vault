# Docker Setup

This project uses two Compose files and two Dockerfiles:

- `docker/compose.dependencies.yaml`: starts dependency services only (PostgreSQL, Redis, Maildev).
- `docker/compose.app.yaml`: starts the app container only.
- `docker/Dockerfile.app`: runtime image for the NestJS app.
- `docker/Dockerfile.ci`: CI image that runs migrations, seed, lint, and e2e tests.

## Environment Files

Docker compose now resolves variables from env files in this order:

1. `.env`
2. `env-example-relational`

This order is used consistently by the Docker commands in this project.

Inside Docker, connection endpoints are forced to Docker service DNS defaults:

- `DATABASE_HOST=postgres`
- `MAIL_HOST=maildev`
- Redis URLs -> `redis://redis:6379/*`

You can override these via optional `DOCKER_*` environment variables.

## Local Docker Run

Use these primary commands:

```bash
# 1) Start dependencies
npm run docker:dev:deps:up

# 2) Start app
npm run docker:dev:app:up

# 3) Stop app
npm run docker:dev:app:down

# 4) Stop dependencies
npm run docker:dev:deps:down
```

These commands automatically use `.env` when present, or create it from `env-example-relational` when missing.

Optional lifecycle shortcuts:

```bash
# Stop running app+dependencies without removing volumes
npm run docker:dev:stop

# Restart running dependencies first, then app
npm run docker:dev:restart
```

Recommended start order:

1. start dependencies
2. start app

Start dependencies:

```bash
npm run docker:dev:deps:up
```

The script auto-creates the shared network `${VAULT_DOCKER_NETWORK:-vault-net}` when missing.

Start app:

```bash
npm run docker:dev:app:up
```

Stop app/dependencies:

```bash
npm run docker:dev:app:down
npm run docker:dev:deps:down
```

## Command Differences

`docker:dev:deps:*` manages only dependency services (`postgres`, `redis`, `maildev`).

`docker:dev:app:*` manages only the app container.

| Command | What it does | Notes |
| --- | --- | --- |
| `npm run docker:dev:deps:up` | Creates `.env` if missing, ensures shared Docker network exists, then starts `docker/compose.dependencies.yaml` in detached mode | Use this first |
| `npm run docker:dev:app:up` | Creates `.env` if missing, ensures shared Docker network exists, then builds and starts `docker/compose.app.yaml` in detached mode | Uses `--build` to rebuild app image |
| `npm run docker:dev:deps:down` | Stops dependencies and removes dependency volumes | Uses `down -v` |
| `npm run docker:dev:app:down` | Stops app and removes app compose volumes | Uses `down -v` |
| `npm run docker:dev:stop` | Stops app and dependencies without removing volumes | Equivalent to `compose stop` for app then deps |
| `npm run docker:dev:restart` | Restarts dependencies first, then app | Equivalent to `compose restart` |

All four commands use env precedence:

1. `.env`
2. `env-example-relational`

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
