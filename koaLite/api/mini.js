const res = require('../config/response');
const { pool } = require('../db/db');

function isValidPhone(phone) {
  return typeof phone === 'string' && /^1\d{10}$/.test(phone.trim());
}

function normalizeMiniUser(row) {
  const id = Number(row.id);
  const villageId = row.village_id == null ? null : Number(row.village_id);
  return {
    id,
    userId: id,
    phone: row.phone || '',
    role: row.role || 'villager',
    villageId,
    name: row.name || '',
    isPhoneBound: !!row.is_phone_bound,
    wxOpenid: row.wx_openid || '',
    locationBound: !!villageId,
  };
}

async function fetchUserByIdOrPhone({ userId, phone }) {
  if (userId) {
    const [rows] = await pool.execute(
      'SELECT id, phone, role, village_id, name, is_phone_bound, wx_openid FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    return rows[0] || null;
  }
  if (phone) {
    const [rows] = await pool.execute(
      'SELECT id, phone, role, village_id, name, is_phone_bound, wx_openid FROM users WHERE phone = ? LIMIT 1',
      [phone]
    );
    return rows[0] || null;
  }
  return null;
}

const api = {
  post: {
    async login(ctx) {
      try {
        const phone = String(ctx.request.body?.phone || '').trim();
        const wxOpenid = String(ctx.request.body?.wxOpenid || ctx.request.body?.openid || '').trim();
        if (!isValidPhone(phone)) return res.paramError(ctx, '手机号格式不正确');

        const oldUser = await fetchUserByIdOrPhone({ phone });
        if (oldUser) {
          if (wxOpenid) {
            await pool.execute(
              'UPDATE users SET is_phone_bound = 1, wx_openid = ?, last_login_at = NOW() WHERE id = ?',
              [wxOpenid, oldUser.id]
            );
          } else {
            await pool.execute('UPDATE users SET is_phone_bound = 1, last_login_at = NOW() WHERE id = ?', [oldUser.id]);
          }
        } else {
          await pool.execute(
            "INSERT INTO users (phone, password, role, is_phone_bound, wx_openid, last_login_at) VALUES (?, '', 'villager', 1, ?, NOW())",
            [phone, wxOpenid]
          );
        }

        const user = await fetchUserByIdOrPhone({ phone });
        return res.success(ctx, { user: normalizeMiniUser(user) });
      } catch (err) {
        console.error(err);
        return res.serverError(ctx, '村民登录失败');
      }
    },

    'bind-location': async function bindLocation(ctx) {
      try {
        const userId = Number(ctx.request.body?.userId || 0);
        const phone = String(ctx.request.body?.phone || '').trim();
        const villageId = Number(ctx.request.body?.villageId || 0);
        if (!userId && !isValidPhone(phone)) return res.paramError(ctx, 'userId 或手机号必填');
        if (!villageId) return res.paramError(ctx, '归属地必填');

        const [villages] = await pool.execute(
          "SELECT id, name, type FROM villages WHERE id = ? AND status = '0' LIMIT 1",
          [villageId]
        );
        if (!villages[0]) return res.notFound(ctx, '归属地不存在或已停用');

        const user = await fetchUserByIdOrPhone({ userId, phone });
        if (!user) return res.notFound(ctx, '用户不存在');

        await pool.execute(
          "UPDATE users SET village_id = ?, role = 'villager', is_phone_bound = 1 WHERE id = ?",
          [villageId, user.id]
        );

        const nextUser = await fetchUserByIdOrPhone({ userId: user.id });
        return res.success(ctx, { user: normalizeMiniUser(nextUser), village: villages[0] });
      } catch (err) {
        console.error(err);
        return res.serverError(ctx, '绑定归属地失败');
      }
    },
  },

  get: {
    async me(ctx) {
      try {
        const userId = Number(ctx.query.userId || 0);
        const phone = String(ctx.query.phone || '').trim();
        if (!userId && !isValidPhone(phone)) return res.paramError(ctx, 'userId 或手机号必填');

        const user = await fetchUserByIdOrPhone({ userId, phone });
        if (!user) return res.notFound(ctx, '用户不存在');

        return res.success(ctx, { user: normalizeMiniUser(user) });
      } catch (err) {
        console.error(err);
        return res.serverError(ctx, '查询身份失败');
      }
    },
  },
};

Object.defineProperty(api, 'isValidPhone', { value: isValidPhone });
Object.defineProperty(api, 'normalizeMiniUser', { value: normalizeMiniUser });

module.exports = api;
