const assert = require('node:assert/strict');
const rosterApi = require('../api/roster-v2');

const { normalizePayload, validatePayload, mapRow } = rosterApi._private;

const normalized = normalizePayload({
  village_id: 1,
  session_no: '第十五届',
  year_start: '2021',
  year_end: '2026',
  post: '主任',
  name: '夏某某',
  phone: '13800000000',
});

assert.deepEqual(normalized, {
  villageId: 1,
  sessionNo: '第十五届',
  yearStart: 2021,
  yearEnd: 2026,
  post: '主任',
  name: '夏某某',
  phone: '13800000000',
  intro: '',
  status: 'active',
});

assert.equal(validatePayload(normalized), '');
assert.equal(validatePayload({ ...normalized, villageId: '' }), 'villageId 必填');
assert.equal(validatePayload({ ...normalized, post: '' }), 'post 必填');
assert.equal(validatePayload({ ...normalized, name: '' }), 'name 必填');
assert.equal(validatePayload({ ...normalized, status: '在岗' }), 'status 只能是 active 或 inactive');
assert.equal(validatePayload({ ...normalized, yearStart: 2027, yearEnd: 2026 }), 'yearStart 不能晚于 yearEnd');

assert.deepEqual(mapRow({
  id: 7,
  village_id: 1,
  village_name: '凤凰社区',
  village_type: '居委会',
  session_no: '第十五届',
  year_start: 2021,
  year_end: 2026,
  post: '主任',
  name: '夏某某',
  phone: '13800000000',
  intro: '简介',
  status: 'active',
  created_by: 2,
  created_at: '2026-07-08 21:30',
  updated_at: '2026-07-08 21:30',
}), {
  id: 7,
  villageId: 1,
  villageName: '凤凰社区',
  villageType: '居委会',
  sessionNo: '第十五届',
  yearStart: 2021,
  yearEnd: 2026,
  post: '主任',
  name: '夏某某',
  phone: '13800000000',
  intro: '简介',
  status: 'active',
  createdBy: 2,
  createdAt: '2026-07-08 21:30',
  updatedAt: '2026-07-08 21:30',
});

console.log('roster-v2 self-check passed');
process.exit(0);
