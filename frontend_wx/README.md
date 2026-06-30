# 微信小程序纯净基础脚手架 (Frontend WX Framework)

这是一个基于已有成熟项目提炼的微信小程序纯净脚手架。移除了具体业务逻辑，保留了完整的请求封装、基础组件、通用样式和权限校验等核心模块。你可以基于此脚手架快速开始新的微信小程序开发。

## 📁 目录结构

```text
├── api/                  # 接口请求中心
│   ├── index.js          # 请求核心封装 (request, login, upload 等)
│   ├── common.js         # 通用数据接口 (如获取配置、通用下拉列表等)
│   └── upload.js         # 腾讯云 COS 上传等相关接口
├── assests/              # 静态资源目录
│   └── images/           # 公共图片、Icon 图标等
├── components/           # 公共自定义组件
│   └── navbar/           # 自定义顶部导航栏组件
├── pages/                # 小程序页面目录
│   └── index/            # 初始化默认的基础首页
├── utils/                # 通用工具类
│   ├── index.js          # 通用方法 (日期处理、字符串处理等)
│   └── permissions.js    # 统一权限校验逻辑
├── miniprogram_npm/      # 构建好的 npm 依赖包 (如 tdesign-miniprogram 等)
├── app.js                # 小程序逻辑入口 (包含启动、登录状态管理全局变量等)
├── app.json              # 小程序全局配置 (页面路由、Window 表现等)
├── app.wxss              # 小程序全局样式库
└── project.config.json   # 微信开发者工具项目配置
```

## 🚀 核心功能模块

### 1. 网络请求封装 (`api/index.js`)
- 支持多环境（测试环境、正式环境）域名自动切换。
- 内置请求拦截和响应拦截，统一处理 `Token` 携带。
- 统一的错误提示处理（`401`、`403`、`500` 等状态码拦截及重定向逻辑）。
- 提供了 `request`、`uploadFile`、微信支付 `wechatpay`、统一登录 `login` 等方法。

### 2. 权限管理机制 (`utils/permissions.js`)
- 提供一个通用的 `hasPermission(permission, context)` 权限校验方法。
- 默认支持 **超级管理员（Admin）** 权限直接放行机制。
- 支持基于用户维度的权限数组比对，你可以根据实际的后端业务需求，轻松在代码里进行扩展（如添加商家、员工、角色的动态权限支持）。

### 3. 全局状态与登录 (`app.js`)
- `app.js` 提供了全局生命周期内的静默登录逻辑 (`login`、`getOpenid` 等)。
- 挂载了 `globalData` 用于存储 `userInfo` 及全局页面状态信息。

## 🛠 开发指南

### 1. 运行项目
- 打开 **微信开发者工具**。
- 选择 **导入项目**。
- 目录选择当前所在的 `frontend_wx` 文件夹，填入你自己的 `AppID` 进行开发。

### 2. 添加新页面
- 在 `pages/` 目录下新建对应业务的文件夹及文件（`.wxml`, `.wxss`, `.js`, `.json`）。
- 并在 `app.json` 的 `pages` 数组中注册路由。

### 3. 环境变量与域名切换
- 打开 `api/index.js`，你可以通过修改 `urls` 对象来配置不同 `AppID` 对应的后端请求 BaseURL。

## 📦 依赖管理
本项目支持使用 npm 构建。如果后续需增加新的 npm 包：
1. 在项目根目录执行 `npm install <package-name>`。
2. 在微信开发者工具的菜单栏点击 `工具 -> 构建 npm`。

## 📝 规范建议
- 页面特定的 API 请求建议在 `api/` 目录下新建对应的文件进行管理，避免所有请求都堆积在 `common.js` 中。
- 新增业务组件统一放在 `components/` 目录下，保证复用性。
