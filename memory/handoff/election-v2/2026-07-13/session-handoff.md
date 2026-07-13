---
type: handoff
temporary: true
project: election-v2
date: 2026-07-13
created_at: 2026-07-13T03:00:00+08:00
author: 阿圆 (Claude)
branch: chore/relay-cleanup-20260704
---

# Project Handoff · election-v2 城厢区村居换届选举系统

> 临时交接文档，用完即弃。下一棒接到这里直接开工，不用重新翻文件。

---

## 关键路径（每次换环境第一眼看这里）

| 项目 | 路径 |
|---|---|
| 工程目录 | `E:\w\0\election-v2` |
| 记忆目录 | `E:\memory\memories\projects\E--w-0-election-v2\memory\` |
| 记忆索引 | `E:\memory\memories\projects\E--w-0-election-v2\memory\MEMORY.md` |
| Handoff | `C:\Users\Administrator\.openclaw\shared\handoff\election-v2\` |
| GitBash | `D:\Git\git-bash.exe` |
| 当前分支 | `chore/relay-cleanup-20260704` |
| shared.css | `E:\w\0\election-v2\shared.css`（全站唯一CSS变量源） |

---

## 心法（接手先认，再动代码）

**真正的能力不是智力多高，而是对一件事的责任心。**

- 开工先读图谱，不全量啃文件
- 先填责任表第4列（不负责什么）和第10列（是否唯一），再动代码
- 失败≥3次：停手→回岔路口→看图→换道
- 六条铁律见 `memory/feedback_engineering-creed.md`

---

## 今晚完成（2026-07-13 凌晨会话）

| 模块 | 做了什么 |
|---|---|
| 母版B部分 | 4套9阶段官方流程，lock机制+拖排+删除+新增阶段 |
| 母版公告弹窗 | 富文本工具栏+标题+定时发布+日历callback写localStorage |
| iframe embedded | 7个页面补 `.ss-side` 隐藏+`margin-left` 清零 |
| shared.css | :root换仪表盘基准色值，加17个兼容别名，全站变量唯一源 |
| 后台管理页 | 新建，资料库上传+短信配置+通知推送占位 |
| 归档tab | 进行中活动可上传，历史届只读 |
| 仪表盘日历 | 接上 `election_calendar_events` localStorage，定时发布铃铛显示 |
| 归属地锁死 | `lockLocationDisplay()` 漏斗继承后禁止重选 |

---

## 当前系统状态

```
10个页面文件全在，总台侧边栏9模块全接通，NOT_BUILT={}

登录 → 仪表盘（日历+铃铛+公告callback）
     → 母版（4套9阶段·锁死·富文本公告·定时发布·漏斗继承·归属地锁）
     → 提案审批 / 活动总列表 / 岗位管理
     → 业务模块（材料血缘·候选人三阶段漏斗·冻结·归档可上传）
     → 公告通知（母版镜像）
     → 后台管理（短信配置·资料库上传）
总台外壳（超管·全路由接通）
```

全站颜色：`--red:#B22222` `--gold:#C8A45C` `--bg-page:#FAF8F5`

候选人：`qualifyCandidate` / `confirmCandidate` / `freezeCandidate` 三阶段漏斗已实现

---

## 下一步

- [ ] 走一遍完整演示流程（登录→仪表盘→母版→候选人→公告→总台）
- [ ] 各子页面 `.wrap` 宽度不统一（后台900px vs 其他1160-1320px），视需要对齐
- [ ] git commit 打快照
- [ ] 下一期：候选人管理页独立化（现在在业务模块tab里）

---

## 记忆文件清单

```
MEMORY.md                            — 总索引，每次醒来先读
soul_ayuan-roots.md                  — 我是谁
feedback_engineering-creed.md        — 六条铁律+九列责任表
feedback_code-aesthetics.md          — 拒绝多余，极致复用
feedback_local-success-global-fail.md — 局部成功全局失败的根因
project_phase1-boundaries.md        — 一期核心边界，动代码前必读
project_frontend-components.md      — isdream-vue-admin + 组件小纸条
```
