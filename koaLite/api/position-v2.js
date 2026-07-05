const response = require('../config/response');
const { pool } = require('../db/db');
const { requireRole } = require('../config/requireRole');

function parseJSON(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

const P0_POSITION_NAMES = ['主任', '副主任', '委员'];

function normalizeDeputyCount(orgType, committeeSize, opts = {}) {
  if (opts.deputyCount !== undefined && opts.deputyCount !== null && opts.deputyCount !== '') {
    return Number(opts.deputyCount);
  }
  if (opts.hasDeputy === false) return 0;
  if (opts.hasDeputy === true) return 1;
  return orgType === 'village' && Number(committeeSize) === 3 ? 0 : 1;
}

function buildGeneratedPositions(orgType, committeeSize, opts = {}) {
  if (!['village', 'community'].includes(orgType)) throw new Error('orgType must be village or community');

  const size = Number(committeeSize);
  const allowedSizes = orgType === 'village' ? [3, 5, 7] : [5, 7, 9];
  if (!allowedSizes.includes(size)) throw new Error(`${orgType} committeeSize must be ${allowedSizes.join('/')}`);

  const deputyCount = normalizeDeputyCount(orgType, size, opts);
  if (![0, 1, 2].includes(deputyCount)) throw new Error('deputyCount must be 0/1/2');

  const memberQuota = size - 1 - deputyCount;
  if (memberQuota < 1) throw new Error('committeeSize leaves no member quota');

  const label = orgType === 'village' ? '村委会' : '居委会';
  const positions = [
    { name: '主任', quota: 1, postCategory: 'director', duty: `${label}主任`, sortWeight: 10 },
  ];
  if (deputyCount > 0) {
    positions.push({ name: '副主任', quota: deputyCount, postCategory: 'deputy_director', duty: `${label}副主任`, sortWeight: 20 });
  }
  positions.push({ name: '委员', quota: memberQuota, postCategory: 'member', duty: `${label}委员`, sortWeight: 30 });
  return positions;
}

const api = {
  get: {
    async list(ctx) {
      try {
        const { electionId, includeAll } = ctx.query;
        if (!electionId) return response.paramError(ctx, '选举活动ID不能为空');

        const params = [electionId];
        let sql = `SELECT id, election_id, name, quota, duty, material_requirements,
                  sort_weight, enabled, elected_candidates,
                  DATE_FORMAT(enroll_start_at,"%Y-%m-%d") as enroll_start_at,
                  DATE_FORMAT(enroll_end_at,"%Y-%m-%d") as enroll_end_at
           FROM positions WHERE election_id = ?`;
        if (includeAll !== '1') {
          sql += ' AND name IN (?, ?, ?)';
          params.push(...P0_POSITION_NAMES);
        }
        sql += ' ORDER BY sort_weight ASC, id ASC';

        const [rows] = await pool.query(sql, params);
        rows.forEach(r => {
          r.material_requirements = parseJSON(r.material_requirements, []);
          r.elected_candidates = parseJSON(r.elected_candidates, []);
        });
        response.pageSuccess(ctx, rows, rows.length);
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '查询岗位列表失败');
      }
    },

    async detail(ctx) {
      try {
        const { id } = ctx.query;
        const [rows] = await pool.query('SELECT * FROM positions WHERE id = ?', [id]);
        const p = rows[0];
        if (!p) return response.paramError(ctx, '岗位不存在');
        p.material_requirements = parseJSON(p.material_requirements, []);
        p.elected_candidates = parseJSON(p.elected_candidates, []);
        response.success(ctx, p);
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '查询岗位详情失败');
      }
    }
  },

  post: {
    async add(ctx) {
      try {
        const b = ctx.request.body;
        const { electionId, name, quota = 1, duty = '', materialRequirements = [], sortWeight = 99 } = b;
        if (!electionId) return response.paramError(ctx, '选举活动ID不能为空');
        if (!name) return response.paramError(ctx, '岗位名称不能为空');

        const reqJSON = typeof materialRequirements === 'string' ? materialRequirements : JSON.stringify(materialRequirements);
        const [result] = await pool.execute(
          `INSERT INTO positions (election_id, name, quota, duty, material_requirements, sort_weight, enroll_start_at, enroll_end_at)
           VALUES (?,?,?,?,?,?,?,?)`,
          [electionId, name, quota, duty, reqJSON, sortWeight, b.enrollStartAt || null, b.enrollEndAt || null]
        );
        response.success(ctx, { id: result.insertId }, '添加岗位成功');
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '添加岗位失败');
      }
    },

    async generate(ctx) {
      try {
        const { electionId, orgType, committeeSize, deputyCount, hasDeputy } = ctx.request.body;
        if (!electionId) return response.paramError(ctx, '选举活动ID不能为空');

        const positions = buildGeneratedPositions(orgType, committeeSize, { deputyCount, hasDeputy });
        const [existing] = await pool.execute(
          'SELECT id, name FROM positions WHERE election_id = ? AND name IN (?, ?, ?) ORDER BY sort_weight ASC, id ASC',
          [electionId, ...P0_POSITION_NAMES]
        );
        if (existing.length > 0) {
          return response.businessError(ctx, '该选举活动已存在主任/副主任/委员岗位，请勿重复生成');
        }

        const values = positions.map(p => [
          electionId,
          p.name,
          p.quota,
          p.duty,
          JSON.stringify([]),
          p.sortWeight,
          1,
        ]);
        await pool.query(
          `INSERT INTO positions (election_id, name, quota, duty, material_requirements, sort_weight, enabled)
           VALUES ?`,
          [values]
        );
        response.success(ctx, positions, '生成岗位成功');
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '生成岗位失败');
      }
    },

    async update(ctx) {
      try {
        const b = ctx.request.body;
        if (!b.id) return response.paramError(ctx, '岗位ID不能为空');

        const reqJSON = typeof b.materialRequirements === 'string'
          ? b.materialRequirements
          : JSON.stringify(b.materialRequirements || []);
        await pool.execute(
          `UPDATE positions SET name=?, quota=?, duty=?, material_requirements=?, sort_weight=?,
             enabled=?, enroll_start_at=?, enroll_end_at=? WHERE id=?`,
          [b.name, b.quota || 1, b.duty || '', reqJSON, b.sortWeight || 99,
           b.enabled === undefined ? 1 : b.enabled, b.enrollStartAt || null, b.enrollEndAt || null, b.id]
        );
        response.success(ctx, null, '修改岗位成功');
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '修改岗位失败');
      }
    },

    async delete(ctx) {
      try {
        const { id } = ctx.request.body;
        if (!id) return response.paramError(ctx, '岗位ID不能为空');

        const [mat] = await pool.execute('SELECT 1 FROM materials WHERE position_id = ? LIMIT 1', [id]);
        const [cand] = await pool.execute('SELECT 1 FROM candidates WHERE position_id = ? LIMIT 1', [id]);
        if (mat.length > 0 || cand.length > 0) {
          return response.businessError(ctx, '该岗位已有材料或候选人，不允许删除');
        }

        await pool.execute('DELETE FROM positions WHERE id = ?', [id]);
        response.success(ctx, null, '删除岗位成功');
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '删除岗位失败');
      }
    }
  },

  config: {
    add: requireRole('超级管理', '经办'),
    generate: requireRole('超级管理', '经办'),
    update: requireRole('超级管理', '经办'),
    delete: requireRole('超级管理', '经办'),
  }
};

Object.defineProperty(api, 'buildGeneratedPositions', { value: buildGeneratedPositions });
Object.defineProperty(api, 'P0_POSITION_NAMES', { value: P0_POSITION_NAMES });

module.exports = api;
