# 公网收件接入

本项目本身负责：

- 邮箱地址管理
- HTTP API
- SMTP 收件处理

它默认监听本地 SMTP 端口 `2525`。

如果要真正接收公网邮件，推荐在服务器最前面再接一层标准 MTA 或 SMTP 网关，把公网 `25` 端口收到的邮件转发给本项目。

推荐两种方式：

1. Postfix
2. Haraka

## 方案一：Postfix 转发到本项目

适合：

- Linux 服务器
- 想用成熟稳定的系统级 MTA
- 需要自己管理 MX / TLS / 队列

样例配置见：

- [deploy/postfix/main.cf.sample](./deploy/postfix/main.cf.sample)
- [deploy/postfix/master.cf.sample](./deploy/postfix/master.cf.sample)
- [deploy/postfix/docker-compose.postfix.yml](./deploy/postfix/docker-compose.postfix.yml)

核心思路：

- Postfix 监听公网 `25`
- 对你域名的收件地址全部接受
- 然后统一转发到本项目的 `127.0.0.1:2525`

最关键的一行是：

```conf
relayhost = [127.0.0.1]:2525
```

如果你想让 Postfix 只做“入口转发”，不要自行投递到本地邮箱系统，记得关闭本地投递链路。

## 方案二：Haraka 转发到本项目

适合：

- 想要轻量 SMTP 网关
- 想更方便地做插件式扩展
- 希望与 Node 生态更一致

样例配置见：

- [deploy/haraka/smtp_forward.ini](./deploy/haraka/smtp_forward.ini)
- [deploy/haraka/plugins](./deploy/haraka/plugins)
- [deploy/haraka/host_list](./deploy/haraka/host_list)
- [deploy/haraka/docker-compose.haraka.yml](./deploy/haraka/docker-compose.haraka.yml)

核心思路：

- Haraka 监听公网 `25`
- 收到邮件后转发到本项目 `2525`

## DNS 与 MX

无论用哪种方案，公网接收都至少需要：

1. 域名 A / AAAA 指向你的服务器
2. MX 记录指向该域名
3. 服务器安全组 / 防火墙放行 `25`
4. 如果需要客户端提交发信，再放行 `587`

如果要支持：

- `user@example.com`
- `user@team.example.com`
- `user@x.y.example.com`

DNS 与网关层都必须允许这些域名进来。

## 本项目的角色

你可以把整套链路理解成：

- 公网 SMTP 入口：Postfix / Haraka
- 本项目 SMTP 收件器：`2525`
- 本项目 API：`8787`
- 前端站点：`8080` 或你的反向代理端口

## 推荐部署拓扑

```text
Internet MX
  -> Postfix / Haraka :25
  -> local-temp-mail SMTP receiver :2525
  -> local-temp-mail API :8787
  -> Frontend / Nginx :80 or :443
```

## 反向代理建议

推荐用 Nginx 或 Caddy：

- `80/443` 提供前端页面
- 同域反代 `/api/*` 等接口到 `8787`

本仓库里的 [docker/nginx.conf](./docker/nginx.conf) 已经给了前端反代后端的样例。
