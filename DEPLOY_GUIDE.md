# 部署指引

## 目标形态

本项目现在默认按本地服务器部署交付，不再以 Cloudflare 作为运行前提。

推荐两种方式：

1. 直接在服务器上运行 Node 服务
2. 使用 Docker Compose 运行整套服务

## 服务组成

- `worker/`：本地后端，负责 HTTP API 与 SMTP 收件
- `frontend/`：前端静态页面
- `db/`：数据库初始化与迁移脚本
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

构建产物位于 `frontend/dist/`，可交给 Nginx、Caddy 或 Apache 提供静态服务。

## 方式二：Docker Compose

先准备环境文件：

```bash
cp worker/.env.local.example worker/.env.local
cp .env.compose.example .env
```

然后启动：

```bash
docker compose pull
docker compose up -d
```

`docker-compose.yml` 不会在目标服务器本地构建镜像，而是直接拉取 GitHub Releases 工作流发布到 GHCR 的预编译镜像：

- `ghcr.io/clockclock1/local-temp-mail/tempmail-backend:${IMAGE_TAG}`
- `ghcr.io/clockclock1/local-temp-mail/tempmail-frontend:${IMAGE_TAG}`

默认标签为 `latest`。如果你想固定某个版本，可以在启动前指定镜像标签：

```bash
IMAGE_TAG=v0.1.0
docker compose up -d
```

也可以把 `IMAGE_TAG=v0.1.0` 写入由 `.env.compose.example` 复制出来的根目录 `.env` 文件中。

默认情况下，Compose 会同时暴露：

- 宿主机 `25` -> 容器 `2525`，用于公网 SMTP / MX 收件
- 宿主机 `2525` -> 容器 `2525`，用于本地调试或前置邮件网关转发

如果当前服务器、云厂商安全组或运营商网络不允许入站 `25`，请按 [MAIL_GATEWAY.md](./MAIL_GATEWAY.md) 使用 Postfix / Haraka 等前置网关。

默认端口：

- 前端：`8080`
- 后端 API：`8787`
- SMTP 收件：宿主机 `25` 与 `2525` 最终都会转发到容器内 `2525`

## 邮件接收

开发环境可以直接让 SMTP 客户端投递到 `2525`。

如果要接收公网邮件，通常需要：

- 域名 MX 记录指向你自己的邮件入口服务器
- 外部网络能够连通服务器入站 `25`
- MTA 或邮件网关把邮件转发到本项目 SMTP 端口
- 或由你自行在公网监听 `25` 端口并转交到本服务

可以参考 [MAIL_GATEWAY.md](./MAIL_GATEWAY.md)。

## 数据存储

本地运行默认使用：

- `worker/.local-data/temp-mail.sqlite`
- `worker/.local-data/kv.json`

Docker Compose 下数据挂在命名卷 `backend_data`。

## GitHub Actions

仓库已改为 Release 触发自动构建：

- `.github/workflows/ci-build.yml`
  用于 Windows / macOS / Linux 验证、构建与 Release 产物上传
- `.github/workflows/docker-images.yml`
  用于构建并推送 `linux/amd64` 与 `linux/arm64` Docker 镜像

## 推荐阅读顺序

1. [README.md](./README.md)
2. [worker/LOCAL_RUN.md](./worker/LOCAL_RUN.md)
3. [MAIL_GATEWAY.md](./MAIL_GATEWAY.md)
4. [docker-compose.yml](./docker-compose.yml)
5. [worker/.env.local.example](./worker/.env.local.example)
