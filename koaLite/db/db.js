const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../config/env');
const { pool } = require('../config/mysql');

// 自动初始化数据库表和默认数据
async function initDatabase() {
  console.log('Checking database connection & initializing schemas...');
  try {
    // 1. 先尝试在不指定数据库的情况下连接，并自动创建目标数据库（如果不存在的话）
    try {
      const tempConnection = await mysql.createConnection({
        host:     env.MYSQL_HOST,
        user:     env.MYSQL_USER,
        password: env.MYSQL_PASSWORD,
      });
      await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${env.MYSQL_DATABASE}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await tempConnection.end();
      console.log(`Database '${env.MYSQL_DATABASE}' checked/created successfully.`);
    } catch (dbCreateError) {
      console.warn('Attempt to automatically create database failed, trying connection pool directly. Error:', dbCreateError.message);
    }

    // 2. 使用常规连接池连接数据库并验证表结构
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');

    // 读取 init_v2.sql 文件内容（招聘表单模型·10张业务表）
    const sqlPath = path.join(__dirname, 'init_v2.sql');
    if (!fs.existsSync(sqlPath)) {
      console.warn('init_v2.sql file not found, skipping schema check.');
      connection.release();
      return;
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // 按照分号拆分 SQL 语句，需要排除注释行并合并多行语句
    const statements = sqlContent
      .split(';')
      .map(statement => {
        return statement
          .split('\n')
          .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('#'))
          .join('\n')
          .trim();
      })
      .filter(statement => statement.length > 0);

    // 逐条执行 SQL
    for (const sql of statements) {
      try {
        await connection.query(sql);
      } catch (err) {
        // INSERT IGNORE 撞已存在数据是正常的，不刷错误
        if (!/Duplicate entry/i.test(err.message)) {
          console.error('Failed to execute query:', sql.slice(0, 60));
          console.error(err.message);
        }
      }
    }

    console.log('选举系统 election_v2 · 10张业务表已就绪');
    connection.release();
  } catch (error) {
    console.error('Database connection / initialization failed:');
    console.error(error);
  }
}

// 自动初始化
initDatabase();

module.exports = {
  pool,
  initDatabase,
};
