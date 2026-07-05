// @@村级数据隔离中间件（一套代码 双重权限）
// 超级管理 → 全村数据
// 经办/审核/运营 → 只能看/改自己村（users.village_id）

const { parseUser } = require('./requireRole');

/**
 * 在查询参数里自动注入 village_id（如果用户不是超级管理）
 * 用法：在 list/get 接口里调用 applyVillageScope(ctx, params)
 */
function applyVillageScope(ctx, params = {}) {
  const user = parseUser(ctx);
  if (!user) return params; // 未登录，不改
  if (user.role === '超级管理') return params; // 超管全看
  
  // 经办/审核/运营 → 强制带上 village_id
  if (user.villageId) {
    params.villageId = user.villageId;
  }
  return params;
}

/**
 * SQL WHERE 子句自动加村级隔离（用于原始 SQL）
 * 返回: { wherePart: 'AND village_id=?', params: [villageId] } 或空
 */
function villageWhere(ctx) {
  const user = parseUser(ctx);
  if (!user || user.role === '超级管理') return { wherePart: '', params: [] };
  if (user.villageId) return { wherePart: ' AND village_id=?', params: [user.villageId] };
  return { wherePart: '', params: [] };
}

/**
 * 检查写操作权限（新增/修改时，非超管只能操作自己村的数据）
 */
async function checkVillageWrite(ctx, targetVillageId) {
  const user = parseUser(ctx);
  if (!user) {
    ctx.status = 401;
    ctx.body = { code: 1003, msg: '未登录', data: null };
    return false;
  }
  if (user.role === '超级管理') return true; // 超管全放行
  
  // 非超管：只能写自己村
  if (user.villageId && targetVillageId && String(user.villageId) !== String(targetVillageId)) {
    ctx.status = 403;
    ctx.body = { code: 1004, msg: '无权操作其他村的数据', data: null };
    return false;
  }
  return true;
}

module.exports = { applyVillageScope, villageWhere, checkVillageWrite };
