# PROJECT_STATE

- 2026-07-08 选举提案上传与持久化闭环完成：`admin/src/views/election-proposals/index.vue` 的附件材料从“文件URL输入框”改为上传按钮；新增 `koaLite/api/election-proposal-v2.js`，提案写入旧资产 `election_proposals` 表，不再伪装成 `materials.scope=proposal`；`koaLite/api/upload.js` 上传地址改为浏览器可打开的 `127.0.0.1`。提交提案时后端自动创建 `public/uploads/archives/proposals/{proposalId}-{title}` 文件夹并移动附件，列表刷新可从库里读回。验证：Vite 编译提案页 200；上传附件成功；子管理提交提案成功返回 `id=1`；列表可读回；归档文件夹中文件存在。

- 2026-07-08 子管理新建选举现场修复：夏夏用子管理账号在选举管理中新建保存失败，根因是旧字段链断开：新建时未默认带当前子管理 `villageId`，村居下拉只取分页前 10 条导致涧口 `id=28` 不在选项里，保存校验看 `village` 文本而不是 `villageId`，且隐藏的 `electionType` 默认“村委会选举”会让社区“居民代表选举”被后端法定校验拒绝。已修 `admin/src/views/election/index.vue`：子管理锁定当前归属地，村居下拉改用 `village-v2/all`，选举类型按村居类型自动联动，选举方式只显示合法项，保存以 `villageId` 为准。验证：Vite 编译选举页 200；子管理 `15000000000 / 123456 / 经办` 调 `election-v2/add` 创建涧口居委会选举成功，并用超管清理测试记录。

- 2026-07-08 子管理岗位页 roster 小闭环已跑通：新增 `koaLite/scripts/seed-subadmin-roster-demo.js`，幂等填充 `15000000000 / 123456 / 经办` 子管理账号并绑定涧口 `village_id=28`，同时给涧口第十五届 `主任/副主任/委员` 填 3 条 active 在岗花名册样例，并同步 `positions.incumbent*` 摘要字段。已用该子管理账号验证：登录成功、`election-v2/list` 只返回涧口活动、`position-v2/list` 可见一期 3 岗、`roster-v2/list` 可读主任在岗、`roster-v2/add/delete` 可新增后停用，停用后 active 列表消失。Vite 3000 可编译 `positions/index.vue`；为消除既有扫描断点，`admin/src/api/api.ts` 补 `submitMaterial` 兼容导出到 `createMaterial`。

- 2026-07-08 Pearl mini 接力保护：当前不能丢的两层成果已落记录。历史层：timeline、18 公告、仪表盘、archive、母公告、UI 锚点、live DB 盘点、`roster` 后端、`stageKey`、`templateKey`、`position` 扩展字段都已压实，不能重做或覆盖。当前层：`admin/src/views/positions/index.vue` 的岗位页“在岗花名册”弹窗改动已被记录保护；页面 runtime 验证结果见上条子管理小闭环记录。

- 2026-07-08 尾随小 mini 机制落地：`AGENTS.md` 新增 `Tail Mini Guard`。以后每完成一个模块，默认由小 mini 2 字段官牵头、小 mini 4 接力官辅助，从功能闭环、字段闭环、权限闭环、关联闭环、验证闭环、记录闭环 6 个维度跟在主 agent 后面压实。尾随小 mini 不写新功能，只查缺口；发现缺口先补最小缺口，不能补的写入 `message.md` 和接力记录。

- 2026-07-08 P0 后端闭环收口：继 `roster` 后继续补齐 `notice-v2/list stageKey` 查询、`elections.content templateKey + timeline/stages` 兼容合同、`position-v2` 岗位扩展字段输出/写入。`init_v2.sql` 已补 `positions` 扩展字段 fresh schema 和轻迁移段；`election-v2` 现在 JSON content 会补 `templateKey/timeline/stages`，普通富文本仍保持原样；`position-v2` 更新时未传字段会保留旧值，避免岗位编辑表单清空在任/状态字段。新增 `koaLite/scripts/check-election-content-contract.js`，并扩展 `check-position-generate.js` 校验 `postCategory`。验证：`node --check` 三个 API、`check-position-generate`、`check-election-content-contract`、`check-roster-v2`、live schema positions/roster 字段检查、`check-router-api-prefix` 均通过。短信通道、完整模板库、前端页面大改不在本轮闭环内。

- 2026-07-08 Git 扫描噪音处理：`.aionrs/skills/cron`、`officecli`、`skill-creator` 是本机 AionUi junction，目标目录不存在时 `git status` 会反复报 `could not open directory`。已在 `.gitignore` 屏蔽 `.aionrs/`，验证 `git status --short` 不再打印这三个目录 warning。

- 2026-07-08 `roster` 花名册最小闭环第一刀完成：新增 `koaLite/db/init_v2.sql` 中 `roster` 最小表，字段为 `id/village_id/session_no/year_start/year_end/post/name/phone/intro/status/created_by/created_at/updated_at`；新增 `koaLite/api/roster-v2.js`，提供 `list/detail/add/update/delete`，其中 `delete` 只将 `status` 置为 `inactive`，不硬删历史在任名录；新增 `admin/src/api/api.ts` 的 `getRosters/getRoster/createRoster/updateRoster/deleteRoster` 包装；新增 `koaLite/scripts/check-roster-v2.js` 最小自检。验证：`node --check koaLite/api/roster-v2.js`、`node --check koaLite/db/db.js`、`node koaLite/scripts/check-roster-v2.js`、live schema `SHOW COLUMNS FROM roster`、`node koaLite/scripts/check-router-api-prefix.js`、roster 路由路径断言均通过。本轮未跑完整 build。

- 2026-07-08 阶段性离线主文档完成：新增根目录 `阶段性进度与全局认知说明-2026-07-08.md`。定位为无上下文可读的阶段报告和全局认知底图，上半部分可摘给甲方看当前进度、边界、未完成项和下一阶段安排；下半部分给产品/UI/前端/后端/数据库接手，细化到角色视角、页面单元、侧边栏目录、数据库表、缺口、风险、验收和下一步实施顺序。本轮不改业务代码，不跑完整 build。

- 2026-07-08 角色视角数据库盘点完成：新增 `副船长的航海接力日志/数据库角色视角盘点-2026-07-08.md`，按结构官/字段官/UI 官/接力官四个视角，把子管理、超管、运营、审核、普通用户的动作链路走了一遍。结论：旧主表继续保留并补强；优先微调 `elections.content` 合同、`notice-v2/list stageKey`、`position-v2` 输出字段；新增最小 `roster` 表承接花名册；短信通道配置先定 `system_configs` 或 `sms_channels` 边界，不把短信能力过度承诺为已落库。本轮只做文档盘点和计划，未改业务代码。

- 2026-07-08 数据库立足点核对完成：已恢复 `koaLite` 运行依赖并跑 live schema 只读核对，新增 `副船长的航海接力日志/数据库立足点核对-2026-07-08.md`。结论：主链 `villages -> elections -> timeline/positions -> notices/materials/candidates/notifications/election_voters` 都有数据库根；当前没找到家的主要是 `roster` 花名册表、短信通道配置表、定时通知执行器、母版模板库表。半对上的主要是 `elections.content` 当前为 `timeline[]` 且缺 `templateKey`、`notice-v2/list` 暂无 `stageKey` 后端筛选、提案审批借用 `materials.scope=proposal` 口径不够干净。live DB 当前 `villages=124`，仍需另核甲方 122 名单。

- 2026-07-08 母版阶段公告一对多口径：根据截图继续压实母版主体表，`换届选举系统-UI优化.html` 已把“公告编辑”列改成阶段子公告集合入口。一个阶段可以挂多条公告，点击进入该阶段公告列表弹窗，弹窗内再 `+新增` 关联公告；新增公告继承 `electionId + stageKey`，再选择/生成 `notice_no/template_key`。现有 `notice-v2/list` 先按 `electionId` 拉本活动公告再按 `stage_key` 过滤；后续建议补后端 `stageKey` 查询参数。本轮只写主体表锚点，不展开弹窗细节。

- 2026-07-08 母版活动详情页主体表与侧边栏分流：`换届选举系统-UI优化.html` 已新增 `motherDetailBlueprint` 区块，明确 `/election/:id` 主体表只看 `#/阶段名称/开始日期/结束日期/天数/核心工作/关联材料/上传文件/公告编辑`，并把 `elections.content.timeline.templateKey + stages[]`、`materials.scope=archive`、`notices.stage_key`、`materials.scope=candidate`、`candidates.election_id + position_id` 写成可搜索锚点。侧边栏分流已压成同一条链：选举活动管理进母表，阶段公告看 `notices`，阶段归档看 `materials.scope=archive`，材料提交管理看 `scope=candidate`，候选人管理看 `candidates`。本轮未做弹层、未做后端 API、未跑完整 build。

- 2026-07-08 母版详情页时间轴表口径纠偏：参考 `选举系统_填空模板 (1).html` 时只看主体表，不看弹层和顶部非主体部分；母版详情页表头固定为 `#/阶段名称/开始日期/结束日期/天数/核心工作/关联材料/上传文件/公告编辑`，但阶段行必须由当前选举模板决定。村委会默认村民直选模板；社区按 `elections.election_method` 分居民直接选举、户代表选举、居民代表选举三类模板。已修正 `换届选举系统-UI优化.html` 中把所有类型硬套 11 阶段的锚点文字。

- 2026-07-08 UI 稿子补全局施工导览：`换届选举系统-UI优化.html` 主页面顶部新增“系统施工导览：业务漏斗 × 侧边栏目录 × 数据库字段”，把 `villages -> elections -> timeline/positions -> materials/candidates/notices/archive` 的先后关系、侧边栏目录吃哪层数据、字段谁决定谁直接写进稿子。新增锚点：`system-global-funnel-001`、`system-truth-order-001`、`system-sidebar-route-map-001`、`system-field-decision-chain-001`。最小验证：新增锚点可搜索，HTML 内脚本语法解析通过，`git diff --check` 无输出。

- 2026-07-08 全局结构计划决策：花名册确定进入一期，新增最小 roster 表；只承接本村/社区在职干部花名册和岗位详情“在岗”联动，不做复杂干部履历系统。下一刀从结构上先做 `/election/:id` 母版详情页最小单元 + roster 表/API 最小闭环，再回到 UI demo 标字段锚点。

- 2026-07-08 UI 原型子管理仪表盘继续压实：`换届选举系统-UI优化.html` 已追加本轮锚点批注（文件被 `.gitignore` 忽略，不进 git diff）：岗位详情必须带当前 `elections.id/session_no`；岗位状态弹窗按状态回到花名册、材料提交、候选人、公告、审核、结果回填；岗位主按钮改为进入 `openJobDetail`，岗位说明/表格下载保留独立入口；本村/本社区活动列表补“母版详情最小单元”，进入 `/election/:id` 后以可编辑时间轴表承接阶段、日期、材料上传和公告编辑。`message.md` 已追加四个固定小 mini 的本轮预检留言。最小验证：HTML 内脚本语法解析通过，新增锚点可搜索，`git diff --check` 对相关记录文件无空白错误；未跑完整 build。

- 2026-07-08 固定小 mini 机制落地：`AGENTS.md` 已新增 4 个固定小 mini（结构官/字段官/UI 官/接力官）及 Windows/PowerShell/留言规则；根目录新增 `message.md` 作为所有小 mini、小 agent、主 agent 的公用留言栏，记录悄悄话、担心、建议和矛盾发现；`PROJECT_TREE.md` 与 `副船长的航海接力日志/文件索引.md` 已同步入口。

- 2026-07-08 `node_repl` 反复启动失败根因确认：`C:\Users\admin\.codex\config.toml` 已无旧段，但 `C:\Users\admin\.codex\confwg.toml` 仍保留 `[mcp_servers.node_repl]`，且指向不存在的 `3c238e29bbc930ff\node_repl.exe`；已备份 `confwg.toml.bak-node-repl-20260708-052339` 并删除该旧 MCP 段，复查 `config.toml/confwg.toml` 均无 `node_repl` 与旧路径。需重开 Codex 会话验证启动噪音是否消失。

- 2026-07-07 UI 原型入口纠偏：`C:\Users\admin\Downloads\换届选举系统-UI优化.html` 已把“登录后选择归属地”改为“登录页绑定角色与归属地”；非超级管理必须选择行政村/社区后进入本村视角，超级管理进入全区汇总视角。主页面原 1-5 步骤条已改为“本村日历”看板：日期由下方母活动/子节点边走边填，日历只做引用与跳转。只改外部原型文件，未改项目源码；已跑 HTML 内脚本语法解析检查通过。

- 2026-07-06 Vite 与路由守卫修复：`admin/package.json` 已设 `type=module`，`admin/vite.config.ts` 改为 `import.meta.url` 解析目录，消除 Vite CJS Node API 弃用链路；`admin/src/router/index.ts` 已修正未授权回退策略，改为按角色跳首个可访问路由，避免 `/`→`/dashboard` 无限重定向。

- 2026-07-06 开发环境降噪：全局 `C:\Users\admin\.codex\config.toml` 中失效的 `[mcp_servers.node_repl]` 已删除，停止会话启动时报 `MCP client for node_repl failed to start`；已自动备份为 `config.toml.bak-node-repl-20260706-034901`。本轮不改项目代码，只清理工具噪音。
- 2026-07-05 基础权限补齐：超级管理/经办/运营/审核四角色已做最小对齐；经办补 `election-methods/archives/logs` 菜单，运营补 `archives` 菜单，审核移除公告菜单；后端 `position/material/notice/notification` 写操作已补基础 RBAC；候选人页对审核员隐藏新增工具栏。未完成断点：归档/日志/选举提案/管理员/角色/设置仍有无后端接口，审批页未接 `election-v2/approve`。
- 2026-07-05 超级管理侧栏补齐：`admin/src/layouts/Sidebar.vue` 已把超级管理可访问路由补进侧栏菜单，覆盖 `election-methods/archives/admins/roles/settings/logs` 等 key，并把文案贴近当前业务稿；本轮只做静态覆盖检查，未跑 build。
- 2026-07-05 上下文保护卡增量刷新：`副船长的航海接力日志/上下文保护接力卡-2026-07-05.md` 已从旧“写 timeline”断点更新为当前真实断点：timeline/公告/仪表盘已做，下一刀只做 archive 材料按 `stage_key/material_no` 挂阶段。
- 2026-07-05 仪表盘母表接线：`admin/src/views/dashboard/index.vue` 已从硬编码 8 段改为优先读取 `getElection(id).content.timeline` 的 11 阶段；无 timeline 时保留旧 8 段兜底。本轮未跑完整 build，下一刀转向 archive 材料按 `stage_key/material_no` 上传归档。
- 2026-07-05 母表时间线落库：新增 `koaLite/scripts/seed-election-timeline.js`，已给 `election_id=1` 写入 `elections.content.timeline` 11 阶段 JSON，并把 18 条公告补齐 `notice_no/stage_key/template_key`；验证 `stages=11`、`notices=18`、`staged=18`、`numbered=18`、`templated=18`，未跑完整 build。
- 2026-07-05 能力蒸馏：使用 `zhengliu-skill` 将本轮“真相保护/上下文保护/作业监督/禁止浪费”蒸馏成 workflow skill，源路径 `E:\duihua\skills\xiaxia-truth-guard`；只建 `meta.json` + `SKILL.md`，不复制到项目 `.codex/skills`，避免两套真相。
- 2026-07-05 记忆技能试跑：`xiaxia-context-compression` 已用于增量更新 `副船长的航海接力日志/上下文保护接力卡-2026-07-05.md`；`learn-from-sessions` 已只读扫描本项目旧 Claude 会话，未写外部 memory，规则仍以项目本地 `AGENTS.md` 为准。
- 2026-07-05 作业监督规则：尝试拉“宝妈小sub”失败（subagent slot 满）；已把监督清单写入 `AGENTS.md`，以后若 sub 满，团队长本地执行 Stop Hook 作业检查。
- 2026-07-05 旧线索纠偏：`副船长的航海接力日志/文件索引.md` 中“岗位生成前端未接”的旧状态已改为“后端主干与前端入口已接”，下一刀转向 `elections.content.timeline`。
- 2026-07-05 树根参数下潜：6 个小 sub 分别 cos 归属地/母档案、11阶段母表、公告、材料、岗位候选人、用户选民登记；结果已合并进 `工程责任表-一期P0.md`，按“来源/去向/用途/关联/不负责”压实字段边界。
- 2026-07-05 接力图瘦身：重写 `副船长的航海接力日志/当前接力图.md`，只保留树根主线、11阶段母表、下一刀和硬边界，避免多段碎图污染判断。
- 2026-07-05 live schema 复核：`villages/elections/positions/candidates/materials/notices/election_voters` 当前列已打印确认；下一刀不是加表，而是落 `elections.content.timeline` 的 11 阶段 JSON。

2026-07-05 树根层接住：`副船长的航海接力日志/当前接力图.md` 已补“树根层”，`上下文保护接力卡-2026-07-05.md` 已从旧岗位断点更新为当前真实断点；下一棒不再从旧上下文重走，直接按 11 阶段 timeline 下钻。

2026-07-05 结构树地图更新：`副船长的航海接力日志/当前接力图.md` 已改成系统结构树、母表 11 阶段下钻图、sub 下路认领图；下一刀按图补 `elections.content.timeline` 结构化数据。

2026-07-05 表诊断与最小扩展：基于附件字段和 live schema，复用旧表为主；仅新增 `election_voters` 表承接“用户/线下名册人员 × 某届选举”关系；`elections/candidates/notices/materials` 只补承接字段。已跑最小 smoke：选举增改查、公告增改查、候选人导入查、候选人材料审核生成候选人、阶段归档材料审核不生成候选人，均通过；未跑完整 build。

2026-07-05 公告种子填实：已把 `election_id=1` 的 18 条公告从挖空内容更新为涧口社区第十五届完整演示数据；数据库验证 `____=0`、`{{字段}}=0`、`镇镇（街道）=0`；本轮未启动后端，HTTP 1116 未开。

2026-07-05 村级运营仪表盘第一刀：`admin/src/views/dashboard/index.vue` 已从泛统计首页改成村/社区运营人员工作台，接现有选举、公告、材料、岗位接口，展示系统消息、活动日历、最新公告、档案入口和当前岗位一览；`npx vite build` 通过。

2026-07-05 岗位生成真实接口验收：本机后端 1116、前端 3000 已启动；对活动 `id=1` 调用 `/api/position-v2/generate` 成功生成居委会主任/副主任/委员 3 条，前端代理 `/api/position-v2/list?electionId=1` 已返回 3 条岗位。

2026-07-05 岗位自动生成前端接线：`admin/src/api/api.ts` 已补 `generatePositions`；`admin/src/views/positions/index.vue` 已补“一键生成岗位”入口，生成时选择村居类型、班子人数、副主任数，提交给后端 `/position-v2/generate` 后刷新列表。后端自检通过，`vite build` 通过；`npm run build` 仍卡在既有 `vue-tsc` 与 Node 24 兼容问题。

- 2026-07-05 上下文保护：新增 `副船长的航海接力日志/上下文保护接力卡-2026-07-05.md`，用 L3 方式保留当前主线、已压实决策、断点和下一刀，防止窗口压缩丢线。

- 2026-07-05 小 sub 检查落盘：`副船长的航海接力日志/岗位自动生成检查-2026-07-05.md` 确认岗位自动生成“后端主干已做、前端未接、扩展字段未全落”；`根目录MD整理清单-2026-07-05.md` 已补根目录一级 md 分类和存疑项。

2026-07-05 根目录可见规则已补齐：新增 `AGENTS.md`，把 Windows 环境、SessionStart 顺序、永久保留层、工程铁律和一期业务边界放到最容易被新 agent 看到的位置。

2026-07-05 职位主线收窄开始落地：`koaLite/api/position-v2.js` 已修复岗位生成函数，默认只返回主任/副主任/委员；`check-position-generate.js` 已覆盖副主任、小村不设副主任、村/社区班子人数边界。

2026-07-04 副船长航海接力目录已整理：`副船长的航海接力日志/` 现在有图入口、文件索引、资料快照。小 sub 接力先看 `当前接力图.md`，再看 `文件索引.md`，最后按需下钻快照和根目录原件。

2026-07-04 四份接力资料巡检：`一期清单压实-接力总表.md` 已把“数据隔离”纠偏为“分级默认过滤”；`船务动态地图.md` 已移除明文数据库口令；`交接单-18公告模板文件.md` 和 `业务梳理-第666届换届起点.md` 保留为公告施工铁律与产品起点说明。

2026-07-04 双 sub 历史上下文打捞完成：业务线确认“母档案 + 母/子公告 + 主任/副主任/委员 + 材料审核 + 候选人确认/结果回填 + 通知”为一期主线；工程线确认后端 v2 主干、`/api` 别名、后台可进、村居可见，但职位页仍有旧岗位噪音。已写回 `上下文压缩摘要-2026-07-04.md` 和 `一期骨架找回-2026-07-04.md`。

2026-07-04 工具垃圾扫一扫：`.ctx` 旧工具已 renew，`ctx.cmd selftest` 现为 3/3 通过；仅分类未跟踪垃圾，未删除文件。当前唯一明确可删项是空目录 `.agents/`，其余先保留待确认。

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

## 2026-07-04 后端身份入口最小线头

- 已新增 `koaLite/api/mini.js`：
  - `POST /mini/login`：手机号认领/创建村民用户，可记录 `wxOpenid/openid`。
  - `POST /mini/bind-location`：首次绑定归属地，返回用户与村居。
  - `GET /mini/me`：按 `userId` 或手机号查询当前身份。
- 已给 `users` 表补 `wx_openid` 字段和索引；旧库通过 `ALTER TABLE` 轻迁移。
- 前端形态先不绑定：小程序/H5 都接同一组 `/mini/*` 后端口。
- 验证已跑：`check-mini-identity`、`node --check`、数据库字段存在检查。

## 2026-07-04 `/api` 路由明线

- 已更新 `koaLite/config/router.js`：自动路由同时注册原路径和 `/api` 前缀路径。
- 例：`/mini/login` 与 `/api/mini/login` 同时可挂载。
- 原因：后台 Vite 会 rewrite `/api`，但小程序直连时没有 rewrite；后端保留 `/api` 别名更稳。
- 验证已跑：`node koaLite/scripts/check-router-api-prefix.js`、`node --check koaLite/config/router.js`。

## 2026-07-04 公告模板生成收口

- 已收口 Claude 船长留下的公告模板半成品：
  - `koaLite/config/noticeTemplates.js`：18 条公告模板配置。
  - `GET /notice-v2/templates`：模板列表/详情。
  - `POST /notice-v2/generate`：按填空字段预览，或保存为公告草稿。
  - `admin/src/views/notices/NoticeTemplateDrawer.vue`：公告模板填空抽屉。
- 后台“进不去”的直接风险已排除：`notice-v2.js` 语法检查通过，`admin` 的 Vite build 通过。
- `vue-tsc` 在 Node 24 下仍有工具兼容报错，不作为页面代码失败判断。

## 2026-07-04 后台截图巡检状态

- 后台已能登录进入，首页、村居管理、选举新建弹窗、职位管理、候选人管理、审批管理均能打开。
- 路由注册输出确认 `/api/*` 双路径已生效，共 100 条自动路由。
- 当前主要问题不是“打不开”，而是业务口径收窄：
  - 村居显示 124 条，需核对甲方 122 名单。
  - 职位页仍有历史/扩展岗位，一期应收窄到主任、副主任、委员。
  - 候选人/审批当前选举为空，需按库内 `election_id` 查实际挂载关系。

## 2026-07-04 一期骨架找回

- 已新增 `一期骨架找回-2026-07-04.md`。
- 这份文件从 `DECISIONS.md`、`一期最小演示闭环.md`、`一期清单压实-接力总表.md`、`HEADROOM_接力锚点.md` 和 `.chat` 切片里重新整理出一期真骨架。
- 后续判断以这份骨架为准：旧后台能跑不等于结构完成，下一步先收窄职位主线和母档案结构。
