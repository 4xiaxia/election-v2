# PROJECT_STATE

更新时间：2026-07-04

当前窗口上下文接近满，已新增 `上下文压缩摘要-2026-07-04.md` 作为下一轮最小接力入口。

2026-07-04 已完成小惊喜：`POST /position-v2/generate` 岗位自动生成第一刀，附 `koaLite/scripts/check-position-generate.js` 自测。

下一轮先读：

1. `上下文压缩摘要-2026-07-04.md`
2. `小Claude船长-下一段施工单.md`
3. `交接单-岗位自动生成-给codex.md`
4. `DECISIONS.md`

更新时间：2026-07-02

## 当前阶段

当前不急着写代码，正在把第666届村委会/社区居委会换届系统的一期业务骨架掰开揉碎。

核心方向：

- 不是多商户 SaaS。
- **不做数据隔离，只做分级**：城厢区统一系统下，122 个村+社区各是一个小管理单元。
- 口径钉死：不做隔离就是不做。超管看全部，经办登录后列表默认带自己归属地过滤，不写"看不到别村"的隔离逻辑，不做复杂权限树。
- `villages` 是归属地筛选根。
- `elections` 是一场换届的大母档案。
- `positions`、`candidates`、`materials`、`notices` 必须挂到 `election_id` 下。

## 当前参考材料

- `业务梳理-第666届换届起点.md`
- `工程责任表-一期P0.md`
- `选举系统_逻辑展示_甲方版 (1).html`
- `选举系统_填空模板 (1).html`

## 下一步

### Codex 配置已修

- `C:\Users\admin\.codex\config.toml` 中两个 `SessionStart` hook 已从 `enabled = false` 改为 `enabled = true`。
- `C:\Users\admin\.codex\hooks.json` 中裸 `bash` 已改为明确的 Git Bash 路径，node hook 已改为 PowerShell 可直接执行的命令形式。
- `C:\Users\admin\.config\lean-ctx\config.toml` 已补 `allow_paths`，允许读取本机全局技能/配置目录与当前工作区。
- `shell_allowlist` 已改为 `[]`，避免 Windows PowerShell 命令被 Linux 白名单误拦截。
- 已执行 `lean-ctx restart`，命令行验证通过；当前会话内嵌 MCP transport 已断开，重开 Codex 会话后会重新连接。
- `codex doctor` 仍提示自定义网关 reachability 超时；单独请求 `/models` 可在约 2.6 秒返回，且包含 `gpt-5.5`。

### 本机环境备份法宝

- 已新增 `scripts/Backup-CodexSafety.ps1` 和 `backup-codex-env.cmd`。
- 默认备份位置：`C:\Users\admin\CodexSafetyBackups`。
- 本轮已生成安全备份：`C:\Users\admin\CodexSafetyBackups\codex-env-20260702-202029.zip`。
- 默认跳过 `auth.json`、`.credentials.json`，避免把 API key 混进普通备份。
- 备份包内含 `Restore-CodexSafety.ps1`，用于回滚 Codex/lean-ctx/hooks/skills 配置。

继续分析两份 HTML：

1. `选举系统_逻辑展示_甲方版 (1).html`：登录后归属地、岗位在任、哪些岗位要换届、点击对应岗位。
2. `选举系统_填空模板 (1).html`：按节点填空、提交材料、发布公告、形成归档。

先画页面/业务 Mermaid，再决定数据库和接口怎么改。
