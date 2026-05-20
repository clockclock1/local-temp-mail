# 部署指引

## 目标形态

本项目现在默认按“本地服务器部署”交付，不再以 Cloudflare 作为运行前提。

推荐部署方式有两种：

1. 直接在服务器上运行 Node 服务
2. 使用 Docker Compose 运行整套服务

## 服务组成

- `worker/`：本地后端，负责 HTTP API 与 SMTP 收件
- `frontend/`：前端静态页面
- `db/`：数据库初始化脚本
- `docker-compose.yml`：推荐的容器化部署入口

## 方式一：直接运行

### 后端

在 [worker](./worker/) 目录：

```bash
cp .env.local.example .env.local
corepack enable
corepack pnpm install
corepack pnpm run local:all
```

默认会启动：

- HTTP API：`8787`
- SMTP 收件：`2525`

### 前端

在 [frontend](./frontend/) 目录：

```bash
corepack enable
corepack pnpm install
corepack pnpm run build
```

构建产物在 `frontend/dist/`，可交给 Nginx、Caddy 或 Apache 提供静态服务。

如果前端与后端同域部署，`VITE_API_BASE` 可以留空。

## 方式二：Docker Compose

先准备环境文件：

```bash
cp worker/.env.local.example worker/.env.local
```

然后启动：

```bash
docker compose up -d --build
```

默认端口：

- 前端：`8080`
- 后端 API：`8787`
- SMTP 收件：`2525`

## 邮件接收

开发环境可以直接让 SMTP 客户端投递到 `2525`。

正式环境如果要真正接收公网邮件，通常需要：

- 域名 MX 指向你的邮件入口服务器
- MTA 或邮件网关把邮件转发到本项目 SMTP 端口
- 或直接把容器端口改成 `25`

## 数据存储

本地运行时默认使用：

- SQLite：`worker/.local-data/temp-mail.sqlite`
- JSON KV：`worker/.local-data/kv.json`

Docker Compose 下数据挂在命名卷 `backend_data`。

## GitHub Actions

仓库已改为本地服务器路线的自动构建：

- `.github/workflows/ci-build.yml`
  用于 Windows / macOS / Linux 的自动构建与冒烟测试
- `.github/workflows/docker-images.yml`
  用于构建并推送 `linux/amd64` 和 `linux/arm64` Docker 镜像

## 推荐阅读顺序

1. [README.md](./README.md)
2. [worker/LOCAL_RUN.md](./worker/LOCAL_RUN.md)
3. [docker-compose.yml](./docker-compose.yml)
4. [worker/.env.local.example](./worker/.env.local.example)
