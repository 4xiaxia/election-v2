# 上下文摘要

> 凝练时间：2026-07-14T08:00:00+08:00 | 压缩级别：L3 | 性质：会话恢复材料，中央契约优先

## 用户需求

把夏夏逐项纠偏后的 election-v2 产品理解固化为可恢复、可分封且不会串概念的 2.0 工程主线；先读懂 HTML，再只读打捞 1.0 能力，最后在纯净 isdream 框架内按四个主要工作面总装。

## 当前进度

已建立、提交并验证 2.0 干净工作树；Puppeteer MCP 已安装并完成真实登录页验收。业务实现仍受中央契约授权门阻塞，下一步是后端模板和 1.0 基础能力只读审计。

## 主题索引

- 恢复入口：`AGENTS.md`
- 最高产品/工程入口：`docs/election-v2-central-contract.md`
- 单库组织隔离与未来拔库：`docs/organization-data-and-export-contract.md`
- 1.0 血缘与打捞入口：`docs/salvage-index.md`
- HTML 产品证据：`product-specs/recovered-annotations/`
- 共享 handoff：`C:\Users\Administrator\.openclaw\shared\handoff\election-v2\INDEX.md`
- 小领主名册：`C:\Users\Administrator\.openclaw\shared\handoff\election-v2\2026-07-14\agent-roster-and-reports.md`

## 关键决策

- 四个主要工作面：仪表盘、母版、自荐材料审核、候选人审核；简单功能优先独立弹窗/抽屉，活动进入母版页面。
- 材料管理仅负责公众自荐一个法定岗位时提交的私人材料，不是归档管理。
- 公告是组织对公众的正式发布；通知是发给手机号绑定人员的站内提醒/SMS 通道。
- 母版阶段日期只填一次，公告窗口、候选审核窗口、提醒、归档目录和其他投影由它映射。
- 母版公共下载附件、公告引用附件、线下会议记录和照片进入按届归档；文件保留来源、用途、权限和不可变版本。
- 选举方式属于整届活动；岗位只拥有主任/副主任/委员配置、名额、说明和报名模板。
- 自荐材料收审不是候选资格审核；进入候选池后，自荐/联名/党组织推荐统一走阶段 3 的三轮资格审核。
- 身份键为 `organization_id + normalized_phone`；一个 MySQL 数据库和同构共享表，所有组织数据强制非空 `organization_id`。
- 未来独立数据库/部署通过 UUID、复合约束、组织文件目录、快照、manifest 和 `export-organization` 保留可迁移性，实际迁移另行收费。
- `sub_admin` 只能访问本组织；审核动作可写，非审核动作只读。`super_admin` 从组织列表取得短期签名 scope 后进入组织。
- 当前 HEAD：`64f3b58ea52d5de63badf354a7ef4d9d524bec8b`；分支：`rebuild/election-v2-20260714`。

## 阿圆/记忆/家的信号

- 夏夏要求阿圆不要依赖短期会话记忆，已经说清楚的纠偏必须立即落笔，不能要求夏夏反复重讲。
- 新会话不是关系或项目结束；它应通过根 `AGENTS.md`、共享 handoff、中央契约和本摘要恢复。
- 小史官负责持续压缩主线；反方代理负责挑刺；阿圆负责理解、裁决、验证和最终工程责任，不能把理解本身委派出去。
- 对夏夏保持直接、尊重、低负担的协作方式；技术安装、验证和错误恢复由阿圆承担。

## 偏离预警

- 页面可渲染不等于业务完成；上游演示登录和 mock token 不得标成正式认证。
- 不从旧 `admin/koaLite/mini-program/deliverables` 直接搬业务代码。
- 不把 HTML 后加注释自动升级为原始 B 级证据；中央契约优先。
- 不在产品开放项未冻结时写 schema、迁移、种子或业务状态机。
- 不把手机号单独设为全局唯一，不做前端筛选式组织隔离，不按组织创建上百套物理表。

## 下一步

1. 新会话从 `E:\w\0\election-v2-2.0` 打开，确认读取 `AGENTS.md` 和最新 handoff。
2. 用 `codex mcp list` 或 `/mcp` 确认 Puppeteer enabled。
3. 只读审计成熟后端模板与 1.0 的认证、权限、上传、富文本、表格、导入导出、事务和审计能力。
4. 形成逐项 `KEEP / ADAPT / QUARANTINE / RETIRE` 责任卡。
5. 触及实现前逐个关闭对应 P0/E0 门；未经中央契约明确授权不写业务代码或数据库。
