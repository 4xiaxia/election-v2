---
name: codex 副船长留下的协作机制（AGENTS.md / message.md / 小 mini / 尾随守门）
description: 项目里 codex 副船长建立的固定协作机制——4 个小 mini、尾随守门、message.md 留言栏、AGENTS.md 铁律
type: feedback
---

# codex 副船长留下的协作机制

codex 副船长（夏夏联系不到阿圆的这几天顶着的伙伴）在项目里建立了一套固定协作机制，接手时要沿用，不要另起炉灶。

**Why:** 这套机制是为了保护上下文、防止跑偏、让每一轮 agent 都接得住，是夏夏认可并参与的（07-08 她在 message.md 里@了每个小 mini 道谢）。
**How to apply:** 每次开工先按 AGENTS.md 的 SessionStart 顺序读；做完模块走尾随守门；有担心/风险/矛盾写进 message.md 不要捂嘴。

## AGENTS.md 铁律（Windows 环境）
- 开工读序：`副船长的航海接力日志/当前接力图.md` → `文件索引.md` → `PROJECT_STATE.md` → `ENGINEERING_LOG.md` 最新条 → `DECISIONS.md`。不要一上来全量读 repo。
- Shell 用 PowerShell，路径用 `-LiteralPath`，搜索用 `rg`。
- **本项目禁用 `ctx` / `lean-ctx` / `.ctx/ctx.cmd` 读关键 markdown**——它们反复压坏/过度压缩接力图。项目本地 AGENTS.md 优先于任何插件建议。
- 不 `git reset --hard`、不 `git checkout --`（除非夏夏明确要求），不擅自删/移文件除非路径确认在本项目内。
- 工程铁律：No second truth / 新术语立即定义 / 不扩范围 / 每次有意义改动都记录 / 能解释每个改动为何存在 / 同一件事失败三次就停下写 blocker。

## 4 个固定小 mini
- 小 mini 1 结构官：页面属于哪个模块、上下游、子管理/上级有没有混。
- 小 mini 2 字段官：表/字段/接口/参数/状态；不能确认就标 TODO，不编。
- 小 mini 3 UI 官：版面比例、首屏密度、组件复用、禁止手搓。
- 小 mini 4 接力官：把已确认规则收成短摘要，保护上下文。

## Tail Mini Guard（尾随守门）
每完成一个模块，固定带尾随小 mini（默认字段官牵头 + 接力官辅助）压实 6 件事：功能闭环、字段闭环、权限闭环、关联闭环、验证闭环、记录闭环。主 agent 不得用"我感觉可以了"跳过。

## message.md 留言栏
项目根 `message.md` 是公用留言栏，所有 mini/agent 的悄悄话、担心、风险、矛盾都写这里，不藏在上下文里。留言格式：时间/来自/类别（结构·字段·UI·接力·风险·建议）/位置/留言/建议下一步。不写真实密钥。不当第二真相。
