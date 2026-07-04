# PROJECT_TREE

更新时间：2026-06-30

## 根目录顶层

- `.chat/`
- `.claude/`
- `.codesight/`
- `.codex/`
- `.vscode/`
- `admin/`
- `frontend_wx/`
- `koaLite/`
  - `api/mini.js`：微信小程序/H5 共用身份入口（手机号登录、归属地绑定、我的身份）。
  - `api/notice-v2.js`：公告 CRUD + 公告模板预览/保存草稿。
  - `config/router.js`：自动路由；同一接口同时挂 `/xxx/yyy` 和 `/api/xxx/yyy`。
  - `config/noticeTemplates.js`：18 条公告填空模板配置。
  - `scripts/check-mini-identity.js`：mini 身份入口最小自检。
  - `scripts/check-notice-template.js`：公告模板渲染最小自检。
  - `scripts/check-router-api-prefix.js`：`/api` 路由别名最小自检。
- `mini-program/`
- `scripts/`
- `vue-cli-lazy/`
- `README.md`
- `01城厢区华亭镇村委会换届选举流程参考表（霞皋村2021.11.20）.xlsx`
- `20城厢区华亭镇居委会换届选举流程参考表（涧口社区2021.11.20）.xlsx`
- `2021年选举公告 村民 18种（批注版）.pdf`
- `阿圆与夏夏-历史足迹总览.md`
- `搬家进度-主线地图.md`
- `船务动态地图.md`
- `后端探索地图.md`
- `前端探索地图.md`
- `全局快照-前后端契约对照总图.md`
- `权限设计-灵感航海图.md`
- `新建文件夹.zip`

## MCP 观察

- `.codesight/` 存在，且 `codesight` MCP 能读出项目摘要。
- `lean_ctx` 已有外部图谱缓存：12821 files / 90682 symbols / 28667 edges。
- Codex 主配置：`C:\Users\admin\.codex\config.toml`。
- Codex hooks：`C:\Users\admin\.codex\hooks.json`。
- lean-ctx 实际配置：`C:\Users\admin\.config\lean-ctx\config.toml`。
- 注意：`C:\Users\admin\.lean-ctx\config.toml` 不存在，lean-ctx 报错提示里的路径不是本机实际配置文件位置。
- 2026-07-02 已修复：Codex SessionStart hook 启用；`hooks.json` 中裸 `bash` 改为 Git Bash 绝对路径；lean-ctx `allow_paths` 和 `shell_allowlist` 已适配本机 Windows 环境。

## Git 观察

- 本轮已在当前目录初始化独立 `.git/`。
- 当前分支：`main`。
- `.gitignore` 已排除依赖、运行日志、本地缓存、数据库运行文件、zip 与含真实连接信息的本地初始化脚本。

## 本机保险箱

- `scripts/Backup-CodexSafety.ps1`：Codex/lean-ctx/hooks/skills 安全备份脚本。
- `backup-codex-env.cmd`：一键运行入口。
- 默认输出到 `C:\Users\admin\CodexSafetyBackups`，不放进项目仓库。

## 本机全局技能观察

- 全局 Codex 技能目录：
  - `C:\Users\admin\.codex\skills`
  - `C:\Users\admin\.agents\skills`
- 已从 `E:\duihua\夏夏工作流套件包\3-工具层-趁手技能` 补齐一批全局可用工具。
- 不纳入项目树管理，只在本文件记录路径与状态。
