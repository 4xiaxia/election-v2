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
