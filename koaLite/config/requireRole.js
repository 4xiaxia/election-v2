// @@AUTH-RBAC 权限中间件（我们自己的·走 users.role 中文四角色·不引入第二套）
// Koa 版：从 Authorization 头解析 token → ctx.state.user → 校验 role
// 用法：在 api/*-v2.js 的 config 段挂载，如 config: { post: { add: requireRole('超级管理','经办') } }
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'election-secret-key-2024';

// 解析 token，把用户放进 ctx.state.user（解不出就 null）
function parseUser(ctx) {
  const auth = ctx.request.header.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), secret);
  } catch {
    return null;
  }
}

// 生成"要求指定角色"的中间件
function requireRole(...allowedRoles) {
  return async (ctx, next) => {
    const user = parseUser(ctx);
    if (!user) {
      ctx.status = 401;
      ctx.body = { code: 1003, msg: '未登录或登录已过期', data: null };
      return;
    }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      ctx.status = 403;
      ctx.body = { code: 1004, msg: '权限不足', data: null };
      return;
    }
    ctx.state.user = user; // 放进 state，后续处理函数可用 ctx.state.user 拿到操作人
    await next();
  };
}

// 只要求登录、不限角色
function requireLogin() {
  return requireRole();
}

module.exports = { requireRole, requireLogin, parseUser };
