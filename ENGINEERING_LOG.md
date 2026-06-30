# ENGINEERING_LOG

## 2026-06-30 MCP 可用性检查

### 输入

- 用户请求：看看有没有能用的 mcp。

### 动作

- 按 SessionStart 规则先查 `memory_cache`：
  - `project:state` 未命中。
  - `project:decisions` 未命中。
  - `project:architecture` 未命中。
  - `project:issues` 未命中。
- 检查项目根目录：原本未发现 `PROJECT_STATE.md`、`ENGINEERING_LOG.md`、`DECISIONS.md`、`PROJECT_TREE.md`。
- 验证 MCP：
  - `mcp__codesight.codesight_get_summary` 可用。
  - `mcp__codesight.codesight_get_routes` 可用。
  - `mcp__codesight.codesight_get_env` 可用。
  - `mcp__lean_ctx.ctx_graph` 可用。
  - `mcp__lean_ctx.ctx_search` 可用。
  - `mcp__memory_cache.get_cache_stats` / `store_data` 可用。

### 结论

- 当前至少有 3 组可用 MCP：`codesight`、`lean_ctx`、`memory_cache`。
- `codesight` 更适合快速项目摘要、路由、env、schema、blast radius。
- `lean_ctx` 更适合代码图谱、符号搜索、影响分析、跨文件关系。
- `memory_cache` 可作为 24h 会话预热缓存。

### 接力棒

- 下轮无需重新全文扫根目录；先查缓存键 `project:architecture`。
- 如果要进入具体模块，先用 `ctx_graph` / `codesight_get_summary` 定位，再读文件。

## 2026-06-30 建立 election-v2 独立 Git 仓库

### 输入

- 用户请求：夏夏可以建立一个 v2 这个的 git 吗。

### 动作

- 确认 `E:\w\0\election-v2` 内原本没有 `.git`。
- 确认上层 Git 根是 `E:\w\0`，因此选择在 `election-v2` 内建独立仓库，避免混入上层 438 条脏状态。
- 新增 `.gitignore`，排除：
  - `node_modules/`
  - 构建产物与 coverage
  - 运行日志
  - `.env*`
  - `.chat/`、`.claude/`、`.codex/`、`.codesight/`、`.vscode/`
  - 本地数据库与 wal/shm 文件
  - `*.zip`
  - `koaLite/db/db.json`
  - `koaLite/db/init_db.js`
- 初始化 Git：`git init`，并将分支名改为 `main`。
- 提交前做敏感信息复扫：
  - 将 `koaLite/config/env.js` 注释中的真实云库密码移除。
  - 将 `搬家进度-主线地图.md` 中真实云库密码移除。
  - 将 `frontend_wx/api/home.js` 中硬编码长 token 改为读取 `wx.getStorageSync('token')`。
  - 复扫 `R7cRMzuj|eyJhbGciOiJSUzI1NiJ9|sh-cynosdbmysql-grp-9gv4boza.*root` 无命中。

### 接力棒

- 首版 commit 应包含源码、文档、lockfile 和参考资料。
- `koaLite/db/init_db.js` 因含真实连接信息被排除；如后续需要入库，先改成环境变量版本再加入 Git。

## 2026-06-30 安装本机全局 Codex 技能

### 输入

- 用户请求：全局的，本地电脑的，好的工具给自己安上。

### 动作

- 来源：`E:\duihua\夏夏工作流套件包\3-工具层-趁手技能`。
- 目标：
  - `C:\Users\admin\.codex\skills`
  - `C:\Users\admin\.agents\skills`
- 策略：
  - 只安装有顶层 `SKILL.md` 的真实技能目录。
  - 不整包运行 `还原.ps1`，因为它面向 Claude 旧路径。
  - 不覆盖已有全局技能。
  - 对 `*-main` / `*-master` 技能按 Codex 可读名称落盘，例如 `ctx-forge-main` → `ctx-forge`。
- 已安装/补齐的重点技能：
  - `case-mode`
  - `life-mode`
  - `codex-token-optimizer`
  - `ctx-forge`
  - `docvideoer`
  - `headroom`
  - `huashu-design`
  - `motion-design`
  - `repo-explainer`
  - `skill-anything`
  - `sliderule`
  - `using-codegraph`
  - `xiaxia-anchor-marking`
  - `xiaxia-continuity`
  - `xiaxia-draw`
  - `zeta-remembering-anchors`
  - `zhengliu-skill`
  - `zizek`
  - 以及若干 `ljg-*` / memory / prompt 工具。
- 修复：
  - `conversation_vault` 原本缺 Codex frontmatter，已补 `name` / `description`。
  - `zeta-remembering-anchors` 的多行中文 `description: |` 让验证器误判，已改成单行 description。
  - 相关副本存在 UTF-8 BOM，已重写为无 BOM，避免验证器把第一行误判。

### 验证

- 本地检查：所选技能在 `.codex\skills` 与 `.agents\skills` 中均有基础 frontmatter。
- `python C:\Users\admin\.codex\skills\migrate-to-codex\scripts\migrate-to-codex.py --validate-target C:\Users\admin\.codex | Select-String -Pattern 'error:'` 无输出。
- 已写缓存：`global:codex-skills-installed`，TTL 24h。

### 接力棒

- 这些全局技能不属于 `election-v2` 仓库，只在项目文档中记录安装事实。
- 下轮若技能列表未刷新，重开会话即可让全局技能重新发现。
