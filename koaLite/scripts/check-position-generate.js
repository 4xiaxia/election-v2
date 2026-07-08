const assert = require('node:assert/strict');
const { buildGeneratedPositions } = require('../api/position-v2');

const village = buildGeneratedPositions('village', 5);
assert.deepEqual(village.map(p => [p.name, p.quota]), [
  ['主任', 1],
  ['副主任', 1],
  ['委员', 3],
]);
assert.deepEqual(village.map(p => p.postCategory), ['director', 'deputy_director', 'member']);

const smallVillage = buildGeneratedPositions('village', 3);
assert.deepEqual(smallVillage.map(p => [p.name, p.quota]), [
  ['主任', 1],
  ['委员', 2],
]);

const villageNoDeputy = buildGeneratedPositions('village', 5, { deputyCount: 0 });
assert.deepEqual(villageNoDeputy.map(p => [p.name, p.quota]), [
  ['主任', 1],
  ['委员', 4],
]);

const community = buildGeneratedPositions('community', 9);
assert.deepEqual(community.map(p => [p.name, p.quota]), [
  ['主任', 1],
  ['副主任', 1],
  ['委员', 7],
]);

assert.throws(() => buildGeneratedPositions('town', 5), /orgType/);
assert.throws(() => buildGeneratedPositions('village', 4), /committeeSize/);
assert.throws(() => buildGeneratedPositions('community', 3), /committeeSize/);
assert.throws(() => buildGeneratedPositions('community', 5, { deputyCount: 4 }), /deputyCount/);

console.log('position generate self-check passed');
process.exit(0);
