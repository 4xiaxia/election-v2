// @@API-MATERIAL-V2 材料管理（招聘比喻=应聘者投简历·候选人的"爹"）
// @@BLOOD-FLIP 血缘翻转核心：材料审核通过 → 自动生成候选人 + 回填 candidate_id
// 三视角：admin(运营查看) / reviewer(审核人审核) / mini(村民提交)
const response = require('../config/response');
const { pool } = require('../db/db');
const { requireRole } = require('../config/requireRole');

function parseJSON(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

// @@BLOOD-FLIP 血缘翻转：一份材料通过 → 生成/复用候选人
// 业务铁律：一人一场一岗位 → 按 election+position+phone 查重
async function promoteToCandidate(conn, m) {
  const [exist] = await conn.execute(
    'SELECT id FROM candidates WHERE election_id=? AND position_id=? AND phone=?',
    [m.election_id, m.position_id, m.applicant_phone]
  );
  let candidateId;
  if (exist.length > 0) {
    candidateId = exist[0].id;
    // 复用旧候选人，补回 material_id
    await conn.execute('UPDATE candidates SET material_id=? WHERE id=?', [m.id, candidateId]);
  } else {
    const [r] = await conn.execute(
      `INSERT INTO candidates
        (election_id, position_id, phone, user_id, material_id, name, source, recommend_type, status)
       VALUES (?,?,?,?,?,?, 'material', '村民自荐', '报名中')`,
      [m.election_id, m.position_id, m.applicant_phone, m.applicant_user_id || null, m.id, m.applicant_name || '']
    );
    candidateId = r.insertId;
  }
  // 回填材料的 candidate_id（血缘闭环）
  await conn.execute('UPDATE materials SET candidate_id=? WHERE id=?', [candidateId, m.id]);
  return candidateId;
}

// 列表查询（admin/reviewer 共用，默认 status 不同）
async function listMaterials(ctx, defaultStatus) {
  const { electionId, positionId, status = defaultStatus } = ctx.query;
  let sql = `SELECT m.id, m.election_id, m.position_id, p.name AS position_name,
                    m.applicant_phone, m.applicant_name, m.status, m.reject_reason,
                    m.candidate_id, DATE_FORMAT(m.created_at,"%Y-%m-%d %H:%i") as created_at
             FROM materials m LEFT JOIN positions p ON m.position_id=p.id WHERE 1=1`;
  const params = [];
  if (electionId) { sql += ' AND m.election_id=?'; params.push(electionId); }
  if (positionId) { sql += ' AND m.position_id=?'; params.push(positionId); }
  if (status)     { sql += ' AND m.status=?';      params.push(status); }
  sql += ' ORDER BY m.created_at DESC';
  const [rows] = await pool.query(sql, params);
  // 统一返回 {list,total} 形状
  response.pageSuccess(ctx, rows, rows.length);
}

module.exports = {
  get: {
    // 运营查全部材料
    async list(ctx) {
      try { await listMaterials(ctx, ''); }
      catch (e) { console.error(e); response.serverError(ctx, '查询材料失败'); }
    },
    // 审核人查待审核队列（默认 status=待审核）
    async pending(ctx) {
      try { await listMaterials(ctx, '待审核'); }
      catch (e) { console.error(e); response.serverError(ctx, '查询待审材料失败'); }
    },
    // 材料详情（含提交内容 items）
    async detail(ctx) {
      try {
        const { id } = ctx.query;
        if (!id) return response.paramError(ctx, '材料ID不能为空');
        const [rows] = await pool.query('SELECT * FROM materials WHERE id=?', [id]);
        if (rows.length === 0) return response.notFound(ctx, '材料不存在');
        rows[0].items = parseJSON(rows[0].items, []);
        response.success(ctx, rows[0]);
      } catch (e) { console.error(e); response.serverError(ctx, '查询材料详情失败'); }
    },
    // 村民查我的材料
    async my(ctx) {
      try {
        const { phone } = ctx.query;
        if (!phone) return response.paramError(ctx, 'phone 不能为空');
        const [rows] = await pool.query(
          `SELECT m.*, p.name AS position_name FROM materials m
           LEFT JOIN positions p ON m.position_id=p.id
           WHERE m.applicant_phone=? ORDER BY m.created_at DESC`, [phone]
        );
        rows.forEach(r => r.items = parseJSON(r.items, []));
        // 统一返回 {list,total} 形状
        response.pageSuccess(ctx, rows, rows.length);
      } catch (e) { console.error(e); response.serverError(ctx, '查询我的材料失败'); }
    }
  },

  post: {
    // 村民提交材料（一人一场一岗位铁律）
    async submit(ctx) {
      try {
        const b = ctx.request.body;
        const { electionId, positionId, applicantPhone, applicantName = '', items = [] } = b;
        if (!electionId || !positionId || !applicantPhone) {
          return response.paramError(ctx, 'electionId、positionId、applicantPhone 必填');
        }
        // 铁律：一人一场选举只能报一个岗位
        const [dup] = await pool.execute(
          'SELECT id FROM materials WHERE election_id=? AND applicant_phone=?',
          [electionId, applicantPhone]
        );
        if (dup.length > 0) return response.businessError(ctx, '您在本场选举已报名，一人只能报一个岗位');

        const itemsJSON = typeof items === 'string' ? items : JSON.stringify(items);
        const [r] = await pool.execute(
          `INSERT INTO materials (election_id, position_id, applicant_phone, applicant_user_id, applicant_name, items, status)
           VALUES (?,?,?,?,?,?, '待审核')`,
          [electionId, positionId, applicantPhone, b.applicantUserId || null, applicantName, itemsJSON]
        );
        response.success(ctx, { id: r.insertId }, '材料提交成功，待审核');
      } catch (e) { console.error(e); response.serverError(ctx, '提交材料失败'); }
    },

    // @@BLOOD-FLIP 审核（审核人·通过则血缘翻转生候选人）
    async review(ctx) {
      const conn = await pool.getConnection();
      try {
        const { id, action, rejectReason = '', reviewerId } = ctx.request.body;
        if (!id) return response.paramError(ctx, '材料ID不能为空');
        if (action !== 'approve' && action !== 'reject') {
          return response.paramError(ctx, 'action 必须是 approve 或 reject');
        }
        if (action === 'reject' && !rejectReason) {
          return response.paramError(ctx, '驳回必须填写原因');
        }

        const [rows] = await conn.execute('SELECT * FROM materials WHERE id=?', [id]);
        if (rows.length === 0) return response.notFound(ctx, '材料不存在');
        const m = rows[0];

        await conn.beginTransaction();
        let candidateId = m.candidate_id || null;
        if (action === 'approve') {
          await conn.execute(
            "UPDATE materials SET status='通过', reviewer_id=?, reviewed_at=NOW() WHERE id=?",
            [reviewerId || null, id]
          );
          candidateId = await promoteToCandidate(conn, m);
        } else {
          await conn.execute(
            "UPDATE materials SET status='驳回', reject_reason=?, reviewer_id=?, reviewed_at=NOW() WHERE id=?",
            [rejectReason, reviewerId || null, id]
          );
        }

        // @@FOUR-THINGS 血缘翻转四件事收尾③④：写日志 + 发结果通知（航海图珍珠①）
        const actorName = ctx.state.user ? ctx.state.user.name : '';
        // ③ 写审核日志
        await conn.execute(
          `INSERT INTO logs (kind, actor_id, actor_name, module, action, detail)
           VALUES ('review', ?, ?, '材料审核', ?, ?)`,
          [reviewerId || null, actorName,
           action === 'approve' ? '通过' : '驳回',
           action === 'approve'
             ? `材料#${id} ${m.applicant_name}(${m.applicant_phone}) 审核通过，生成候选人#${candidateId}`
             : `材料#${id} ${m.applicant_name}(${m.applicant_phone}) 驳回，原因：${rejectReason}`]
        );
        // ④ 发结果通知给上报人（站内信，按手机号定向）
        await conn.execute(
          `INSERT INTO notifications (title, content, type, target_phones, send_mode, status)
           VALUES (?, ?, '结果通知', ?, '即时', '已发送')`,
          [action === 'approve' ? '材料审核通过' : '材料审核未通过',
           action === 'approve'
             ? `您报名提交的材料已审核通过，已进入候选人名单。`
             : `您报名提交的材料未通过审核。原因：${rejectReason}`,
           m.applicant_phone]
        );

        await conn.commit();
        response.success(ctx, { candidateId }, action === 'approve' ? '审核通过，已生成候选人' : '已驳回');
      } catch (e) {
        await conn.rollback();
        console.error(e);
        response.serverError(ctx, '审核失败');
      } finally {
        conn.release();
      }
    }
  },

  // @@AUTH 材料：review审核限审核人/超管；submit村民提交放开(村民端无管理token)
  config: {
    review: requireRole('超级管理', '审核'),
  }
};
