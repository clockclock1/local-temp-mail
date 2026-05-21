# 本地自托管临时邮箱

这是一个彻底脱离 Cloudflare、可独立运行在本地服务器上的临时邮箱系统。

当前版本保留了原项目的大部分接口前缀与核心能力，同时把运行方式改为本地 HTTP API + 本地 SMTP 接收 + SQLite/JSON 存储。

## 当前特性

- 本地 HTTP API 服务
- 本地 SMTP 收件服务
- 本地 SQLite 数据库
- 本地 JSON KV 存储
- 前端静态站点
- Docker Compose 部署
- GitHub Releases 触发的跨平台自动编译
- GitHub Releases 触发的 Docker 镜像构建与发布

## API 保持原样

本地模式下仍保留这些接口前缀：

- `/api/*`
- `/open_api/*`
- `/user_api/*`
- `/admin/*`
- `/telegram/*`
- `/external/*`

这意味着前端和第三方调用方不需要因为脱离 Cloudflare 而重写 API 路径。

## 快速开始

### 直接运行

后端：

```bash
cd worker
cp .env.local.example .env.local
corepack enable
corepack pnpm install
corepack pnpm run local:all
```

前端：

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

`docker-compose.yml` 会直接从 GHCR 拉取 GitHub Release 工作流产出的预编译镜像，不会在目标服务器本地执行构建：

- `ghcr.io/clockclock1/local-temp-mail/tempmail-backend:${IMAGE_TAG}`
- `ghcr.io/clockclock1/local-temp-mail/tempmail-frontend:${IMAGE_TAG}`

默认标签为 `latest`。如果你想固定到某个 Release 版本，可以这样启动：

```bash
IMAGE_TAG=v0.1.0
docker compose up -d
```

也可以把 `IMAGE_TAG=v0.1.0` 写入由 `.env.compose.example` 复制出来的根目录 `.env` 文件中。

默认情况下，Compose 会同时暴露：

- 宿主机 `25` -> 容器 `2525`，用于公网 SMTP / MX 收件
- 宿主机 `2525` -> 容器 `2525`，用于本地联调或上游网关转发

如果你的服务器环境无法直接开放 `25`，请改用 [MAIL_GATEWAY.md](./MAIL_GATEWAY.md) 里的 Postfix / Haraka 前置网关方案。

默认端口：

- 前端：`8080`
- 后端 API：`8787`
- SMTP 收件：宿主机 `25`（公网）与 `2525`（本地）都会转发到容器内 `2525`

## 主要目录

- [worker](./worker/)：本地后端与 SMTP 收件入口
- [frontend](./frontend/)：前端页面
- [db](./db/)：数据库 schema 与迁移脚本
- [docker-compose.yml](./docker-compose.yml)：容器化部署入口
- [docker](./docker/)：Dockerfile 与 Nginx 配置
- [smtp_proxy_server](./smtp_proxy_server/)：历史 SMTP / IMAP 代理实现

## 文档入口

- [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
- [MAIL_GATEWAY.md](./MAIL_GATEWAY.md)
- [worker/LOCAL_RUN.md](./worker/LOCAL_RUN.md)
- [worker/.env.local.example](./worker/.env.local.example)

## GitHub Actions

仓库当前包含两个基于 Release 发布触发的工作流：

- `.github/workflows/ci-build.yml`
  负责 Windows / macOS / Linux 跨平台验证、构建，并把产物上传到 GitHub Release
- `.github/workflows/docker-images.yml`
  负责构建并发布多架构 Docker 镜像，同时把 OCI 归档挂到 GitHub Release

## 参考来源

- `dreamhunter2333/cloudflare_temp_email`
- `wenfxl/cloudflare_temp_email_worker`

本项目仅用于学习、研究与合法场景使用。
