const assert = require('node:assert/strict');
const { buildRoutePaths } = require('../config/router');

assert.deepEqual(buildRoutePaths('mini.js', 'login'), ['/mini/login', '/api/mini/login']);
assert.deepEqual(buildRoutePaths('position-v2.js', 'generate'), [
  '/position-v2/generate',
  '/api/position-v2/generate',
]);

console.log('router api-prefix self-check passed');
