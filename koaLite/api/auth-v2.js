const md5 = require('md5');
const { pool } = require('../db/db');
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'election-secret-key-2024';

module.exports = {
  post: {
    // POST /auth-v2/login
    async login(ctx) {
      let connection;
      try {
        const { phone, password, role, villageId } = ctx.request.body;

        // 参数验证
        if (!phone || !password || !role) {
          return ctx.paramError('phone、password、role 不能为空');
        }

        // 获取数据库连接
        connection = await pool.getConnection();

        // 查询用户
        const [users] = await connection.execute(
          'SELECT id, phone, password, role, village_id, name FROM users WHERE phone = ? AND role = ?',
          [phone, role]
        );

        if (!users || users.length === 0) {
          return ctx.paramError('用户名或密码错误');
        }

        const user = users[0];

        // 验证密码（md5）
        const hashedPassword = md5(password);
        if (user.password !== hashedPassword) {
          return ctx.paramError('用户名或密码错误');
        }

        // 生成 JWT token
        const token = jwt.sign(
          {
            userId: user.id,
            phone: user.phone,
            role: user.role,
            villageId: user.village_id,
            name: user.name,
          },
          secret,
          { expiresIn: '7d' }
        );

        // 返回登录成功
        ctx.success({
          token,
          user: {
            id: user.id,
            phone: user.phone,
            role: user.role,
            villageId: user.village_id,
            name: user.name,
          },
        }, '登录成功');
      } catch (err) {
        console.error('登录错误:', err);
        ctx.serverError('登录失败');
      } finally {
        if (connection) connection.release();
      }
    },

    // POST /auth-v2/logout
    async logout(ctx) {
      ctx.success({}, '登出成功');
    },
  },

  get: {
    // GET /auth-v2/verify
    async verify(ctx) {
      try {
        const token = ctx.request.header.authorization?.replace('Bearer ', '');
        if (!token) {
          return ctx.paramError('token 不存在');
        }

        const decoded = jwt.verify(token, secret);
        ctx.success(decoded, 'token 有效');
      } catch (err) {
        ctx.paramError('token 无效或已过期');
      }
    },
  },
};
