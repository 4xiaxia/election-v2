// config/env.js - 统一环境配置（替代 .env + dotenv）
// 优先读取真实环境变量，回退到默认值
const os = require('os');
const NODE_ENV = process.env.NODE_ENV || 'development';

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const info of iface) {
      if (info.family === 'IPv4' && !info.internal) {
        return info.address;
      }
    }
  }
  return 'localhost';
};

module.exports = {
  NODE_ENV,
  isProd: NODE_ENV === 'production',

  // 服务器
  HOST: process.env.HOST || '0.0.0.0',
  PORT: parseInt(process.env.PORT, 10) || 1116,
  LOCAL_IP: getLocalIP(),

  // 日志
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // 跨域
  CORS_ORIGIN_DEV: '*',
  CORS_ORIGIN_PROD: process.env.CORS_ORIGIN_PROD || 'sh-cynosdbmysql-grp-9gv4boza.sql.tencentcdb.com:24563',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_here',

  // MySQL - 腾讯云 CynosDB
  // 内网地址(CVM同VPC): 10.2.104.89:3306
  // 外网地址: sh-cynosdbmysql-grp-9gv4boza.sql.tencentcdb.com:24563
  // MySQL - 本地开发库（终态切腾讯云时改 .env 即可）
  // 腾讯云外网备用连接信息请通过环境变量注入，不写入仓库。
  MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
  MYSQL_PORT: parseInt(process.env.MYSQL_PORT, 10) || 3306,
  MYSQL_USER: process.env.MYSQL_USER || 'root',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || 'root123456',
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'election_v2',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/flower',
};
