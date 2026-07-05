import http from './index';
import {
  normalizeResponse,
  toCandidateReviewPayload,
  toElectionApprovePayload,
  toMaterialReviewPayload,
  toNotificationPayload,
} from './adapter';

// 公告 notice-v2
export function getNotices(params?: any) {
  return http.get('/notice-v2/list', { params }).then(normalizeResponse);
}
export function getNotice(id: string) {
  return http.get('/notice-v2/detail', { params: { id } }).then(normalizeResponse);
}
export function createNotice(data: any) {
  return http.post('/notice-v2/add', data);
}
export function updateNotice(id: string, data: any) {
  return http.post('/notice-v2/update', { id, ...data });
}
export function deleteNotice(id: string) {
  return http.post('/notice-v2/delete', { id });
}
export function publishNotice(id: string) {
  return http.post('/notice-v2/publish', { id, status: '已发布' });
}
// 18公告填空模板：不传 seq → {commonFields, list}；传 seq → {commonFields, template}
export function getNoticeTemplates(seq?: number) {
  return http.get('/notice-v2/templates', { params: seq ? { seq } : {} });
}
// 填空生成：save=false 预览，save=true 存草稿进 notices
export function generateNotice(data: { seq: number; orgType: string; fields: Record<string, any>; save?: boolean; electionId?: string }) {
  return http.post('/notice-v2/generate', data);
}

// 选举 election-v2
export function getElections(params?: any) { return http.get('/election-v2/list', { params }).then(normalizeResponse); }
export function getElection(id: string) { return http.get('/election-v2/detail', { params: { id } }).then(normalizeResponse); }
export function createElection(data: any) { return http.post('/election-v2/add', data); }
export function updateElection(id: string, data: any) { return http.post('/election-v2/update', { id, ...data }); }
export function updateElectionStatus(id: string, status: string, reason = '') { return http.post('/election-v2/approve', toElectionApprovePayload(id, status, reason)); }
export function deleteElection(id: string) { return http.post('/election-v2/delete', { id }); }
// 选举方式字典
export function getElectionMethodMap() { return http.get('/election-v2/methods'); }

// 村居 village-v2
export function getVillages(params?: any) { return http.get('/village-v2/list', { params }); }
export function getVillagesAll() { return http.get('/village-v2/all'); }
export function createVillage(data: any) { return http.post('/village-v2/add', data); }
export function updateVillage(id: string, data: any) { return http.post('/village-v2/update', { id, ...data }); }
export function deleteVillage(id: string) { return http.post('/village-v2/delete', { id }); }

// 选举方式管理
// @@TODO-废弃？选举方式已是elections字段，独立管理待确认
// @@TODO-无后端
export function getElectionMethods(params?: any) { return http.get('/admin/election-methods', { params }); }
// @@TODO-废弃？选举方式已是elections字段，独立管理待确认 // @@TODO-无后端
export function createElectionMethod(data: any) { return http.post('/admin/election-methods', data); }
// @@TODO-废弃？选举方式已是elections字段，独立管理待确认 // @@TODO-无后端
export function updateElectionMethod(id: string, data: any) { return http.put(`/admin/election-methods/${id}`, data); }
// @@TODO-废弃？选举方式已是elections字段，独立管理待确认 // @@TODO-无后端
export function reviewElectionMethod(id: string, data: any) { return http.put(`/admin/election-methods/${id}/review`, data); }
// @@TODO-废弃？选举方式已是elections字段，独立管理待确认 // @@TODO-无后端
export function deleteElectionMethod(id: string) { return http.delete(`/admin/election-methods/${id}`); }

// 系统设置
// @@TODO-无后端
export function getSettings() { return http.get('/admin/settings'); }
// @@TODO-无后端
export function updateSettings(data: any) { return http.put('/admin/settings', data); }

// 候选人 candidate-v2
export function getCandidates(params?: any) {
  return http.get('/candidate-v2/list', { params }).then(normalizeResponse);
}
export function getCandidate(id: string) {
  return http.get('/candidate-v2/detail', { params: { id } }).then(normalizeResponse);
}
// 后台录入=import来源
export function createCandidate(data: any) {
  return http.post('/candidate-v2/import', data);
}
// @@TODO-无后端 candidate-v2无update，用review/result替代
export function updateCandidate(id: string, data: any) {
  return http.post('/candidate-v2/review', toCandidateReviewPayload(id, data));
}
export function updateCandidateStatus(id: string, status: string) {
  return http.post('/candidate-v2/review', toCandidateReviewPayload(id, { action: status }));
}
// @@TODO-无后端 candidate-v2无delete端点
export function deleteCandidate(id: string) {
  return http.delete(`/admin/candidates/${id}`);
}
// 新增结果回填
export function fillCandidateResult(id: string, elected: any, votes: any) {
  return http.post('/candidate-v2/result', { id, elected, votes });
}
// 驳回重提
// @@TODO-无后端
export function resubmitCandidate(id: string) {
  return http.put(`/admin/candidates/${id}/resubmit`);
}
// 内链 callback：材料齐全性校验（候选人职位 → 职位材料要求 → 缺哪些）
// @@TODO-无后端
export function checkCandidateMaterials(id: string) {
  return http.get(`/admin/candidates/${id}/material-check`);
}
// @@TODO-无后端
export function importCandidates(file: File, electionId?: string) {
  const form = new FormData();
  form.append('file', file);
  if (electionId) form.append('electionId', electionId);
  return http.post('/admin/candidates/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
}
// @@TODO-无后端
export function exportCandidates(params?: any) {
  return http.get('/admin/candidates/export/all', {
    params,
    responseType: 'blob',
  });
}

// 操作日志
// @@TODO-无后端 koaLite暂无logs路由（logs表有数据，待建查询路由）
export function getOperationLogs(params?: any) {
  return http.get('/log-v2/list', { params });
}
// @@TODO-无后端 koaLite暂无logs路由（logs表有数据，待建查询路由）
export function exportOperationLogs(params?: any) {
  return http.get('/admin-v2/logs/export/all', { params, responseType: 'blob' });
}

// 材料 material-v2
export function getMaterials(params?: any) {
  return http.get('/material-v2/list', { params }).then(normalizeResponse);
}
export function getMaterial(id: string) {
  return http.get('/material-v2/detail', { params: { id } }).then(normalizeResponse);
}
export function createMaterial(data: any) {
  return http.post('/material-v2/submit', data);
}
// @@TODO-无后端 material-v2 无 update/delete 端点
export function updateMaterial(id: string, data: any) {
  return http.post('/material-v2/update', { id, ...data });
}
// @@TODO-无后端 material-v2 无 update/delete 端点
export function deleteMaterial(id: string) {
  return http.delete(`/admin-v2/materials/${id}`);
}
export function reviewMaterial(id: string, data: any) {
  return http.post('/material-v2/review', toMaterialReviewPayload(id, data));
}

// 通知 notification-v2
export function getNotifications(params?: any) {
  return http.get('/notification-v2/list', { params }).then(normalizeResponse);
}
// 发通知=send
export function createNotification(data: any) {
  return http.post('/notification-v2/send', toNotificationPayload(data));
}
// @@TODO-无后端 notification无update
export function updateNotification(id: string, data: any) {
  return http.put(`/admin-v2/notifications/${id}`, data);
}
export function deleteNotification(id: string) {
  return http.post('/notification-v2/delete', { id });
}
export function sendNotificationNow(id: string) {
  return Promise.reject(new Error('当前后端没有“重发已有通知”接口'));
}
// @@TODO-无后端
export function exportNotifications(params?: any) {
  return http.get('/admin-v2/notifications/export/all', { params, responseType: 'blob' });
}
// @@TODO-无后端 notification无detail端点
export function getNotification(id: string) {
  return http.get(`/admin-v2/notifications/${id}`);
}

// 职位 position-v2
export function getPositions(params?: any) {
  return http.get('/position-v2/list', { params }).then(normalizeResponse);
}
export function getPosition(id: string) {
  return http.get('/position-v2/detail', { params: { id } }).then(normalizeResponse);
}
export function createPosition(data: any) {
  return http.post('/position-v2/add', data);
}
export function updatePosition(id: string, data: any) {
  return http.post('/position-v2/update', { id, ...data });
}
export function deletePosition(id: string) {
  return http.post('/position-v2/delete', { id });
}
export function generatePositions(data: {
  electionId: string;
  orgType: 'village' | 'community';
  committeeSize: number;
  deputyCount?: number;
  hasDeputy?: boolean;
}) {
  return http.post('/position-v2/generate', data);
}

// 档案（走 material-v2 scope=archive）
export function getArchives(params?: any) {
  return http.get('/material-v2/list', { params: { ...params, scope: 'archive' } }).then(normalizeResponse);
}
export function createArchive(data: any) {
  // data 含: electionId, stageKey, materialNo, fileUrl, applicantName?, applicantPhone?
  return http.post('/material-v2/submit', { ...data, scope: 'archive' });
}
// @@TODO-无后端 material-v2 无归档专用 update/delete
export function updateArchive(id: string, data: any) {
  return http.post('/material-v2/update', { id, ...data, scope: 'archive' });
}
export function deleteArchive(id: string) {
  return http.delete(`/admin-v2/materials/${id}`);
}
// @@TODO-无后端 台账导出待补
export function exportArchives(params?: any) {
  return http.get('/admin/archives/export', { params, responseType: 'blob' });
}
export function exportFullArchives() {
  return http.get('/admin/archives/export/full', { responseType: 'blob' });
}

// 用户与管理员 user-v2（users表统一入口）
export function getAdmins(params?: any) {
  return http.get('/user-v2/list', { params }).then(normalizeResponse);
}
export function createAdmin(data: any) {
  return http.post('/user-v2/add', data);
}
export function updateAdmin(id: string, data: any) {
  return http.post('/user-v2/update', { id, ...data });
}
export function deleteAdmin(id: string) {
  return http.post('/user-v2/disable', { id });
}

// 用户列表（含村民，供选民登记/权限检查用）
export function getUsers(params?: any) {
  return http.get('/user-v2/all', { params }).then(normalizeResponse);
}

// 角色枚举（本地常量，无需请求接口——roles表不存在，role是users字段枚举）
export function getRoles() {
  return Promise.resolve({ data: [
    { name: '超级管理', description: '系统最高权限，可管理所有模块', count: 0 },
    { name: '经办',   description: '负责日常选举事务操作',         count: 0 },
    { name: '审核',   description: '负责材料审核和候选人审批',      count: 0 },
    { name: '运营',   description: '负责公告发布和数据查看',        count: 0 },
  ]});
}
export function createRole(_data: any) { return Promise.reject(new Error('角色由系统固定，不支持自定义')); }
export function updateRole(_id: string, _data: any) { return Promise.reject(new Error('角色由系统固定，不支持修改')); }
export function deleteRole(_id: string) { return Promise.reject(new Error('角色由系统固定，不支持删除')); }

// 登录（新门 auth-v2·三身份：手机号+密码+身份）
export function login(phone: string, password: string, role: string, villageId?: string) {
  return http.post('/auth-v2/login', { phone, password, role, villageId });
}

// ===== 村民端（H5 移动端·调 /mini 公开接口·免管理员登录）=====
// 兜底方案：小程序备案/审核未就绪时，H5 浏览器直接可用，村民能看选举信息。
// @@TODO-无后端 mini路由待建
export function miniGetNotices() {
  return http.get('/mini/notices');
}
// @@TODO-无后端 mini路由待建
export function miniGetElections() {
  return http.get('/mini/elections');
}
// @@TODO-无后端 mini路由待建
export function miniGetCandidates(electionId?: string) {
  return http.get('/mini/candidates', { params: { electionId: electionId || '' } });
}
// @@TODO-无后端 mini路由待建
export function miniGetElectionMethods() {
  return http.get('/mini/election-methods');
}
// @@TODO-无后端 mini路由待建
export function miniGetNotifications(userId?: string) {
  return http.get('/mini/notifications', { params: { userId: userId || '' } });
}
