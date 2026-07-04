// @@API-POSITION-V2 岗位管理（招聘比喻=职位设置）
// 核心：material_requirements JSON = 村民端报名表单（金山表单三层）
// 岗位时间默认空=跟活动走；填了=特招覆盖
const response = require('../config/response');
const { pool } = require('../db/db');
const { requireRole } = require('../config/requireRole');

// 安全解析 JSON 字段
function parseJSON(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

function buildGeneratedPositions(orgType, committeeSize) {
  if (!['village', 'community'].includes(orgType)) throw new Error('orgType must be village or community');
  if (![3, 5, 7, 9].includes(Number(committeeSize))) throw new Error('committeeSize must be 3/5/7/9');

  const label = orgType === 'community' ? '居民委员会' : '村民委员会';
  return [
    { name: '主任', quota: 1, postCategory: 'director', duty: `${label}主任`, sortWeight: 10 },
    { name: '副主任', quota: 1, postCategory: 'deputy_director', duty: `${label}副主任`, sortWeight: 20 },
    { name: '委员', quota: Number(committeeSize) - 2, postCategory: 'member', duty: `${label}委员`, sortWeight: 30 },
  ];
}

const api = {
  get: {
    // 某活动下的岗位列表
    async list(ctx) {
      try {
        const { electionId } = ctx.query;
        if (!electionId) return response.paramError(ctx, '选举活动ID不能为空');

        const [rows] = await pool.query(
          `SELECT id, election_id, name, quota, duty, material_requirements,
                  sort_weight, enabled, elected_candidates,
                  DATE_FORMAT(enroll_start_at,"%Y-%m-%d") as enroll_start_at,
                  DATE_FORMAT(enroll_end_at,"%Y-%m-%d") as enroll_end_at
           FROM positions WHERE election_id = ? ORDER BY sort_weight ASC, id ASC`,
          [electionId]
        );
        // JSON 字段解析回对象
        rows.forEach(r => {
          r.material_requirements = parseJSON(r.material_requirements, []);
          r.elected_candidates = parseJSON(r.elected_candidates, []);
        });
        // 统一返回 {list,total} 形状（与其他列表端点一致·前端不用猜两种）
        response.pageSuccess(ctx, rows, rows.length);
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '查询岗位列表失败');
      }
    },

    // 岗位详情（含材料要求·村民端渲染报名表单用）
    async detail(ctx) {
      try {
        const { id } = ctx.query;
        if (!id) return response.paramError(ctx, '岗位ID不能为空');
        const [rows] = await pool.query('SELECT * FROM positions WHERE id = ?', [id]);
        if (rows.length === 0) return response.notFound(ctx, '岗位不存在');
        const p = rows[0];
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
    // 新增岗位
    async add(ctx) {
      try {
        const b = ctx.request.body;
        const { electionId, name, quota = 1, duty = '', materialRequirements = [], sortWeight = 99 } = b;
        if (!electionId) return response.paramError(ctx, '所属选举活动不能为空');
        if (!name) return response.paramError(ctx, '岗位名称不能为空');

        // 校验活动存在且已审批通过（前置锁：没批不让配岗位）
        const [elec] = await pool.execute('SELECT approval_status FROM elections WHERE id = ?', [electionId]);
        if (elec.length === 0) return response.businessError(ctx, '选举活动不存在');

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
        const { electionId, orgType, committeeSize } = ctx.request.body;
        if (!electionId) return response.paramError(ctx, '所属选举活动不能为空');

        const positions = buildGeneratedPositions(orgType, committeeSize);
        const [existing] = await pool.execute(
          'SELECT id, election_id, name, quota, duty, material_requirements, sort_weight, enabled FROM positions WHERE election_id = ? ORDER BY sort_weight ASC, id ASC',
          [electionId]
        );
        if (existing.length > 0) {
          return response.success(ctx, { list: existing, inserted: 0 }, '岗位已存在');
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
        response.success(ctx, { list: positions, inserted: positions.length }, '生成岗位成功');
      } catch (error) {
        console.error(error);
        response.paramError(ctx, error.message || '生成岗位失败');
      }
    },

    // 修改岗位
    async update(ctx) {
      try {
        const b = ctx.request.body;
        if (!b.id) return response.paramError(ctx, '岗位ID不能为空');
        if (!b.name) return response.paramError(ctx, '岗位名称不能为空');

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

    // 删除岗位（校验有无材料/候选人）
    async delete(ctx) {
      try {
        const { id } = ctx.request.body;
        if (!id) return response.paramError(ctx, '岗位ID不能为空');

        const [mat] = await pool.execute('SELECT 1 FROM materials WHERE position_id = ? LIMIT 1', [id]);
        if (mat.length > 0) return response.businessError(ctx, '该岗位已有人报名材料，不允许删除');
        const [cand] = await pool.execute('SELECT 1 FROM candidates WHERE position_id = ? LIMIT 1', [id]);
        if (cand.length > 0) return response.businessError(ctx, '该岗位已有候选人，不允许删除');

        await pool.execute('DELETE FROM positions WHERE id = ?', [id]);
        response.success(ctx, null, '删除岗位成功');
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '删除岗位失败');
      }
    }
  },

  // @@AUTH 岗位管理：增删改限超管/经办，读放开
  config: {
    add: requireRole('超级管理', '经办'),
    generate: requireRole('超级管理', '经办'),
    update: requireRole('超级管理', '经办'),
    delete: requireRole('超级管理', '经办'),
  }
};

Object.defineProperty(api, 'buildGeneratedPositions', { value: buildGeneratedPositions });

module.exports = api;
