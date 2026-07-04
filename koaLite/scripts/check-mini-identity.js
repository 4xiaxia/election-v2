const assert = require('node:assert/strict');
const { isValidPhone, normalizeMiniUser } = require('../api/mini');

assert.equal(isValidPhone('13800000001'), true);
assert.equal(isValidPhone('23800000001'), false);
assert.equal(isValidPhone('1380000000'), false);

const user = normalizeMiniUser({
  id: 7,
  phone: '13800000001',
  role: 'villager',
  village_id: 3,
  name: '测试选民',
  is_phone_bound: 1,
  wx_openid: 'wx-test',
});

assert.deepEqual(user, {
  id: 7,
  userId: 7,
  phone: '13800000001',
  role: 'villager',
  villageId: 3,
  name: '测试选民',
  isPhoneBound: true,
  wxOpenid: 'wx-test',
  locationBound: true,
});

console.log('mini identity self-check passed');
process.exit(0);
