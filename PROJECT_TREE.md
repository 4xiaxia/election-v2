# PROJECT_TREE

## 根目录真相源

- `工程责任表-一期P0.md`：一期树根参数责任表；字段来源、去向、用途、关联和不负责边界。
- `PROJECT_STATE.md`：当前状态。
- `ENGINEERING_LOG.md`：工作记录与验证。
- `DECISIONS.md`：已定边界。
- `message.md`：固定小 mini / 小 agent / 主 agent 公用留言栏，记录悄悄话、担心、建议和矛盾发现。

## 接力入口

- `副船长的航海接力日志/当前接力图.md`：低 token 施工图入口。
- `副船长的航海接力日志/文件索引.md`：航海日志目录。
- `副船长的航海接力日志/数据库立足点核对-2026-07-08.md`：live schema 对照 UI/业务设计，标出已对上、半对上、未找到家。
- `副船长的航海接力日志/数据库角色视角盘点-2026-07-08.md`：角色视角走通 UI、侧边栏、字段、数据库和下一刀计划。
- `副船长的航海接力日志/留言板.md`：小 sub 卡点和提醒。

## 根目录业务证据

- `换届选举系统-UI优化.html`：当前 UI 对齐原型；已按子管理仪表盘、母版活动、岗位详情、花名册、表格下载打锚点。文件被 `.gitignore` 忽略，作为本地施工稿使用。
- `cebianlan.md`：侧边栏模块草图，当前用于对齐选举活动管理、岗位管理、材料提交管理、候选人管理等跳转关系。
- `选举系统_填空模板 (1).html`
- `选举材料_时间线对照表 ——大招聘动态公告栏-下面小公告按照时间轴走.md`
- `其他附件材料/`

## 当前代码锚点

- `koaLite/db/init_v2.sql`：主表与新增字段。
- `koaLite/api/election-v2.js`：母档案增改查、选举方式规则。
- `koaLite/api/position-v2.js`：主任/副主任/委员岗位生成。
- `koaLite/api/candidate-v2.js`：候选人导入、审核、结果。
- `koaLite/api/material-v2.js`：candidate/archive 材料分流与审核。
- `koaLite/api/notice-v2.js`：18 公告模板生成与公告归档字段。
- `koaLite/scripts/seed-election-timeline.js`：给演示活动写入 11 阶段母表，并把 18 公告挂回阶段。
- `admin/src/views/dashboard/index.vue`：村/社区运营工作台，活动日历优先读取 `elections.content.timeline`。

## 下一刀

```text
按角色视角盘点的优先级收口：先补 `roster` 最小表/API、`notice-v2/list stageKey` 查询、`elections.content templateKey` 兼容合同，再盘 `position-v2` 输出字段。
```
