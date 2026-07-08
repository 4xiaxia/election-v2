# DECISIONS

更新时间：2026-06-30

## 当前决策

- 2026-07-08 选举提案存档口径：提案不是候选人材料，也不是阶段归档材料，不再伪装成 `materials.scope=proposal`。提案创建走 `election_proposals` 表；附件只能通过上传进入系统，不允许手填 URL。提交提案时后端自动创建 `public/uploads/archives/proposals/{proposalId}-{title}` 文件夹，并把附件移动进去，列表刷新从库里读回，保证弹窗关闭或页面刷新不丢。
- 2026-07-08 子管理账号口径：当前代码里的“子管理视角”落到 `users.role='经办'`，不新增 `子管理` 角色名，避免登录页、侧边栏、后端 `ADMIN_ROLES` 三处不一致。演示子管理账号固定为 `15000000000 / 123456 / 经办`，绑定 `village_id=28` 涧口，用于验证子管理只看本归属地的小闭环。
- 2026-07-08 P0 后端闭环范围：本轮后端闭环只包含 `roster` 花名册、`notice-v2/list stageKey` 查询、`elections.content templateKey + timeline/stages` 兼容合同、`position-v2` 岗位扩展字段承接。短信通道配置、完整模板库表、前端页面大改不计入本轮闭环，避免过度承诺。
- 2026-07-08 `roster` 花名册落库策略：一期新增最小 `roster` 表和 `roster-v2` API，只承接本村/社区在职干部花名册、岗位详情“在岗”和历史在任名录；不扩复杂干部履历。字段为 `village_id/session_no/year_start/year_end/post/name/phone/intro/status` 等最小集。`delete` 接口不硬删，统一将 `status` 置为 `inactive`，保留历史可追溯性。
- 2026-07-08 角色视角承接策略：子管理、超管、运营、审核、普通用户不各建一套业务结构；角色只决定入口、筛选和可操作动作，业务事实统一回到 `villages -> elections -> timeline/positions -> notices/materials/candidates/notifications`。下一步按最小缺口承接，不重建主表：新增 `roster` 最小表；给 `notice-v2/list` 补 `stageKey` 查询；统一 `elections.content` 的 `templateKey + timeline[]` 兼容合同；短信通道配置未落库前只能标为待定能力。
- 2026-07-08 母版阶段公告口径：母版主体表的“公告编辑”列不是单公告字段，而是该阶段子公告集合入口。一个阶段可以挂多条公告；点击进入弹窗列表后可 `+新增`。新增公告必须继承当前 `electionId + stageKey`，再选择或生成 `notice_no/template_key`。现有 `notice-v2/list` 可先按 `electionId` 拉取再前端按 `stage_key` 过滤，后续建议补后端 `stageKey` 查询参数。
- 2026-07-08 母版详情页时间轴表口径：表头固定为 `#/阶段名称/开始日期/结束日期/天数/核心工作/关联材料/上传文件/公告编辑`，但阶段行由当前选举模板决定，不能所有类型硬套 11 阶段。村委会默认“村民委员会 · 全民直选”模板；社区按 `elections.election_method` 分为居民直接选举、户代表选举、居民代表选举三类模板。`elections.content.timeline` 保存当前母活动实际采用的 `templateKey + stages[]`，日历、公告、归档材料都跟这份 stages 对齐。
- 2026-07-08 花名册进入一期：需要新增最小 roster 表承接“本村/社区在职干部花名册”。范围只做在岗展示和岗位详情联动，不扩复杂干部履历系统。最小字段建议：`id/village_id/session_no/year_start/year_end/post/name/phone/intro/status/created_by/created_at/updated_at`；联动规则：岗位状态为“在岗”时，岗位详情按 `village_id + session_no + post=positions.name + status=active` 读取当前在任干部。
- 2026-07-08 UI 原型施工口径：先压实子管理视角。子管理登录后只看当前村/社区；超级管理只是外围归属地列表与下钻壳，下钻后复用子管理内容，不把“总管理/全区管理”混入子管理首屏。岗位详情、岗位说明、表格下载、材料提交、候选人、公告、结果回填都必须带同一个 `elections.id + positions.id` 上下文；母版活动详情 `/election/:id` 采用可编辑时间轴表作为最小单元，字段为阶段名称、开始/结束日期、天数、核心工作、关联材料、上传文件、公告编辑，真相源是 `elections.content.timeline`。
- 2026-07-05 基础权限口径：本期不做复杂权限树，只做四角色最小分工。超级管理看全部；经办办理村居/母档案/岗位/材料/公告/通知/归档/日志；运营处理公告、通知、候选人结果与归档；审核只处理材料、候选人审核与审批，不给公告发布和系统配置入口。
- 2026-07-05 表结构策略：附件字段先对照 live schema，能复用旧表就绝不新建；代表/小组长/监会等二期内容只进归档 JSON/附件，不建 P0 结构表。唯一新增 `election_voters`，因为 `users` 只表达账号，不能表达“某用户/线下名册人员参加某一届选民登记”的一对多关系。
- 2026-07-05 母档案/子公告/材料归档复用策略：`elections` 是母档案，`notices` 是子公告，`materials` 同表承接候选人材料和阶段归档材料，通过 `scope/stage_key/material_no/file_url` 区分；不新建母公告表、子公告表、阶段材料表三件套。
- `E:\w\0\election-v2` 使用独立 Git 仓库管理，不混入上层 `E:\w\0` 仓库的历史与脏状态。
- 首版 Git 不收录本地缓存、依赖目录、运行日志、数据库运行文件、zip、真实连接信息脚本。
- 本机全局 Codex 技能安装采用“真实 `SKILL.md` 技能逐个安装、不覆盖已有项、不运行 Claude 还原脚本”的策略。

## 已确认边界

- MCP 可用性检查只确认工具是否能返回有效结果，不改变业务代码。
- 本轮新增的记录文件只用于工程接力与状态沉淀。
- 涉及真实凭据的文件必须先脱敏或改为环境变量注入后再纳入 Git。

## 2026-07-02 一期业务决策

- 系统不是多商户 SaaS，也**不做数据隔离**。做的是**分级**：城厢区统一系统下，122 个村+社区各是一个小管理单元。
- 口径钉死：**不做隔离就是不做**。不写"村账号看不到别村"的隔离逻辑，只按角色分级——超管看全部，经办登录后列表默认带上自己的归属地过滤，如此而已。不做复杂权限树。
- 区级/超级管理员看全部 122 个归属地；村/社区经办账号默认聚焦自己的归属地和换届母档案。
- 普通微信用户首次参与前必须绑定微信身份、手机号和归属地；游客可浏览公开内容。
- 小程序/H5 共用后端身份入口：`POST /mini/login`、`POST /mini/bind-location`、`GET /mini/me`。这里负责身份线头和归属地绑定，不扩展成多商户隔离。
- 后端自动路由保留双路径：`/xxx/yyy` 与 `/api/xxx/yyy` 都可用。`/api` 是前端直连兼容前缀，不是第二套接口。
- `villages` 是归属地筛选根；`elections` 是一场换届的大母档案。
- `positions`、`candidates`、`materials`、`notices`、`notifications` 都应围绕 `election_id` 归属到具体换届活动。
- 一期竞选岗位只做主任、副主任、委员。
- 岗位自动生成入口只负责收集 `orgType / committeeSize / deputyCount` 并调用后端 `/position-v2/generate`；本刀不扩 `elections/positions` 表字段，不在前端计算岗位名额，不删除旧岗位。
- `position-v2/list` 默认只返回主任、副主任、委员；旧历史岗位数据不删除，必要时用 `includeAll=1` 查询全量，避免为一期演示破坏历史/二期线索。
- 甲方要求的“岗位树”用“当前岗位一览 + 岗位二级面板”覆盖，不做复杂全岗位树。
- 母公告是某场选举活动的动态消息大看板；子公告按时间线挂在母公告下面。
- `我是选民` 是选民登记/参与确认入口，可在母公告详情中出现。
- `参与竞选` 必须挂到具体岗位旁边，不能作为母公告上的泛按钮。
- 候选人来源必须区分：前台自荐、联名推荐、党组织推荐、后台导入。
- 后台导入、材料审核、私信通知、已读记录是已有成果，后续只能补强，不能删除或重做替换。
- 一期不做线上投票计票；如界面出现“参与投票”文案，工程语义仍是选民登记/参与确认。
- `E:\duihua\夏夏工作流套件包` 继续作为源快照/保险副本；Codex 全局可用版本落在 `C:\Users\admin\.codex\skills` 与 `C:\Users\admin\.agents\skills`。
