# 组织数据隔离与独立导出契约

> 修订：2026-07-14.2
> 状态：工程契约候选；未授权创建 schema 或迁移。
> 反方复核：2026-07-14，混合路由、可移植控制面、多态审计、弱认领和导出 fence 已闭环。
> 目标：基础版共享表不串村，并保证未来任一村/社区可完整拔出到独立数据库。

## 1. 最终边界

```text
一个 MySQL 数据库
一套共享业务表
100+ organizations
所有村居数据以 organization_id 明确归属
```

本期不使用每村动态表、不使用每村 Database/Schema。未来独立部署属于导出、迁移和路由切换服务，不改变当前业务模型。

## 2. 数据分类

### 2.1 平台级数据

仅允许以下类型不带村居业务所有权：

- `organizations`：村/社区目录、类型、状态和基础显示信息。
- `platform_accounts`：超级管理员身份。
- `organization_role_quotas`：组织及角色账号额度。
- `schema_migrations`：共享库结构版本与 checksum。
- `organization_export_jobs`：独立导出任务、状态和结果清单。
- `organization_data_routes`：组织当前使用 `shared` 或 `dedicated` 数据空间、路由状态、目标 secret reference、schemaVersion 和切换审计。

平台级表不得保存某届候选、材料、公告正文、手机号收件箱或村居档案。

### 2.2 组织级数据

以下所有表必须有 `organization_id NOT NULL`：

| 聚合 | 建议表族 | 唯一所有者 |
|---|---|---|
| 账号与角色 | `accounts`, `account_roles` | 组织内身份、认领状态与角色分配 |
| 提案 | `proposals`, `proposal_revisions`, `proposal_reviews` | 提案版本、附件引用与审批 |
| 母版 | `elections`, `election_stage_instances`, `stage_reschedules` | 本届事实与八阶段实例 |
| 岗位 | `positions`, `position_requirements` | 岗位、人数、说明和自荐要求 |
| 自荐材料 | `applications`, `application_files`, `application_intake_reviews` | 一人一岗完整申请与材料收审 |
| 候选 | `candidates`, `candidate_sources`, `candidate_reviews` | 候选身份、来源和三轮审核 |
| 结果 | `final_results`, `final_result_items` | D 日票数、确认与中选事实 |
| 公告 | `announcements`, `announcement_versions`, `announcement_file_refs` | 正式公众内容及发布版本 |
| 站内信 | `notifications`, `notification_recipients` | 消息内容、逐人投递和已读 |
| 花名册 | `roster_terms`, `roster_members` | 当前/历史届快照与人工资料 |
| 文件 | `file_objects`, `business_file_refs` | 不可变文件版本与业务用途 |
| 归档 | `archive_roots`, `archive_entries` | 一届一根的目录投影与来源 |
| 审计/任务 | `audit_logs`, `outbox_events`, `scheduled_jobs` | 变更证据、幂等事件和后台任务 |

新增业务表默认属于组织级；若确需平台级，必须先更新中央契约说明为何不能归属某组织。

## 3. 组织级必备字段

每张组织级主表至少具备以下逻辑字段，具体 SQL 类型在 schema 设计阶段统一：

```text
id                 UUID/ULID, globally collision-resistant
organization_id    UUID/ULID, NOT NULL
status             controlled enum/state key
version            optimistic-lock integer
created_at          timestamp
created_by          stable account id, nullable only for system bootstrap
updated_at          timestamp
updated_by          stable account id
deleted_at          nullable; core history uses void/archive, not hard delete
```

事件、版本、审核和文件引用表还应保存：

```text
idempotency_key
source_type
source_id
occurred_at / reviewed_at / published_at
actor_id
actor_name_snapshot where audit readability requires it
```

审计 actor 采用多态快照，不强制所有 actor 外键到组织账号：

```text
actor_type = organization_account | platform_account | system
actor_id
actor_organization_id nullable
actor_name_snapshot
```

组织账号可额外校验同组织；平台超管和系统任务依赖不可变快照，确保拔库后审计仍可读。

手机号保存 `normalized_phone`，显示值可另存或格式化；数据库唯一约束是：

```sql
UNIQUE (organization_id, normalized_phone)
```

后台导入/推荐尚未登录的人时，先在同一组织内查找或创建 `accounts` 记录，并设置 `claim_status=unclaimed`。前端以相同归属地和规范化手机号登录后，只把该记录改为 `claimed`，不得新建第二个账号或改写业务外键。

## 4. 主外键与唯一约束

组织所有权必须进入约束，不只存在于查询代码。

父表为每个组织暴露复合候选键：

```sql
UNIQUE (organization_id, id)
```

子表使用同组织复合外键：

```sql
FOREIGN KEY (organization_id, election_id)
  REFERENCES elections (organization_id, id)
```

同样规则适用于 `position_id`, `application_id`, `candidate_id`, `file_object_id`, `archive_root_id` 等所有组织级关系。

最低业务唯一约束候选：

```text
accounts:       (organization_id, normalized_phone)
positions:      (organization_id, election_id, position_type)
applications:   (organization_id, election_id, account_id)
candidates:     (organization_id, election_id, account_id)
reviews:        (organization_id, candidate_id, review_stage_key)
archive_roots:  (organization_id, election_id)
message_reads:  (organization_id, notification_id, account_id)
```

具体键在业务契约冻结后实施；禁止以缺少产品答案为由省略 `organization_id`。

## 5. 服务器组织作用域

```text
AuthContext
  organizationId from authenticated server identity/signed scope
  actorId
  roles/permissions
```

- 普通账号的组织范围来自服务端账号记录。
- 用户首次认领使用 `selected organization + normalized phone`，组合固化；客户端选择只参与首次创建，不给既有账号改权。
- 超级管理员必须从组织列表显式下钻，获得短期签名 scope/token；每个请求独立携带，不能使用可变的全局“当前村”会话。
- controller/service/repository 不接受“可选 organizationId”。组织级方法签名必须强制 scope。
- 客户端 body/query 中的 `organization_id` 只能用于一致性核对，不能覆盖服务端 scope。
- 详情、修改和下载先用 `(organization_id, id)` 定位。对越权资源返回统一拒绝/不存在，避免枚举。
- 禁止在业务代码中暴露 `findById(id)`、`listAll()` 等无组织仓储方法。

## 6. 文件与归档

本地私有文件键必须由服务端生成：

```text
storage/org/{organizationUuid}/{fileObjectUuid}/v{version}
```

- 不能使用客户端村名、原文件名或路径片段决定目录；原文件名只作为受控元数据保存。
- `file_objects` 保存 organization、checksum、mime、size、storage_key、version 和创建者。
- `business_file_refs` 保存来源聚合、来源 ID、usage、visibility 和不可变 file version。
- `archive_entries` 只做目录投影和来源血缘，不复制文件字节。
- 导出、备份、缩略图、定时任务和清理任务都携带 `organization_id + file_object_id`。
- 任何下载都同时验证组织 scope、业务引用权限和文件版本。

## 7. 历史可迁移性

- 每届冻结组织类型、选举方式、模板 key/version、阶段实例和组织称谓快照。
- 已发布公告保存不可变正文版本和引用的文件版本。
- 花名册保存届次快照，不依赖可变候选简介。
- 归档条目保存来源类型/ID和显示名称快照。
- 组织级数据不得依赖另一个组织的记录。
- 对平台模板的运行时引用必须在创建选举时形成可导出的 election snapshot。

## 8. `export-organization` 包

导出包至少包含：

```text
manifest.json
schema-version.json
rows/*.jsonl or transactional SQL dump
files/**
checksums.sha256
audit/export-report.json
```

`manifest.json` 至少记录：

```text
exportId
organizationId
organizationName snapshot
schemaVersion + migration checksums
exportedAt + exportedBy
readFreezeAt
table row counts
file count + total bytes
missing/orphan/conflict counts
package checksum/signature
```

导出包还必须携带可移植控制面最小子集：

- 目标 `organizations` 行快照、组织状态和称谓。
- 角色定义、permission action keys、角色额度和组织管理员引导信息。
- 模板/规则版本引用及本届不可变快照。
- 目标独立部署所需的 schema migration 清单。
- 不包含明文数据库密码、JWT 密钥或云凭据；仅记录可重新配置的 secret reference 名称。

组织迁出后，`organization_data_routes` 永久记录 `shared -> provisioning -> dedicated` 状态、目标 schemaVersion、切换时间和回滚窗口。共享应用按该表路由，不能靠人工记忆判断数据位置。

导出顺序：

1. 使用 `organization.export` action key 发起，完成双人审批并建立加密导出作业。
2. 为目标组织设置 export fence：拒绝新写入、暂停新任务领取并等待在途任务 drain/确认。
3. 记录数据库一致性快照点，只按快照内不可变 file refs 锁定文件清单。
4. 导出全部目标 `organization_id` 行、可移植控制面子集和对应文件版本。
5. 校验表计数、外键、孤儿引用、checksum、任务 fence 和审计连续性。
6. 导入目标独立库并再次校验。
7. 更新 `organization_data_routes`，执行登录、查询、下载、任务和历史只读验收。
8. 导出包使用短时授权下载并记录领取；到期销毁临时包和临时密钥。
9. 保留共享库原数据只读回滚窗口；不得立即物理删除。

UUID/ULID 使导入时不需要批量重编号。若实际执行需要重写任何 ID，必须生成完整映射表并纳入审计。

## 9. 最低越权与拔库测试

- A 组织账号不能列表、读取、修改或下载 B 组织任何记录。
- 篡改 URL、body、query 中的组织和资源 ID 均失败。
- 超级管理员两个浏览器标签分别进入 A/B，不发生 scope 串台。
- 相同手机号可在不同组织形成不同账号；站内信和候选记录不串。
- 同组织手机号导入与前端绑定精确匹配；错归属地不匹配。
- 所有组织级表扫描 `organization_id IS NULL` 必须为零。
- 复合外键无法创建跨组织父子关系。
- 导出包的行数、文件数和 checksum 与源组织一致。
- 导入独立库后，主链查询、文件下载、历史届和审计可独立运行。

## 10. 商业边界

- 基础版只承诺共享数据库下的组织级逻辑隔离和可导出设计。
- `export-organization` 的契约/校验能力可纳入底座；实际独立部署、云资源、停机窗口、数据/文件迁移、验收和回滚支持另行报价。
- 用户选错归属地后的数据库级迁移属于人工纠错服务，另行收费。
- 要求物理隔离、独立数据库、独立服务器或专属备份策略时，必须走变更单。
