const assert = require('node:assert/strict');
const { buildGeneratedPositions } = require('../api/position-v2');

const village = buildGeneratedPositions('village', 5);
assert.deepEqual(village.map(p => [p.name, p.quota]), [
  ['主任', 1],
  ['副主任', 1],
  ['委员', 3],
]);
assert.equal(village[0].duty, '村民委员会主任');

const community = buildGeneratedPositions('community', 9);
assert.deepEqual(community.map(p => [p.name, p.quota]), [
  ['主任', 1],
  ['副主任', 1],
  ['委员', 7],
]);
assert.equal(community[2].duty, '居民委员会委员');

assert.throws(() => buildGeneratedPositions('town', 5), /orgType/);
assert.throws(() => buildGeneratedPositions('village', 4), /committeeSize/);

console.log('position generate self-check passed');
process.exit(0);
