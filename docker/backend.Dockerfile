FROM node:24-bookworm-slim

RUN corepack enable

WORKDIR /app/worker

COPY worker/package.json worker/pnpm-lock.yaml ./
RUN corepack pnpm install --frozen-lockfile --prod=false

COPY worker/ ./
COPY db/ /app/db/

ENV NODE_ENV=production

EXPOSE 8787 2525

CMD ["corepack", "pnpm", "run", "local:all"]
