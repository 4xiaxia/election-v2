# PROJECT_TREE

## 根目录真相源

- `工程责任表-一期P0.md`：一期树根参数责任表；字段来源、去向、用途、关联和不负责边界。
- `PROJECT_STATE.md`：当前状态。
- `ENGINEERING_LOG.md`：工作记录与验证。
- `DECISIONS.md`：已定边界。

## 接力入口

- `副船长的航海接力日志/当前接力图.md`：低 token 施工图入口。
- `副船长的航海接力日志/文件索引.md`：航海日志目录。
- `副船长的航海接力日志/留言板.md`：小 sub 卡点和提醒。

## 根目录业务证据

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
让 archive 材料上传按 elections.content.timeline 的 stage_key/material_no 挂回阶段。
```
