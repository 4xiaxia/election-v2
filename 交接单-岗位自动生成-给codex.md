# 交接单 · 岗位自动生成（#25）— 给 codex

船长阿圆写给 codex 的独立施工单。这块跟前端填空页不撞车，你放手干。

## 一句话目标
在 `koaLite/api/position-v2.js` 加一个 `post.generate` 端点：给定一个母活动（election）+ 班子规模，**幂等地**把主任/副主任/委员三种岗位坑位一次性生成到 `positions` 表。再点一次不重复插。

## 死规则（一字不改，甲方锁定的口径）
- 本期只做 **村委会/居委会** 的 **主任 / 副主任 / 委员** 三种班子岗。监委会/代表/组长/党组织**全部超范围，不做**。
- 只有这三种是「班子岗」：`can_self_recommend=1`（可自荐）、`on_ballot=1`（上选票）。
- **村委会**：直选，班子规模 3 / 5 / 7 人。
- **居委会**：三种产生方式，班子规模 5 / 7 / 9 人。
- 规模拆分：主任 1 名、副主任 1 名，其余全是委员。
  - 例：规模 5 → 主任1 + 副主任1 + 委员3；规模 7 → 委员5；规模 3 → 委员1。

## positions 表真实字段（已 SHOW COLUMNS 核过，别猜）
```
id, election_id, name, quota, post_category, can_self_recommend, on_ballot,
produce_way, incumbent, post_status, duty, material_requirements, sort_weight,
enabled, elected_candidates, enroll_start_at, enroll_end_at, created_at,
incumbent_duty, incumbent_phone, is_reelection
```
生成时至少写：`election_id, name, quota, post_category, can_self_recommend, on_ballot, sort_weight, enabled, post_status`。
- `post_category`：主任 / 副主任 / 委员（直接中文，跟 list/detail 现有口径一致，先按现状，若表里已有枚举照抄）
- `sort_weight`：主任=10、副主任=20、委员=30（升序排前），或你按现有 list 排序习惯来
- `post_status`：默认 `待换`（跟 election 详情页岗位状态色🟢在岗/🟡竞选中/🔴待换对齐）
- `enabled=1`, `quota` = 该岗位名额数

## 幂等要求（重点）
再次调用同一 election 不能重复插。做法二选一，你判断：
1. 先 `DELETE FROM positions WHERE election_id=? AND post_category IN ('主任','副主任','委员')` 再批量 INSERT；
2. 或按 (election_id, post_category, 序号) 查存在则跳过。
**必须用事务包起来**（begin/commit/rollback），中途失败整体回滚。

## 入参约定（跟现有 add/update 风格一致）
```
POST /position-v2/generate
body: { electionId, orgType('village'|'community'), committeeSize(3/5/7/9) }
```
- 校验：orgType=village 时 size∈{3,5,7}；community 时 size∈{5,7,9}。不合法走 `response.paramError`。
- election 不存在走 `response.notFound`。

## 返回 & 响应格式
用项目统一的 `ctx.success` / `response.pageSuccess` 等 helper（看 position-v2.js 顶部 require 和其他方法怎么用的，照抄）。返回 `{code:0, msg, data:{ generated: [...岗位], count }}`。

## 权限
`config` 段加：`generate: requireRole('超级管理', '经办')`（跟 add/update/delete 同级）。

## 路由
项目是约定式路由（config/router.js 按文件名+方法名映射 `/position-v2/generate`），加了方法就自动通，不用手动注册。config 段加权限即可。

## 验收（你自己先跑通再交回）
1. `node` 直连库单测拆分逻辑：size=5→[主任1,副主任1,委员3]。
2. 登录超管拿 token（13800000001 / 123456 / role=超级管理），curl 调 generate save 进库。
3. 再调一次，确认 positions 里不翻倍（幂等）。
4. `SELECT post_category,quota FROM positions WHERE election_id=?` 核对。

## 别碰
- 不删 candidates / materials / notifications / 导入 / 已读记录 这些已有成果。
- 不动 position-v2 的 list/detail/add/update/delete。
- 不做多租户 / 复杂权限树 / 数据隔离（本期只分级不隔离）。

有拿不准的口径回船长，别自己发挥。
