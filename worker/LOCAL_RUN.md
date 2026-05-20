# 本地独立运行

这套本地运行模式不依赖 Cloudflare Workers、D1、KV 或 Email Routing。

它通过下面几层兼容保持原有 API：

- `SQLite` 替代 `D1`
- 本地 `JSON KV` 替代 `KV`
- 本地 `Node HTTP Server` 托管原 `Hono` API
- 本地 `SMTP Receiver` 接收邮件并调用原 `email()` 处理链

## 启动

1. 在 `worker` 目录安装依赖
2. 复制 `.env.local.example` 为 `.env.local`
3. 启动 HTTP API 与 SMTP 收件器

命令：

```bash
pnpm install
pnpm local:all
```

默认端口：

- HTTP API：`8787`
- SMTP 收件：`2525`

如果你只想单独调试某一部分，也可以使用：

```bash
pnpm local:start
pnpm local:smtp
```

## API 兼容

前端原来的接口路径继续保持：

- `/api/*`
- `/open_api/*`
- `/user_api/*`
- `/admin/*`
- `/telegram/*`
- `/external/*`

也就是说，前端只需要把 `VITE_API_BASE` 指向本地服务即可。

## 邮件接收

把你的域名 MX 指向你自己的服务器后，再让邮件服务或 MTA 转发到本地 SMTP 端口即可。

开发阶段也可以直接用 SMTP 客户端往本地 `2525` 端口投递测试邮件。

CI 冒烟测试命令：

```bash
pnpm local:smoke
```

## 数据位置

本地数据默认保存在：

- `worker/.local-data/temp-mail.sqlite`
- `worker/.local-data/kv.json`
