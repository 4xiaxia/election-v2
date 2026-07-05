// @@API-ELECTION-V2 选举活动管理（轴心=招聘活动）
// 两个核心机关：① 选举方式联动(type→method) ② 审批锁(approval_status)
// 套路对齐 village-v2.js
const response = require('../config/response');
const { pool } = require('../db/db');
const { requireRole } = require('../config/requireRole');

// @@LEGAL-MAP 选举方式法定联动（认知定稿·法条第六条）
// 村委会→只能村民直接选举；居委会→三选一
const ELECTION_METHOD_MAP = {
  '村委会选举': ['村民直接选举'],
  '居委会选举': ['居民直接选举', '居民代表选举', '户代表选举'],
};

// 校验 type↔method 合法组合
function isLegalMethod(type, method) {
  const allowed = ELECTION_METHOD_MAP[type];
  if (!allowed) return false;
  return allowed.includes(method);
}

module.exports = {
  get: {
    // 选举活动分页列表（JOIN 村居名）
    async list(ctx) {
      try {
        const { page = 1, pageSize = 10, name, villageId, electionType, status } = ctx.query;
        const limit = Number(pageSize);
        const offset = (Number(page) - 1) * limit;

        let sql = `SELECT e.id, e.name, e.village_id, v.name AS village_name,
                          e.election_type, e.election_method, e.session_no, e.committee_size, e.deputy_count,
                          e.status, e.approval_status,
                          DATE_FORMAT(e.enroll_start_at, "%Y-%m-%d") as enroll_start_at,
                          DATE_FORMAT(e.enroll_end_at, "%Y-%m-%d") as enroll_end_at,
                          DATE_FORMAT(e.created_at, "%Y-%m-%d %H:%i:%s") as created_at
                   FROM elections e LEFT JOIN villages v ON e.village_id = v.id WHERE 1=1`;
        let countSql = 'SELECT COUNT(1) as total FROM elections e WHERE 1=1';
        const params = [];
        const countParams = [];

        if (name)         { sql += ' AND e.name LIKE ?';          countSql += ' AND e.name LIKE ?';          params.push(`%${name}%`); countParams.push(`%${name}%`); }
        if (villageId)    { sql += ' AND e.village_id = ?';       countSql += ' AND e.village_id = ?';       params.push(villageId);   countParams.push(villageId); }
        if (electionType) { sql += ' AND e.election_type = ?';    countSql += ' AND e.election_type = ?';    params.push(electionType);countParams.push(electionType); }
        if (status)       { sql += ' AND e.status = ?';           countSql += ' AND e.status = ?';           params.push(status);      countParams.push(status); }

        sql += ' ORDER BY e.id DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query(sql, params);
        const [totalRow] = await pool.query(countSql, countParams);
        response.pageSuccess(ctx, rows, totalRow[0].total, page, pageSize);
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '查询选举活动列表失败');
      }
    },

    // 选举活动详情（含岗位列表·招聘比喻：活动带岗位）
    async detail(ctx) {
      try {
        const { id } = ctx.query;
        if (!id) return response.paramError(ctx, '选举活动ID不能为空');

        const [rows] = await pool.query(
          `SELECT e.*, v.name AS village_name FROM elections e
           LEFT JOIN villages v ON e.village_id = v.id WHERE e.id = ?`, [id]
        );
        if (rows.length === 0) return response.notFound(ctx, '选举活动不存在');

        const election = rows[0];
        const [positions] = await pool.query(
          'SELECT id, name, quota, duty, sort_weight, enabled FROM positions WHERE election_id = ? ORDER BY sort_weight ASC',
          [id]
        );
        election.positions = positions;
        response.success(ctx, election);
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '查询选举活动详情失败');
      }
    },

    // 选举方式字典（前端联动下拉用）
    async methods(ctx) {
      response.success(ctx, ELECTION_METHOD_MAP);
    }
  },

  post: {
    // 新增选举活动（经办创建·初始待审批）
    async add(ctx) {
      try {
        const b = ctx.request.body;
        const { villageId, name, electionType = '村委会选举', electionMethod = '', content = '',
                sessionNo = '第十五届', committeeSize = null, deputyCount = null } = b;
        if (!villageId) return response.paramError(ctx, '所属村居不能为空');
        if (!name) return response.paramError(ctx, '选举名称不能为空');
        // 选举方式法定校验
        if (electionMethod && !isLegalMethod(electionType, electionMethod)) {
          return response.businessError(ctx, `选举方式"${electionMethod}"不符合"${electionType}"的法定规则`);
        }

        const [result] = await pool.execute(
          `INSERT INTO elections
            (village_id, name, election_type, election_method, content, session_no, committee_size, deputy_count,
             enroll_start_at, enroll_end_at, review_start_at, review_end_at,
             publicity_start_at, publicity_end_at, election_end_date,
             status, approval_status, created_by)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'draft', '待审批', ?)`,
          [villageId, name, electionType, electionMethod, content, sessionNo, committeeSize, deputyCount,
           b.enrollStartAt || null, b.enrollEndAt || null, b.reviewStartAt || null, b.reviewEndAt || null,
           b.publicityStartAt || null, b.publicityEndAt || null, b.electionEndDate || null,
           b.createdBy || null]
        );
        response.success(ctx, { id: result.insertId }, '创建选举活动成功，待审核人审批');
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '创建选举活动失败');
      }
    },

    // 修改选举活动（带方式法定校验）
    async update(ctx) {
      try {
        const b = ctx.request.body;
        if (!b.id) return response.paramError(ctx, '选举活动ID不能为空');
        if (b.electionMethod && !isLegalMethod(b.electionType, b.electionMethod)) {
          return response.businessError(ctx, `选举方式"${b.electionMethod}"不符合"${b.electionType}"的法定规则`);
        }

        await pool.execute(
          `UPDATE elections SET village_id=?, name=?, election_type=?, election_method=?, content=?,
             session_no=?, committee_size=?, deputy_count=?,
             enroll_start_at=?, enroll_end_at=?, review_start_at=?, review_end_at=?,
             publicity_start_at=?, publicity_end_at=?, election_end_date=? WHERE id=?`,
          [b.villageId, b.name, b.electionType, b.electionMethod, b.content || '',
           b.sessionNo || '第十五届', b.committeeSize || null, b.deputyCount ?? null,
           b.enrollStartAt || null, b.enrollEndAt || null, b.reviewStartAt || null, b.reviewEndAt || null,
           b.publicityStartAt || null, b.publicityEndAt || null, b.electionEndDate || null, b.id]
        );
        response.success(ctx, null, '修改选举活动成功');
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '修改选举活动失败');
      }
    },

    // @@APPROVAL-LOCK 审批（审核人批·全局前置锁）
    async approve(ctx) {
      try {
        const { id, action, reason = '', approverId } = ctx.request.body;
        if (!id) return response.paramError(ctx, '选举活动ID不能为空');
        if (action !== 'approve' && action !== 'reject') {
          return response.paramError(ctx, 'action 必须是 approve 或 reject');
        }
        if (action === 'reject' && !reason) {
          return response.paramError(ctx, '驳回必须填写原因');
        }

        if (action === 'approve') {
          await pool.execute(
            "UPDATE elections SET approval_status='已通过', approver_id=?, approved_at=NOW(), status='pending' WHERE id=?",
            [approverId || null, id]
          );
          response.success(ctx, null, '审批通过，活动可开展');
        } else {
          await pool.execute(
            "UPDATE elections SET approval_status='已驳回', approver_id=?, approved_at=NOW(), approval_reason=?, status='draft' WHERE id=?",
            [approverId || null, reason, id]
          );
          response.success(ctx, null, '已驳回，打回草稿');
        }
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '审批操作失败');
      }
    },

    // 删除选举活动（校验有无岗位/候选人）
    async delete(ctx) {
      try {
        const { id } = ctx.request.body;
        if (!id) return response.paramError(ctx, '选举活动ID不能为空');

        const [pos] = await pool.execute('SELECT 1 FROM positions WHERE election_id = ? LIMIT 1', [id]);
        if (pos.length > 0) return response.businessError(ctx, '该活动已有岗位，不允许删除');

        await pool.execute('DELETE FROM elections WHERE id = ?', [id]);
        response.success(ctx, null, '删除选举活动成功');
      } catch (error) {
        console.error(error);
        response.serverError(ctx, '删除选举活动失败');
      }
    }
  },

  // @@AUTH 权限矩阵（读放开·写按角色）
  // 注：router.js 读 config[method]，method=内层key(add/update...)，扁平结构
  config: {
    add: requireRole('超级管理', '经办'),       // 创建活动：经办/超管
    update: requireRole('超级管理', '经办'),    // 改活动：经办/超管
    approve: requireRole('超级管理', '审核'),   // 审批：审核人/超管
    delete: requireRole('超级管理'),            // 删活动：仅超管
  }
};
