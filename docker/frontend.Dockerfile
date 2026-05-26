FROM node:24-bookworm-slim AS build

RUN corepack enable

WORKDIR /app/frontend

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack pnpm install --frozen-lockfile

COPY frontend/ ./

ARG VITE_API_BASE=
ENV VITE_API_BASE=${VITE_API_BASE}
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN corepack pnpm run build

FROM nginx:1.29-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
