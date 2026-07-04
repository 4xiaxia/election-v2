const assert = require('node:assert/strict');
const { _private } = require('../api/notice-v2');

assert.deepEqual(_private.orgWords('community'), {
  orgResident: '居民',
  orgUnit: '社区',
  orgCommittee: '居民委员会',
  orgElectionCommittee: '居民选举委员会',
});

assert.equal(_private.renderTemplate('甲{{name}}乙{{empty}}', { name: '霞皋村', empty: '' }), '甲霞皋村乙____');

const notice = _private.buildNoticeFromTemplate({
  seq: 1,
  orgType: 'village',
  fields: { villageName: '霞皋村', townName: '华亭', issueDate: '2026-07-04' },
});

assert.equal(notice.title, '霞皋村关于确定选举日的公告');
assert.match(notice.content, /霞皋村/);
assert.match(notice.content, /村民委员会/);

console.log('notice template self-check passed');
process.exit(0);
