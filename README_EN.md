# Local Temp Mail - Self-Hosted Temporary Email Service

This project is a fully self-hosted temporary email system that runs on your own server without depending on Cloudflare.

It keeps the original API prefixes and most of the core behavior, while replacing the runtime with a local HTTP API server, a local SMTP receiver, and SQLite/JSON-backed storage.

## Current Features

- Local HTTP API service
- Local SMTP receiving service
- Local SQLite database
- Local JSON KV storage
- Static frontend
- Docker Compose deployment
- Cross-platform GitHub Release builds
- GitHub Release-triggered Docker image publishing

## API Compatibility

The local mode still preserves these API prefixes:

- `/api/*`
- `/open_api/*`
- `/user_api/*`
- `/admin/*`
- `/telegram/*`
- `/external/*`

That means the frontend and third-party integrations do not need to rewrite their API paths just because the project no longer runs on Cloudflare.

## Quick Start

### Run Directly

Backend:

```bash
cd worker
cp .env.local.example .env.local
corepack enable
corepack pnpm install
corepack pnpm run local:all
```

Frontend:

```bash
cd frontend
corepack enable
corepack pnpm install
corepack pnpm run build
```

### Docker Compose

```bash
cp worker/.env.local.example worker/.env.local
cp .env.compose.example .env
docker compose pull
docker compose up -d
```

The compose file pulls prebuilt Release images from GHCR and does not build anything on the target host:

- `ghcr.io/clockclock1/local-temp-mail/tempmail-backend:${IMAGE_TAG}`
- `ghcr.io/clockclock1/local-temp-mail/tempmail-frontend:${IMAGE_TAG}`

The default tag is `latest`. To pin a specific Release:

```bash
IMAGE_TAG=v0.1.0
docker compose up -d
```

You can also put `IMAGE_TAG=v0.1.0` into the root `.env` file copied from `.env.compose.example`.

Default ports:

- Frontend: `8080`
- Backend API: `8787`
- SMTP receiving: `2525`

## Important Paths

- [worker](./worker/): local backend and SMTP receiver entry
- [frontend](./frontend/): frontend application
- [db](./db/): database schema and migration scripts
- [docker-compose.yml](./docker-compose.yml): container deployment entrypoint
- [docker](./docker/): Dockerfiles and Nginx config
- [MAIL_GATEWAY.md](./MAIL_GATEWAY.md): public inbound mail gateway guidance

## GitHub Actions

The repository includes two Release-triggered workflows:

- `.github/workflows/ci-build.yml`
  verifies and builds on Windows, macOS, and Linux, then uploads artifacts to the GitHub Release
- `.github/workflows/docker-images.yml`
  builds and publishes multi-arch Docker images, then uploads OCI archives to the GitHub Release

## Upstream References

- `dreamhunter2333/cloudflare_temp_email`
- `wenfxl/cloudflare_temp_email_worker`

This project is for learning, research, and legitimate use only.
