# 本地服务器版临时邮箱系统

这是一个已经改造成“本地服务器优先”的完整项目。

它保留了原项目的大部分 API 与功能形态，但运行方式已经切到本地服务器，不再以 Cloudflare 作为运行前提。

## 当前默认形态

- 本地 HTTP API 服务
- 本地 SMTP 收件服务
- 本地 SQLite 数据库
- 本地 JSON KV 存储
- 前端静态站
- Docker Compose 部署
- GitHub Actions 全平台自动构建
- GitHub Actions 多架构 Docker 镜像构建

## 已包含能力

- 临时邮箱创建、收信、删信、发信
- 地址密码登录
- 用户系统、角色系统、管理员后台
- Webhook、自动回复、附件、AI 提取
- Telegram Bot / Mini App
- SMTP / IMAP 代理
- 指定子域邮箱与随机子域邮箱
- 根域与多级子域地址匹配

## API 保持原样

本地模式下仍保留这些接口前缀：

- `/api/*`
- `/open_api/*`
- `/user_api/*`
- `/admin/*`
- `/telegram/*`
- `/external/*`

也就是说，前端和第三方调用方不需要因为“脱离 Cloudflare”而重写 API 路径。

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
docker compose up -d --build
```

默认端口：

- 前端：`8080`
- 后端 API：`8787`
- SMTP 收件：`2525`

## 主要目录

- [worker](./worker/)：本地后端与 SMTP 收件入口
- [frontend](./frontend/)：前端页面
- [db](./db/)：数据库 schema 与迁移脚本
- [docker-compose.yml](./docker-compose.yml)：容器化部署入口
- [docker](./docker/)：Dockerfile 与 Nginx 配置
- [smtp_proxy_server](./smtp_proxy_server/)：历史 SMTP / IMAP 代理实现

## 文档入口

- [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
- [worker/LOCAL_RUN.md](./worker/LOCAL_RUN.md)
- [worker/.env.local.example](./worker/.env.local.example)

## GitHub Actions

已提供两条新的工作流：

- [ci-build.yml](./.github/workflows/ci-build.yml)
  在 Windows / macOS / Linux 上自动安装、构建和冒烟测试
- [docker-images.yml](./.github/workflows/docker-images.yml)
  自动构建并推送多架构 Docker 镜像

## 参考来源

- `dreamhunter2333/cloudflare_temp_email`
- `wenfxl/cloudflare_temp_email_worker`

本项目仅用于学习、研究与合法场景使用。
