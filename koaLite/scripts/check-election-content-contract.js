const assert = require('node:assert/strict');
const electionApi = require('../api/election-v2');

const { inferTemplateKey, normalizeContent, serializeContent } = electionApi._private;

assert.equal(inferTemplateKey('村委会选举', '村民直接选举'), 'TEMPLATE_VILLAGE');
assert.equal(inferTemplateKey('居委会选举', '居民直接选举'), 'TEMPLATE_COMMUNITY_DIRECT');
assert.equal(inferTemplateKey('居委会选举', '户代表选举'), 'TEMPLATE_COMMUNITY_HOUSEHOLD');
assert.equal(inferTemplateKey('居委会选举', '居民代表选举'), 'TEMPLATE_COMMUNITY_REPRESENTATIVE');

const normalized = normalizeContent('{"timeline":[{"stageKey":"S1","stageName":"前期准备"}]}', {
  election_type: '居委会选举',
  election_method: '居民代表选举',
});
assert.equal(normalized.templateKey, 'TEMPLATE_COMMUNITY_REPRESENTATIVE');
assert.equal(normalized.timeline.length, 1);
assert.equal(normalized.stages.length, 1);

const serialized = serializeContent({ stages: [{ stageKey: 'S1' }] }, {
  election_type: '村委会选举',
  election_method: '村民直接选举',
});
const parsed = JSON.parse(serialized);
assert.equal(parsed.templateKey, 'TEMPLATE_VILLAGE');
assert.equal(parsed.timeline[0].stageKey, 'S1');
assert.equal(parsed.stages[0].stageKey, 'S1');

assert.equal(normalizeContent('普通富文本', {}), '普通富文本');

console.log('election content contract self-check passed');
process.exit(0);
