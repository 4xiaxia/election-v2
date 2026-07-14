# 管理后台基座决定

> 日期：2026-07-14
> 状态：FINAL for baseline ownership；不授权业务实现。

## 1. 三份目录的角色

| 目录 | 角色 | 规则 |
|---|---|---|
| `base/` | 夏夏复制的 isdream-vue-admin 1.4.0 全新下载母本 | 本机只读参考，包含官方 docs、CI、Husky、VS Code 配置和活动 `.env`；不参与运行，不提交 Git |
| `apps/admin-web/` | 2.0 唯一管理后台源码与运行目录 | 所有后续前端实现、验证和提交只发生在这里 |
| `E:\w\0\election-v2\deliverables\isdream-vue-admin-main` | 旧业务接入后的历史副本 | 只读打捞交互证据，禁止作为基座或整包复制 |

`base/` 和 `apps/admin-web/` 不允许同时开发。需要核对官方文档时读 `base/docs`；需要改代码时只改 `apps/admin-web`。

## 2. 完整性核对

2026-07-14 对 `base/` 与 `apps/admin-web/` 做了相对路径和忽略 CRLF/BOM 的语义比较：

```text
base files: 354
apps/admin-web files: 328
shared files: 323
semantic differences: 6
```

六处差异仅为：

- `.env`、`.env.dev`、`.env.prod`：实际运行值已在 app 中改为 `*.example`，避免误提交。
- `.gitignore`：app 增加 2.0 生成物忽略规则。
- `LICENSE`：文本/换行差异。
- `public/iconfont/iconfont.css`：非业务文本差异。

共同的 `src/`、`build/`、`typings/`、`scripts/` 核心源码没有语义差异。`base/` 额外内容主要是官方组件/指南 docs 和仓库维护配置；app 额外保留 `UPSTREAM.md` 与环境示例。

## 3. 已确认可用的成熟前端能力

`apps/admin-web` 已经拥有：

- Token 注入、响应适配、401/403 和网络错误处理。
- 路由守卫、动态菜单、权限 key 和 `v-auth` 按钮权限指令。
- Pinia 用户状态和带版本/过期时间的本地 storage。
- `MTable` 远程分页、多选、跨页 selection 和请求竞态保护。
- `MForm`、`MFormDialog`、Element Plus 表单校验。
- TinyMCE 富文本、预览、模板/表格/图片插件和自定义上传入口。
- `MUpload` 文件数、类型、大小、规则、进度和预览。
- 布局、标签页、KeepAlive、主题、图标和图表基础设施。

这些是前端能力，不是服务端授权。按钮隐藏、路由过滤、文件类型前端校验都不能替代后端 scope、RBAC、状态、文件权限和事务校验。

## 4. 来源

实际 app 的可复现上游来源继续以 `apps/admin-web/UPSTREAM.md` 为准：

```text
repository: https://github.com/isdreamcn/isdream-vue-admin.git
commit: 298bbcfae9b19bf17122e4ef8ac42d688b00b248
version: 1.4.0
```

`base/` 只是方便夏夏和阿圆查看完整下载包，不替代 Git commit 血缘。
