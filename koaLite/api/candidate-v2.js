// @@API-CANDIDATE-V2 候选人管理（招聘比喻=录用名单·血缘链终点）
// 两来源：material(审核翻转·村民自荐) / import(运营导入·其余三种推荐方式)
// 多维表格：村/活动/岗位/方式/推荐方式/状态/来源 都能筛
const response = require('../config/response');
const { pool } = require('../db/db');
const { requireRole } = require('../config/requireRole');

module.exports = {
  get: {
    // 候选人多维列表（按链上每环筛）
    async list(ctx) {
      try {
        const { page = 1, pageSize = 10, electionId, positionId, villageId,
                electionType, recommendType, source, status, name } = ctx.query;
        const limit = Number(pageSize);
        const offset = (Number(page) - 1) * limit;

        let base = `FROM candidates c
                    LEFT JOIN positions p ON c.position_id = p.id
                    LEFT JOIN elections e ON c.election_id = e.id
                    LEFT JOIN villages v ON e.village_id = v.id WHERE 1=1`;
        const params = [];
        if (electionId)    { base += ' AND c.election_id=?';     params.push(electionId); }
        if (positionId)    { base += ' AND c.position_id=?';     params.push(positionId); }
        if (villageId)     { base += ' AND e.village_id=?';      params.push(villageId); }
        if (electionType)  { base += ' AND e.election_type=?';   params.push(electionType); }
        if (recommendType) { base += ' AND c.recommend_type=?';  params.push(recommendType); }
        if (source)        { base += ' AND c.source=?';          params.push(source); }
        if (status)        { base += ' AND c.status=?';          params.push(status); }
        if (name)          { base += ' AND c.name LIKE ?';       params.push(`%${name}%`); }

        const listSql = `SELECT c.id, c.name, c.phone, c.politics, c.source, c.recommend_type,
                                c.status, c.elected, c.votes, c.review_comment,
                                c.election_id, e.name AS election_name, e.election_type, e.election_method,
                                c.position_id, p.name AS position_name,
                                e.village_id, v.name AS village_name
                         ${base} ORDER BY c.id DESC LIMIT ? OFFSET ?`;
        const [rows] = await pool.query(listSql, [...params, limit, offset]);
        const [totalRow] = await pool.query(`SELECT COUNT(1) as total ${base}`, params);
        response.pageSuccess(ctx, rows, totalRow[0].total, page, pageSize);
      } catch (e) { console.error(e); response.serverError(ctx, '查询候选人失败'); }
    },

    // 候选人详情（含血缘溯源·点开看材料）
    async detail(ctx) {
      try {
        const { id } = ctx.query;
        if (!id) return response.paramError(ctx, '候选人ID不能为空');
        const [rows] = await pool.query(
          `SELECT c.*, p.name AS position_name, e.name AS election_name
           FROM candidates c LEFT JOIN positions p ON c.position_id=p.id
           LEFT JOIN elections e ON c.election_id=e.id WHERE c.id=?`, [id]
        );
        if (rows.length === 0) return response.notFound(ctx, '候选人不存在');
        const c = rows[0];
        // 血缘溯源：自荐的能查到源材料
        if (c.material_id) {
          const [mat] = await pool.query('SELECT id, items, status FROM materials WHERE id=?', [c.material_id]);
          if (mat.length > 0) {
            try { mat[0].items = JSON.parse(mat[0].items || '[]'); } catch { mat[0].items = []; }
            c.material = mat[0];
          }
        }
        response.success(ctx, c);
      } catch (e) { console.error(e); response.serverError(ctx, '查询候选人详情失败'); }
    }
  },

  post: {
    // 运营手工导入候选人（import来源·完整链·初始未审核）
    async import(ctx) {
      try {
        const b = ctx.request.body;
        const { electionId, positionId, phone, name, recommendType } = b;
        if (!electionId || !positionId || !phone || !name) {
          return response.paramError(ctx, 'electionId、positionId、phone、name 必填');
        }
        if (!recommendType || recommendType === '村民自荐') {
          return response.businessError(ctx, '导入候选人的推荐方式必须是：村委会推荐/联名推荐/联名委托（村民自荐走材料提交）');
        }
        // 一人一场一岗铁律
        const [dup] = await pool.execute(
          'SELECT id FROM candidates WHERE election_id=? AND phone=?', [electionId, phone]
        );
        if (dup.length > 0) return response.businessError(ctx, '该手机号在本场选举已是候选人');

        const [r] = await pool.execute(
          `INSERT INTO candidates (election_id, position_id, phone, name, politics, intro, source, recommend_type, status)
           VALUES (?,?,?,?,?,?, 'import', ?, '未审核')`,
          [electionId, positionId, phone, name, b.politics || '', b.intro || '', recommendType]
        );
        response.success(ctx, { id: r.insertId }, '导入候选人成功，待资格审查');
      } catch (e) { console.error(e); response.serverError(ctx, '导入候选人失败'); }
    },

    // 资格审查（经办/运营审够不够格·落选给理由）
    async review(ctx) {
      try {
        const { id, action, comment = '' } = ctx.request.body;
        if (!id) return response.paramError(ctx, '候选人ID不能为空');
        if (action !== 'pass' && action !== 'fail') {
          return response.paramError(ctx, 'action 必须是 pass 或 fail');
        }
        if (action === 'fail' && !comment) {
          return response.paramError(ctx, '不通过必须填写审查意见');
        }
        const newStatus = action === 'pass' ? '报名中' : '资格作废';
        await pool.execute(
          'UPDATE candidates SET status=?, review_comment=? WHERE id=?',
          [newStatus, comment, id]
        );
        response.success(ctx, null, action === 'pass' ? '资格审查通过' : '资格作废');
      } catch (e) { console.error(e); response.serverError(ctx, '资格审查失败'); }
    },

    // 结果回填（运营·线下投票后填当选/票数）
    async result(ctx) {
      try {
        const { id, elected, votes } = ctx.request.body;
        if (!id) return response.paramError(ctx, '候选人ID不能为空');
        // 回填结果后统一进入"已公示"（当选/落选都公示，只是结果不同）
        await pool.execute(
          "UPDATE candidates SET elected=?, votes=?, status='已公示' WHERE id=?",
          [elected || '', votes || null, id]
        );
        response.success(ctx, null, '结果回填成功');
      } catch (e) { console.error(e); response.serverError(ctx, '结果回填失败'); }
    }
  },

  // @@AUTH 候选人：import导入(超管/经办/运营)·review资格审查(超管/经办/审核)·result结果回填(超管/运营)
  config: {
    import: requireRole('超级管理', '经办', '运营'),
    review: requireRole('超级管理', '经办', '审核'),
    result: requireRole('超级管理', '运营'),
  }
};
