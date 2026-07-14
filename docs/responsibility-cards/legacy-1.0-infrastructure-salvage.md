# 1.0 基础能力打捞责任卡

> 日期：2026-07-14
> 来源：`E:\w\0\election-v1-salvage-head` @ `985f6d205ef581a5d6c4c2668c9e706d19e4cab0`
> 性质：只读审计收口。此卡之后不再广泛浏览 1.0；只有本卡点名的证据才允许定向回看。

## 1. 唯一责任

判断 1.0 的认证、权限、上传、富文本、表格、导入导出、事务与审计中，哪些技术意图可被 2.0 接收。

明确不负责：继承 1.0 页面编排、状态枚举、表结构、材料/归档模型、通知广播、法律数字或 demo 数据。

## 2. 最终分类

### KEEP：仅保留已验证的通用思想

| 能力 | 可保留内容 | 2.0 接收位置 |
|---|---|---|
| HTTP envelope | 成功、错误、分页具有稳定结构的思想 | `packages/contracts` 定义正式响应；HTTP 状态不能沿用“业务错误也 200” |
| SQL | `mysql2/promise`、参数化查询、连接池习惯 | 后端模板确定后重新实现 |
| 事务骨架 | get connection -> begin -> commit/rollback -> finally release | application command；增加锁、版本、幂等和复合唯一约束 |
| 跨模块顺序 | 业务事实、血缘、审计、outbox 同事务 | 只保留顺序，不复制 `material-v2.js` |
| 模板填空 | 纯文本占位替换、预览后保存草稿的意图 | announcement plan/draft 组件与后端版本契约 |

### ADAPT：保留交互意图，使用新基座重做

| 1.0 意图 | 2.0 做法 |
|---|---|
| 登录表单与 401/403 UX | 使用 isdream 登录壳、service interceptors 和 user store；服务端返回 AuthContext |
| 表格、筛选、弹窗 | 使用 `MTable`、`MFormDialog`、Element Plus；核心状态机不塞进通用 CRUD |
| 公告富文本 | 使用基座 TinyMCE，不复制旧 Tiptap 页面；绑定公告 draft/version 与不可变文件引用 |
| 上传控件 | 使用 `MUpload` 的前端体验；后端重建私有 FileObject、用途引用和鉴权下载 |
| 提案多附件 | 保留多附件、分类、预览体验；取消时清理 staging，提交使用不可变 file IDs |
| 材料齐全性看板 | 按稳定 `applicationId` 聚合整份私人申请，由服务端计算并一次收审 |
| 候选来源标签 | 展示多来源血缘；同届同人合并，岗位冲突先人工处理 |
| Blob 下载 | 只保留浏览器下载技巧；下载 URL 必须短时、鉴权、组织/用途/版本受控 |
| 管理员列表/软停用 | 使用 action keys、组织范围、账号额度、审计和 token 撤销重做 |

### QUARANTINE：只有触及明确需求时才能回看

- 旧 Tiptap 工具栏配置：新基座已有 TinyMCE，只有功能缺口明确时才比较。
- timeline JSON 兼容解析与旧公告模板正文：只作历史输入，不能成为八阶段或法定真相。
- 前端 COS STS 方向：本期是服务器本地私有存储，外部对象存储属于收费适配器。
- 岗位材料要求和示例图交互：保留视觉参考，不继承自动水印等未实现承诺。
- `pino`、`multer` 库选择：可由后端模板使用，但 1.0 配置全部废弃。

### RETIRE：禁止迁移

- MD5、默认 JWT 密钥、7 天不可撤销 token、登录时由客户端选择角色/村居。
- 无 token/无组织时空过滤的 fail-open scope；裸 `findById(id)` 和 `UPDATE ... WHERE id=?`。
- 手机号全局唯一、手机号即持有人证明、客户端 userId/phone 自助改归属地。
- 四个中文角色名直接授权、`localStorage.user.role` 权限判断和超管永久全域 token。
- `koa-multer` 公开上传、原文件名落盘、同名覆盖、硬编码 `127.0.0.1` URL。
- `koa-static` 发布整个 KoaLite 根目录和 `public/logs` 请求/响应全文日志。
- `materials.scope=archive`、手填 fileUrl、公共直链下载和提案附件同步 `fs.rename`。
- 旧 `CrudPage.fetchData`、客户端分页假闭环和核心业务通用硬删除。
- 所有旧 Excel 导入导出“成品”声明：源码没有 XLSX 读写，API 多数明确无后端。
- 启动时自动建库、拆 SQL、吞单条错误后继续并声称就绪。
- 提案只改状态不建 election、候选单字段审核、结果直写 candidate、通知插库即“已发送”。

## 3. 关键证据

| 结论 | 1.0 证据 |
|---|---|
| 登录忽略所选村居 | `koaLite/api/auth-v2.js:13,24-27` |
| scope 无 token 时全量，客户端 villageId 可绕过 | `koaLite/config/villageScope.js:27-31`; `koaLite/api/election-v2.js:75-87` |
| 小程序可凭手机号/userId 冒用和改绑 | `koaLite/api/mini.js:44-98,106-116` |
| MD5 与默认 JWT secret | `koaLite/api/auth-v2.js:1,5,35-52`; `koaLite/config/requireRole.js:4-12` |
| 管理员手机号全局查重 | `koaLite/api/user-v2.js:54-66`; `koaLite/db/init_v2.sql:8-25` |
| 上传公开且原名覆盖 | `koaLite/api/upload.js:21-26,51-55`; `koaLite/app.js:77-83` |
| 请求日志记录密码/token/私人正文并写 public | `koaLite/config/logger.js:53-82`; `koaLite/app.js:77-83` |
| 唯一业务事务但无锁/幂等 | `koaLite/api/material-v2.js:158-220` |
| reviewerId 来自客户端 | `koaLite/api/material-v2.js:160,177-198` |
| 提案 DB/文件非原子 | `koaLite/api/election-proposal-v2.js:51-79,146-157` |
| 提案批准没有创建 electionId | `koaLite/api/election-proposal-v2.js:165-179` |
| 候选审核/结果只是裸 UPDATE | `koaLite/api/candidate-v2.js:104-135` |
| CrudPage 默认分页丢 page/pageSize | `admin/src/components/CrudPage.vue:128-145` |
| Excel 接口是无后端 TODO | `admin/src/api/api.ts:105-125,128-135,192-198,245-264` |
| XLSX/vxe 仅声明依赖，无运行时引用 | `admin/package.json:26-28`; `admin/src` 搜索结果为 0 |
| 启动时自动建库/执行 SQL/吞错 | `koaLite/db/db.js:7-73` |

## 4. 新基座优先级

遇到同类前端能力时，优先级固定为：

```text
apps/admin-web 现成组件
  > base/docs 官方用法
  > 1.0 交互意图
  > 1.0 通用组件源码
```

因此不复制 1.0 的 Axios、Pinia、Router、CrudPage、Tiptap 或上传组件；新基座已有 service、store、router guards、`MTable`、`MFormDialog`、TinyMCE 和 `MUpload`。

## 5. 2.0 接收契约

- 所有管理请求的 actor、roles 和组织范围来自服务端会话/签名 scope。
- 组织级 repository 方法必须接收非空 `organizationId`，详情/写入使用 `(organization_id, id)`。
- RBAC 使用稳定 action keys；前端 `v-auth` 仅做 UX，服务端再次授权。
- mutation 带 `expectedVersion/status` 和幂等键；服务端检查 `affectedRows`。
- 审计与业务变更同事务；日志字段白名单并脱敏。
- outbox 只记录待投递，worker/provider 回执后才标成功。
- 文件先进入私有 staging/FileObject；业务只引用 file ID/version，下载再次鉴权。
- Excel 导入由后端解析，输出逐行错误；导出由后端按组织范围生成，不信任前端选中对象全文。

## 6. 最低验收

- A 组织账号无法列表、详情、修改、审核或下载 B 组织记录。
- 无 token、无组织 scope、未知 action key 默认拒绝。
- 停用/改角色/改组织/logout 后旧会话按契约失效。
- 同一命令并发或重试只产生一份业务事实、审计和 outbox。
- DB 失败、文件失败、worker 失败不显示假成功。
- 私人原件、草稿公告、内部档案和日志不可静态直链。
- Excel 错行不污染正确行，整批结果可审计和重试。

## 7. 停手边界

此卡完成后，1.0 审计阶段关闭。后续只有当责任卡指向具体行且新基座/中央契约无法回答时，才允许定向读取旧树；不得继续从旧页面发现并扩张 2.0 产品需求。
