/**
 * 判断当前登录用户是否有权限执行某操作
 * @param {String} permission - 权限标识字符串 
 * @param {Object} context - 权限上下文数据 (如选中某项目等)
 * @returns {Boolean}
 */
export function hasPermission(permission, context = null) {
  const infoData = wx.getStorageSync('infoData');
  if (!infoData) return false;
  
  const user = typeof infoData === 'string' ? JSON.parse(infoData) : infoData;
  if (!user || !user.identity) return false;

  // 1. 超级管理员全局通行
  if (user.identity.includes('admin')) return true;

  // 2. 根据用户权限数组进行匹配 (示例逻辑，可根据实际后端返回的结构调整)
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }

  // 其他身份或角色逻辑可以在此扩展
  // if (user.identity.includes('xxx')) { ... }

  return false;
}
