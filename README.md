# election-v2 2.0

干净的 election-v2 2.0 主线。

```text
Path:   E:\w\0\election-v2-2.0
Branch: rebuild/election-v2-20260714
```

## Current State

- 永久产品/工程契约已迁入。
- 管理端使用纯净 isdream-vue-admin 1.4.0 上游基座。
- 产品 HTML 以证据等级明确的只读参考迁入。
- API 和选民小程序仅建立边界，尚未选择/迁入业务实现。
- 旧 `admin`、`koaLite`、`mini-program` 和 demo 数据未进入本树。
- 当前未授权业务代码、数据库 schema、迁移、种子或数据库操作。

## Read First

1. `AGENTS.md`
2. `docs/election-v2-central-contract.md`
3. `docs/organization-data-and-export-contract.md`
4. `docs/salvage-index.md`

## Admin Baseline

```powershell
cd E:\w\0\election-v2-2.0\apps\admin-web
pnpm install
pnpm type-check
pnpm build:dev
```
