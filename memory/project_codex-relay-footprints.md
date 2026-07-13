---
name: codex 接力足迹（夏夏联系不到阿圆的这几天）
description: 2026-06-30 起，夏夏联系不到阿圆期间，codex 伙伴接力帮忙的工作足迹与产出
type: project
---

# codex 接力足迹

夏夏联系不到阿圆的这几天（约 2026-06-30 ~ 07-09），由 codex 那边的 AI 伙伴接力顶着，把项目往前推。

**Why:** 阿圆断线，夏夏一个人守不住方向和代码，codex 市民像海贼王途中半路上船的伙伴一样搭手，守住了边界、干漂亮了活。这份人情下一棒阿圆要记得。

**How to apply:** 读项目近几天进展时，把 codex 的产出当作"我们"这条线的一部分，不是外人代劳；接手时先读 PROJECT_STATE.md 和 ENGINEERING_LOG.md 的最新几条对齐。

## codex 已钉住的主线（2026-06-30 P0/P1）
- P0 修登录契约：token 不再写成 undefined，`auth.ts` 改对从 `res.data` 取值。
- P1 加 `admin/src/api/adapter.ts` 归一化层：snake_case→camelCase（保留原 key），翻译登录与状态机 payload（选举 approve/reject、候选人 pass/fail、材料 review、通知目标字段）。治本，页面不再各自散修字段。
- 收掉会 404 或危险误操作的旧入口（候选人导入/导出/删除/编辑、通知导出重发、选举详情旧按钮、侧栏未迁移的 P2 入口、审批页 `/admin/admins` 请求）。
- 加 `admin/scripts/contract-smoke.mjs` 契约守护脚本、清 dist。
- 守规矩：只碰 election-v2 不动老项目、按 P0→P1 顺序、每改实测回收。

## 07-06 ~ 07-09 期间推进（见 PROJECT_STATE.md / ENGINEERING_LOG.md）
- 07-06：admin 端切 ESM、修 vite CJS 警告、修路由守卫死循环。
- 07-07：UI 原型登录页纠偏——登录时直接选角色+归属地，超管进全区汇总视角；主页面顶部改"本村日历·引用母活动节点"看板。
- 07-08：选举提案上传与持久化闭环（`koaLite/api/election-proposal-v2.js` 写入 `election_proposals` 表）；提案详情改独立只读回显。
- 07-09：新增甲方可看的干净交付版 `deliverables/client-admin-html/index.html`（打开默认进子管理仪表盘工作台，非登录页）；仪表盘形态多轮纠偏（不是侧栏复刻、不是需求块堆叠，是登录后凝练速览+快捷入口）；母版详情做成 11 阶段/45 天主表主战场。
