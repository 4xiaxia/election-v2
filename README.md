# 🚀 [项目名称] - 全栈通用权限管理框架

一个开箱即用的全栈通用框架（包含完整的权限管理系统）。采用前后端分离架构，同时支持 Web 管理后台与微信小程序端，基于 Koa、Vue 3 构建，非常适合二次开发和快速外包接单。

## 🌟 核心特性

- **完整的三端支持**：包含 Node.js 服务端、Vue 3 后台管理端、微信小程序端。
- **开箱即用的权限系统**：内置完整的 RBAC（基于角色的权限控制）解决方案。
- **现代化的技术栈**：使用最新的前后端框架和生态工具，保证开发效率和代码质量。
- **轻量且高效**：`koaLite` 提供极简高效的 API 接口，`vue-cli-lazy` 提供极致的前端构建体验。

## 📦 项目结构

```text
.
├── koaLite/            # Node.js 后端服务 (Koa + Mongoose/MySQL + Swagger)
├── vue-cli-lazy/       # 后台管理端 (Vue 3 + Vite + Element Plus + Pinia)
├── frontend_wx/        # 微信小程序端 (原生开发 + Vant Weapp)
└── gogo.sh             # 自动化部署/Git提交流程脚本
```

## 🛠 技术栈

### 服务端 (koaLite)
- **核心框架**：Koa
- **数据库**：Mongoose (MongoDB) / MySQL2
- **接口文档**：Swagger (swagger-jsdoc & koa2-swagger-ui)
- **常用工具**：dotenv, helmet (安全), pino (日志), koa-router 等

### 管理后台 (vue-cli-lazy)
- **核心框架**：Vue 3
- **构建工具**：Vite
- **状态管理**：Pinia (+ pinia-plugin-persistedstate)
- **UI 组件库**：Element Plus
- **网络请求**：Axios

### 微信小程序端 (frontend_wx)
- **核心**：原生微信小程序开发
- **UI 组件库**：Vant Weapp
- **云存储**：腾讯云 COS SDK (cos-wx-sdk-v5)

## 🚀 快速开始

### 1. 启动后端服务 (koaLite)
```bash
cd koaLite
npm install

# 启动开发环境
npm run start

# 生产环境部署 (依赖 PM2)
npm run start:prd
```

### 2. 启动管理后台 (vue-cli-lazy)
```bash
cd vue-cli-lazy
npm install

# 启动开发服务器
npm run dev

# 构建生产代码
npm run build
```

### 3. 运行微信小程序 (frontend_wx)
1. 使用 **微信开发者工具** 导入 `frontend_wx` 目录。
2. 在开发者工具菜单中点击 **工具 -> 构建 npm**。
3. 编译并预览。

## 📜 自动化工作流脚本 (gogo.sh)

项目根目录包含一个便捷的自动化脚本 `gogo.sh`，可用于一键 pull、add、commit、push 以及触发 build。

```bash
# 一键提交代码 (默认 message 为 'update')
sh gogo.sh "你的提交信息"

# 提交代码并执行 build
sh gogo.sh "你的提交信息" build
```

## 📄 License
[MIT License](LICENSE)
