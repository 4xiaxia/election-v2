// @@API-USER-V2 用户与管理员管理
// users 表统一入口：超级管理/经办/审核/运营 = 管理员；villager/guest = 普通用户
const response = require('../config/response');
const { pool } = require('../db/db');
const { requireRole } = require('../config/requireRole');
const crypto = require('crypto');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

const ADMIN_ROLES = ['超级管理', '经办', '审核', '运营'];

module.exports = {
  get: {
    // 管理员列表（四角色）
    async list(ctx) {
      try {
        const { role, keyword, villageId } = ctx.query;
        let sql = `SELECT id, phone, name, role, village_id, status,
                          DATE_FORMAT(last_login_at, '%Y-%m-%d %H:%i') as last_login_at,
                          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at
                   FROM users WHERE role IN (${ADMIN_ROLES.map(() => '?').join(',')})`;
        const params = [...ADMIN_ROLES];
        if (role) { sql += ' AND role=?'; params.push(role); }
        if (villageId) { sql += ' AND village_id=?'; params.push(villageId); }
        if (keyword) { sql += ' AND (name LIKE ? OR phone LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
        sql += ' ORDER BY created_at DESC';
        const [rows] = await pool.query(sql, params);
        response.pageSuccess(ctx, rows, rows.length);
      } catch (e) { console.error(e); response.serverError(ctx, '查询管理员失败'); }
    },

    // 全部用户列表（含村民）
    async all(ctx) {
      try {
        const { role, keyword } = ctx.query;
        let sql = `SELECT id, phone, name, role, village_id, status,
                          DATE_FORMAT(created_at, '%Y-%m-%d') as created_at
                   FROM users WHERE 1=1`;
        const params = [];
        if (role) { sql += ' AND role=?'; params.push(role); }
        if (keyword) { sql += ' AND (name LIKE ? OR phone LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
        sql += ' ORDER BY created_at DESC LIMIT 500';
        const [rows] = await pool.query(sql, params);
        response.pageSuccess(ctx, rows, rows.length);
      } catch (e) { console.error(e); response.serverError(ctx, '查询用户失败'); }
    },
  },

  post: {
    // 新增管理员
    async add(ctx) {
      try {
        const { phone, name, role, password, villageId } = ctx.request.body;
        if (!phone || !name || !role || !password) return response.paramError(ctx, 'phone/name/role/password 必填');
        if (!ADMIN_ROLES.includes(role)) return response.paramError(ctx, `角色须为：${ADMIN_ROLES.join('/')}`);
        const [exist] = await pool.execute('SELECT id FROM users WHERE phone=?', [phone]);
        if (exist.length > 0) return response.businessError(ctx, '该手机号已存在');
        const [r] = await pool.execute(
          `INSERT INTO users (phone, name, role, password, village_id, is_phone_bound, status)
           VALUES (?, ?, ?, ?, ?, 1, '0')`,
          [phone, name, role, md5(password), villageId || null]
        );
        response.success(ctx, { id: r.insertId }, '管理员创建成功');
      } catch (e) { console.error(e); response.serverError(ctx, '新增管理员失败'); }
    },

    // 更新管理员（密码留空不改）
    async update(ctx) {
      try {
        const { id, name, role, password, villageId, status } = ctx.request.body;
        if (!id) return response.paramError(ctx, 'id 必填');
        const sets = ['name=?', 'role=?', 'village_id=?', 'status=?'];
        const params = [name, role, villageId || null, status || '0'];
        if (password) { sets.push('password=?'); params.push(md5(password)); }
        params.push(id);
        await pool.execute(`UPDATE users SET ${sets.join(',')} WHERE id=?`, params);
        response.success(ctx, null, '更新成功');
      } catch (e) { console.error(e); response.serverError(ctx, '更新管理员失败'); }
    },

    // 停用/启用（软删除）
    async disable(ctx) {
      try {
        const { id, status } = ctx.request.body;
        if (!id) return response.paramError(ctx, 'id 必填');
        await pool.execute("UPDATE users SET status=? WHERE id=?", [status === '0' ? '1' : '0', id]);
        response.success(ctx, null, '操作成功');
      } catch (e) { response.serverError(ctx, '操作失败'); }
    },
  },

  config: {
    // 只有超级管理能管理员CRUD
    add: requireRole('超级管理'),
    update: requireRole('超级管理'),
    disable: requireRole('超级管理'),
    all: requireRole('超级管理', '经办'),
  }
};
