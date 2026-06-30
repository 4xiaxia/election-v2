import assert from 'node:assert/strict';

const camel = (key) => key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (!value || typeof value !== 'object') return value;
  const out = { ...value };
  for (const [key, raw] of Object.entries(value)) {
    const next = normalize(raw);
    out[key] = next;
    const ck = camel(key);
    if (ck !== key && out[ck] === undefined) out[ck] = next;
  }
  return out;
}
function loginPayload(res) {
  return res?.data ?? res ?? {};
}
function electionApprove(id, statusOrAction, reason = '') {
  const action = statusOrAction === 'reject' || statusOrAction === '已驳回' ? 'reject' : 'approve';
  return { id, action, reason };
}
function candidateReview(id, data = {}) {
  const comment = data.comment ?? data.reviewComment ?? '';
  const raw = data.action ?? data.status;
  const action = raw === 'fail' || raw === '资格作废' || raw === '已驳回' || raw === '已初审驳回' || raw === '已终审驳回' ? 'fail' : 'pass';
  return { id, action, comment };
}
function materialReview(id, data = {}) {
  return { id, action: data.action, rejectReason: data.rejectReason ?? data.reason ?? '', reviewerId: data.reviewerId };
}
function notificationPayload(data = {}) {
  const targetPhones = data.targetPhones ?? data.phones ?? '';
  return {
    title: data.title,
    content: data.content,
    type: data.type,
    userId: data.userId,
    targetPhones: data.targetType === 'all' ? 'all' : (Array.isArray(targetPhones) ? targetPhones.join(',') : targetPhones),
    targetRole: data.targetRole,
    targetVillage: data.targetVillage,
    sendMode: data.sendMode,
    scheduledAt: data.scheduledAt,
  };
}

assert.equal(loginPayload({ code: 0, data: { token: 't', user: { id: 1 } } }).token, 't');

const row = normalize({
  village_name: '凤凰社区',
  position_name: '主任',
  material_requirements: [{ sample_image: '/a.png' }],
  target_phones: '138',
  created_at: '2026-06-29',
});
assert.equal(row.villageName, '凤凰社区');
assert.equal(row.positionName, '主任');
assert.equal(row.materialRequirements[0].sampleImage, '/a.png');
assert.equal(row.targetPhones, '138');
assert.equal(row.createdAt, '2026-06-29');

assert.deepEqual(electionApprove('7', '已通过'), { id: '7', action: 'approve', reason: '' });
assert.deepEqual(electionApprove('7', '已驳回', 'x'), { id: '7', action: 'reject', reason: 'x' });
assert.deepEqual(candidateReview('1', { status: '已通过', reviewComment: 'ok' }), { id: '1', action: 'pass', comment: 'ok' });
assert.deepEqual(candidateReview('1', { status: '资格作废', reviewComment: 'bad' }), { id: '1', action: 'fail', comment: 'bad' });
assert.deepEqual(materialReview('2', { action: 'reject', reason: 'missing' }), { id: '2', action: 'reject', rejectReason: 'missing', reviewerId: undefined });
assert.equal(notificationPayload({ targetType: 'phone', phones: '138,139' }).targetPhones, '138,139');
assert.equal(notificationPayload({ targetType: 'all' }).targetPhones, 'all');

console.log('contract-smoke ok');
