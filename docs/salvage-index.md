# 2.0 来源与打捞索引

## New Root

- Worktree: `E:\w\0\election-v2-2.0`
- Branch: `rebuild/election-v2-20260714`
- Branch type: orphan, no 1.0 tracked tree inherited

## Legacy Evidence

- 1.0 source commit: `985f6d205ef581a5d6c4c2668c9e706d19e4cab0`
- 1.0 audit branch: `salvage/legacy-1.0-audit-20260714`
- 1.0 read-only worktree: `E:\w\0\election-v1-salvage-head`
- Dirty historical/main workspace: `E:\w\0\election-v2`

旧目录只作证据与能力打捞源。不得把旧页面、状态枚举、API adapter、`materials.scope=archive`、公开上传或 demo 数据直接复制进 2.0。

只读打捞已在 `docs/responsibility-cards/legacy-1.0-infrastructure-salvage.md` 收口。后续禁止广泛浏览旧树；只有责任卡点名且中央契约/新基座无法回答时才定向回看。

## Local Clean Baseline Reference

- 夏夏本机完整下载母本：`E:\w\0\election-v2-2.0\base`
- 唯一运行源码：`apps/admin-web`
- 决定与比较证据：`docs/decisions/2026-07-14-admin-baseline.md`

## Clean Admin Upstream

- Repository: `https://github.com/isdreamcn/isdream-vue-admin.git`
- Branch: `main`
- Commit: `298bbcfae9b19bf17122e4ef8ac42d688b00b248`
- Version: `1.4.0`
- Target: `apps/admin-web`

复制时排除了 nested `.git`、`.github`、`.husky`、`.vscode`、VitePress docs、`.env*` 活跃配置、构建产物、本机依赖、日志和测试产物。环境变量名只保留为 `.env*.example`。

## Product Specs

`product-specs/recovered-annotations` 保存当前可观察的交互参考。它们可能同时含夏夏原始设计和后来恢复批注，因此证据等级低于仓库中央契约，不能反向证明产品决定。

真实附件与法务资料暂留原工作区，待受众、主版本和法源确认后通过 manifest 单独引入，不整包复制。
